-- =====================================================================
-- ROLLBACK da Migration 0010 — Aprovar Orçamento (RPC) + contrato da OS.
-- Confirmar o ref antes de rodar. Remove a RPC aprovar_orcamento, os 2
-- triggers (cancelamento e trava) e suas funções. NÃO mexe em dados:
-- a tabela os_comercial (0009) e os orçamentos (0005) permanecem intactos;
-- OSs já criadas e números atribuídos continuam existindo.
-- Ordem reversa segura: triggers -> funções dos triggers -> RPC. Tudo IF EXISTS.
-- =====================================================================

-- 1) Triggers primeiro (dependem das funções) --------------------------------
drop trigger if exists trg_orc_itens_trava_aprovado on public.orcamento_itens;
drop trigger if exists trg_orcamentos_cancela_os    on public.orcamentos;

-- 2) Funções dos triggers ----------------------------------------------------
drop function if exists public.trava_itens_orcamento_aprovado();
drop function if exists public.cancelar_os_ao_recusar_orcamento();

-- 3) RPC ---------------------------------------------------------------------
drop function if exists public.aprovar_orcamento(uuid);

-- Fim do rollback 0010
