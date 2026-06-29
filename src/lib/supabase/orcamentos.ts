/**
 * Camada de dados do módulo Orçamento (Fase 1) — o diferencial nº 1.
 * O banco calcula os totais/margem (colunas geradas); aqui também há um
 * cálculo PURO (calcularTotais) para a margem AO VIVO na tela, antes de salvar.
 */

import { getSupabase } from './client';
import { DEMO } from '@/lib/demo/mode';
import type { FetchState } from './clientes';

export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';
export type TipoItem = 'peca' | 'mao_de_obra' | 'insumo';

export const STATUS_ORCAMENTO: { id: StatusOrcamento; nome: string }[] = [
  { id: 'rascunho', nome: 'Rascunho' },
  { id: 'enviado', nome: 'Enviado' },
  { id: 'aprovado', nome: 'Aprovado' },
  { id: 'recusado', nome: 'Recusado' },
];

export const TIPOS_ITEM: { id: TipoItem; nome: string }[] = [
  { id: 'peca', nome: 'Peça' },
  { id: 'mao_de_obra', nome: 'Mão de obra' },
  { id: 'insumo', nome: 'Insumo' },
];

export type OrcamentoItem = {
  id: string;
  tipo: TipoItem;
  descricao: string;
  quantidade: number;
  custo_unitario: number;
  venda_unitaria: number;
  total_custo: number;
  total_venda: number;
  margem: number;
};

export type Orcamento = {
  id: string;
  cliente_id: string | null;
  veiculo_id: string | null;
  status: StatusOrcamento;
  desconto: number;
  observacoes: string | null;
  criado_em: string;
};

export type OrcamentoLinha = {
  id: string;
  cliente_id: string | null;
  status: StatusOrcamento;
  desconto: number;
  criado_em: string;
  cliente: { nome: string } | null;
  veiculo: { placa: string } | null;
  itens: { total_venda: number; total_custo: number; margem: number }[];
};

/* ----------------- cálculo AO VIVO (puro, sem rede) ----------------- */

export type LinhaCalc = { quantidade: number; custo_unitario: number; venda_unitaria: number };
export type Totais = { totalVenda: number; totalCusto: number; lucro: number; margemPct: number };

export function calcularTotais(itens: LinhaCalc[], desconto = 0): Totais {
  const bruto = itens.reduce((a, i) => a + i.quantidade * i.venda_unitaria, 0);
  const totalVenda = Math.max(0, bruto - desconto);
  const totalCusto = itens.reduce((a, i) => a + i.quantidade * i.custo_unitario, 0);
  const lucro = totalVenda - totalCusto;
  const margemPct = totalVenda > 0 ? (lucro / totalVenda) * 100 : 0;
  return { totalVenda, totalCusto, lucro, margemPct };
}

/* ----------------- piso de margem (semáforo "pare de vender no prejuízo") ----------------- */

/**
 * Piso de margem MÍNIMO (fração, 0–1). Abaixo dele o orçamento acende alerta de
 * perigo na tela — o reforço do diferencial "pare de vender no prejuízo".
 *
 * É uma `const` (default da oficina) deixada pronta para virar config por
 * oficina depois (ex.: ler de uma tabela `oficina_config` e cair neste valor
 * quando ausente), SEM mexer na lógica de margem existente: `avaliarPisoMargem`
 * só LÊ o `margemPct` que `calcularTotais` já produziu e compara com o piso.
 *
 * 0.15 = 15%. Escolhido abaixo da "meta" de 20% (faixa de atenção do semáforo
 * `statusMargem`): entre o piso e a meta é atenção; abaixo do piso é perigo.
 */
export const PISO_MARGEM_PADRAO = 0.15;

/** Avaliação do piso: o piso em %, se a margem está abaixo dele, e o rótulo pronto. */
export type PisoMargem = {
  /** Piso configurado, já em PONTOS PERCENTUAIS (ex.: 15) para exibir/compor texto. */
  pisoPct: number;
  /** `true` quando a margem ao vivo está ABAIXO do piso (acende o alerta de perigo). */
  abaixo: boolean;
  /** Texto curto e acionável para o alerta/realce (PT-BR). */
  rotulo: string;
};

/**
 * Compara a margem AO VIVO (`margemPct`, em pontos percentuais — a mesma saída
 * de `calcularTotais`) contra o piso (fração 0–1, default `PISO_MARGEM_PADRAO`).
 * Função PURA, sem rede: a tela chama a cada render para o semáforo do piso.
 *
 * Não altera nem recalcula a margem — apenas a interpreta contra o piso.
 */
export function avaliarPisoMargem(margemPct: number, piso = PISO_MARGEM_PADRAO): PisoMargem {
  const pisoPct = Math.round(piso * 100);
  const abaixo = margemPct < pisoPct;
  return {
    pisoPct,
    abaixo,
    rotulo: abaixo
      ? `Abaixo do piso de margem (mín. ${pisoPct}%)`
      : `Acima do piso de margem (mín. ${pisoPct}%)`,
  };
}

/* ----------------- acesso a dados ----------------- */

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
function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('duplicate') || m.includes('unique') || m.includes('23505')) return 'Outra aprovação aconteceu ao mesmo tempo. Tente de novo.';
  if (m.includes('jwt') || m.includes('invalid api key')) return 'Sessão inválida. Faça login de novo.';
  if (m.includes('permission') || m.includes('rls') || m.includes('policy') || m.includes('denied')) return 'Sem permissão para esta ação.';
  if (m.includes('check constraint') || m.includes('violates check')) return 'Tipo de item ou status inválido.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com o servidor.';
  return msg;
}
type QueryResult<T> = { data: T | null; error: { message: string } | null };

const COLS_ITEM = 'id, tipo, descricao, quantidade, custo_unitario, venda_unitaria, total_custo, total_venda, margem';

export async function listarOrcamentos(): Promise<FetchState<OrcamentoLinha[]>> {
  // MODO DEMO: orçamentos fictícios (mix de status, com itens) já resolvidos.
  if (DEMO) {
    const { ORCAMENTOS_DEMO } = await import('@/lib/demo/dataset');
    return ORCAMENTOS_DEMO.length === 0 ? { status: 'empty' } : { status: 'success', data: ORCAMENTOS_DEMO };
  }
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('orcamentos')
        .select('id, cliente_id, status, desconto, criado_em, cliente:clientes(nome), veiculo:veiculos(placa), itens:orcamento_itens(total_venda, total_custo, margem)')
        .order('criado_em', { ascending: false })
    )) as QueryResult<OrcamentoLinha[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Tokens de compartilhamento por orçamento (`orcamentos.share_token`, migration
 * 0021). Leitura SEPARADA e FAIL-SOFT de propósito: a query principal
 * (`listarOrcamentos`) NÃO inclui `share_token`, para que a tela do dono não
 * regrida caso a 0021 ainda não tenha sido aplicada (a coluna ausente
 * derrubaria o select inteiro). Aqui, se a coluna não existir, devolvemos um
 * mapa vazio e a tela apenas mostra o estado honesto "Disponível ao aplicar a
 * migration 0021" no botão de WhatsApp — sem crash, sem chip.
 *
 * Retorna `id -> share_token` apenas para os orçamentos que já têm token.
 */
export async function listarShareTokens(): Promise<Record<string, string>> {
  // MODO DEMO: sem tokens públicos reais — mapa vazio (a tela mostra o estado
  // honesto no botão de WhatsApp), sem tocar no Supabase.
  if (DEMO) return {};
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('orcamentos').select('id, share_token')
    )) as QueryResult<{ id: string; share_token: string | null }[]>;
    if (error || !data) return {};
    const mapa: Record<string, string> = {};
    for (const row of data) {
      if (row.share_token) mapa[row.id] = row.share_token;
    }
    return mapa;
  } catch {
    return {};
  }
}

export type OrcamentoInput = {
  cliente_id?: string | null;
  veiculo_id?: string | null;
  status?: StatusOrcamento;
  desconto?: number;
  observacoes?: string | null;
};

/** Mensagem honesta para ESCRITAS no modo demo (nada é persistido de verdade). */
const DEMO_ESCRITA = 'Modo demonstração: dados fictícios não são salvos.';

export async function criarOrcamento(input: OrcamentoInput): Promise<FetchState<Orcamento>> {
  if (DEMO) return { status: 'error', message: DEMO_ESCRITA };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('orcamentos')
        .insert({
          cliente_id: input.cliente_id ?? null,
          veiculo_id: input.veiculo_id ?? null,
          status: input.status ?? 'rascunho',
          desconto: input.desconto ?? 0,
          observacoes: input.observacoes?.trim() || null,
        })
        .select('id, cliente_id, veiculo_id, status, desconto, observacoes, criado_em')
        .single()
    )) as QueryResult<Orcamento>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao criar o orçamento.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type ItemInput = {
  tipo: TipoItem;
  descricao: string;
  quantidade: number;
  custo_unitario: number;
  venda_unitaria: number;
};

export async function adicionarItens(orcamentoId: string, itens: ItemInput[]): Promise<FetchState<OrcamentoItem[]>> {
  const validos = itens.filter((i) => i.descricao.trim().length > 0);
  if (validos.length === 0) return { status: 'error', message: 'Adicione ao menos um item com descrição.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('orcamento_itens')
        .insert(validos.map((i) => ({ orcamento_id: orcamentoId, ...i })))
        .select(COLS_ITEM)
    )) as QueryResult<OrcamentoItem[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    return { status: 'success', data: data ?? [] };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function buscarOrcamento(id: string): Promise<FetchState<{ orcamento: Orcamento; itens: OrcamentoItem[] }>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('orcamentos').select('id, cliente_id, veiculo_id, status, desconto, observacoes, criado_em').eq('id', id).maybeSingle()
    )) as QueryResult<Orcamento>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'empty' };
    const itensRes = (await withTimeout(
      getSupabase().from('orcamento_itens').select(COLS_ITEM).eq('orcamento_id', id).order('criado_em', { ascending: true })
    )) as QueryResult<OrcamentoItem[]>;
    return { status: 'success', data: { orcamento: data, itens: itensRes.data ?? [] } };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

const COLS_ORCAMENTO = 'id, cliente_id, veiculo_id, status, desconto, observacoes, criado_em';

export async function atualizarStatus(id: string, status: StatusOrcamento): Promise<FetchState<Orcamento>> {
  if (DEMO) return { status: 'error', message: DEMO_ESCRITA };
  try {
    // "Aprovado é contrato": aprovar não é um update simples. A RPC
    // aprovar_orcamento (migration 0010) seta status='aprovado' E materializa a
    // OS Comercial (numeração por oficina + snapshot do valor, idempotente).
    // Por isso, no caminho 'aprovado' chamamos a RPC em vez do update direto.
    // A RPC retorna a OS (os_comercial), não o orçamento; para preservar a
    // assinatura FetchState<Orcamento>, relemos o orçamento já aprovado em
    // seguida (mesmas colunas do fluxo original).
    if (status === 'aprovado') {
      const { error: rpcError } = (await withTimeout(
        getSupabase().rpc('aprovar_orcamento', { p_orcamento_id: id })
      )) as QueryResult<unknown>;
      if (rpcError) return { status: 'error', message: traduzirErro(rpcError.message) };
      const { data, error } = (await withTimeout(
        getSupabase().from('orcamentos').select(COLS_ORCAMENTO).eq('id', id).single()
      )) as QueryResult<Orcamento>;
      if (error) return { status: 'error', message: traduzirErro(error.message) };
      if (!data) return { status: 'error', message: 'Falha ao atualizar o status.' };
      return { status: 'success', data };
    }

    // Demais status: comportamento original (update simples).
    const { data, error } = (await withTimeout(
      getSupabase().from('orcamentos').update({ status }).eq('id', id).select(COLS_ORCAMENTO).single()
    )) as QueryResult<Orcamento>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao atualizar o status.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
