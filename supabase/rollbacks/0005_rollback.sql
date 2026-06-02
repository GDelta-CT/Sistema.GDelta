-- ROLLBACK da Migration 0005 — Orçamento. Confirmar o ref antes de rodar.
drop policy if exists "orc_itens_isolation" on public.orcamento_itens;
drop policy if exists "orcamentos_isolation" on public.orcamentos;
drop table if exists public.orcamento_itens;
drop table if exists public.orcamentos;
-- Fim do rollback 0005
