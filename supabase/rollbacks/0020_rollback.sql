-- =====================================================================
-- Rollback 0020 — Promover Orçamento aprovado em OS (RPC + itens da OS)
-- USO: TESTE. Em PROD, reverter exige decisão explícita do fundador
--   (o "Protocolo de Código Seguro" proíbe DROP silencioso em PROD).
-- Confirmar o ref de destino ANTES de rodar.
--
-- Reverte na ordem inversa/segura:
--   1) a RPC gerar_os_de_orcamento (não depende de mais nada);
--   2) a tabela os_comercial_itens (filha de os_comercial via FK cascade —
--      cai sem tocar em os_comercial nem em orcamento_itens).
-- NÃO mexe em dados de outras migrations: os_comercial (0009), orcamentos
--   (0005) e a RPC aprovar_orcamento (0010) permanecem intactas; OSs já
--   criadas continuam existindo (perdem apenas o snapshot de itens).
-- Idempotente (drop ... if exists).
-- =====================================================================

-- 1) RPC ---------------------------------------------------------------------
drop function if exists public.gerar_os_de_orcamento(uuid);

-- 2) Tabela de itens da OS (policy cai junto com a tabela) -------------------
drop policy if exists "os_comercial_itens_isolation" on public.os_comercial_itens;
drop table  if exists public.os_comercial_itens;

-- Fim do Rollback 0020
