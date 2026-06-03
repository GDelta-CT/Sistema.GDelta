-- =====================================================================
-- ROLLBACK da Migration 0015 — Hardening RLS (FORCE nas tabelas antigas)
-- ALVO: TESTE primeiro (zivdqykrppatcgdezvqu). Confirmar o ref antes de rodar.
--
-- Volta as tabelas ao estado anterior (apenas `enable`, sem FORCE). NÃO mexe
-- em policies nem dropa dados — só retira o FORCE adicionado na 0015.
-- As tabelas NOVAS (já nasceram com FORCE) NÃO são tocadas aqui.
-- Idempotente: `no force row level security` repetido é no-op.
-- =====================================================================

alter table public.orcamento_itens no force row level security;
alter table public.orcamentos      no force row level security;
alter table public.veiculos        no force row level security;
alter table public.clientes        no force row level security;
alter table public.user_oficinas   no force row level security;
alter table public.oficinas        no force row level security;

-- Fim do rollback 0015
