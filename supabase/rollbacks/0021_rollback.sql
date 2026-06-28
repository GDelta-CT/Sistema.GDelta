-- =====================================================================
-- Rollback 0021 — Link público do orçamento (share_token + 2 RPCs públicas)
-- USO: TESTE. Em PROD, reverter exige decisão explícita do fundador
--   (o "Protocolo de Código Seguro" proíbe DROP silencioso em PROD).
-- Confirmar o ref de destino ANTES de rodar.
--
-- Reverte na ordem inversa/segura:
--   1) as 2 RPCs públicas (não dependem de mais nada);
--   2) o índice UNIQUE do share_token;
--   3) a coluna share_token.
-- NÃO mexe em dados de outras migrations: orcamentos (0005), os_comercial
--   (0009), aprovar_orcamento (0010), gerar_os_de_orcamento (0020) e a RLS
--   permanecem intactas. Remover share_token NÃO apaga orçamento algum —
--   apenas o atributo do link público (e qualquer link já enviado deixa de
--   resolver, comportamento esperado de um rollback do recurso).
-- Idempotente (drop ... if exists).
-- =====================================================================

-- 1) RPCs públicas (revoga e dropa; o revoke é defensivo/no-op no drop) -------
revoke execute on function public.aprovar_orcamento_publico(uuid) from anon, authenticated;
drop function if exists public.aprovar_orcamento_publico(uuid);

revoke execute on function public.orcamento_publico(uuid) from anon, authenticated;
drop function if exists public.orcamento_publico(uuid);

-- 2) Índice UNIQUE do token ---------------------------------------------------
drop index if exists public.uq_orcamentos_share_token;

-- 3) Coluna share_token -------------------------------------------------------
alter table public.orcamentos drop column if exists share_token;

-- Fim do Rollback 0021
