-- =====================================================================
-- Migration 0015 — Hardening RLS: FORCE nas tabelas antigas (auditoria do squad)
-- ALVO: TESTE primeiro (zivdqykrppatcgdezvqu). PROD só após validar + OK do fundador.
-- >>> NÃO APLICAR EM PRODUÇÃO sem OK explícito do fundador <<<
--
-- POR QUE FORCE? `enable row level security` aplica as policies a todos, MENOS
-- ao DONO da tabela (table owner) e a papéis BYPASSRLS. Em migrations/jobs que
-- rodam como owner, a RLS é silenciosamente ignorada — vazamento entre oficinas
-- por uma porta dos fundos. `force row level security` fecha essa porta: a RLS
-- passa a valer TAMBÉM para o dono. É defesa em profundidade pura.
--
-- As tabelas NOVAS (os_comercial, notas_fiscais, seguradora_perfil,
-- seguradora_mao_de_obra, estoque_itens, estoque_movimentos) já nasceram com
-- FORCE. Esta migration apenas PADRONIZA as tabelas ANTIGAS, que tinham só
-- `enable` (0001..0005). NÃO altera nenhuma policy — só ADICIONA o FORCE.
--
-- Idempotente por natureza: re-aplicar `force row level security` é no-op.
-- Pré-requisito: 0001..0005 aplicadas (RLS já HABILITADA nestas tabelas).
-- Rollback: supabase/rollbacks/0015_rollback.sql
-- =====================================================================

-- Tenant base (0001): RLS habilitada, faltava FORCE
alter table public.oficinas        force row level security;
alter table public.user_oficinas   force row level security;

-- Clientes (0003): RLS habilitada, faltava FORCE
alter table public.clientes        force row level security;

-- Veículos (0004): RLS habilitada, faltava FORCE
alter table public.veiculos        force row level security;

-- Orçamento + itens (0005): RLS habilitada, faltava FORCE
alter table public.orcamentos      force row level security;
alter table public.orcamento_itens force row level security;

-- Fim da Migration 0015
