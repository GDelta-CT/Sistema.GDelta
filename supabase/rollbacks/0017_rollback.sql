-- =====================================================================
-- Rollback 0017 — Diretriz V3 (Fase A)
-- USO: TESTE. Em PROD, o PDF proíbe DROP — reverter exige decisão explícita.
-- Reverte na ordem inversa: views -> tabelas novas -> colunas adicionadas.
-- =====================================================================

drop view  if exists public.v_cabine_desperdicio;
drop view  if exists public.v_insumo_estouro;

drop table if exists public.os_auditoria_cabine;
drop table if exists public.os_insumos_consumidos;

alter table public.os_comercial drop column if exists integracao_payload;
alter table public.os_comercial drop column if exists meta_horas;

-- Fim do Rollback 0017
