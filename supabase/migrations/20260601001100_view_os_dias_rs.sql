-- =====================================================================
-- Migration 0011 — View v_os_dias_rs · métrica "dias-na-oficina × R$" do Pátio
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0009 (tabela public.os_comercial).
--
-- View de leitura que alimenta o card do Pátio cruzando o tempo de
-- permanência da OS (dias entre aprovação e entrega) com o R$ do orçamento.
-- `dias` é CALCULADO pelo banco: dias decorridos REAIS via epoch/86400 (não
-- extract(day from interval), que truncaria as horas); usa data_entrega_real
-- quando já entregue, senão now() (OS ainda no pátio); greatest(0, ...) evita
-- dias negativos por dados inconsistentes. Não materializa nada — reflete a
-- base ao vivo.
--
-- CRÍTICO — security_invoker = true: a view roda com a permissão de QUEM a
-- consulta (não do dono/criador). Sem isso, a view ignoraria a RLS por
-- oficina de public.os_comercial e um usuário de uma oficina enxergaria OS
-- de TODAS as oficinas — vazamento multi-tenant. Com security_invoker a
-- view herda a política de isolamento da tabela base e cada oficina vê
-- somente as próprias OS.
-- Idempotente (create or replace). Rollback: supabase/rollbacks/0011_rollback.sql
-- =====================================================================

create or replace view public.v_os_dias_rs
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do os_comercial (sem isso vazaria entre oficinas)
select
  o.oficina_id,
  o.id            as os_id,
  o.numero,
  o.cliente_id,
  o.valor_orcamento,
  o.status,
  greatest(0, floor(extract(epoch from (coalesce(o.data_entrega_real, now()) - o.data_aprovacao)) / 86400.0))::int as dias
from public.os_comercial o;

-- Fim da Migration 0011
