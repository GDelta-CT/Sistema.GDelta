-- =====================================================================
-- Rollback 0019 — FINANCEIRO / GESTÃO
-- USO: TESTE. Em PROD, reverter exige decisão explícita do fundador
--   (o "Protocolo de Código Seguro" proíbe DROP silencioso em PROD).
-- Reverte na ordem inversa/segura: views -> tabelas filhas (FK) -> pais.
--   • contas_a_pagar referencia fornecedores (RESTRICT) -> cai ANTES.
--   • contas_a_receber referencia os_comercial/notas_fiscais/clientes
--     (SET NULL, externas a esta migration) -> cai sem tocar nas bases.
--   • despesas é independente.
-- Idempotente (drop ... if exists).
-- =====================================================================

drop view  if exists public.v_fluxo_caixa;
drop view  if exists public.v_aging;
drop view  if exists public.v_dre_despesas;

drop table if exists public.contas_a_receber;
drop table if exists public.contas_a_pagar;   -- filha de fornecedores (RESTRICT) -> antes do pai
drop table if exists public.fornecedores;
drop table if exists public.despesas;

-- Fim do Rollback 0019
