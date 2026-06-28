/**
 * Camada de dados da PROPOSTA PÚBLICA (link que vai pro cliente final via
 * WhatsApp). É a fronteira DONO × CLIENTE: aqui só existem os campos que o
 * cliente PODE ver — descrição, quantidade, valor de VENDA e total. NUNCA
 * custo, margem ou lucro (nem no tipo, nem no select, nem no JSON).
 *
 * A segurança real é do banco (migration 0021, em construção em paralelo):
 *  - `orcamento_publico(p_token)` é uma RPC que devolve SÓ os campos seguros,
 *    selecionados PELO BANCO. Mesmo que esta camada pedisse mais, a RPC não
 *    entrega custo/margem. Aqui a gente reforça: o tipo nem tem esses campos.
 *  - `aprovar_orcamento_publico(p_token)` marca o orçamento como 'aprovado' sem
 *    exigir login (o token É a credencial). NÃO há notificação automática: o
 *    sinal real é o status virar 'aprovado' no painel do dono.
 *
 * Esta camada roda no BROWSER do cliente final (rota pública, sem sessão). Por
 * isso NÃO importa nada que toque em auth/RLS por oficina — só a anon key e o
 * token. FAIL-SOFT: se a 0021 ainda não foi aplicada, devolve um estado honesto
 * `indisponivel` em vez de quebrar a página.
 */

import { getSupabase } from './client';

/** Status que o cliente pode enxergar (sem nuance interna). */
export type StatusPropostaPublica = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';

/**
 * Item da proposta NA VISÃO DO CLIENTE. Repare: só `descricao`, `quantidade`,
 * `valor_unitario` (= venda unitária) e `total` (= venda total). Nenhum campo
 * de custo/margem existe aqui — é impossível renderizar o que não chega.
 */
export type ItemPublico = {
  descricao: string;
  quantidade: number;
  /** Valor unitário PRO CLIENTE (preço de venda). Nunca o custo. */
  valor_unitario: number;
  /** Total da linha PRO CLIENTE (quantidade × valor de venda). */
  total: number;
};

/**
 * Proposta completa NA VISÃO DO CLIENTE. Cabeçalho com a marca da oficina,
 * veículo, itens (só venda) e total. Sem desconto detalhado de custo, sem
 * margem, sem lucro.
 *
 * O shape espelha a RPC `orcamento_publico` (0021), que devolve um objeto
 * ANINHADO: `orcamento`, `oficina`, `cliente`, `veiculo`, `itens`. Aqui a gente
 * achata para campos cliente-safe. Os campos são opcionais/nuláveis porque a
 * tela trata cada ausência com um fallback discreto (sem quebrar).
 *
 * NÃO existe campo de validade: a tabela `orcamentos` não tem essa coluna e a
 * RPC não a retorna. O cliente vê "emitido em {criado_em}", nada inventado.
 */
export type PropostaPublica = {
  /** Nome/fantasia da oficina (cabeçalho — a "cara" da oficina pro cliente). */
  oficina_nome: string | null;
  /** Nome do cliente, para personalizar a saudação. */
  cliente_nome: string | null;
  /** Placa do veículo, quando houver. */
  veiculo_placa: string | null;
  /** Descrição do veículo (marca + modelo), quando houver. */
  veiculo_descricao: string | null;
  /** Status atual da proposta (controla o botão Aprovar / confirmações). */
  status: StatusPropostaPublica;
  /** Itens já no preço de VENDA. */
  itens: ItemPublico[];
  /** Total final da proposta pro cliente (já com desconto aplicado, do orçamento). */
  total: number;
  /** Desconto aplicado ao orçamento (informativo). */
  desconto: number;
  /** Data de criação/emissão da proposta (ISO). */
  criado_em: string | null;
};

/**
 * Desfechos de leitura da proposta pública, todos SEM quebrar a página:
 *  - `success`      → a proposta veio (campos seguros).
 *  - `nao_encontrado` → token inexistente/inválido (link errado ou revogado).
 *  - `indisponivel` → a RPC ainda não existe (0021 não aplicada). Honesto.
 *  - `error`        → falha real (rede/servidor), mensagem em PT-BR.
 */
export type PropostaResultado =
  | { status: 'success'; data: PropostaPublica }
  | { status: 'nao_encontrado' }
  | { status: 'indisponivel'; message: string }
  | { status: 'error'; message: string };

/** Desfecho da aprovação pública pelo cliente. */
export type AprovacaoResultado =
  | { status: 'success' }
  | { status: 'nao_encontrado' }
  | { status: 'ja_decidido'; statusAtual: StatusPropostaPublica }
  | { status: 'indisponivel'; message: string }
  | { status: 'error'; message: string };

/** Mensagem honesta quando a 0021 ainda não foi aplicada no ambiente. */
export const PROPOSTA_RPC_INDISPONIVEL =
  'Esta proposta ainda não está disponível. Pedimos que entre em contato com a oficina.';

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('A conexão demorou demais. Verifique sua internet e tente de novo.')),
      ms
    );
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

/**
 * Reconhece o erro do PostgREST de "função/relação ainda não existe" — ou seja,
 * a migration 0021 não foi aplicada neste ambiente. Mesmo espírito do
 * `ehMigracaoAusente` da camada de OS.
 */
function ehMigracaoAusente(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('pgrst202') ||
    m.includes('could not find the function') ||
    m.includes('schema cache') ||
    (m.includes('function') && m.includes('does not exist')) ||
    (m.includes('relation') && m.includes('does not exist')) ||
    m.includes('orcamento_publico') ||
    m.includes('aprovar_orcamento_publico')
  );
}

/** Reconhece "não encontrado": token inválido/inexistente (a RPC devolve null/0 linhas). */
function ehNaoEncontrado(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('not found') ||
    m.includes('não encontrad') ||
    m.includes('nao encontrad') ||
    m.includes('no rows') ||
    m.includes('0 rows') ||
    m.includes('token') && (m.includes('invalid') || m.includes('inválid'))
  );
}

/** Reconhece "já decidido": orçamento já aprovado/recusado (a RPC sinaliza). */
function ehJaDecidido(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('aprovad') || m.includes('recusad') || m.includes('já decidid') || m.includes('ja decidid');
}

/** Mensagem PT-BR e ACIONÁVEL para o cliente final (sem jargão técnico). */
function traduzirErroPublico(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  if (m.includes('timeout') || m.includes('demorou')) {
    return 'A conexão demorou demais. Tente de novo em instantes.';
  }
  return 'Não foi possível carregar a proposta agora. Tente de novo em instantes.';
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

/** Helper: lê um sub-objeto (orcamento/oficina/cliente/veiculo) como Record. */
function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Helper: string não-vazia ou null (apara espaços; descarta vazio). */
function strOuNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/**
 * A RPC `orcamento_publico` devolve um objeto ANINHADO (uma linha, ou array de
 * uma linha): `{ orcamento, oficina, cliente, veiculo, itens }`. Aqui achatamos
 * para o tipo cliente-safe. NUNCA tocamos custo/margem (a RPC nem os envia).
 *
 * Shape da RPC (0021):
 *   orcamento: { id, numero, status, desconto, observacoes, criado_em,
 *                atualizado_em, total_venda }
 *   oficina:   { nome }
 *   cliente:   { nome }
 *   veiculo:   { marca, modelo, placa }
 *   itens:     [{ descricao, quantidade, venda_unitaria, total_venda }]
 */
function normalizarProposta(raw: unknown): PropostaPublica | null {
  if (raw == null) return null;
  const row = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | undefined;
  if (!row) return null;

  const orcamento = asObj(row.orcamento);
  const oficina = asObj(row.oficina);
  const cliente = asObj(row.cliente);
  const veiculo = asObj(row.veiculo);

  const itensRaw = Array.isArray(row.itens) ? (row.itens as Record<string, unknown>[]) : [];
  const itens: ItemPublico[] = itensRaw.map((i) => ({
    descricao: String(i.descricao ?? ''),
    quantidade: Number(i.quantidade ?? 0),
    valor_unitario: Number(i.venda_unitaria ?? 0),
    total: Number(i.total_venda ?? 0),
  }));

  // Descrição do veículo = marca + modelo (o que houver), sem placa (vai separada).
  const veiculoDescricao = strOuNull([strOuNull(veiculo.marca), strOuNull(veiculo.modelo)]
    .filter(Boolean)
    .join(' '));

  return {
    oficina_nome: strOuNull(oficina.nome),
    cliente_nome: strOuNull(cliente.nome),
    veiculo_placa: strOuNull(veiculo.placa),
    veiculo_descricao: veiculoDescricao,
    status: (strOuNull(orcamento.status) ?? 'enviado') as StatusPropostaPublica,
    itens,
    total: Number(orcamento.total_venda ?? 0),
    desconto: Number(orcamento.desconto ?? 0),
    criado_em: strOuNull(orcamento.criado_em),
  };
}

/**
 * Busca a proposta pública por token. SEM sessão (rota pública). A RPC do banco
 * é a fronteira: só campos seguros saem. Aqui apenas mapeamos para o tipo
 * cliente-safe e tratamos cada desfecho sem quebrar a página.
 */
export async function buscarOrcamentoPublico(token: string): Promise<PropostaResultado> {
  const p_token = (token ?? '').trim();
  if (!p_token) return { status: 'nao_encontrado' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase().rpc('orcamento_publico', { p_token })
    )) as QueryResult<unknown>;

    if (error) {
      if (ehMigracaoAusente(error.message)) {
        return { status: 'indisponivel', message: PROPOSTA_RPC_INDISPONIVEL };
      }
      if (ehNaoEncontrado(error.message)) return { status: 'nao_encontrado' };
      return { status: 'error', message: traduzirErroPublico(error.message) };
    }

    const proposta = normalizarProposta(data);
    if (!proposta) return { status: 'nao_encontrado' };
    return { status: 'success', data: proposta };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido.';
    if (ehMigracaoAusente(msg)) return { status: 'indisponivel', message: PROPOSTA_RPC_INDISPONIVEL };
    return { status: 'error', message: traduzirErroPublico(msg) };
  }
}

/**
 * Aprova a proposta pelo cliente (token = credencial). A RPC do banco marca o
 * orçamento como 'aprovado'. NÃO dispara notificação automática: o sinal real é
 * o status aparecer 'aprovado' no painel do dono. FAIL-SOFT em todos os
 * desfechos; nunca lança.
 */
export async function aprovarOrcamentoPublico(token: string): Promise<AprovacaoResultado> {
  const p_token = (token ?? '').trim();
  if (!p_token) return { status: 'nao_encontrado' };
  try {
    const { error } = (await withTimeout(
      getSupabase().rpc('aprovar_orcamento_publico', { p_token })
    )) as QueryResult<unknown>;

    if (error) {
      if (ehMigracaoAusente(error.message)) {
        return { status: 'indisponivel', message: PROPOSTA_RPC_INDISPONIVEL };
      }
      if (ehJaDecidido(error.message)) {
        const statusAtual: StatusPropostaPublica = error.message.toLowerCase().includes('recusad')
          ? 'recusado'
          : 'aprovado';
        return { status: 'ja_decidido', statusAtual };
      }
      if (ehNaoEncontrado(error.message)) return { status: 'nao_encontrado' };
      return { status: 'error', message: traduzirErroPublico(error.message) };
    }
    return { status: 'success' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido.';
    if (ehMigracaoAusente(msg)) return { status: 'indisponivel', message: PROPOSTA_RPC_INDISPONIVEL };
    return { status: 'error', message: traduzirErroPublico(msg) };
  }
}

/* ----------------- helpers de compartilhamento (DONO → CLIENTE) ----------------- */

/** Só os dígitos do telefone (formato exigido pelo wa.me). Vazio se não der. */
export function telefoneDigitsOnly(telefone: string | null | undefined): string {
  return (telefone ?? '').replace(/\D/g, '');
}

/**
 * Monta a URL pública da proposta a partir do token. O `origin` é injetado por
 * quem chama (no browser, `window.location.origin`) — esta função é pura/testável.
 */
export function montarLinkPublico(origin: string, shareToken: string): string {
  return `${origin.replace(/\/$/, '')}/orcamento/${shareToken}`;
}

/**
 * Monta o link wa.me com uma mensagem cordial + o link da proposta.
 * `telefone` cru é normalizado para dígitos; se não houver dígitos, devolve null
 * (quem chama desabilita o botão e mostra a dica).
 */
export function montarLinkWhatsApp(args: {
  telefone: string | null | undefined;
  oficinaNome?: string | null;
  clienteNome?: string | null;
  link: string;
}): string | null {
  const digits = telefoneDigitsOnly(args.telefone);
  if (!digits) return null;
  const saudacao = args.clienteNome ? `Olá, ${args.clienteNome}!` : 'Olá!';
  const assinatura = args.oficinaNome ? ` — ${args.oficinaNome}` : '';
  const msg =
    `${saudacao} Segue o orçamento do seu veículo. ` +
    `Você pode conferir os itens e aprovar pelo link:\n\n${args.link}\n\n` +
    `Qualquer dúvida, é só chamar por aqui.${assinatura}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
