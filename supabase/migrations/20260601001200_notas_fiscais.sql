-- =====================================================================
-- Migration 0012 — Notas Fiscais (registro LOCAL) · espelho da emissão fiscal
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0009 (os_comercial) — e 0001..0006 (tenant+claim, RLS, funções).
--
-- Registro LOCAL da nota fiscal: a EMISSÃO REAL é feita por um agregador
-- externo (focus|nuvemfiscal|plugnotas), FORA desta migration. Aqui guardamos
-- o espelho do documento: tipo (nfse/nfe), status do ciclo de vida, referência
-- de idempotência no agregador, número/série oficiais que voltam, chave de
-- acesso, links de XML/PDF e a mensagem de status/erro do provedor.
-- A nota NASCE de uma OS Comercial (os_comercial_id); se a OS sumir, o registro
-- fiscal é PRESERVADO (on delete set null) — exigência de guarda fiscal.
-- LGPD: contém dados FISCAIS e PESSOAIS (vinculados ao tomador via OS) ->
-- isolado por oficina_id via RLS + claim do JWT. oficina_id é auto-preenchido
-- pelo JWT (sem digitação dupla).
-- Idempotente (IF NOT EXISTS / DROP ... IF EXISTS).
-- Rollback: supabase/rollbacks/0012_rollback.sql
-- =====================================================================

-- 1) Tabela notas_fiscais -----------------------------------------------------
create table if not exists public.notas_fiscais (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id)     on delete cascade,
  -- a nota nasce de uma OS; set null preserva o registro fiscal se a OS sumir:
  os_comercial_id uuid references public.os_comercial(id)         on delete set null,
  tipo            varchar(8)  not null
                    check (tipo in ('nfse','nfe')),
  status          varchar(16) not null default 'rascunho'
                    check (status in ('rascunho','processando','autorizada','rejeitada','cancelada')),
  agregador       varchar(30),                 -- provedor usado: focus|nuvemfiscal|plugnotas
  agregador_ref   varchar(80),                 -- id externo no agregador (idempotência)
  numero          varchar(30),                 -- número oficial, volta do agregador
  serie           varchar(10),
  valor           numeric(14,2) not null default 0,
  chave_acesso    varchar(60),                 -- chave da NF-e
  xml_url         text,
  pdf_url         text,
  mensagem        text,                        -- mensagem de status/erro do agregador
  emitida_em      timestamptz,
  cancelada_em    timestamptz,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- 2) Índices ------------------------------------------------------------------
-- idempotência da emissão: 1 ref por (oficina, agregador) QUANDO informada
-- (partial -> permite várias notas ainda sem ref/rascunho):
create unique index if not exists uq_notas_agregador_ref
  on public.notas_fiscais(oficina_id, agregador, agregador_ref)
  where agregador_ref is not null;
-- índices simples (isolamento por oficina + joins + filtro por status):
create index if not exists idx_notas_oficina      on public.notas_fiscais(oficina_id);
create index if not exists idx_notas_os_comercial on public.notas_fiscais(os_comercial_id);
create index if not exists idx_notas_status       on public.notas_fiscais(status);

-- 3) auto oficina_id (reusa a função criada na 0003) --------------------------
drop trigger if exists trg_notas_fiscais_oficina on public.notas_fiscais;
create trigger trg_notas_fiscais_oficina
  before insert on public.notas_fiscais
  for each row execute function public.set_oficina_id_from_jwt();

-- 4) atualizado_em automático (reusa set_atualizado_em da 0001) ---------------
drop trigger if exists trg_notas_fiscais_atualizado on public.notas_fiscais;
create trigger trg_notas_fiscais_atualizado
  before update on public.notas_fiscais
  for each row execute function public.set_atualizado_em();

-- 5) RLS por oficina_id (claim do JWT) ----------------------------------------
alter table public.notas_fiscais enable row level security;
drop policy if exists "notas_fiscais_isolation" on public.notas_fiscais;
create policy "notas_fiscais_isolation"
  on public.notas_fiscais
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- Fim da Migration 0012
