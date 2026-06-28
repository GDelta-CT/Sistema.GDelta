/**
 * Camada de dados do módulo OS Comercial (Fase 1) — a ponte entre o Orçamento
 * APROVADO e a produção/Totem (migrations 0009/0010/0011).
 *
 * Mesmo padrão dos demais módulos: FetchState + withTimeout + erros traduzidos
 * (traduzirErro reusado de './clientes') + cast manual via QueryResult.
 *
 * Pontos de contrato (ver migrations):
 *  - A OS nasce SÓ pela RPC public.aprovar_orcamento(p_orcamento_id uuid), que
 *    atribui o `numero` sequencial por oficina e grava o snapshot do valor.
 *    A RPC é SECURITY INVOKER -> a RLS por oficina (claim do JWT) é a fronteira.
 *  - oficina_id é auto-preenchido pelo trigger a partir do JWT (sem digitação
 *    dupla); a RLS isola por oficina em TODAS as leituras/escritas.
 *  - O Pátio lê a view public.v_os_dias_rs (security_invoker), que calcula
 *    `dias` no banco. Se a view ainda não existir (migration não aplicada), o
 *    erro é degradado por traduzirErro como qualquer outra falha de leitura.
 */

import { getSupabase } from './client';
import { traduzirErro, type FetchState } from './clientes';

export type StatusOs = 'aberta' | 'em_producao' | 'concluida' | 'entregue' | 'cancelada';

export const STATUS_OS: { id: StatusOs; nome: string }[] = [
  { id: 'aberta', nome: 'Aberta' },
  { id: 'em_producao', nome: 'Em produção' },
  { id: 'concluida', nome: 'Concluída' },
  { id: 'entregue', nome: 'Entregue' },
  { id: 'cancelada', nome: 'Cancelada' },
];

export type OsComercial = {
  id: string;
  oficina_id: string;
  orcamento_id: string;
  cliente_id: string | null;
  veiculo_id: string | null;
  numero: number;
  valor_orcamento: number;
  status: StatusOs;
  os_ref: string | null;
  totem_sync_status: string;
  data_aprovacao: string;
  prazo_entrega: string | null;
  data_entrega_real: string | null;
  criado_em: string;
  atualizado_em: string;
};

/** OS com os nomes/placa já resolvidos via join (para listagens na tela). */
export type OsComercialComRefs = OsComercial & {
  cliente: { nome: string } | null;
  veiculo: { placa: string; marca: string | null; modelo: string | null } | null;
};

/** Linha do card do Pátio: vem da view v_os_dias_rs (banco calcula `dias`). */
export type PatioLinha = {
  oficina_id: string;
  os_id: string;
  numero: number;
  valor_orcamento: number;
  status: StatusOs;
  dias: number;
};

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Conexão demorou demais. Verifique a internet.')), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

const COLS =
  'id, oficina_id, orcamento_id, cliente_id, veiculo_id, numero, valor_orcamento, status, os_ref, totem_sync_status, data_aprovacao, prazo_entrega, data_entrega_real, criado_em, atualizado_em';
const COLS_COM_REFS = `${COLS}, cliente:clientes(nome), veiculo:veiculos(placa, marca, modelo)`;

/**
 * Aprova um orçamento e materializa a OS Comercial via RPC (numeração + snapshot
 * do valor são feitos no banco, de forma idempotente por orcamento_id).
 */
export async function aprovarOrcamento(orcamentoId: string): Promise<FetchState<OsComercial>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().rpc('aprovar_orcamento', { p_orcamento_id: orcamentoId })
    )) as QueryResult<OsComercial>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao aprovar o orçamento.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Resultado de "Gerar OS" a partir de um orçamento aprovado, via RPC
 * public.gerar_os_de_orcamento(p_orcamento_id uuid) (migration 0020).
 *
 * Três desfechos, todos sem quebrar a tela:
 *  - `success` → a OS foi gerada (RPC devolve a OS materializada).
 *  - `indisponivel` → a RPC ainda NÃO existe (0020 não aplicada no TEST). É um
 *    estado HONESTO, não um erro: o PostgREST responde "função não encontrada".
 *  - `error` → falha real (sessão, RLS, rede), com mensagem já traduzida.
 */
export type GerarOsResultado =
  | { status: 'success'; data: OsComercial }
  | { status: 'indisponivel'; message: string }
  | { status: 'error'; message: string };

/**
 * Heurística string (mesmo espírito do `traduzirErro`) para reconhecer o erro
 * do PostgREST quando a função/relação da RPC ainda não existe — ou seja, a
 * migration 0020 não foi aplicada no ambiente. Cobre as variações conhecidas:
 *  - PGRST202 ("Could not find the function public.gerar_os_de_orcamento …")
 *  - "function … does not exist" (42883) / "schema cache"
 *  - "relation … does not exist" (42P01), caso a RPC referencie tabela ausente
 */
function ehMigracaoAusente(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('pgrst202') ||
    m.includes('could not find the function') ||
    m.includes('schema cache') ||
    (m.includes('function') && m.includes('does not exist')) ||
    (m.includes('relation') && m.includes('does not exist')) ||
    m.includes('gerar_os_de_orcamento')
  );
}

/** Mensagem honesta exibida quando a 0020 ainda não foi aplicada no TEST. */
export const OS_RPC_INDISPONIVEL = 'Disponível ao aplicar a migration 0020 no TEST';

/**
 * Gera a OS de um orçamento APROVADO chamando a RPC `gerar_os_de_orcamento`
 * (migration 0020, em construção em paralelo). Sem digitação dupla: nada é
 * recriado — o banco materializa a OS a partir do orçamento.
 *
 * FAIL-SOFT: se a RPC ainda não existe, devolve `status: 'indisponivel'` (estado
 * honesto), nunca lança. A tela mostra "Disponível ao aplicar a migration 0020".
 */
export async function gerarOsDeOrcamento(orcamentoId: string): Promise<GerarOsResultado> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().rpc('gerar_os_de_orcamento', { p_orcamento_id: orcamentoId })
    )) as QueryResult<OsComercial>;
    if (error) {
      if (ehMigracaoAusente(error.message)) {
        return { status: 'indisponivel', message: OS_RPC_INDISPONIVEL };
      }
      return { status: 'error', message: traduzirErro(error.message) };
    }
    if (!data) return { status: 'error', message: 'A OS não foi gerada. Tente de novo.' };
    return { status: 'success', data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido.';
    if (ehMigracaoAusente(msg)) return { status: 'indisponivel', message: OS_RPC_INDISPONIVEL };
    return { status: 'error', message: msg };
  }
}

/** Lista as OS da oficina (RLS), com cliente/veículo resolvidos, mais novas primeiro. */
export async function listarOsComercial(): Promise<FetchState<OsComercialComRefs[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('os_comercial').select(COLS_COM_REFS).order('numero', { ascending: false })
    )) as QueryResult<OsComercialComRefs[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Busca a OS gerada por um orçamento (1 por orçamento). null quando ainda não há. */
export async function getOsComercialPorOrcamento(orcamentoId: string): Promise<FetchState<OsComercial | null>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('os_comercial').select(COLS).eq('orcamento_id', orcamentoId).maybeSingle()
    )) as QueryResult<OsComercial>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    return { status: 'success', data: data ?? null };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Atualiza o status da OS (fluxo de produção: aberta -> ... -> entregue/cancelada). */
export async function atualizarStatusOs(id: string, status: StatusOs): Promise<FetchState<OsComercial>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('os_comercial').update({ status }).eq('id', id).select(COLS).single()
    )) as QueryResult<OsComercial>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao atualizar o status da OS.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Alimenta o card do Pátio (dias-na-oficina × R$) lendo a view v_os_dias_rs.
 * Se a view ainda não existir (migration 0011 não aplicada), traduzirErro
 * degrada a mensagem como em qualquer outra falha de leitura.
 */
export async function listarPatio(): Promise<FetchState<PatioLinha[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('v_os_dias_rs')
        .select('oficina_id, os_id, numero, valor_orcamento, status, dias')
        .order('dias', { ascending: false })
    )) as QueryResult<PatioLinha[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
