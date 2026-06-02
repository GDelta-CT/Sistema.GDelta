-- =====================================================================
-- Migration 0004 — Módulo Veículo (Fase 1)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001/0002/0003.
--
-- Veículo pertence (opcionalmente) a um cliente da MESMA oficina. Dados podem
-- vir do FIPE (marca/modelo/ano/valor). oficina_id auto pelo JWT. RLS por oficina.
-- Idempotente. Rollback: supabase/rollbacks/0004_rollback.sql
-- =====================================================================

create table if not exists public.veiculos (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references public.oficinas(id) on delete cascade,
  cliente_id    uuid references public.clientes(id) on delete set null,
  placa         varchar(8) not null,            -- normalizada em maiúsculas (app)
  marca         varchar(60),
  modelo        varchar(120),
  ano_modelo    varchar(12),                    -- FIPE: "2020" / "2020-3" etc.
  combustivel   varchar(30),
  cor           varchar(40),
  fipe_codigo   varchar(20),
  fipe_valor    numeric(12,2),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_veiculos_oficina on public.veiculos(oficina_id);
create index if not exists idx_veiculos_cliente on public.veiculos(cliente_id);
-- uma placa ÚNICA por oficina (histórico entre oficinas diferentes preservado)
create unique index if not exists uq_veiculos_oficina_placa on public.veiculos(oficina_id, placa);

-- auto oficina_id (reusa a função criada na 0003)
drop trigger if exists trg_veiculos_oficina on public.veiculos;
create trigger trg_veiculos_oficina
  before insert on public.veiculos
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em (reusa set_atualizado_em da 0001)
drop trigger if exists trg_veiculos_atualizado on public.veiculos;
create trigger trg_veiculos_atualizado
  before update on public.veiculos
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id (claim do JWT)
alter table public.veiculos enable row level security;
drop policy if exists "veiculos_isolation" on public.veiculos;
create policy "veiculos_isolation"
  on public.veiculos
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- Fim da Migration 0004
