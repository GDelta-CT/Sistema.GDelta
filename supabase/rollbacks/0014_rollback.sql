-- =====================================================================
-- ROLLBACK da Migration 0014 — Estoque.
-- ALVO: confirmar o ref antes de rodar. DROPA as tabelas estoque_movimentos
-- e estoque_itens (PERDE os dados de estoque e o histórico de movimentos).
-- Ordem reversa segura:
--   1) view  -> 2) trigger + função do saldo -> 3) tabelas.
-- Tabelas com CASCADE e na ordem MOVIMENTOS antes de ITENS (movimentos.item_id
-- referencia itens). CASCADE também leva índices/triggers/policy de cada tabela.
-- As funções GENÉRICAS (set_oficina_id_from_jwt / set_atualizado_em) são
-- COMPARTILHADAS por outras tabelas -> NÃO são dropadas aqui.
-- Tudo IF EXISTS (idempotente).
-- =====================================================================

-- 1) View primeiro (depende de estoque_itens) --------------------------------
drop view if exists public.v_estoque_alertas;

-- 2) Trigger do saldo + sua função (própria desta migration) -----------------
drop trigger  if exists trg_estoque_mov_aplica on public.estoque_movimentos;
drop function if exists public.aplicar_movimento_estoque();

-- 3) Tabelas: movimentos ANTES de itens (FK item_id) -------------------------
drop policy if exists "estoque_movimentos_isolation" on public.estoque_movimentos;
drop policy if exists "estoque_itens_isolation"      on public.estoque_itens;
drop table  if exists public.estoque_movimentos cascade;
drop table  if exists public.estoque_itens      cascade;

-- Fim do rollback 0014
