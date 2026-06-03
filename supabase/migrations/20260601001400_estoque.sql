-- =====================================================================
-- Migration 0014 — Estoque (itens + movimentos + saldo + alertas)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0009 (tenant+claim, RLS, hardening search_path,
--                os_comercial). Reusa as funções genéricas da 0006
--                (set_oficina_id_from_jwt / set_atualizado_em).
--
-- O QUE ENTREGA (decisões do fundador):
--   1) estoque_itens     — catálogo de itens (peça / matéria-prima / escritório),
--      com saldo (quantidade), custo_medio e estoque_minimo. UNIQUE por nome
--      dentro da oficina.
--   2) estoque_movimentos — livro-razão de entradas/saídas. NUNCA se edita o
--      saldo direto: registra-se um movimento e o TRIGGER aplica no item.
--   3) Trigger aplicar_movimento_estoque (AFTER INSERT): entrada recalcula o
--      CUSTO MÉDIO PONDERADO e soma a quantidade; saída subtrai a quantidade.
--   4) v_estoque_alertas — itens ativos com saldo <= estoque_minimo (reposição).
--
-- SEGURANÇA (padrão do projeto):
--   • oficina_id é auto-preenchido pelo JWT (trigger set_oficina_id_from_jwt) —
--     sem digitação dupla. RLS enable + FORCE + policy de isolamento por oficina
--     (claim auth.jwt() ->> 'oficina_id') em AMBAS as tabelas.
--   • A função do saldo é SECURITY INVOKER + search_path = '' (padrão 0006/0010):
--     roda com a IDENTIDADE do chamador, então a RLS por oficina se aplica ao
--     UPDATE do item — uma oficina nunca altera o saldo de outra. Todos os
--     objetos são schema-qualificados (fecha hijack via search_path).
--   • A view tem security_invoker = true: herda a RLS das tabelas base (sem
--     isso vazaria saldo entre oficinas — vazamento multi-tenant).
--
-- SALDO NEGATIVO (nota MVP): a saída subtrai sem travar em zero — o modelo
--   PERMITE estoque negativo de propósito (registrar baixa mesmo sem cadastro
--   prévio / acerto retroativo). Se o negócio exigir bloqueio, é um CHECK/guard
--   futuro; hoje a responsabilidade é do app. A FK item_id (on delete cascade)
--   garante que o movimento sempre aponta para um item da MESMA oficina.
--
-- LGPD: tabelas de DADOS DE NEGÓCIO por oficina (sem dado pessoal de titular);
--   isolamento por oficina_id via RLS. os_comercial_id em saída é vínculo
--   opcional (on delete set null preserva o histórico do movimento).
-- Idempotente (IF NOT EXISTS / create or replace / drop ... if exists).
-- Rollback: supabase/rollbacks/0014_rollback.sql
-- =====================================================================

-- 1) Tabela estoque_itens — catálogo + saldo --------------------------------
create table if not exists public.estoque_itens (
  id             uuid primary key default gen_random_uuid(),
  oficina_id     uuid not null references public.oficinas(id) on delete cascade,
  nome           text not null,
  categoria      varchar(16) not null
                   check (categoria in ('peca','materia_prima','escritorio')),
  unidade        varchar(10) not null default 'un',   -- un, l, kg, m...
  quantidade     numeric(14,3) not null default 0,    -- saldo atual (aplicado por trigger)
  custo_medio    numeric(14,2) not null default 0,    -- custo médio ponderado (recalc. na entrada)
  estoque_minimo numeric(14,3) not null default 0,    -- gatilho de alerta de reposição
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- nome único POR OFICINA (não global): cada oficina tem o próprio catálogo
create unique index if not exists uq_estoque_itens_oficina_nome
  on public.estoque_itens(oficina_id, nome);
-- índices: isolamento por oficina + filtro por categoria
create index if not exists idx_estoque_itens_oficina   on public.estoque_itens(oficina_id);
create index if not exists idx_estoque_itens_categoria on public.estoque_itens(categoria);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_estoque_itens_oficina on public.estoque_itens;
create trigger trg_estoque_itens_oficina
  before insert on public.estoque_itens
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa set_atualizado_em da 0001/0006)
drop trigger if exists trg_estoque_itens_atualizado on public.estoque_itens;
create trigger trg_estoque_itens_atualizado
  before update on public.estoque_itens
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.estoque_itens enable row level security;
alter table public.estoque_itens force  row level security;
drop policy if exists "estoque_itens_isolation" on public.estoque_itens;
create policy "estoque_itens_isolation"
  on public.estoque_itens
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- 2) Tabela estoque_movimentos — livro-razão de entradas/saídas -------------
create table if not exists public.estoque_movimentos (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id)      on delete cascade,
  item_id         uuid not null references public.estoque_itens(id) on delete cascade,
  tipo            varchar(8) not null check (tipo in ('entrada','saida')),
  quantidade      numeric(14,3) not null check (quantidade > 0),
  custo_unitario  numeric(14,2),               -- usado na ENTRADA (recálculo do custo médio)
  -- saída vinculada a uma OS (opcional); set null preserva o histórico do movimento:
  os_comercial_id uuid references public.os_comercial(id) on delete set null,
  observacao      text,
  criado_em       timestamptz not null default now()
);

-- índices: isolamento por oficina + joins por item / por OS
create index if not exists idx_estoque_mov_oficina on public.estoque_movimentos(oficina_id);
create index if not exists idx_estoque_mov_item    on public.estoque_movimentos(item_id);
create index if not exists idx_estoque_mov_os      on public.estoque_movimentos(os_comercial_id);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_estoque_mov_oficina on public.estoque_movimentos;
create trigger trg_estoque_mov_oficina
  before insert on public.estoque_movimentos
  for each row execute function public.set_oficina_id_from_jwt();

-- RLS por oficina_id (claim do JWT)
alter table public.estoque_movimentos enable row level security;
alter table public.estoque_movimentos force  row level security;
drop policy if exists "estoque_movimentos_isolation" on public.estoque_movimentos;
create policy "estoque_movimentos_isolation"
  on public.estoque_movimentos
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- 3) Trigger de aplicação no saldo ------------------------------------------
--    AFTER INSERT em estoque_movimentos. SECURITY INVOKER -> a RLS do chamador
--    é a fronteira: o UPDATE só alcança itens da MESMA oficina. search_path=''
--    fecha o hijack (objetos schema-qualificados).
--    ENTRADA: média ponderada. No SET, `quantidade`/`custo_medio` referenciam
--    os valores ANTIGOS da linha (semântica do UPDATE) — correto para a média:
--    novo_custo = (qtd_antiga*custo_antigo + qtd_entrada*custo_entrada) / total.
--    Se o total der 0 (caso de borda), mantém o custo_medio atual.
--    custo_unitario nulo na entrada -> usa o custo_medio atual (coalesce).
--    SAÍDA: apenas subtrai a quantidade (pode ficar negativa — ver cabeçalho).
create or replace function public.aplicar_movimento_estoque()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tipo = 'entrada' then
    update public.estoque_itens
       set custo_medio = case
                           when (quantidade + new.quantidade) > 0
                             then ((quantidade * custo_medio)
                                   + (new.quantidade * coalesce(new.custo_unitario, custo_medio)))
                                  / (quantidade + new.quantidade)
                             else custo_medio
                         end,
           quantidade  = quantidade + new.quantidade
     where id = new.item_id;
  elsif new.tipo = 'saida' then
    update public.estoque_itens
       set quantidade = quantidade - new.quantidade
     where id = new.item_id;
  end if;
  -- Item precisa ser desta oficina: UPDATE casando 0 linhas = item de outra
  -- oficina (barrado pela RLS do invoker) ou inexistente. Aborta para nao
  -- gravar um movimento orfao que nao mexe em saldo nenhum.
  if not found then
    raise exception 'Item de estoque nao encontrado nesta oficina.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_estoque_mov_aplica on public.estoque_movimentos;
create trigger trg_estoque_mov_aplica
  after insert on public.estoque_movimentos
  for each row execute function public.aplicar_movimento_estoque();

-- 4) View v_estoque_alertas — itens a repor ----------------------------------
--    CRÍTICO: security_invoker = true -> herda a RLS por oficina de
--    estoque_itens (sem isso vazaria saldo entre oficinas). Só itens ATIVOS
--    com saldo <= estoque_minimo. Sem order by — o app ordena.
create or replace view public.v_estoque_alertas
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do estoque_itens (sem isso vazaria entre oficinas)
select
  i.oficina_id,
  i.id,
  i.nome,
  i.categoria,
  i.unidade,
  i.quantidade,
  i.estoque_minimo
from public.estoque_itens i
where i.ativo = true
  and i.quantidade <= i.estoque_minimo;

-- Fim da Migration 0014
