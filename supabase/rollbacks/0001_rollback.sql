-- =====================================================================
-- ROLLBACK da Migration 0001 — base multi-tenant + claim hook
-- Projeto ALVO: TESTE  GDelta-Sistema-Teste  (ref zivdqykrppatcgdezvqu)
-- Desfaz na ordem inversa. ATENÇÃO: dropa as tabelas de tenant (perde dados).
-- Antes de rodar em qualquer lugar: confirmar o ref e ter backup.
-- Lembrete: desabilite o hook no painel (Authentication > Hooks) ANTES,
-- senão o Auth tentará chamar uma função que deixará de existir.
-- =====================================================================

revoke execute on function public.custom_access_token_hook(jsonb) from supabase_auth_admin;
drop function if exists public.custom_access_token_hook(jsonb);

drop policy if exists "auth_admin_le_user_oficinas" on public.user_oficinas;

drop trigger if exists trg_oficinas_atualizado on public.oficinas;
-- set_atualizado_em pode ser usada por outras tabelas no futuro; só dropa se órfã.
drop function if exists public.set_atualizado_em();

drop table if exists public.user_oficinas;
drop table if exists public.oficinas;

-- Fim do rollback 0001
