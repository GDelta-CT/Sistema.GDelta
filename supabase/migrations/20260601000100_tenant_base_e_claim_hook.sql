-- =====================================================================
-- Migration 0001 — Base multi-tenant + Custom Access Token Hook (claim)
-- Projeto ALVO: TESTE  GDelta-Sistema-Teste  (ref zivdqykrppatcgdezvqu)
-- >>> NÃO APLICAR EM PRODUÇÃO sem OK explícito do fundador <<<
--
-- ORDEM SAGRADA: este passo cria as tabelas de tenant e o HOOK que injeta
-- `oficina_id` no JWT. As políticas RLS que LEEM esse claim ficam na 0002
-- (Passo 5) — claim ANTES de RLS. "Nada de fechadura sem porta."
--
-- Idempotente: pode rodar de novo (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS).
-- Rollback: supabase/rollbacks/0001_rollback.sql
-- =====================================================================

-- 1) Tabela de TENANT: oficinas -------------------------------------------------
create table if not exists public.oficinas (
  id               uuid primary key default gen_random_uuid(),
  nome             varchar(120) not null,
  cnpj             varchar(20),
  razao_social     varchar(160),
  email            varchar(120),
  telefone         varchar(30),
  -- Assinatura (campos de billing já previstos; uso pleno na fase de cobrança)
  plano            varchar(20)  not null default 'trial',
  status_assinatura varchar(20) not null default 'ativa',
  trial_ate        timestamptz,
  criado_em        timestamptz  not null default now(),
  atualizado_em    timestamptz  not null default now()
);

-- 2) Vínculo usuário -> oficina (com papel) ------------------------------------
create table if not exists public.user_oficinas (
  user_id    uuid not null references auth.users(id) on delete cascade,
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  role       varchar(20) not null check (role in ('dono','gerente','operario','contador')),
  criado_em  timestamptz not null default now(),
  primary key (user_id, oficina_id)
);

create index if not exists idx_user_oficinas_user on public.user_oficinas(user_id);

-- 3) Trigger de atualizado_em em oficinas --------------------------------------
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_oficinas_atualizado on public.oficinas;
create trigger trg_oficinas_atualizado
  before update on public.oficinas
  for each row execute function public.set_atualizado_em();

-- 4) CUSTOM ACCESS TOKEN HOOK — injeta oficina_id + user_role no JWT -----------
-- O Supabase Auth chama esta função na emissão de cada token. Ela lê o vínculo
-- do usuário e carimba os claims. É o que faltava versionado no Totem.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims        jsonb;
  v_oficina_id  uuid;
  v_role        text;
begin
  -- Pega o vínculo do usuário (se pertencer a mais de uma oficina, o mais antigo).
  select uo.oficina_id, uo.role
    into v_oficina_id, v_role
  from public.user_oficinas uo
  where uo.user_id = (event->>'user_id')::uuid
  order by uo.criado_em asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);

  if v_oficina_id is not null then
    -- carimbado pelo SERVIDOR (o cliente não escolhe esse valor)
    claims := jsonb_set(claims, '{oficina_id}', to_jsonb(v_oficina_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- 5) Permissões do hook (executado pelo papel supabase_auth_admin) -------------
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- O hook precisa LER user_oficinas. Habilita RLS e libera só o auth admin.
alter table public.user_oficinas enable row level security;
grant select on table public.user_oficinas to supabase_auth_admin;

drop policy if exists "auth_admin_le_user_oficinas" on public.user_oficinas;
create policy "auth_admin_le_user_oficinas"
  on public.user_oficinas
  as permissive for select
  to supabase_auth_admin
  using (true);

-- 6) RLS na tabela oficinas: ativada agora, porém TRANCADA (sem policy).
--    As políticas por oficina_id (que leem o claim) entram na 0002 (Passo 5),
--    depois que o claim estiver PROVADO no token. Ordem sagrada.
alter table public.oficinas enable row level security;

-- Fim da Migration 0001
