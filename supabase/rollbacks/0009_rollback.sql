-- =====================================================================
-- ROLLBACK da Migration 0009 — OS Comercial.
-- ALVO: confirmar o ref antes de rodar. DROPA a tabela os_comercial
-- (perde os dados de OS). Usa CASCADE: a view v_os_dias_rs (0011) depende
-- desta tabela; índices/triggers/policy da própria tabela caem junto.
-- Ideal: rodar os rollbacks em ordem reversa (0011 -> 0010 -> 0009).
-- As funções genéricas (set_oficina_id_from_jwt / set_atualizado_em) são
-- reutilizadas por outras tabelas -> mantidas.
-- =====================================================================

drop policy if exists "os_comercial_isolation" on public.os_comercial;
drop table  if exists public.os_comercial cascade;  -- cascade: leva junto a view v_os_dias_rs (0011) e objetos da tabela

-- Fim do rollback 0009
