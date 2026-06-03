/**
 * Camada de dados do módulo Estoque (Fase 1) — itens, movimentos (entrada/saída)
 * e alertas de estoque mínimo (migration 0014).
 *
 * Mesmo padrão dos demais módulos: FetchState + withTimeout + erros traduzidos
 * (traduzirErro reusado de './clientes') + cast manual via QueryResult.
 *
 * Pontos de contrato (ver migration 0014):
 *  - oficina_id é auto-preenchido pelo trigger a partir do JWT (regra "sem
 *    digitação dupla"); a RLS isola por oficina em TODAS as leituras/escritas,
 *    então o oficina_id NUNCA é enviado/filtrado aqui.
 *  - estoque_itens: custo_medio e quantidade começam em 0 via DEFAULT no banco
 *    (não são enviados no insert).
 *  - estoque_movimentos: o registro de movimento é APENAS um INSERT; um trigger
 *    no banco recalcula quantidade/custo_medio do item — a camada de dados não
 *    toca em estoque_itens ao movimentar.
 *  - v_estoque_alertas: view (security_invoker) com os itens cuja quantidade
 *    está no/abaixo do estoque_minimo.
 *  - Se as tabelas/view ainda não existirem (migration 0014 não aplicada), o
 *    erro é degradado por traduzirErro como qualquer outra falha de leitura.
 */

import { getSupabase } from './client';
import { traduzirErro, type FetchState } from './clientes';

export type CategoriaEstoque = 'peca' | 'materia_prima' | 'escritorio';
export type MovimentoTipo = 'entrada' | 'saida';

export const CATEGORIAS_ESTOQUE: { id: CategoriaEstoque; nome: string }[] = [
  { id: 'peca', nome: 'Peça' },
  { id: 'materia_prima', nome: 'Matéria-prima' },
  { id: 'escritorio', nome: 'Escritório' },
];

export type EstoqueItem = {
  id: string;
  oficina_id: string;
  nome: string;
  categoria: CategoriaEstoque;
  unidade: string;
  quantidade: number;
  custo_medio: number;
  estoque_minimo: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type EstoqueMovimento = {
  id: string;
  oficina_id: string;
  item_id: string;
  tipo: MovimentoTipo;
  quantidade: number;
  custo_unitario: number | null;
  os_comercial_id: string | null;
  observacao: string | null;
  criado_em: string;
};

/** Linha da view v_estoque_alertas: itens no/abaixo do estoque mínimo. */
export type EstoqueAlerta = {
  oficina_id: string;
  id: string;
  nome: string;
  categoria: CategoriaEstoque;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
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

const COLS_ITEM =
  'id, oficina_id, nome, categoria, unidade, quantidade, custo_medio, estoque_minimo, ativo, criado_em, atualizado_em';
const COLS_MOVIMENTO =
  'id, oficina_id, item_id, tipo, quantidade, custo_unitario, os_comercial_id, observacao, criado_em';
const COLS_ALERTA = 'oficina_id, id, nome, categoria, unidade, quantidade, estoque_minimo';

/** Lista os itens de estoque da oficina (RLS), em ordem alfabética. */
export async function listarItens(): Promise<FetchState<EstoqueItem[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('estoque_itens').select(COLS_ITEM).order('nome', { ascending: true })
    )) as QueryResult<EstoqueItem[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type EstoqueItemInput = {
  nome: string;
  categoria: CategoriaEstoque;
  unidade?: string;
  estoque_minimo?: number;
};

/**
 * Cria um item de estoque. custo_medio e quantidade começam em 0 via DEFAULT no
 * banco (não enviados aqui); oficina_id é preenchido pelo trigger a partir do JWT.
 */
export async function criarItem(input: EstoqueItemInput): Promise<FetchState<EstoqueItem>> {
  const nome = input.nome.trim();
  if (!nome) return { status: 'error', message: 'Informe o nome do item.' };
  const payload: Record<string, unknown> = {
    nome,
    categoria: input.categoria,
  };
  if (input.unidade !== undefined) {
    const unidade = input.unidade.trim();
    if (unidade) payload.unidade = unidade;
  }
  if (input.estoque_minimo !== undefined) payload.estoque_minimo = input.estoque_minimo;
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('estoque_itens')
        .insert(payload) // oficina_id, custo_medio e quantidade são do banco (trigger/default)
        .select(COLS_ITEM)
        .single()
    )) as QueryResult<EstoqueItem>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao criar o item.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type EstoqueMovimentoInput = {
  item_id: string;
  tipo: MovimentoTipo;
  quantidade: number;
  custo_unitario?: number | null;
  os_comercial_id?: string | null;
  observacao?: string | null;
};

/**
 * Registra uma movimentação (entrada/saída). É APENAS um INSERT em
 * estoque_movimentos — um trigger no banco recalcula quantidade/custo_medio do
 * item. oficina_id é preenchido pelo trigger a partir do JWT.
 */
export async function registrarMovimento(input: EstoqueMovimentoInput): Promise<FetchState<EstoqueMovimento>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('estoque_movimentos')
        .insert({
          item_id: input.item_id,
          tipo: input.tipo,
          quantidade: input.quantidade,
          custo_unitario: input.custo_unitario ?? null,
          os_comercial_id: input.os_comercial_id ?? null,
          observacao: input.observacao?.trim() || null,
        }) // oficina_id é preenchido pelo trigger; o trigger também atualiza o item
        .select(COLS_MOVIMENTO)
        .single()
    )) as QueryResult<EstoqueMovimento>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao registrar a movimentação.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Lista as movimentações de um item (RLS), mais novas primeiro. */
export async function listarMovimentos(itemId: string): Promise<FetchState<EstoqueMovimento[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('estoque_movimentos')
        .select(COLS_MOVIMENTO)
        .eq('item_id', itemId)
        .order('criado_em', { ascending: false })
    )) as QueryResult<EstoqueMovimento[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Itens no/abaixo do estoque mínimo, lidos da view v_estoque_alertas. Se a view
 * ainda não existir (migration 0014 não aplicada), traduzirErro degrada a
 * mensagem como em qualquer outra falha de leitura.
 */
export async function listarAlertas(): Promise<FetchState<EstoqueAlerta[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_estoque_alertas').select(COLS_ALERTA).order('nome', { ascending: true })
    )) as QueryResult<EstoqueAlerta[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
