-- =====================================================================
-- Migration 0003 — Módulo Clientes (Fase 1)
-- ALVO: TESTE primeiro. PROD só após validar + OK do fundador.
-- Pré-requisito: 0001 (tenant + claim) e 0002 (RLS) aplicadas.
--
-- Cliente é dado PESSOAL (nome, documento, telefone) -> isolado por oficina_id
-- via RLS + claim. oficina_id é auto-preenchido pelo JWT (sem digitação dupla).
-- Idempotente. Rollback: supabase/rollbacks/0003_rollback.sql
-- =====================================================================

-- 1) Tabela clientes ----------------------------------------------------
create table if not exists public.clientes (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references public.oficinas(id) on delete cascade,
  tipo          varchar(20) not null default 'particular'
                  check (tipo in ('particular','seguradora','cooperativa')),
  nome          varchar(160) not null,      -- nome ou razão social
  documento     varchar(20),                -- CPF/CNPJ (dado pessoal)
  email         varchar(120),
  telefone      varchar(30),
  observacoes   text,
  ativo         boolean not null default true,  -- soft-delete (preserva histórico)
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_clientes_oficina on public.clientes(oficina_id);
create index if not exists idx_clientes_nome    on public.clientes(oficina_id, nome);

-- 2) Auto-preencher oficina_id a partir do JWT (regra "sem digitação dupla")
--    Função genérica reutilizável pelas próximas tabelas de negócio.
create or replace function public.set_oficina_id_from_jwt()
returns trigger language plpgsql as $$
begin
  if new.oficina_id is null then
    new.oficina_id := (auth.jwt() ->> 'oficina_id')::uuid;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clientes_oficina on public.clientes;
create trigger trg_clientes_oficina
  before insert on public.clientes
  for each row execute function public.set_oficina_id_from_jwt();

-- 3) atualizado_em automático (reusa set_atualizado_em da 0001)
drop trigger if exists trg_clientes_atualizado on public.clientes;
create trigger trg_clientes_atualizado
  before update on public.clientes
  for each row execute function public.set_atualizado_em();

-- 4) RLS: cada oficina só vê/mexe nos próprios clientes (pelo claim do JWT)
alter table public.clientes enable row level security;
drop policy if exists "clientes_isolation" on public.clientes;
create policy "clientes_isolation"
  on public.clientes
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- Fim da Migration 0003
