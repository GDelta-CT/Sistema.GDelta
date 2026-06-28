-- =====================================================================
-- Migration 0018 — Fórmulas de tinta (custeio da cor por receita)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0017 (tenant+claim, RLS, hardening search_path,
--                estoque). Reusa as funções genéricas da 0006
--                (set_oficina_id_from_jwt / set_atualizado_em).
--
-- OBJETIVO (roadmap "melhor do mercado", P0 da MARGEM AO VIVO):
--   Custear a tinta de PINTURA por FÓRMULA (receita de bases por grama),
--   em vez de um custo chutado. As BASES já existem no estoque como
--   estoque_itens (categoria 'materia_prima', unidade 'g',
--   custo_medio = R$/grama). A fórmula só amarra QUAIS bases e QUANTOS
--   gramas — o CUSTO "vive" porque é lido do custo_medio ATUAL do estoque:
--   trocou o lote da base, a margem reflete sozinha.
--
-- O QUE ENTREGA (recorte v1, validado pela colorista):
--   1) tinta_formula      — cabeçalho da receita (nome, codigo_cor da
--      montadora, observacoes, ativo). A fórmula é cadastrada UMA vez e
--      reusada. codigo_cor é a chave real da igualação (texto livre no v1).
--   2) tinta_formula_item — linhas da receita: cada base do estoque com a
--      quantidade em GRAMAS (> 0). FK para estoque_itens com ON DELETE
--      RESTRICT (decisão do fundador): NÃO deixar uma base usada em fórmula
--      sumir silenciosamente — isso faria a margem "melhorar" por bug, não
--      por economia real. Apagar a base exige antes remover o item da fórmula.
--   3) v_tinta_formula_custo — por fórmula, soma(gramas * custo_medio) como
--      custo_total e o custo por grama da MISTURA (custo_total / gramas).
--      O app NÃO recalcula: a view já entrega pronto.
--
-- FORA DO V1 (cortado de propósito — ver doc da colorista):
--   • rendimento_pratico / lote padrão: o custo/grama desta view é da MISTURA
--     COMO PESADA (custo_total / Σ gramas da receita). O "lote padrão" e o
--     fator de perda/teste entram em v2, DEPOIS de medir no piloto — chutar
--     percentual agora contaminaria todo orçamento.
--   • Integração fórmula ↔ item de orçamento de pintura (abater da margem ao
--     vivo): v2, em cima de custo/grama já validado no piloto.
--   • papel (base/verniz/diluente/catalisador/aditivo), multi-fornecedor,
--     histórico fórmula→OS: v2.
--
-- SEGURANÇA (padrão do projeto):
--   • oficina_id auto-preenchido pelo JWT (trigger set_oficina_id_from_jwt) —
--     sem digitação dupla. RLS enable + FORCE + policy de isolamento por
--     oficina (claim auth.jwt() ->> 'oficina_id') em AMBAS as tabelas.
--   • A view tem security_invoker = true: herda a RLS das tabelas base (sem
--     isso vazaria custo/receita entre oficinas — vazamento multi-tenant).
--   • Todos os objetos schema-qualificados (fecha hijack via search_path).
--
-- LGPD: tabelas de DADOS DE NEGÓCIO por oficina (sem dado pessoal de titular);
--   isolamento por oficina_id via RLS.
-- 100% ADITIVO (só create ... if not exists / create or replace). Idempotente.
-- Rollback: supabase/rollbacks/0018_rollback.sql
-- =====================================================================

-- 1) Tabela tinta_formula — cabeçalho da receita de cor ---------------------
create table if not exists public.tinta_formula (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references public.oficinas(id) on delete cascade,
  nome          text not null,                 -- ex.: "Branco Polar Fiat 296"
  codigo_cor    text,                          -- código da montadora (chave da igualação); texto livre no v1
  observacoes   text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.tinta_formula is
  'Cabeçalho da fórmula de tinta (receita de cor). Cadastrada uma vez e reusada; o custo vive do custo_medio atual das bases no estoque.';
comment on column public.tinta_formula.nome is
  'Nome legível da fórmula (ex.: "Branco Polar Fiat 296").';
comment on column public.tinta_formula.codigo_cor is
  'Código da cor da montadora — chave real da igualação; texto livre no v1 (nullable).';

-- nome único POR OFICINA (não global): cada oficina tem o próprio catálogo de cores
create unique index if not exists uq_tinta_formula_oficina_nome
  on public.tinta_formula(oficina_id, nome);
-- índices: isolamento por oficina + busca pelo código de cor
create index if not exists idx_tinta_formula_oficina    on public.tinta_formula(oficina_id);
create index if not exists idx_tinta_formula_codigo_cor on public.tinta_formula(oficina_id, codigo_cor);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_tinta_formula_oficina on public.tinta_formula;
create trigger trg_tinta_formula_oficina
  before insert on public.tinta_formula
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa set_atualizado_em da 0001/0006)
drop trigger if exists trg_tinta_formula_atualizado on public.tinta_formula;
create trigger trg_tinta_formula_atualizado
  before update on public.tinta_formula
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.tinta_formula enable row level security;
alter table public.tinta_formula force  row level security;
drop policy if exists "tinta_formula_isolation" on public.tinta_formula;
create policy "tinta_formula_isolation"
  on public.tinta_formula
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- 2) Tabela tinta_formula_item — as bases da receita ------------------------
--    formula_id ON DELETE CASCADE: apagar a fórmula leva suas linhas junto.
--    estoque_item_id ON DELETE RESTRICT: protege a história da fórmula — não
--    deixa a base sumir do estoque sem antes remover o item da receita (senão
--    a margem cairia sozinha por bug). FK garante base da MESMA oficina (RLS).
create table if not exists public.tinta_formula_item (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id)         on delete cascade,
  formula_id      uuid not null references public.tinta_formula(id)    on delete cascade,
  estoque_item_id uuid not null references public.estoque_itens(id)    on delete restrict,
  gramas          numeric(14,3) not null check (gramas > 0),  -- quantidade desta base na receita (g)
  criado_em       timestamptz   not null default now()
);

comment on table public.tinta_formula_item is
  'Linhas da fórmula: cada base do estoque (estoque_itens) com sua quantidade em gramas. estoque_item_id ON DELETE RESTRICT protege o custeio.';
comment on column public.tinta_formula_item.gramas is
  'Quantidade desta base na receita, em gramas (> 0).';

-- uma base não se repete dentro da mesma fórmula (somar gramas, não duplicar linha)
create unique index if not exists uq_tinta_formula_item_formula_base
  on public.tinta_formula_item(formula_id, estoque_item_id);
-- índices: isolamento por oficina + joins por fórmula / por base
create index if not exists idx_tinta_formula_item_oficina on public.tinta_formula_item(oficina_id);
create index if not exists idx_tinta_formula_item_formula on public.tinta_formula_item(formula_id);
create index if not exists idx_tinta_formula_item_base    on public.tinta_formula_item(estoque_item_id);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_tinta_formula_item_oficina on public.tinta_formula_item;
create trigger trg_tinta_formula_item_oficina
  before insert on public.tinta_formula_item
  for each row execute function public.set_oficina_id_from_jwt();

-- RLS por oficina_id (claim do JWT)
alter table public.tinta_formula_item enable row level security;
alter table public.tinta_formula_item force  row level security;
drop policy if exists "tinta_formula_item_isolation" on public.tinta_formula_item;
create policy "tinta_formula_item_isolation"
  on public.tinta_formula_item
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- 3) View v_tinta_formula_custo — custo da fórmula (custeio "vivo") ----------
--    CRÍTICO: security_invoker = true -> herda a RLS por oficina das tabelas
--    base (sem isso vazaria custo/receita entre oficinas).
--    custo_total      = Σ (gramas * custo_medio da base) — custo_medio é R$/g.
--    gramas_total     = Σ gramas da receita (a mistura como pesada).
--    custo_por_grama  = custo_total / gramas_total (NULL se sem gramas — fórmula
--                       sem itens; evita divisão por zero).
--    LEFT JOIN para a fórmula aparecer mesmo sem itens (custo 0 / por_grama NULL).
--    Sem order by — o app ordena.
create or replace view public.v_tinta_formula_custo
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina das tabelas base (sem isso vazaria entre oficinas)
select
  f.oficina_id,
  f.id,
  f.nome,
  f.codigo_cor,
  f.ativo,
  coalesce(sum(it.gramas), 0)                          as gramas_total,
  coalesce(sum(it.gramas * i.custo_medio), 0)          as custo_total,
  case when coalesce(sum(it.gramas), 0) > 0
       then sum(it.gramas * i.custo_medio) / sum(it.gramas)
       else null end                                   as custo_por_grama
from public.tinta_formula f
left join public.tinta_formula_item it on it.formula_id = f.id
left join public.estoque_itens      i  on i.id          = it.estoque_item_id
group by f.oficina_id, f.id, f.nome, f.codigo_cor, f.ativo;

comment on view public.v_tinta_formula_custo is
  'Custeio vivo da fórmula: custo_total = Σ(gramas * custo_medio da base no estoque) e custo_por_grama da mistura como pesada. security_invoker herda a RLS por oficina.';

-- Fim da Migration 0018
