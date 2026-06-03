-- =====================================================================
-- Migration 0008 — Seguradora como entidade de PRIMEIRA CLASSE (Fase 1)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001 (tenant+claim), 0002 (RLS), 0003 (clientes).
--
-- DECISÃO DE SCHEMA (e porquê):
--   Seguradora CONTINUA sendo um cliente (pessoa jurídica). A coluna
--   clientes.tipo JÁ aceita 'seguradora' (constraint criada na 0003) e o
--   TipoCliente/TIPOS_CLIENTE no app já contemplam — portanto NÃO mexemos
--   na constraint/enum (mudança seria redundante e arriscaria a 0003).
--   O que falta é o que torna a seguradora "primeira classe": tabela de
--   mão de obra própria, prazo de aprovação e regra de franquia.
--
--   Modelamos isso como EXTENSÃO 1:1 do cliente (não duplicamos nome/doc):
--     • seguradora_perfil       — 1:1 com clientes (UNIQUE em cliente_id):
--                                 prazo_aprovacao_dias, franquia_valor, obs.
--     • seguradora_mao_de_obra  — N tabela de valores de mão de obra própria
--                                 da seguradora (descricao, valor, unidade).
--   Só clientes tipo 'seguradora' devem ganhar perfil/mão de obra (regra de
--   negócio na app); o banco não restringe o tipo aqui para manter o vínculo
--   simples (FK -> clientes) e permitir reclassificação sem perda de dados.
--
--   Segurança/LGPD: ambas as tabelas têm oficina_id NOT NULL, RLS habilitada,
--   as MESMAS 4 garantias por oficina_id do claim (policy "for all" cobrindo
--   select/insert/update/delete), trigger de auto-preenchimento do oficina_id
--   (sem digitação dupla) e reúso das funções com search_path fixo (0006).
--
-- Idempotente (IF NOT EXISTS / DROP IF EXISTS). Rollback: supabase/rollbacks/0008_rollback.sql
-- =====================================================================

-- 1) Perfil 1:1 da seguradora (extensão do cliente) ----------------------------
create table if not exists public.seguradora_perfil (
  cliente_id           uuid primary key
                         references public.clientes(id) on delete cascade,  -- 1:1 (PK = UNIQUE)
  oficina_id           uuid not null references public.oficinas(id) on delete cascade,
  prazo_aprovacao_dias integer,                 -- prazo de aprovação (dias)
  franquia_valor       numeric(12,2),           -- franquia padrão (R$)
  observacoes          text,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);
create index if not exists idx_seguradora_perfil_oficina on public.seguradora_perfil(oficina_id);

-- 2) Mão de obra própria da seguradora (tabela de valores) ---------------------
create table if not exists public.seguradora_mao_de_obra (
  id                    uuid primary key default gen_random_uuid(),
  oficina_id            uuid not null references public.oficinas(id) on delete cascade,
  seguradora_cliente_id uuid not null references public.clientes(id) on delete cascade,
  descricao             text not null,
  valor                 numeric(12,2) not null,
  unidade               text,                    -- ex.: "hora", "peça", "ponto"
  criado_em             timestamptz not null default now()
);
create index if not exists idx_seg_mao_obra_oficina    on public.seguradora_mao_de_obra(oficina_id);
create index if not exists idx_seg_mao_obra_seguradora on public.seguradora_mao_de_obra(seguradora_cliente_id);

-- 3) auto oficina_id a partir do JWT (reusa função da 0003 / hardened na 0006) --
drop trigger if exists trg_seguradora_perfil_oficina on public.seguradora_perfil;
create trigger trg_seguradora_perfil_oficina before insert on public.seguradora_perfil
  for each row execute function public.set_oficina_id_from_jwt();

drop trigger if exists trg_seg_mao_obra_oficina on public.seguradora_mao_de_obra;
create trigger trg_seg_mao_obra_oficina before insert on public.seguradora_mao_de_obra
  for each row execute function public.set_oficina_id_from_jwt();

-- 4) atualizado_em no perfil (reusa set_atualizado_em da 0001 / hardened 0006) --
drop trigger if exists trg_seguradora_perfil_atualizado on public.seguradora_perfil;
create trigger trg_seguradora_perfil_atualizado before update on public.seguradora_perfil
  for each row execute function public.set_atualizado_em();

-- 5) RLS por oficina_id (claim do JWT) — isolamento total por tenant -----------
alter table public.seguradora_perfil enable row level security;
drop policy if exists "seguradora_perfil_isolation" on public.seguradora_perfil;
create policy "seguradora_perfil_isolation" on public.seguradora_perfil for all to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

alter table public.seguradora_mao_de_obra enable row level security;
drop policy if exists "seg_mao_obra_isolation" on public.seguradora_mao_de_obra;
create policy "seg_mao_obra_isolation" on public.seguradora_mao_de_obra for all to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- Fim da Migration 0008
