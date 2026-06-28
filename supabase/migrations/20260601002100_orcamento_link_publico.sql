-- =====================================================================
-- Migration 0021 — Link público do orçamento: o CLIENTE vê e APROVA sem login
-- ALVO: TESTE primeiro (zivdqykrppatcgdezvqu). PROD só após validar + OK do fundador.
-- >>> NÃO APLICAR EM PRODUÇÃO sem OK explícito do fundador <<<
-- Pré-requisito: 0001..0020 (tenant+claim, RLS+FORCE, clientes [0003],
--   veículos [0004], orcamentos/orcamento_itens [0005], hardening search_path
--   [0006], os_comercial [0009], aprovar_orcamento + contrato [0010],
--   gerar_os_de_orcamento + os_comercial_itens [0020]).
--
-- OBJETIVO (paridade WorkMotor: "enviar orçamento e o cliente aprova"):
--   A oficina envia um LINK PÚBLICO ao cliente. O cliente — SEM LOGIN, sem
--   sessão Supabase, papel `anon` — abre o link, vê o orçamento e pode APROVAR.
--   Nada de custo/margem aparece; nada de outra oficina é alcançável. A chave
--   do link é um token UUID não-adivinhável (share_token).
--
-- O QUE ENTREGA (tudo ADITIVO):
--   1) orcamentos.share_token uuid not null default gen_random_uuid()
--      + índice UNIQUE. É a chave secreta do link público (não-enumerável).
--   2) RPC public.orcamento_publico(p_token uuid) -> SETOF (JSON do orçamento).
--      SECURITY DEFINER, search_path=''. Devolve SÓ a linha do token e SÓ
--      campos seguros para o cliente (NUNCA custo/margem). Token inexistente =>
--      retorno VAZIO (0 linhas). Lookup só por token EXATO (sem enumeração).
--   3) RPC public.aprovar_orcamento_publico(p_token uuid) -> text (novo status).
--      SECURITY DEFINER, search_path=''. Marca o orçamento (achado pelo token)
--      como 'aprovado' SÓ se ainda 'rascunho'/'enviado' (idempotente; não
--      re-decide um 'aprovado' nem reverte um 'recusado'). Devolve o status.
--
-- ────────────────────────────────────────────────────────────────────────
-- POR QUE SECURITY DEFINER AQUI (e por que é SEGURO):
--   O cliente do link NÃO está logado: papel `anon`, JWT sem claim oficina_id.
--   A RLS por oficina_id (que LÊ auth.jwt() ->> 'oficina_id') jamais casaria —
--   um anon não enxerga linha alguma de orcamentos/itens. Logo, para o fluxo
--   público existir, a função PRECISA rodar com a identidade do DONO (definer),
--   que no Supabase tem BYPASSRLS — caso contrário o FORCE RLS (0015) barraria
--   até o owner. Isso é deliberado e contido:
--     • A ÚNICA chave de acesso é p_token (UUID não-adivinhável). NÃO existe
--       parâmetro oficina_id, id de orçamento, nem qualquer filtro que o
--       chamador controle além do token. Sem token válido => 0 linhas.
--     • O ESCOPO é estritamente a LINHA daquele token: todo SELECT/UPDATE é
--       ancorado em where share_token = p_token (e os itens, no orcamento_id
--       resolvido a partir dessa única linha). Uma oficina nunca alcança a
--       outra: tokens distintos => linhas distintas; não há como pivotar.
--     • A função NÃO ACEITA e NÃO RETORNA custo_unitario, total_custo nem
--       margem. Essas colunas não aparecem em lugar nenhum desta migration
--       fora deste comentário. O cliente vê apenas preço de VENDA.
--     • search_path = '' + objetos schema-qualificados (padrão 0006): fecha
--       hijack de search_path mesmo rodando como definer.
--   Defesa em profundidade extra: as funções são VOLATILE/STABLE conforme o
--   caso e concedidas a `anon` e `authenticated` SOMENTE via grant explícito;
--   o público (PUBLIC) não recebe execute.
--
-- DECISÃO DE PRODUTO — aprovar_orcamento_publico NÃO cria a OS:
--   Ela apenas muda o status do orçamento para 'aprovado'. A criação da OS
--   (numero sequencial por oficina, snapshot de valor, cópia de itens) é
--   responsabilidade do DONO/operador logado, via aprovar_orcamento (0010) ou
--   gerar_os_de_orcamento (0020), que rodam como SECURITY INVOKER sob a RLS da
--   oficina. Motivos:
--     • Aquelas RPCs resolvem a oficina por auth.jwt() ->> 'oficina_id'. Sob um
--       chamador `anon` esse claim é NULL — elas abortariam de propósito. Não
--       se deve reescrevê-las para um caminho "sem oficina".
--     • Numerar OS / copiar itens / disparar produção a partir de um clique
--       público anônimo é decisão operacional do negócio, não do cliente. O
--       padrão WorkMotor: cliente aprova -> a oficina (logada) materializa a OS.
--     • Mantém SEPARAÇÃO de privilégios: o fluxo público só ALTERA o status,
--       nunca gera artefato comercial. Menor superfície definer.
--   Como o trigger de cancelamento (0010) já reage a transições de status, e a
--   tela do dono mostra "aprovado pelo cliente", o dono gera a OS num clique —
--   mesmo botão que já existe. Convergência total, sem rota anônima criar OS.
--
-- Idempotente (IF NOT EXISTS / create or replace / drop ... if exists).
-- Rollback: supabase/rollbacks/0021_rollback.sql
-- =====================================================================

-- 1) Coluna share_token + UNIQUE ----------------------------------------------
--    not null default gen_random_uuid(): toda linha existente recebe um token
--    único no backfill da própria adição da coluna; novas linhas, idem. UUID v4
--    é não-adivinhável (chave secreta do link). UNIQUE garante 1 token => no
--    máximo 1 orçamento (lookup determinístico, sem ambiguidade).
alter table public.orcamentos
  add column if not exists share_token uuid not null default gen_random_uuid();

create unique index if not exists uq_orcamentos_share_token
  on public.orcamentos(share_token);

-- 2) RPC: orcamento_publico(p_token) — leitura pública SEGURA ------------------
--    SECURITY DEFINER + search_path='' (ver cabeçalho). Retorna SETOF de uma
--    linha JSON (ou ZERO linhas se o token não existir). NUNCA expõe
--    custo_unitario / total_custo / margem.
--
--    Retorna SETOF jsonb (e não uma composite type nova) de propósito:
--      • Mantém a migration puramente ADITIVA (não cria type que o rollback
--        precise dropar com dependências).
--      • O cliente recebe um objeto estável e auto-descritivo; a forma é
--        controlada AQUI, então é impossível uma coluna proibida "vazar por
--        select *" — cada campo é nomeado um a um.
create or replace function public.orcamento_publico(p_token uuid)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'orcamento', jsonb_build_object(
      'id',           o.id,
      'numero',       oc.numero,            -- numero da OS (NULL até aprovar/gerar)
      'status',       o.status,
      'desconto',     o.desconto,
      'observacoes',  o.observacoes,
      'criado_em',    o.criado_em,
      'atualizado_em',o.atualizado_em,
      -- total de VENDA do orçamento (Σ total_venda − desconto, nunca < 0).
      -- total_venda é coluna gerada (0005); custo/margem NÃO entram na conta
      -- exposta — só o que o cliente paga.
      'total_venda',  greatest(
                        0,
                        coalesce((
                          select sum(i.total_venda)
                          from public.orcamento_itens i
                          where i.orcamento_id = o.id
                        ), 0) - coalesce(o.desconto, 0)
                      )
    ),
    'oficina', jsonb_build_object(
      'nome', of.nome
    ),
    'cliente', jsonb_build_object(
      'nome', c.nome
    ),
    'veiculo', jsonb_build_object(
      'marca',  v.marca,
      'modelo', v.modelo,
      'placa',  v.placa
    ),
    'itens', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'descricao',      i.descricao,
                 'quantidade',     i.quantidade,
                 -- SOMENTE valores de VENDA. custo_unitario/total_custo/margem
                 -- são DELIBERADAMENTE omitidos.
                 'venda_unitaria', i.venda_unitaria,
                 'total_venda',    i.total_venda
               )
               order by i.criado_em asc
             )
      from public.orcamento_itens i
      where i.orcamento_id = o.id
    ), '[]'::jsonb)
  )
  from public.orcamentos o
  join public.oficinas of  on of.id = o.oficina_id
  left join public.clientes c on c.id = o.cliente_id
  left join public.veiculos v on v.id = o.veiculo_id
  -- OS opcional (numero só existe após aprovar/gerar OS). 1 OS por orçamento
  -- (uq_os_comercial_orcamento, 0009), então o left join não multiplica linhas.
  left join public.os_comercial oc on oc.orcamento_id = o.id
  -- A ÚNICA cláusula de filtro controlada pelo chamador é o token exato.
  -- Token inexistente => 0 linhas (sem enumeração, sem cross-oficina).
  where o.share_token = p_token;
$$;

-- Execução: apenas anon (link público) e authenticated (preview pela oficina).
-- PUBLIC não recebe nada (revoga o grant implícito a PUBLIC de funções novas).
revoke execute on function public.orcamento_publico(uuid) from public;
grant  execute on function public.orcamento_publico(uuid) to anon, authenticated;

-- 3) RPC: aprovar_orcamento_publico(p_token) — aprovação pública SEGURA --------
--    SECURITY DEFINER + search_path=''. Marca 'aprovado' SÓ se ainda não
--    decidido. Idempotente: re-clicar em 'aprovado' devolve 'aprovado' sem
--    reescrever; um 'recusado' permanece 'recusado' (não reabre). NÃO cria OS
--    (ver decisão de produto no cabeçalho). Devolve o status resultante.
create or replace function public.aprovar_orcamento_publico(p_token uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id      uuid;
  v_status  text;
begin
  -- 3.1) Resolve o orçamento pelo token EXATO e TRAVA a linha (for update)
  --      para serializar cliques concorrentes no mesmo link. Sem token válido,
  --      nada acontece e devolvemos NULL (cliente vê "link inválido").
  select o.id, o.status
    into v_id, v_status
  from public.orcamentos o
  where o.share_token = p_token
  for update;

  if not found then
    return null;  -- token inexistente: nenhuma linha alcançada, nenhuma escrita
  end if;

  -- 3.2) Idempotência / não re-decidir:
  --      • 'aprovado'  -> já aprovado: no-op, devolve 'aprovado'.
  --      • 'recusado'  -> decisão final: NÃO reabre, devolve 'recusado'.
  --      • 'rascunho'/'enviado' -> transição válida para 'aprovado'.
  if v_status in ('aprovado', 'recusado') then
    return v_status;
  end if;

  -- 3.3) Transição: escopo estritamente a ESTA linha (id resolvido do token).
  --      O where dobra a chave (id = linha travada) — defesa em profundidade;
  --      jamais toca outra oficina (token => 1 linha => 1 oficina).
  update public.orcamentos
     set status = 'aprovado'
   where id = v_id;

  return 'aprovado';
end;
$$;

revoke execute on function public.aprovar_orcamento_publico(uuid) from public;
grant  execute on function public.aprovar_orcamento_publico(uuid) to anon, authenticated;

-- Fim da Migration 0021
