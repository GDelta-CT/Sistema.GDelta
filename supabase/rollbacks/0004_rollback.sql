-- ROLLBACK da Migration 0004 — módulo Veículo. Confirmar o ref antes de rodar.
drop policy if exists "veiculos_isolation" on public.veiculos;
drop table if exists public.veiculos;
-- Fim do rollback 0004
