/**
 * Camada de dados do módulo Fórmulas de Tinta (migration 0018) — custeio da
 * COR por receita de bases, base da MARGEM AO VIVO honesta na pintura.
 *
 * Modelo (ver migration 0018):
 *  - tinta_formula        — cabeçalho da receita (nome, codigo_cor, observacoes,
 *    ativo). Cadastrada uma vez e reusada.
 *  - tinta_formula_item   — linhas: cada base do estoque (estoque_itens) com a
 *    quantidade em GRAMAS (> 0). A base usada é protegida por ON DELETE RESTRICT.
 *  - v_tinta_formula_custo — view (security_invoker) que já entrega custo_total
 *    e custo_por_grama calculados a partir do custo_medio ATUAL das bases no
 *    estoque (o custo "vive": trocou o lote da base, a margem reflete sozinha).
 *
 * FAIL-SOFT (igual ./patio.ts): a migration 0018 AINDA NÃO foi aplicada no
 * ambiente de TEST. Enquanto isso, qualquer leitura da view/tabelas falha
 * (relação inexistente). Por isso as funções de LEITURA degradam SUAVE —
 * try/catch retornando `[]` em qualquer erro — para que a página NUNCA quebre
 * por causa de objetos que ainda não existem. Quando a 0018 for aplicada, os
 * dados passam a aparecer sem mudar a API. As funções de ESCRITA usam FetchState
 * + traduzirErro (padrão de ./estoque.ts) para devolver mensagem ao usuário.
 *
 * Pontos de contrato (ver migration 0018):
 *  - oficina_id é auto-preenchido pelo trigger a partir do JWT; a RLS isola por
 *    oficina em TODAS as leituras/escritas — o oficina_id NUNCA é enviado aqui.
 *  - Valores numéricos podem vir como string do PostgREST; o consumo na tela
 *    deve aplicar `Number(...)` antes de formatar/ordenar com precisão.
 *  - custo_por_grama é NULL quando a fórmula não tem itens (mistura sem gramas).
 */

import { getSupabase } from './client';
import { DEMO } from '@/lib/demo/mode';
import { traduzirErro, type FetchState } from './clientes';

/** Cabeçalho da fórmula de tinta (tabela tinta_formula). */
export type TintaFormula = {
  id: string;
  oficina_id: string;
  nome: string;
  codigo_cor: string | null;
  observacoes: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

/** Linha da fórmula: uma base do estoque com sua quantidade em gramas. */
export type TintaFormulaItem = {
  id: string;
  oficina_id: string;
  formula_id: string;
  estoque_item_id: string;
  gramas: number;
  criado_em: string;
};

/**
 * Linha da view v_tinta_formula_custo: a fórmula com o custo já calculado a
 * partir do custo_medio atual das bases. custo_por_grama é NULL quando a
 * fórmula ainda não tem itens.
 */
export type FormulaComCusto = {
  oficina_id: string;
  id: string;
  nome: string;
  codigo_cor: string | null;
  ativo: boolean;
  gramas_total: number;
  custo_total: number;
  custo_por_grama: number | null;
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

const COLS_FORMULA = 'id, oficina_id, nome, codigo_cor, observacoes, ativo, criado_em, atualizado_em';
const COLS_ITEM = 'id, oficina_id, formula_id, estoque_item_id, gramas, criado_em';
const COLS_CUSTO = 'oficina_id, id, nome, codigo_cor, ativo, gramas_total, custo_total, custo_por_grama';

/**
 * Lista as fórmulas da oficina com o custo já calculado (view
 * v_tinta_formula_custo), em ordem alfabética pelo nome. FAIL-SOFT: retorna
 * `[]` em qualquer erro — a view só existe após a migration 0018, então a
 * página nunca pode quebrar por isso.
 */
export async function listarFormulasComCusto(): Promise<FormulaComCusto[]> {
  // MODO DEMO: fórmulas de cor já com custo (espelha v_tinta_formula_custo).
  if (DEMO) {
    const { TINTAS_FORMULAS_DEMO } = await import('@/lib/demo/dataset');
    return TINTAS_FORMULAS_DEMO;
  }
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_tinta_formula_custo').select(COLS_CUSTO).order('nome', { ascending: true })
    )) as QueryResult<FormulaComCusto[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Lista as linhas (bases) de uma fórmula, mais novas primeiro. FAIL-SOFT:
 * retorna `[]` em qualquer erro — as tabelas só existem após a migration 0018.
 */
export async function listarItens(formulaId: string): Promise<TintaFormulaItem[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('tinta_formula_item')
        .select(COLS_ITEM)
        .eq('formula_id', formulaId)
        .order('criado_em', { ascending: false })
    )) as QueryResult<TintaFormulaItem[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export type TintaFormulaInput = {
  nome: string;
  codigo_cor?: string | null;
  observacoes?: string | null;
};

/**
 * Cria uma fórmula (cabeçalho). oficina_id é preenchido pelo trigger a partir
 * do JWT; ativo começa em true via DEFAULT no banco (não enviado aqui).
 */
export async function criarFormula(input: TintaFormulaInput): Promise<FetchState<TintaFormula>> {
  const nome = input.nome.trim();
  if (!nome) return { status: 'error', message: 'Informe o nome da fórmula.' };
  const payload: Record<string, unknown> = { nome };
  const codigo = input.codigo_cor?.trim();
  if (codigo) payload.codigo_cor = codigo;
  const obs = input.observacoes?.trim();
  if (obs) payload.observacoes = obs;
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('tinta_formula').insert(payload).select(COLS_FORMULA).single()
    )) as QueryResult<TintaFormula>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao criar a fórmula.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type TintaFormulaItemInput = {
  formula_id: string;
  estoque_item_id: string;
  gramas: number;
};

/**
 * Adiciona uma base (linha) à fórmula. oficina_id é preenchido pelo trigger a
 * partir do JWT. gramas deve ser > 0 (CHECK no banco; validado aqui também).
 */
export async function addItem(input: TintaFormulaItemInput): Promise<FetchState<TintaFormulaItem>> {
  if (!(input.gramas > 0)) return { status: 'error', message: 'Informe uma quantidade em gramas maior que zero.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('tinta_formula_item')
        .insert({
          formula_id: input.formula_id,
          estoque_item_id: input.estoque_item_id,
          gramas: input.gramas,
        }) // oficina_id é preenchido pelo trigger a partir do JWT
        .select(COLS_ITEM)
        .single()
    )) as QueryResult<TintaFormulaItem>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao adicionar a base à fórmula.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Remove uma linha (base) da fórmula pelo id da linha. */
export async function removerItem(itemId: string): Promise<FetchState<true>> {
  try {
    const { error } = (await withTimeout(
      getSupabase().from('tinta_formula_item').delete().eq('id', itemId)
    )) as QueryResult<unknown>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    return { status: 'success', data: true };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Remove uma fórmula inteira (suas linhas vão junto por ON DELETE CASCADE no
 * banco). A FK das bases é ON DELETE RESTRICT, mas isso só protege a base no
 * estoque — apagar a fórmula em si é livre.
 */
export async function removerFormula(formulaId: string): Promise<FetchState<true>> {
  try {
    const { error } = (await withTimeout(
      getSupabase().from('tinta_formula').delete().eq('id', formulaId)
    )) as QueryResult<unknown>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    return { status: 'success', data: true };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
