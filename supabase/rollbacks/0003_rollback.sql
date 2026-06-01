-- =====================================================================
-- ROLLBACK da Migration 0003 — módulo Clientes
-- ALVO: confirmar o ref antes de rodar. DROPA a tabela clientes (perde dados).
-- A função set_oficina_id_from_jwt() é genérica/reutilizável -> mantida.
-- =====================================================================

drop policy if exists "clientes_isolation" on public.clientes;
drop table if exists public.clientes;  -- cascade remove os triggers da tabela

-- Fim do rollback 0003
