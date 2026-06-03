-- =====================================================================
-- Migration 0010 — Aprovar Orçamento (RPC) + Contrato da OS Comercial
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0009 (tenant+claim, RLS, clientes, veículos,
--                orçamentos, hardening search_path, os_comercial).
--
-- O QUE ENTREGA (decisões do fundador):
--   1) RPC public.aprovar_orcamento(uuid): transforma um orçamento APROVADO
--      em OS Comercial. Atribui o `numero` sequencial POR OFICINA, grava o
--      SNAPSHOT do valor (Σ total_venda dos itens − desconto, nunca < 0) e
--      faz UPSERT idempotente por orcamento_id (re-aprovar não duplica nem
--      re-numera). Marca o orçamento como 'aprovado'.
--   2) Trigger de CANCELAMENTO: orçamento 'aprovado' -> 'recusado' cancela a
--      OS (status='cancelada'); NUNCA apaga (preserva histórico/numeração).
--   3) Trigger de TRAVA (contrato): orçamento 'aprovado' tem seus ITENS
--      congelados — INSERT/UPDATE/DELETE em orcamento_itens é bloqueado.
--      "Aprovado é contrato": para mudar, cria-se nova versão.
--
-- SEGURANÇA (padrão do projeto):
--   • RPC é SECURITY INVOKER -> roda com a IDENTIDADE do chamador, então a
--     RLS por oficina_id (claim do JWT) se aplica a TODAS as leituras/escritas.
--     Não há escalonamento de privilégio; uma oficina não enxerga outra.
--   • search_path = '' em TODAS as funções (fecha hijack via search_path,
--     padrão da 0006). Todos os objetos são schema-qualificados.
--   • A oficina é resolvida do claim (auth.jwt() ->> 'oficina_id'); o INSERT
--     grava oficina_id explicitamente = v_oficina, casando com o WITH CHECK.
--
-- CONCORRÊNCIA (nota MVP): o `numero` vem de max(numero)+1 POR OFICINA. Sob
--   aprovações simultâneas na MESMA oficina, dois cálculos podem colidir — a
--   UNIQUE (oficina_id, numero) [uq_os_comercial_numero, migration 0009]
--   rejeita a duplicata (o 2º chamador recebe unique_violation e re-tenta).
--   Aceitável p/ MVP; evolução futura = sequência por oficina / advisory lock.
--
-- Idempotente (create or replace; drop trigger if exists).
-- Rollback: supabase/rollbacks/0010_rollback.sql
-- =====================================================================

-- 1) RPC: aprovar orçamento -> OS Comercial -----------------------------------
--    SECURITY INVOKER (default): a RLS do chamador é a fronteira de segurança.
create or replace function public.aprovar_orcamento(p_orcamento_id uuid)
returns public.os_comercial
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_oficina  uuid;
  v_orc      public.orcamentos%rowtype;
  v_valor    numeric(14,2);
  v_numero   bigint;
  v_os       public.os_comercial%rowtype;
begin
  -- 1.1) Oficina do chamador (claim do JWT). Sem oficina, sem operação.
  v_oficina := (auth.jwt() ->> 'oficina_id')::uuid;
  if v_oficina is null then
    raise exception 'Sessão sem oficina_id no token: não é possível aprovar orçamento.'
      using errcode = '28000';  -- invalid_authorization_specification
  end if;

  -- 1.2) Carrega o orçamento. A RLS já restringe à oficina do chamador, logo
  --      "não encontrado" cobre tanto inexistente quanto de outra oficina.
  select * into v_orc
  from public.orcamentos
  where id = p_orcamento_id;

  if not found then
    raise exception 'Orçamento % não encontrado nesta oficina.', p_orcamento_id
      using errcode = 'P0002';  -- no_data_found
  end if;

  -- 1.3) Valor = Σ(total_venda dos itens) − desconto, nunca negativo.
  --      total_venda é COLUNA GERADA (fonte da verdade do lucro, migration 0005).
  v_valor := greatest(
               0,
               coalesce((select sum(oi.total_venda)
                           from public.orcamento_itens oi
                          where oi.orcamento_id = p_orcamento_id), 0)
               - coalesce(v_orc.desconto, 0)
             );

  -- 1.4) Próximo número sequencial POR OFICINA (RLS já filtra; o where é
  --      defesa em profundidade). A UNIQUE protege a corrida (ver cabeçalho).
  v_numero := coalesce(
                (select max(oc.numero)
                   from public.os_comercial oc
                  where oc.oficina_id = v_oficina),
                0) + 1;

  -- 1.5) UPSERT idempotente por orcamento_id (uq_os_comercial_orcamento, 0009).
  --      Re-aprovar: atualiza só o snapshot do valor e o atualizado_em,
  --      PRESERVANDO numero e status já existentes (não re-numera, não reabre).
  --      oficina_id explícito = v_oficina casa com o WITH CHECK da RLS.
  insert into public.os_comercial
    (oficina_id, orcamento_id, cliente_id, veiculo_id,
     numero, valor_orcamento, status, data_aprovacao)
  values
    (v_oficina, p_orcamento_id, v_orc.cliente_id, v_orc.veiculo_id,
     v_numero, v_valor, 'aberta', now())
  on conflict (orcamento_id) do update
    set valor_orcamento = excluded.valor_orcamento,
        atualizado_em   = now()
  returning * into v_os;

  -- 1.6) Marca o orçamento como aprovado (idempotente; já pode estar aprovado).
  update public.orcamentos
     set status = 'aprovado'
   where id = p_orcamento_id;

  return v_os;
end;
$$;

-- Só usuários autenticados podem chamar (a RLS faz o isolamento por oficina).
grant execute on function public.aprovar_orcamento(uuid) to authenticated;

-- 2) Trigger de CANCELAMENTO: 'aprovado' -> 'recusado' cancela a OS -----------
--    AFTER UPDATE em orcamentos. Não apaga a OS (preserva histórico/numeração).
create or replace function public.cancelar_os_ao_recusar_orcamento()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'aprovado' and new.status = 'recusado' then
    update public.os_comercial
       set status = 'cancelada'
     where orcamento_id = new.id
       and status <> 'cancelada';   -- evita update no-op se já cancelada
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orcamentos_cancela_os on public.orcamentos;
create trigger trg_orcamentos_cancela_os
  after update on public.orcamentos
  for each row execute function public.cancelar_os_ao_recusar_orcamento();

-- 3) Trigger de TRAVA: itens de orçamento APROVADO são contrato --------------
--    BEFORE INSERT/UPDATE/DELETE em orcamento_itens. Se o orçamento pai está
--    'aprovado', bloqueia a mutação. "Aprovado é contrato: nova versão p/ editar."
create or replace function public.trava_itens_orcamento_aprovado()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orcamento_id uuid;
  v_status       text;
begin
  -- Em DELETE não há NEW; usa OLD. Em INSERT/UPDATE usa NEW.
  v_orcamento_id := coalesce(new.orcamento_id, old.orcamento_id);

  select o.status into v_status
  from public.orcamentos o
  where o.id = v_orcamento_id;

  if v_status = 'aprovado' then
    raise exception 'Orçamento aprovado é contrato: crie nova versão para editar.'
      using errcode = 'P0001';  -- raise_exception
  end if;

  -- DELETE retorna OLD; INSERT/UPDATE retornam NEW.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orc_itens_trava_aprovado on public.orcamento_itens;
create trigger trg_orc_itens_trava_aprovado
  before insert or update or delete on public.orcamento_itens
  for each row execute function public.trava_itens_orcamento_aprovado();

-- Fim da Migration 0010
