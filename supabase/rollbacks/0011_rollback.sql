-- ROLLBACK da Migration 0011 — remove a view da métrica do Pátio.
drop view if exists public.v_os_dias_rs;
-- Fim do rollback 0011
