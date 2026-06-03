-- =====================================================================
-- ROLLBACK da Migration 0013 — remove as 4 views do dashboard Financeiro.
-- Views de leitura (não materializadas) -> drop não perde dado das tabelas base.
-- =====================================================================

drop view if exists public.v_financeiro_kpis;
drop view if exists public.v_funil_os;
drop view if exists public.v_funil_orcamentos;
drop view if exists public.v_ranking_clientes;

-- Fim do rollback 0013
