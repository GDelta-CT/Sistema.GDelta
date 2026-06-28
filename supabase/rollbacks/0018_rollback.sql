-- =====================================================================
-- Rollback 0018 — Fórmulas de tinta (custeio da cor por receita)
-- USO: TESTE. Em PROD, reverter exige decisão explícita do fundador.
-- Reverte na ordem inversa/segura: view -> item (FK filha) -> formula (pai).
-- Idempotente (drop ... if exists).
-- =====================================================================

drop view  if exists public.v_tinta_formula_custo;

drop table if exists public.tinta_formula_item;
drop table if exists public.tinta_formula;

-- Fim do Rollback 0018
