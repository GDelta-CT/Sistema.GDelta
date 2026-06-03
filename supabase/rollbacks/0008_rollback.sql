-- =====================================================================
-- ROLLBACK da Migration 0008 — Seguradora primeira classe.
-- Confirmar o ref antes de rodar. DROPA as duas tabelas (perde os dados de
-- perfil e de mão de obra das seguradoras). NÃO mexe em clientes.tipo: a
-- constraint que aceita 'seguradora' veio da 0003 e permanece intacta.
-- As funções genéricas (set_oficina_id_from_jwt / set_atualizado_em) são
-- reutilizadas por outras tabelas -> mantidas. Ordem reversa segura.
-- =====================================================================

drop policy if exists "seg_mao_obra_isolation" on public.seguradora_mao_de_obra;
drop table  if exists public.seguradora_mao_de_obra;  -- cascade remove os triggers da tabela

drop policy if exists "seguradora_perfil_isolation" on public.seguradora_perfil;
drop table  if exists public.seguradora_perfil;       -- cascade remove os triggers da tabela

-- Fim do rollback 0008
