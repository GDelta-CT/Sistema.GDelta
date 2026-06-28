-- =====================================================================
-- Migration 0020 — Promover Orçamento aprovado em OS sem redigitar (RPC)
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0001..0019 (tenant+claim, RLS, hardening search_path,
--   orcamentos/orcamento_itens [0005], os_comercial [0009],
--   aprovar_orcamento + contrato da OS [0010]).
--   Reusa as funções genéricas: set_oficina_id_from_jwt (0003/0006).
--   NÃO redefine função genérica alguma; NÃO altera a RPC aprovar_orcamento.
--
-- OBJETIVO (paridade "Orçamento -> OS" do WorkMotor + blueprint):
--   Transformar um orçamento APROVADO em Ordem de Serviço SEM redigitar:
--   reaproveita cliente/veículo/valores do orçamento e COPIA os itens
--   linha-a-linha (peça/mão de obra/insumo) para a OS. Um clique no comercial
--   vira uma OS pronta para a produção.
--
-- O QUE ENTREGA:
--   1) os_comercial_itens — tabela NOVA (ADITIVA): snapshot dos itens da OS,
--      copiados de orcamento_itens no momento da promoção. "Aprovado é
--      contrato": a OS carrega o que foi vendido, congelado, mesmo que o
--      orçamento (ou seu catálogo) mude depois. FK -> os_comercial (cascade)
--      e FK opcional -> orcamento_itens (set null, rastreia a origem).
--   2) RPC public.gerar_os_de_orcamento(p_orcamento_id uuid) returns uuid:
--      valida (existe + da oficina do chamador + APROVADO), materializa a OS
--      (reusando a OS já criada pela 0010, se houver — sem duplicar) e copia
--      os itens. Idempotente: retorna a OS existente e NÃO recopia itens já
--      copiados. Devolve o id da OS.
--
-- VÍNCULO orçamento <-> OS (já existente — NÃO recriado):
--   os_comercial.orcamento_id é NOT NULL desde a 0009, com a UNIQUE
--   uq_os_comercial_orcamento (1 OS por orçamento). Esta migration NÃO
--   adiciona coluna de vínculo no cabeçalho — ele JÁ existe. O único objeto
--   aditivo é a tabela de ITENS da OS (não existia: a 0009 guardava só o
--   snapshot do VALOR em os_comercial.valor_orcamento, não as linhas).
--
-- COEXISTÊNCIA com aprovar_orcamento (0010):
--   A 0010 já cria a OS (numero + snapshot do valor) ao aprovar, porém SEM
--   itens (não havia tabela). Esta RPC é compatível: se a OS já existe (via
--   0010 ou chamada anterior desta), ela é REUSADA; os itens são copiados só
--   se ainda não houver nenhum (backfill único, guardado por NOT EXISTS).
--   Assim, tanto "aprovar e depois gerar OS" quanto "gerar OS direto"
--   convergem para a MESMA OS, com itens, sem duplicar.
--
-- SEGURANÇA (padrão do projeto — ordem sagrada respeitada):
--   • RPC é SECURITY INVOKER (igual à 0010): roda com a IDENTIDADE do chamador,
--     então a RLS por oficina_id (claim do JWT) é a fronteira em TODAS as
--     leituras/escritas (orcamentos, orcamento_itens, os_comercial,
--     os_comercial_itens). Não há escalonamento de privilégio. Como o claim
--     oficina_id já está PROVADO no token (0001/0002) e a RLS já lê esse claim,
--     NÃO há motivo para security definer aqui.
--   • Defesa em profundidade: a oficina é resolvida do claim
--     (auth.jwt() ->> 'oficina_id'); sessão sem oficina_id aborta. O INSERT
--     grava oficina_id explícito = v_oficina, casando com o WITH CHECK da RLS.
--   • search_path = '' (fecha hijack, padrão 0006). Objetos schema-qualificados.
--
-- CONCORRÊNCIA (nota MVP, idêntica à 0010): o `numero` da OS vem de
--   max(numero)+1 POR OFICINA quando esta RPC precisa CRIAR a OS. A UNIQUE
--   uq_os_comercial_numero (0009) rejeita colisão sob aprovações simultâneas
--   na mesma oficina (o 2º chamador recebe unique_violation e re-tenta).
--   Aceitável p/ MVP; evolução = sequência por oficina / advisory lock.
--
-- Idempotente (IF NOT EXISTS / create or replace / drop ... if exists).
-- Rollback: supabase/rollbacks/0020_rollback.sql
-- =====================================================================

-- 1) Tabela os_comercial_itens — snapshot dos itens da OS (ADITIVA) -----------
--    Espelha as colunas de valor de orcamento_itens (0005): mesmas geradas
--    (total_custo / total_venda / margem) para manter o lucro como fonte da
--    verdade também no nível da OS. origem_item_id rastreia a linha do
--    orçamento (set null preserva o snapshot se a origem for apagada).
create table if not exists public.os_comercial_itens (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id)        on delete cascade,
  os_comercial_id uuid not null references public.os_comercial(id)    on delete cascade,
  -- origem (linha do orçamento que gerou esta linha da OS); set null = histórico:
  origem_item_id  uuid references public.orcamento_itens(id)         on delete set null,
  tipo            varchar(20)  not null check (tipo in ('peca','mao_de_obra','insumo')),
  descricao       varchar(200) not null,
  quantidade      numeric(12,2) not null default 1,
  custo_unitario  numeric(12,2) not null default 0,
  venda_unitaria  numeric(12,2) not null default 0,
  -- Totais e margem CALCULADOS pelo banco (mesma regra da 0005):
  total_custo     numeric(14,2) generated always as (quantidade * custo_unitario) stored,
  total_venda     numeric(14,2) generated always as (quantidade * venda_unitaria) stored,
  margem          numeric(14,2) generated always as (quantidade * (venda_unitaria - custo_unitario)) stored,
  criado_em       timestamptz   not null default now()
);

create index if not exists idx_os_itens_os      on public.os_comercial_itens(os_comercial_id);
create index if not exists idx_os_itens_oficina on public.os_comercial_itens(oficina_id);
create index if not exists idx_os_itens_origem  on public.os_comercial_itens(origem_item_id);

-- auto oficina_id (reusa a função genérica da 0003/0006) ----------------------
drop trigger if exists trg_os_itens_oficina on public.os_comercial_itens;
create trigger trg_os_itens_oficina
  before insert on public.os_comercial_itens
  for each row execute function public.set_oficina_id_from_jwt();

-- RLS por oficina_id (claim do JWT) — enable + FORCE + isolamento -------------
alter table public.os_comercial_itens enable row level security;
alter table public.os_comercial_itens force  row level security;
drop policy if exists "os_comercial_itens_isolation" on public.os_comercial_itens;
create policy "os_comercial_itens_isolation"
  on public.os_comercial_itens
  for all
  to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);

-- 2) RPC: gerar OS a partir de orçamento APROVADO -----------------------------
--    SECURITY INVOKER (default): a RLS do chamador é a fronteira de segurança.
create or replace function public.gerar_os_de_orcamento(p_orcamento_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_oficina uuid;
  v_orc     public.orcamentos%rowtype;
  v_valor   numeric(14,2);
  v_numero  bigint;
  v_os_id   uuid;
  v_tem_itens boolean;
begin
  -- 2.1) Oficina do chamador (claim do JWT). Sem oficina, sem operação.
  v_oficina := (auth.jwt() ->> 'oficina_id')::uuid;
  if v_oficina is null then
    raise exception 'Sessão sem oficina_id no token: não é possível gerar OS.'
      using errcode = '28000';  -- invalid_authorization_specification
  end if;

  -- 2.2) Carrega o orçamento. A RLS já restringe à oficina do chamador, logo
  --      "não encontrado" cobre tanto inexistente quanto de outra oficina.
  select * into v_orc
  from public.orcamentos
  where id = p_orcamento_id;

  if not found then
    raise exception 'Orçamento % não encontrado nesta oficina.', p_orcamento_id
      using errcode = 'P0002';  -- no_data_found
  end if;

  -- 2.3) "Aprovado é contrato": SÓ um orçamento aprovado converte em OS.
  if v_orc.status <> 'aprovado' then
    raise exception 'Orçamento % está "%": apenas orçamentos APROVADOS viram OS.',
      p_orcamento_id, v_orc.status
      using errcode = 'P0001';  -- raise_exception
  end if;

  -- 2.4) IDEMPOTÊNCIA do cabeçalho: se já existe OS para este orçamento
  --      (criada aqui ou pela RPC aprovar_orcamento, 0010), REUSA — não duplica
  --      nem re-numera. A UNIQUE uq_os_comercial_orcamento (0009) garante 1:1.
  select oc.id into v_os_id
  from public.os_comercial oc
  where oc.orcamento_id = p_orcamento_id;

  if v_os_id is null then
    -- 2.4a) Não há OS ainda: cria a partir do orçamento (cliente/veículo/valor).
    --       Valor = Σ(total_venda dos itens) − desconto, nunca negativo
    --       (mesma regra da 0010; total_venda é coluna gerada da 0005).
    v_valor := greatest(
                 0,
                 coalesce((select sum(oi.total_venda)
                             from public.orcamento_itens oi
                            where oi.orcamento_id = p_orcamento_id), 0)
                 - coalesce(v_orc.desconto, 0)
               );

    -- Próximo número sequencial POR OFICINA (RLS filtra; where = defesa em
    -- profundidade). A UNIQUE (oficina_id, numero) protege a corrida.
    v_numero := coalesce(
                  (select max(oc.numero)
                     from public.os_comercial oc
                    where oc.oficina_id = v_oficina),
                  0) + 1;

    -- oficina_id explícito = v_oficina casa com o WITH CHECK da RLS.
    -- status inicial 'aberta' = estado inicial real do enum da OS (0009).
    insert into public.os_comercial
      (oficina_id, orcamento_id, cliente_id, veiculo_id,
       numero, valor_orcamento, status, data_aprovacao)
    values
      (v_oficina, p_orcamento_id, v_orc.cliente_id, v_orc.veiculo_id,
       v_numero, v_valor, 'aberta', now())
    returning id into v_os_id;
  end if;

  -- 2.5) IDEMPOTÊNCIA dos itens: copia orcamento_itens -> os_comercial_itens
  --      APENAS se a OS ainda não tiver item algum (backfill único). Cobre
  --      tanto a OS recém-criada quanto uma OS pré-existente da 0010 (que
  --      nasceu sem itens). Re-chamar não duplica linhas.
  select exists (
    select 1 from public.os_comercial_itens i
    where i.os_comercial_id = v_os_id
  ) into v_tem_itens;

  if not v_tem_itens then
    -- oficina_id explícito (o trigger também preencheria, mas explícito casa
    -- com o WITH CHECK e deixa a intenção clara).
    insert into public.os_comercial_itens
      (oficina_id, os_comercial_id, origem_item_id,
       tipo, descricao, quantidade, custo_unitario, venda_unitaria)
    select
      v_oficina, v_os_id, oi.id,
      oi.tipo, oi.descricao, oi.quantidade, oi.custo_unitario, oi.venda_unitaria
    from public.orcamento_itens oi
    where oi.orcamento_id = p_orcamento_id
    order by oi.criado_em asc;
  end if;

  -- 2.6) Devolve o id da OS (criada ou reaproveitada).
  return v_os_id;
end;
$$;

-- Só usuários autenticados podem chamar (a RLS faz o isolamento por oficina).
grant execute on function public.gerar_os_de_orcamento(uuid) to authenticated;

-- Fim da Migration 0020
