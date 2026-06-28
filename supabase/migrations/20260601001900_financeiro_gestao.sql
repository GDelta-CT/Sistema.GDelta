-- =====================================================================
-- Migration 0019 — FINANCEIRO / GESTÃO (paridade Planilha-Sistema v2.0)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0018 (tenant+claim, RLS, hardening search_path,
--   clientes [0003], os_comercial [0009], notas_fiscais [0012]).
--   Reusa as funções genéricas: set_oficina_id_from_jwt (0003) e
--   set_atualizado_em (0001/0006). NÃO redefine função alguma.
--
-- OBJETIVO (Plano de paridade F-B do modelo-planilha-completo.md):
--   Entregar as tabelas de FINANCEIRO/GESTÃO que faltam para paridade com a
--   Planilha-Sistema GDelta v2.0 — alimentando os módulos Despesas,
--   Fornecedores (contas a pagar), Recebíveis, e as telas DRE / Aging /
--   Fluxo de Caixa. É o lastro de dados que a DRE completa precisa.
--
-- O QUE ENTREGA:
--   1) despesas          — gasto operacional (fixa | variavel), categoria,
--      data_competencia, recorrência. Alimenta a DRE (Despesas Operacionais)
--      e o módulo Despesas (fixas + variáveis).
--   2) fornecedores      — cadastro de quem a oficina paga (peças, tinta,
--      serviços). Cabeçalho do módulo Fornecedores.
--   3) contas_a_pagar    — título a pagar por fornecedor (vencimento, status
--      aberto|pago, categoria, pago_em). Alimenta Fornecedores + Aging
--      (lado pagáveis) + Fluxo de Caixa (saídas projetadas).
--   4) contas_a_receber  — título a receber (origem os|nota|avulso, cliente,
--      vencimento, status aberto|recebido, recebido_em). Alimenta Receitas +
--      Aging (lado recebíveis) + Fluxo de Caixa (entradas projetadas).
--   5) Views (security_invoker=on):
--        v_dre_despesas  — despesas do mês por tipo/categoria (DRE Desp. Oper.).
--        v_aging         — recebíveis + pagáveis em ABERTO por faixa de idade
--                          (a_vencer | 1-30 | 31-60 | 60+).
--        v_fluxo_caixa   — projeção SEMANAL (entradas a receber - saídas a pagar)
--                          a partir dos vencimentos em aberto.
--
-- DECISÃO — contas_a_receber: TABELA NOVA (não derivar das OS/notas) ---------
--   Avaliado: (A) derivar recebíveis das os_comercial/notas_fiscais existentes
--   vs. (B) tabela própria. Escolhido (B). Por quê:
--     • os_comercial (0009) modela RECEITA RECONHECIDA (valor_orcamento +
--       status), NÃO o financeiro a receber: não tem vencimento, não tem
--       recebido_em, e uma OS pode virar ENTRADA + várias PARCELAS com
--       vencimentos distintos — uma OS = N recebíveis. Derivar 1:1 mentiria
--       no Aging e no Fluxo (que são POR DATA DE VENCIMENTO).
--     • notas_fiscais (0012) é o espelho do DOCUMENTO fiscal (valor, status do
--       ciclo de emissão), NÃO a previsão de caixa; emitir nota != receber.
--     • Recebível AVULSO (venda de peça no balcão, acerto sem OS) não tem OS
--       nem nota — não cabe em nenhuma das duas.
--   Mitigação de DUPLICAÇÃO (o trade-off da tabela nova): a tabela NÃO duplica
--   dados; ela REFERENCIA a origem por FK opcional (os_comercial_id /
--   nota_fiscal_id) + o enum `origem`. O valor da OS continua único em
--   os_comercial; aqui registramos o(s) TÍTULO(S) financeiro(s) gerado(s) a
--   partir dela. A geração do recebível a partir da OS (1→N parcelas) é
--   responsabilidade do app/uma RPC futura — fora desta migration (aditiva).
--   Trade-off aceito: exige o app criar o título (não nasce sozinho), em troca
--   de Aging/Fluxo corretos por vencimento e suporte a parcela/adiantamento.
--
-- EXCLUÍDO DESTA MIGRATION — RH / FOLHA / FUNCIONÁRIOS:
--   NÃO criamos `funcionarios`/folha aqui. `funcionarios` pertence ao TOTEM e
--   a unificação (banco único) ainda está PENDENTE — criar do lado Sistema
--   agora causaria conflito de schema na convergência. RH/folha + metas
--   Bronze/Prata/Ouro ficam para DEPOIS do banco único (F-C do plano). Em
--   consequência, a linha "Mão-de-obra direta (folha)" da DRE NÃO é coberta
--   por esta migration — só as Despesas Operacionais (fixas/variáveis).
--
-- SEGURANÇA (padrão do projeto, idêntico a 0017/0018):
--   • oficina_id auto-preenchido pelo JWT (trigger set_oficina_id_from_jwt) —
--     sem digitação dupla.
--   • RLS enable + FORCE + policy de isolamento por oficina
--     (auth.jwt() ->> 'oficina_id') em TODAS as tabelas novas.
--   • Views com security_invoker = true: herdam a RLS das tabelas base (sem
--     isso vazaria financeiro entre oficinas — vazamento multi-tenant).
--   • Todos os objetos schema-qualificados (fecha hijack via search_path).
--
-- LGPD: dados de NEGÓCIO por oficina; fornecedores podem conter contato
--   (dado pessoal de PJ/PF) -> isolado por oficina_id via RLS.
-- 100% ADITIVO (só create ... if not exists / create or replace). Idempotente.
-- Rollback: supabase/rollbacks/0019_rollback.sql
-- =====================================================================

-- =====================================================================
-- 1) despesas — gasto operacional (fixa | variavel)
-- =====================================================================
create table if not exists public.despesas (
  id               uuid primary key default gen_random_uuid(),
  oficina_id       uuid not null references public.oficinas(id) on delete cascade,
  descricao        varchar(200) not null,
  categoria        varchar(60),                       -- ex.: aluguel, energia, marketing, material
  tipo             varchar(10) not null default 'variavel'
                     check (tipo in ('fixa','variavel')),
  valor            numeric(14,2) not null default 0 check (valor >= 0),
  data_competencia date not null default current_date,  -- mês de competência (DRE é por competência)
  -- recorrência: despesa que se repete (aluguel, software). periodicidade só
  -- faz sentido quando recorrente -> CHECK amarra os dois:
  recorrente       boolean not null default false,
  periodicidade    varchar(10)
                     check (periodicidade in ('mensal','semanal','anual')),
  observacoes      text,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  constraint chk_despesas_recorrencia
    check ( (recorrente = false and periodicidade is null)
         or (recorrente = true  and periodicidade is not null) )
);

comment on table public.despesas is
  'Despesas operacionais da oficina (fixa|variavel) por competência. Alimenta a DRE (Despesas Operacionais) e o módulo Despesas. NÃO inclui folha/RH (Totem; ver banco único).';
comment on column public.despesas.tipo is
  'fixa = mensal recorrente (aluguel, software); variavel = caixa pontual.';
comment on column public.despesas.data_competencia is
  'Mês de competência da despesa (a DRE agrega por competência, não por caixa).';
comment on column public.despesas.recorrente is
  'true se a despesa se repete; exige periodicidade (CHECK). A geração das próximas ocorrências é do app, não desta migration.';

-- índices: isolamento por oficina + agregações da DRE (competência/tipo/categoria)
create index if not exists idx_despesas_oficina     on public.despesas(oficina_id);
create index if not exists idx_despesas_competencia on public.despesas(oficina_id, data_competencia);
create index if not exists idx_despesas_tipo        on public.despesas(oficina_id, tipo);
create index if not exists idx_despesas_categoria   on public.despesas(oficina_id, categoria);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_despesas_oficina on public.despesas;
create trigger trg_despesas_oficina
  before insert on public.despesas
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa set_atualizado_em da 0001/0006)
drop trigger if exists trg_despesas_atualizado on public.despesas;
create trigger trg_despesas_atualizado
  before update on public.despesas
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.despesas enable row level security;
alter table public.despesas force  row level security;
drop policy if exists "despesas_isolation" on public.despesas;
create policy "despesas_isolation"
  on public.despesas
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- =====================================================================
-- 2) fornecedores — cadastro de quem a oficina paga
-- =====================================================================
create table if not exists public.fornecedores (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references public.oficinas(id) on delete cascade,
  nome          varchar(160) not null,            -- nome ou razão social
  documento     varchar(20),                      -- CPF/CNPJ
  categoria     varchar(60),                      -- ex.: pecas, tinta, servicos, utilidades
  email         varchar(120),
  telefone      varchar(30),
  observacoes   text,
  ativo         boolean not null default true,    -- soft-delete (preserva histórico)
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.fornecedores is
  'Cadastro de fornecedores (peças, tinta, serviços) por oficina. Cabeçalho do módulo Fornecedores; pai de contas_a_pagar.';

-- nome único POR OFICINA (não global): cada oficina tem o próprio catálogo
create unique index if not exists uq_fornecedores_oficina_nome
  on public.fornecedores(oficina_id, nome);
-- índices: isolamento por oficina + busca por categoria
create index if not exists idx_fornecedores_oficina   on public.fornecedores(oficina_id);
create index if not exists idx_fornecedores_categoria on public.fornecedores(oficina_id, categoria);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_fornecedores_oficina on public.fornecedores;
create trigger trg_fornecedores_oficina
  before insert on public.fornecedores
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa set_atualizado_em da 0001/0006)
drop trigger if exists trg_fornecedores_atualizado on public.fornecedores;
create trigger trg_fornecedores_atualizado
  before update on public.fornecedores
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.fornecedores enable row level security;
alter table public.fornecedores force  row level security;
drop policy if exists "fornecedores_isolation" on public.fornecedores;
create policy "fornecedores_isolation"
  on public.fornecedores
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- =====================================================================
-- 3) contas_a_pagar — título a pagar por fornecedor
--    fornecedor_id ON DELETE RESTRICT: não deixa sumir um fornecedor que
--    ainda tem título lançado (preserva o histórico do pagável). FK garante
--    fornecedor da MESMA oficina (RLS). pago_em só faz sentido quando 'pago'.
-- =====================================================================
create table if not exists public.contas_a_pagar (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references public.oficinas(id)        on delete cascade,
  fornecedor_id uuid references public.fornecedores(id)             on delete restrict,
  descricao     varchar(200) not null,
  categoria     varchar(60),                       -- ex.: pecas, tinta, aluguel
  valor         numeric(14,2) not null default 0 check (valor >= 0),
  vencimento    date not null,
  status        varchar(8) not null default 'aberto'
                  check (status in ('aberto','pago')),
  pago_em       date,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint chk_cap_pago_em
    check ( (status = 'aberto' and pago_em is null)
         or (status = 'pago'   and pago_em is not null) )
);

comment on table public.contas_a_pagar is
  'Títulos a pagar (por fornecedor). Alimenta Fornecedores + Aging (pagáveis) + Fluxo de Caixa (saídas projetadas por vencimento).';
comment on column public.contas_a_pagar.status is
  'aberto = em aberto (entra no Aging/Fluxo); pago = liquidado (exige pago_em via CHECK).';

-- índices: isolamento por oficina + joins + Aging/Fluxo por vencimento + status
create index if not exists idx_cap_oficina    on public.contas_a_pagar(oficina_id);
create index if not exists idx_cap_fornecedor on public.contas_a_pagar(fornecedor_id);
create index if not exists idx_cap_status     on public.contas_a_pagar(oficina_id, status);
create index if not exists idx_cap_vencimento on public.contas_a_pagar(oficina_id, vencimento);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_contas_a_pagar_oficina on public.contas_a_pagar;
create trigger trg_contas_a_pagar_oficina
  before insert on public.contas_a_pagar
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa set_atualizado_em da 0001/0006)
drop trigger if exists trg_contas_a_pagar_atualizado on public.contas_a_pagar;
create trigger trg_contas_a_pagar_atualizado
  before update on public.contas_a_pagar
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.contas_a_pagar enable row level security;
alter table public.contas_a_pagar force  row level security;
drop policy if exists "contas_a_pagar_isolation" on public.contas_a_pagar;
create policy "contas_a_pagar_isolation"
  on public.contas_a_pagar
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- =====================================================================
-- 4) contas_a_receber — título a receber (origem os|nota|avulso)
--    Ver DECISÃO no cabeçalho: tabela NOVA que REFERENCIA a origem (não
--    duplica). FKs opcionais com ON DELETE SET NULL: o recebível é registro
--    FINANCEIRO e sobrevive se a OS/nota sumir (guarda do histórico de caixa);
--    `origem` continua dizendo de onde veio. cliente_id também set null
--    (cliente pode ser apagado; o título permanece). recebido_em só faz
--    sentido quando 'recebido' (CHECK).
-- =====================================================================
create table if not exists public.contas_a_receber (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id)        on delete cascade,
  origem          varchar(8) not null default 'avulso'
                    check (origem in ('os','nota','avulso')),
  os_comercial_id uuid references public.os_comercial(id)            on delete set null,
  nota_fiscal_id  uuid references public.notas_fiscais(id)           on delete set null,
  cliente_id      uuid references public.clientes(id)                on delete set null,
  descricao       varchar(200) not null,
  valor           numeric(14,2) not null default 0 check (valor >= 0),
  vencimento      date not null,
  status          varchar(8) not null default 'aberto'
                    check (status in ('aberto','recebido')),
  recebido_em     date,
  observacoes     text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  constraint chk_car_recebido_em
    check ( (status = 'aberto'   and recebido_em is null)
         or (status = 'recebido' and recebido_em is not null) )
);

comment on table public.contas_a_receber is
  'Títulos a receber (origem os|nota|avulso). Tabela própria que REFERENCIA a OS/nota por FK (não duplica). Alimenta Receitas + Aging (recebíveis) + Fluxo de Caixa (entradas por vencimento). Suporta parcela/adiantamento (1 OS = N títulos).';
comment on column public.contas_a_receber.origem is
  'os = nasce de uma os_comercial; nota = de uma nota_fiscal; avulso = sem OS/nota (balcão/acerto).';
comment on column public.contas_a_receber.status is
  'aberto = a receber (entra no Aging/Fluxo); recebido = liquidado (exige recebido_em via CHECK).';

-- índices: isolamento por oficina + joins + Aging/Fluxo por vencimento + status
create index if not exists idx_car_oficina    on public.contas_a_receber(oficina_id);
create index if not exists idx_car_os         on public.contas_a_receber(os_comercial_id);
create index if not exists idx_car_nota       on public.contas_a_receber(nota_fiscal_id);
create index if not exists idx_car_cliente    on public.contas_a_receber(cliente_id);
create index if not exists idx_car_status     on public.contas_a_receber(oficina_id, status);
create index if not exists idx_car_vencimento on public.contas_a_receber(oficina_id, vencimento);

-- auto oficina_id (reusa a função da 0003/0006)
drop trigger if exists trg_contas_a_receber_oficina on public.contas_a_receber;
create trigger trg_contas_a_receber_oficina
  before insert on public.contas_a_receber
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa set_atualizado_em da 0001/0006)
drop trigger if exists trg_contas_a_receber_atualizado on public.contas_a_receber;
create trigger trg_contas_a_receber_atualizado
  before update on public.contas_a_receber
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.contas_a_receber enable row level security;
alter table public.contas_a_receber force  row level security;
drop policy if exists "contas_a_receber_isolation" on public.contas_a_receber;
create policy "contas_a_receber_isolation"
  on public.contas_a_receber
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- =====================================================================
-- 5) VIEWS (security_invoker = true — herdam a RLS por oficina das bases)
-- =====================================================================

-- 5.1) v_dre_despesas — despesas por mês × tipo × categoria (DRE Desp. Oper.) -
--    Agrega por mês de COMPETÊNCIA (date_trunc('month', ...)). O app filtra o
--    mês desejado e soma por tipo (fixa/variável) / categoria para a linha
--    "Despesas Operacionais" da DRE. Sem order by — o app ordena.
create or replace view public.v_dre_despesas
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina de despesas (sem isso vazaria entre oficinas)
select
  d.oficina_id,
  date_trunc('month', d.data_competencia)::date as competencia_mes,
  d.tipo,
  d.categoria,
  count(*)                       as qtd,
  coalesce(sum(d.valor), 0)      as total
from public.despesas d
group by d.oficina_id, date_trunc('month', d.data_competencia), d.tipo, d.categoria;

comment on view public.v_dre_despesas is
  'Despesas agregadas por mês de competência × tipo × categoria (linha Despesas Operacionais da DRE). security_invoker herda a RLS por oficina.';

-- 5.2) v_aging — recebíveis + pagáveis EM ABERTO por faixa de idade ----------
--    Une os dois lados (lado = 'receber' | 'pagar') somente o que está em
--    ABERTO. Faixa pela distância de hoje (current_date) ao vencimento:
--      a_vencer = vence hoje ou no futuro (>= 0 dias)
--      1-30 / 31-60 / 60+ = dias VENCIDOS (atraso). Casa com o Aging da planilha
--    (idade de recebíveis/pagáveis; provisão de risco por faixa).
--    UNION ALL (não UNION): os dois lados nunca colidem (lados distintos) e
--    UNION ALL evita o custo de dedup. Sem order by — o app ordena.
create or replace view public.v_aging
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina das bases (sem isso vazaria entre oficinas)
with titulos as (
  select
    r.oficina_id,
    'receber'::text as lado,
    r.id            as titulo_id,
    r.descricao,
    r.valor,
    r.vencimento,
    (current_date - r.vencimento) as dias_atraso   -- >0 vencido, <=0 a vencer
  from public.contas_a_receber r
  where r.status = 'aberto'
  union all
  select
    p.oficina_id,
    'pagar'::text   as lado,
    p.id            as titulo_id,
    p.descricao,
    p.valor,
    p.vencimento,
    (current_date - p.vencimento) as dias_atraso
  from public.contas_a_pagar p
  where p.status = 'aberto'
)
select
  t.oficina_id,
  t.lado,
  t.titulo_id,
  t.descricao,
  t.valor,
  t.vencimento,
  t.dias_atraso,
  case
    when t.dias_atraso <= 0  then 'a_vencer'
    when t.dias_atraso <= 30 then '1-30'
    when t.dias_atraso <= 60 then '31-60'
    else '60+'
  end as faixa
from titulos t;

comment on view public.v_aging is
  'Recebíveis + pagáveis EM ABERTO por faixa de idade (a_vencer | 1-30 | 31-60 | 60+) via dias de atraso vs. vencimento. lado = receber|pagar. security_invoker herda a RLS por oficina.';

-- 5.3) v_fluxo_caixa — projeção SEMANAL (entradas - saídas) por vencimento ----
--    Bucket = semana do vencimento (date_trunc('week', ...), segunda-feira no
--    Postgres). Soma entradas (a receber em aberto) e saídas (a pagar em aberto)
--    por semana e dá o líquido. É a base da "projeção semanal 60 dias" da
--    planilha — o app aplica a janela (ex.: próximas 8 semanas) e acumula o
--    saldo. FULL OUTER JOIN: semana com só entrada OU só saída ainda aparece.
--    Sem order by — o app ordena por semana.
create or replace view public.v_fluxo_caixa
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina das bases (sem isso vazaria entre oficinas)
with entradas as (
  select
    r.oficina_id,
    date_trunc('week', r.vencimento)::date as semana,
    sum(r.valor)                           as total_entrada
  from public.contas_a_receber r
  where r.status = 'aberto'
  group by r.oficina_id, date_trunc('week', r.vencimento)
),
saidas as (
  select
    p.oficina_id,
    date_trunc('week', p.vencimento)::date as semana,
    sum(p.valor)                           as total_saida
  from public.contas_a_pagar p
  where p.status = 'aberto'
  group by p.oficina_id, date_trunc('week', p.vencimento)
)
select
  coalesce(e.oficina_id, s.oficina_id)              as oficina_id,
  coalesce(e.semana, s.semana)                      as semana,
  coalesce(e.total_entrada, 0)                      as total_entrada,
  coalesce(s.total_saida, 0)                        as total_saida,
  coalesce(e.total_entrada, 0) - coalesce(s.total_saida, 0) as liquido_semana
from entradas e
full outer join saidas s
  on e.oficina_id = s.oficina_id and e.semana = s.semana;

comment on view public.v_fluxo_caixa is
  'Projeção semanal de caixa: entradas (a receber) - saídas (a pagar) em aberto, agrupadas pela semana do vencimento. Base da projeção 60 dias; o app aplica a janela e acumula o saldo. security_invoker herda a RLS por oficina.';

-- Fim da Migration 0019
