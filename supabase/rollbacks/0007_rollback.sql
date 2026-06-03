-- ROLLBACK da Migration 0007 — remove chassi + renavam de public.veiculos.
-- Ordem inversa: índice, depois as colunas. Confirmar o ref antes de rodar.
drop index  if exists public.idx_veiculos_chassi;
alter table public.veiculos drop column if exists renavam;
alter table public.veiculos drop column if exists chassi;
-- Fim do rollback 0007
