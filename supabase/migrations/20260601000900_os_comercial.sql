-- =====================================================================
-- Migration 0009 — OS Comercial (Fase 1) · ponte Orçamento aprovado -> Totem
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0005 (tenant+claim, RLS, clientes, veículos, orçamentos).
--
-- A OS Comercial nasce quando um orçamento é APROVADO: vira a ordem que vai
-- para a produção e sincroniza com o Totem. Guarda um SNAPSHOT do valor do
-- orçamento e a numeração sequencial POR OFICINA (1, 2, 3...).
-- IMPORTANTE: a atribuição do `numero` e o snapshot do valor são feitos pela
-- RPC aprovar_orcamento (migration 0010) — AQUI ficam só a coluna + a unique
-- que garante a sequência sem buraco/duplicata por oficina.
-- oficina_id é auto-preenchido pelo JWT (sem digitação dupla). RLS por oficina.
-- Idempotente (IF NOT EXISTS / DROP ... IF EXISTS).
-- Rollback: supabase/rollbacks/0009_rollback.sql
-- =====================================================================

-- 1) Tabela os_comercial ------------------------------------------------------
create table if not exists public.os_comercial (
  id                uuid primary key default gen_random_uuid(),
  oficina_id        uuid not null references public.oficinas(id)   on delete cascade,
  -- 1 OS por orçamento; orçamento não some se houver OS (restrict):
  orcamento_id      uuid not null references public.orcamentos(id) on delete restrict,
  cliente_id        uuid references public.clientes(id)            on delete set null,
  veiculo_id        uuid references public.veiculos(id)            on delete set null,
  -- sequencial POR OFICINA; atribuído pela RPC aprovar_orcamento (0010):
  numero            bigint not null,
  -- snapshot do valor do orçamento no momento da aprovação (preenchido na 0010):
  valor_orcamento   numeric(14,2) not null default 0,
  status            varchar(20) not null default 'aberta'
                      check (status in ('aberta','em_producao','concluida','entregue','cancelada')),
  os_ref            varchar(40),                 -- referência externa/Totem (opcional)
  totem_sync_status varchar(20) not null default 'pendente'
                      check (totem_sync_status in ('pendente','enviada','confirmada','erro')),
  totem_sync_em     timestamptz,
  data_aprovacao    timestamptz not null default now(),
  prazo_entrega     date,
  data_entrega_real timestamptz,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- 2) Índices ------------------------------------------------------------------
-- 1 OS por orçamento (idempotência da aprovação):
create unique index if not exists uq_os_comercial_orcamento on public.os_comercial(orcamento_id);
-- sequência sem duplicata por oficina:
create unique index if not exists uq_os_comercial_numero    on public.os_comercial(oficina_id, numero);
-- os_ref única por oficina QUANDO informada (partial -> permite vários NULL):
create unique index if not exists uq_os_comercial_osref     on public.os_comercial(oficina_id, os_ref) where os_ref is not null;
-- índices simples das FKs (isolamento por oficina + joins):
create index if not exists idx_os_comercial_oficina on public.os_comercial(oficina_id);
create index if not exists idx_os_comercial_cliente on public.os_comercial(cliente_id);
create index if not exists idx_os_comercial_veiculo on public.os_comercial(veiculo_id);

-- 3) auto oficina_id (reusa a função criada na 0003) --------------------------
drop trigger if exists trg_os_comercial_oficina on public.os_comercial;
create trigger trg_os_comercial_oficina
  before insert on public.os_comercial
  for each row execute function public.set_oficina_id_from_jwt();

-- 4) atualizado_em automático (reusa set_atualizado_em da 0001) ---------------
drop trigger if exists trg_os_comercial_atualizado on public.os_comercial;
create trigger trg_os_comercial_atualizado
  before update on public.os_comercial
  for each row execute function public.set_atualizado_em();

-- 5) RLS por oficina_id (claim do JWT) ----------------------------------------
alter table public.os_comercial enable row level security;
alter table public.os_comercial force row level security;
drop policy if exists "os_comercial_isolation" on public.os_comercial;
create policy "os_comercial_isolation"
  on public.os_comercial
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- Fim da Migration 0009
