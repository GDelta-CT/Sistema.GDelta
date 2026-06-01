-- =====================================================================
-- ROLLBACK da Migration 0002 — remove as políticas RLS por oficina_id
-- ALVO: confirmar o ref antes de rodar.
-- Remove só as políticas desta migration; a RLS segue habilitada (0001),
-- então as tabelas voltam ao estado "trancado" (sem acesso por authenticated).
-- =====================================================================

drop policy if exists "oficina_self" on public.oficinas;
drop policy if exists "user_oficinas_self" on public.user_oficinas;

-- Fim do rollback 0002
