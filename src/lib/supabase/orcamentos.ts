/**
 * Camada de dados do módulo Orçamento (Fase 1) — o diferencial nº 1.
 * O banco calcula os totais/margem (colunas geradas); aqui também há um
 * cálculo PURO (calcularTotais) para a margem AO VIVO na tela, antes de salvar.
 */

import { getSupabase } from './client';
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
  if (m.includes('jwt') || m.includes('invalid api key')) return 'Sessão inválida. Faça login de novo.';
  if (m.includes('permission') || m.includes('rls') || m.includes('policy') || m.includes('denied')) return 'Sem permissão para esta ação.';
  if (m.includes('check constraint') || m.includes('violates check')) return 'Tipo de item ou status inválido.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com o servidor.';
  return msg;
}
type QueryResult<T> = { data: T | null; error: { message: string } | null };

const COLS_ITEM = 'id, tipo, descricao, quantidade, custo_unitario, venda_unitaria, total_custo, total_venda, margem';

export async function listarOrcamentos(): Promise<FetchState<OrcamentoLinha[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('orcamentos')
        .select('id, status, desconto, criado_em, cliente:clientes(nome), veiculo:veiculos(placa), itens:orcamento_itens(total_venda, total_custo, margem)')
        .order('criado_em', { ascending: false })
    )) as QueryResult<OrcamentoLinha[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type OrcamentoInput = {
  cliente_id?: string | null;
  veiculo_id?: string | null;
  status?: StatusOrcamento;
  desconto?: number;
  observacoes?: string | null;
};

export async function criarOrcamento(input: OrcamentoInput): Promise<FetchState<Orcamento>> {
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
