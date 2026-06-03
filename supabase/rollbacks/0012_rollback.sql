-- =====================================================================
-- ROLLBACK da Migration 0012 — Notas Fiscais (registro LOCAL).
-- ALVO: confirmar o ref antes de rodar. DROPA a tabela notas_fiscais
-- (perde o espelho fiscal local — XML/PDF/chave/refs do agregador).
-- Ordem segura: derruba a policy e depois a tabela (cascade leva junto os
-- índices e triggers da própria tabela).
-- As funções genéricas (set_oficina_id_from_jwt / set_atualizado_em) são
-- COMPARTILHADAS por outras tabelas -> NÃO dropar.
-- =====================================================================

drop policy if exists "notas_fiscais_isolation" on public.notas_fiscais;
drop table  if exists public.notas_fiscais cascade;  -- cascade remove índices/triggers da tabela

-- Fim do rollback 0012
