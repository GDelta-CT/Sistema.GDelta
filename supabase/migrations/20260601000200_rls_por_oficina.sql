-- =====================================================================
-- Migration 0002 — Políticas RLS por oficina_id (Passo 5)
-- ALVO: TESTE primeiro (zivdqykrppatcgdezvqu). PROD só após validar + OK.
-- Pré-requisito: 0001 aplicada e claim `oficina_id` PROVADO no JWT (feito).
--
-- A RLS já está HABILITADA nas tabelas (0001). Aqui entram as POLÍTICAS que
-- leem o claim do token. Quem isola é o banco — nenhuma query confia no cliente.
-- Idempotente. Rollback: supabase/rollbacks/0002_rollback.sql
-- =====================================================================

-- oficinas: cada usuário só enxerga/edita a PRÓPRIA oficina (pelo claim do JWT)
drop policy if exists "oficina_self" on public.oficinas;
create policy "oficina_self"
  on public.oficinas
  for all
  to authenticated
  using      (id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (id = (auth.jwt() ->> 'oficina_id')::uuid);

-- user_oficinas: o usuário enxerga os PRÓPRIOS vínculos
-- (a policy "auth_admin_le_user_oficinas" da 0001 permanece — é o que o hook usa)
drop policy if exists "user_oficinas_self" on public.user_oficinas;
create policy "user_oficinas_self"
  on public.user_oficinas
  for select
  to authenticated
  using (user_id = auth.uid());

-- Fim da Migration 0002
