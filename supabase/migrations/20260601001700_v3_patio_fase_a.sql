-- =====================================================================
-- Migration 0017 — Diretriz V3 (Fase A): Pátio/IEO lado Sistema
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0016 (tenant+claim, RLS, hardening, os_comercial,
--                orcamentos/itens, estoque). Reusa set_oficina_id_from_jwt.
--
-- CONTEXTO (PDF "Diretrizes V3" — Otimização de Pátio, IEO e ROI):
--   Esta é a FASE A — somente objetos do lado SISTEMA (os_comercial,
--   orcamento_itens, estoque). NÃO toca em nenhuma tabela do Totem
--   (ordens_servico/apontamentos) — isso é a Fase B, na DB compartilhada.
--   100% ADITIVO (só ALTER ADD / novas tabelas), nunca DROP — conforme o
--   "Protocolo de Código Seguro" do PDF.
--
-- O QUE ENTREGA:
--   A1) os_comercial.meta_horas       — tempo ORÇADO pela seguradora (base do IEO).
--       os_comercial.integracao_payload jsonb — future-proof Audatex/Cília (XML/JSON).
--   A2) os_insumos_consumidos — consumo REAL de insumo por OS × item × preparador
--       (custo consumido vs orçado). Espelha o padrão de estoque_movimentos.
--   A3) os_auditoria_cabine — aplicação vs ciclo de cura da estufa (gargalo + caro).
--   A4) v_insumo_estouro     — custo de insumo ESTIMADO (orçamento) × CONSUMIDO → estouro.
--       v_cabine_desperdicio — cura real × padrão → desperdício de energia/tempo.
--
-- SEGURANÇA (padrão do projeto):
--   • oficina_id auto-preenchido pelo JWT (trigger set_oficina_id_from_jwt).
--   • RLS enable + FORCE + policy de isolamento por oficina em todas as tabelas novas.
--   • Views com security_invoker = true (herdam a RLS das bases; sem isso vazaria
--     entre oficinas). Objetos schema-qualificados.
-- Idempotente (IF NOT EXISTS / create or replace / drop ... if exists).
-- Rollback: supabase/rollbacks/0017_rollback.sql
-- =====================================================================

-- A1) Campos na OS comercial (IEO + future-proof) ---------------------------
alter table public.os_comercial
  add column if not exists meta_horas         numeric(10,2);  -- tempo orçado (h) pela seguradora
alter table public.os_comercial
  add column if not exists integracao_payload jsonb;          -- Audatex/Cília (importação futura)

comment on column public.os_comercial.meta_horas is
  'Tempo orçado em horas pela seguradora; base do IEO (orçado x real).';
comment on column public.os_comercial.integracao_payload is
  'Payload bruto de integração (Audatex/Cília) para importação futura via API/XML.';

-- A2) os_insumos_consumidos — consumo real de insumo por OS -----------------
create table if not exists public.os_insumos_consumidos (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id)       on delete cascade,
  os_comercial_id uuid not null references public.os_comercial(id)   on delete cascade,
  -- item do estoque (opcional; set null preserva o histórico do consumo):
  estoque_item_id uuid references public.estoque_itens(id) on delete set null,
  descricao       varchar(200),                 -- usado quando não vem do estoque
  nome_funcionario text,                         -- preparador/pintor (identidade denormalizada, igual Totem)
  quantidade      numeric(14,3) not null check (quantidade > 0),
  custo_unitario  numeric(14,2) not null default 0,
  custo_total     numeric(16,2) generated always as (quantidade * custo_unitario) stored,
  criado_em       timestamptz   not null default now()
);

create index if not exists idx_os_insumos_oficina on public.os_insumos_consumidos(oficina_id);
create index if not exists idx_os_insumos_os       on public.os_insumos_consumidos(os_comercial_id);
create index if not exists idx_os_insumos_item     on public.os_insumos_consumidos(estoque_item_id);

drop trigger if exists trg_os_insumos_oficina on public.os_insumos_consumidos;
create trigger trg_os_insumos_oficina
  before insert on public.os_insumos_consumidos
  for each row execute function public.set_oficina_id_from_jwt();

alter table public.os_insumos_consumidos enable row level security;
alter table public.os_insumos_consumidos force  row level security;
drop policy if exists "os_insumos_consumidos_isolation" on public.os_insumos_consumidos;
create policy "os_insumos_consumidos_isolation"
  on public.os_insumos_consumidos
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- A3) os_auditoria_cabine — aplicação vs ciclo de cura ----------------------
create table if not exists public.os_auditoria_cabine (
  id                  uuid primary key default gen_random_uuid(),
  oficina_id          uuid not null references public.oficinas(id)     on delete cascade,
  os_comercial_id     uuid not null references public.os_comercial(id) on delete cascade,
  aplicacao_inicio    timestamptz,
  cura_inicio         timestamptz,
  cura_fim            timestamptz,
  cura_minutos_padrao integer,                  -- padrão esperado de cura (min)
  observacao          text,
  criado_em           timestamptz not null default now()
);

create index if not exists idx_os_cabine_oficina on public.os_auditoria_cabine(oficina_id);
create index if not exists idx_os_cabine_os       on public.os_auditoria_cabine(os_comercial_id);

drop trigger if exists trg_os_cabine_oficina on public.os_auditoria_cabine;
create trigger trg_os_cabine_oficina
  before insert on public.os_auditoria_cabine
  for each row execute function public.set_oficina_id_from_jwt();

alter table public.os_auditoria_cabine enable row level security;
alter table public.os_auditoria_cabine force  row level security;
drop policy if exists "os_auditoria_cabine_isolation" on public.os_auditoria_cabine;
create policy "os_auditoria_cabine_isolation"
  on public.os_auditoria_cabine
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- A4) Views de gargalo (security_invoker — herdam RLS por oficina) ----------

-- Estouro de insumo: estimado (itens 'insumo' do orçamento) x consumido (real).
create or replace view public.v_insumo_estouro
  with (security_invoker = true) as
select
  oc.oficina_id,
  oc.id     as os_comercial_id,
  oc.numero,
  coalesce(est.custo_estimado, 0)                            as custo_insumo_estimado,
  coalesce(con.custo_consumido, 0)                           as custo_insumo_consumido,
  coalesce(con.custo_consumido, 0) - coalesce(est.custo_estimado, 0) as estouro
from public.os_comercial oc
left join (
  select i.orcamento_id, sum(i.total_custo) as custo_estimado
  from public.orcamento_itens i
  where i.tipo = 'insumo'
  group by i.orcamento_id
) est on est.orcamento_id = oc.orcamento_id
left join (
  select c.os_comercial_id, sum(c.custo_total) as custo_consumido
  from public.os_insumos_consumidos c
  group by c.os_comercial_id
) con on con.os_comercial_id = oc.id;

-- Desperdício de cabine: cura real (min) x padrão.
create or replace view public.v_cabine_desperdicio
  with (security_invoker = true) as
select
  a.oficina_id,
  a.os_comercial_id,
  a.aplicacao_inicio,
  a.cura_inicio,
  a.cura_fim,
  a.cura_minutos_padrao,
  case when a.cura_inicio is not null and a.cura_fim is not null
       then round(extract(epoch from (a.cura_fim - a.cura_inicio)) / 60.0)::int
       else null end as cura_minutos_real,
  case when a.cura_inicio is not null and a.cura_fim is not null and a.cura_minutos_padrao is not null
       then round(extract(epoch from (a.cura_fim - a.cura_inicio)) / 60.0)::int - a.cura_minutos_padrao
       else null end as desperdicio_minutos
from public.os_auditoria_cabine a;

-- Fim da Migration 0017 (Fase A)
