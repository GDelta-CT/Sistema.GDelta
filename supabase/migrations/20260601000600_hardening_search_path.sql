-- =====================================================================
-- Migration 0006 — Hardening (auditoria do squad)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
--
-- Recria as funções com `search_path` FIXO (fecha o vetor de hijack que a
-- auditoria de segurança/banco apontou, e o Supabase Advisor sinaliza).
-- Todos os objetos são schema-qualificados; pg_catalog continua implícito.
-- Idempotente. Rollback: supabase/rollbacks/0006_rollback.sql
-- =====================================================================

-- 1) Hook do claim — search_path fixo
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims        jsonb;
  v_oficina_id  uuid;
  v_role        text;
begin
  select uo.oficina_id, uo.role
    into v_oficina_id, v_role
  from public.user_oficinas uo
  where uo.user_id = (event->>'user_id')::uuid
  order by uo.criado_em asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);
  if v_oficina_id is not null then
    claims := jsonb_set(claims, '{oficina_id}', to_jsonb(v_oficina_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  end if;
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- grants do hook (idempotente; replace preserva, re-aplica por segurança)
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- 2) Trigger de oficina_id — search_path fixo
create or replace function public.set_oficina_id_from_jwt()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.oficina_id is null then
    new.oficina_id := (auth.jwt() ->> 'oficina_id')::uuid;
  end if;
  return new;
end;
$$;

-- 3) Trigger de atualizado_em — search_path fixo
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- 4) Índice faltante na FK orcamentos.veiculo_id (auditoria de banco)
create index if not exists idx_orcamentos_veiculo on public.orcamentos(veiculo_id);

-- Fim da Migration 0006
