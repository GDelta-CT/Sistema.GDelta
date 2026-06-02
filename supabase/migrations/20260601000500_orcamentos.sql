-- =====================================================================
-- Migration 0005 — Orçamento ao vivo (Fase 1) · o diferencial nº 1
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0004.
--
-- orcamentos (cabeçalho ligado a cliente+veículo) + orcamento_itens
-- (cada linha = peça / mão de obra / insumo, com CUSTO e VENDA).
-- Totais e MARGEM são COLUNAS GERADAS (o banco calcula) — fonte da verdade
-- do lucro. oficina_id auto pelo JWT; RLS por oficina.
-- Idempotente. Rollback: supabase/rollbacks/0005_rollback.sql
-- =====================================================================

-- 1) Cabeçalho do orçamento ----------------------------------------------------
create table if not exists public.orcamentos (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references public.oficinas(id) on delete cascade,
  cliente_id    uuid references public.clientes(id) on delete set null,
  veiculo_id    uuid references public.veiculos(id) on delete set null,
  status        varchar(20) not null default 'rascunho'
                  check (status in ('rascunho','enviado','aprovado','recusado')),
  desconto      numeric(12,2) not null default 0,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_orcamentos_oficina on public.orcamentos(oficina_id);
create index if not exists idx_orcamentos_cliente on public.orcamentos(cliente_id);

-- 2) Itens do orçamento (peça / mão de obra / insumo) --------------------------
create table if not exists public.orcamento_itens (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id) on delete cascade,
  orcamento_id    uuid not null references public.orcamentos(id) on delete cascade,
  tipo            varchar(20) not null check (tipo in ('peca','mao_de_obra','insumo')),
  descricao       varchar(200) not null,
  quantidade      numeric(12,2) not null default 1,
  custo_unitario  numeric(12,2) not null default 0,
  venda_unitaria  numeric(12,2) not null default 0,
  -- Totais e margem CALCULADOS pelo banco (fonte da verdade do lucro):
  total_custo     numeric(14,2) generated always as (quantidade * custo_unitario) stored,
  total_venda     numeric(14,2) generated always as (quantidade * venda_unitaria) stored,
  margem          numeric(14,2) generated always as (quantidade * (venda_unitaria - custo_unitario)) stored,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_orc_itens_orcamento on public.orcamento_itens(orcamento_id);
create index if not exists idx_orc_itens_oficina   on public.orcamento_itens(oficina_id);

-- 3) auto oficina_id (reusa função da 0003) ------------------------------------
drop trigger if exists trg_orcamentos_oficina on public.orcamentos;
create trigger trg_orcamentos_oficina before insert on public.orcamentos
  for each row execute function public.set_oficina_id_from_jwt();

drop trigger if exists trg_orc_itens_oficina on public.orcamento_itens;
create trigger trg_orc_itens_oficina before insert on public.orcamento_itens
  for each row execute function public.set_oficina_id_from_jwt();

-- 4) atualizado_em no cabeçalho (reusa set_atualizado_em da 0001) --------------
drop trigger if exists trg_orcamentos_atualizado on public.orcamentos;
create trigger trg_orcamentos_atualizado before update on public.orcamentos
  for each row execute function public.set_atualizado_em();

-- 5) RLS por oficina_id --------------------------------------------------------
alter table public.orcamentos enable row level security;
drop policy if exists "orcamentos_isolation" on public.orcamentos;
create policy "orcamentos_isolation" on public.orcamentos for all to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

alter table public.orcamento_itens enable row level security;
drop policy if exists "orc_itens_isolation" on public.orcamento_itens;
create policy "orc_itens_isolation" on public.orcamento_itens for all to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- Fim da Migration 0005
