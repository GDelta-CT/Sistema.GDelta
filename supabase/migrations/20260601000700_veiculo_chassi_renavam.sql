-- =====================================================================
-- Migration 0007 — Veículo: chassi + renavam (Fase 1)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0004 (tabela public.veiculos).
--
-- Adiciona duas colunas NULL em public.veiculos para dados do CRLV: chassi
-- (VIN) e renavam. Sem backfill; ambas nullable. Sem mudança de RLS — herdam
-- a policy "veiculos_isolation" da 0004. São DADOS PESSOAIS (LGPD).
-- Idempotente. Rollback: supabase/rollbacks/0007_rollback.sql
-- =====================================================================

alter table public.veiculos add column if not exists chassi  text;
alter table public.veiculos add column if not exists renavam text;

comment on column public.veiculos.chassi  is 'Chassi/VIN (17 caracteres). Origem CRLV/veículo. Dado pessoal (LGPD).';
comment on column public.veiculos.renavam is 'RENAVAM (9-11 dígitos). Origem CRLV. Dado pessoal (LGPD).';

-- busca por chassi dentro da oficina (parcial: ignora linhas sem chassi)
create index if not exists idx_veiculos_chassi on public.veiculos (chassi) where chassi is not null;

-- Fim da Migration 0007
