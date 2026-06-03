-- =====================================================================
-- Migration 0013 — Views do dashboard Financeiro (4 views de leitura)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0009 (public.os_comercial). Também usa 0005 (orcamentos)
-- e 0003 (clientes).
--
-- Quatro views de leitura que alimentam o dashboard Financeiro:
--   1) v_financeiro_kpis    — uma linha por oficina (KPIs agregados de OS).
--   2) v_funil_os           — funil de OS por status (qtd + R$).
--   3) v_funil_orcamentos   — funil de orçamentos por status (qtd).
--   4) v_ranking_clientes   — ranking de clientes por OS (qtd + R$).
-- Não materializam nada — refletem a base ao vivo. Sem order by nas views:
-- a ordenação é responsabilidade do app.
--
-- CRÍTICO — security_invoker = true em TODAS: a view roda com a permissão de
-- QUEM a consulta (não do dono/criador). Sem isso, a view ignoraria a RLS por
-- oficina das tabelas base (os_comercial, orcamentos, clientes) e um usuário de
-- uma oficina enxergaria dados de TODAS as oficinas — vazamento multi-tenant.
-- Com security_invoker cada view herda a política de isolamento das tabelas
-- base e cada oficina vê somente os próprios dados. O group by oficina_id é
-- defensivo/explícito; o isolamento real vem da RLS via security_invoker.
-- Idempotente (create or replace view). Rollback: supabase/rollbacks/0013_rollback.sql
-- =====================================================================

-- 1) v_financeiro_kpis — uma linha por oficina (KPIs agregados de OS) ----------
create or replace view public.v_financeiro_kpis
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do os_comercial (sem isso vazaria entre oficinas)
select
  o.oficina_id,
  count(*) filter (where o.status = 'aberta')        as os_abertas,
  count(*) filter (where o.status = 'em_producao')   as os_em_producao,
  count(*) filter (where o.status = 'concluida')     as os_concluidas,
  count(*) filter (where o.status = 'entregue')      as os_entregues,
  count(*) filter (where o.status = 'cancelada')     as os_canceladas,
  -- pipeline ativo: nao cancelado E ainda nao entregue (casa com a legenda "OS nao entregues"):
  coalesce(sum(o.valor_orcamento) filter (where o.status not in ('cancelada','entregue')), 0) as receita_aberta,
  coalesce(sum(o.valor_orcamento) filter (where o.status =  'entregue'),  0) as receita_entregue,
  coalesce(avg(o.valor_orcamento) filter (where o.status <> 'cancelada'), 0) as ticket_medio
from public.os_comercial o
group by o.oficina_id;

-- 2) v_funil_os — funil de OS por status (qtd + R$) ---------------------------
create or replace view public.v_funil_os
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do os_comercial (sem isso vazaria entre oficinas)
select
  o.oficina_id,
  o.status,
  count(*)                                  as qtd,
  coalesce(sum(o.valor_orcamento), 0)       as valor_total
from public.os_comercial o
group by o.oficina_id, o.status;

-- 3) v_funil_orcamentos — funil de orçamentos por status (qtd) ----------------
create or replace view public.v_funil_orcamentos
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do orcamentos (sem isso vazaria entre oficinas)
select
  orc.oficina_id,
  orc.status,
  count(*)  as qtd
from public.orcamentos orc
group by orc.oficina_id, orc.status;

-- 4) v_ranking_clientes — ranking de clientes por OS (qtd + R$) ---------------
-- left join: OS sem cliente (cliente_id null, on delete set null em 0009)
-- ainda aparecem agrupadas como 'Sem cliente'. Sem order by — o app ordena.
create or replace view public.v_ranking_clientes
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do os_comercial/clientes (sem isso vazaria entre oficinas)
select
  o.oficina_id,
  o.cliente_id,
  coalesce(c.nome, 'Sem cliente')      as cliente_nome,
  count(*)                             as qtd_os,
  coalesce(sum(o.valor_orcamento), 0)  as valor_total
from public.os_comercial o
left join public.clientes c on c.id = o.cliente_id
group by o.oficina_id, o.cliente_id, c.nome;

-- Fim da Migration 0013
