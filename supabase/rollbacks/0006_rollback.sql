-- ROLLBACK da Migration 0006 — remove só o índice novo.
-- As funções com search_path fixo são uma MELHORIA de segurança; não as
-- revertemos (re-rodar 0001/0003 traria de volta a versão sem search_path).
drop index if exists public.idx_orcamentos_veiculo;
-- Fim do rollback 0006
