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
import { DEMO } from '@/lib/demo/mode';
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
  // MODO DEMO: itens de estoque fictícios (peças + matéria-prima + escritório).
  if (DEMO) {
    const { ESTOQUE_ITENS_DEMO } = await import('@/lib/demo/dataset');
    return ESTOQUE_ITENS_DEMO.length === 0 ? { status: 'empty' } : { status: 'success', data: ESTOQUE_ITENS_DEMO };
  }
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
  // MODO DEMO: nada é persistido; mensagem honesta (sem tocar no Supabase).
  if (DEMO) return { status: 'error', message: 'Modo demonstração: dados fictícios não são salvos.' };
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
  // MODO DEMO: nada é persistido; mensagem honesta (sem tocar no Supabase).
  if (DEMO) return { status: 'error', message: 'Modo demonstração: dados fictícios não são salvos.' };
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
  // MODO DEMO: itens no/abaixo do mínimo (espelha a view v_estoque_alertas).
  if (DEMO) {
    const { ESTOQUE_ALERTAS_DEMO } = await import('@/lib/demo/dataset');
    return ESTOQUE_ALERTAS_DEMO.length === 0 ? { status: 'empty' } : { status: 'success', data: ESTOQUE_ALERTAS_DEMO };
  }
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

/* ====================================================================== */
/* Importação de NF-e de compra → entrada de estoque (custo médio).       */
/* ====================================================================== */

/**
 * Uma linha a gravar na importação da nota. Já vem RESOLVIDA pela tela (que casou
 * cada item da nota com o estoque): se `item_id` é null, o item é NOVO e será
 * criado antes da entrada; se preenchido, é uma ATUALIZAÇÃO de item existente.
 *
 * A entrada em si é SEMPRE só um INSERT em estoque_movimentos — o trigger do
 * banco recalcula quantidade e custo médio ponderado (qtd_atual*custo_atual +
 * qtd_nota*custo_nota) / (qtd_atual + qtd_nota). A camada NÃO faz a média à mão.
 */
export type ImportarLinhaInput = {
  /** id do item existente a atualizar; null cria um item novo. */
  item_id: string | null;
  /** Nome do item (usado ao criar o item novo). */
  nome: string;
  /** Categoria do item novo (a tela escolhe; itens existentes ignoram). */
  categoria: CategoriaEstoque;
  /** Unidade (un, pç, kg…) usada ao criar o item novo. */
  unidade: string;
  /** Quantidade da nota (entrada > 0). */
  quantidade: number;
  /** Custo unitário da nota (alimenta o custo médio ponderado). */
  custo_unitario: number;
  /** Observação do movimento (ex.: "NF-e 123 · Fornecedor X"). */
  observacao?: string | null;
};

/** Resultado por linha da importação — a tela mostra o que entrou e o que falhou. */
export type ImportarLinhaResultado = {
  nome: string;
  /** `true` quando um item NOVO foi criado nesta linha (vs. atualização). */
  novo: boolean;
  ok: boolean;
  /** Mensagem de erro legível quando `ok` é false. */
  erro?: string;
};

/** Resumo da importação inteira (para o estado de sucesso/parcial na tela). */
export type ImportarResultado = {
  linhas: ImportarLinhaResultado[];
  total: number;
  gravadas: number;
  falhas: number;
};

/**
 * Importa as linhas de uma NF-e como ENTRADAS de estoque.
 *
 * Para cada linha:
 *  - item NOVO (item_id null): cria o item (criarItem) e, com o id retornado,
 *    registra a entrada com custo_unitario → o trigger seta o custo médio.
 *  - item EXISTENTE: registra a entrada direto → o trigger recalcula a média
 *    ponderada com o saldo atual.
 *
 * FAIL-SOFT: jamais lança. Cada linha é isolada (try/catch via os data layers
 * que já retornam FetchState); se uma falhar (RLS, tabela ausente, duplicidade),
 * as outras seguem e a tela mostra o resultado HONESTO por linha. Processa em
 * série de propósito — a ordem do livro-razão importa para o custo médio e o
 * volume (itens de uma nota) é pequeno.
 */
export async function importarNotaEstoque(
  linhas: ImportarLinhaInput[]
): Promise<ImportarResultado> {
  const resultados: ImportarLinhaResultado[] = [];

  for (const linha of linhas) {
    const novo = linha.item_id === null;
    try {
      let itemId = linha.item_id;

      // Item novo → cria primeiro (custo_medio/quantidade nascem 0 no banco).
      if (itemId === null) {
        const criado = await criarItem({
          nome: linha.nome,
          categoria: linha.categoria,
          unidade: linha.unidade,
        });
        if (criado.status !== 'success') {
          resultados.push({
            nome: linha.nome,
            novo,
            ok: false,
            erro: criado.status === 'error' ? criado.message : 'Falha ao criar o item.',
          });
          continue;
        }
        itemId = criado.data.id;
      }

      // Entrada: o trigger do banco aplica a média ponderada e soma o saldo.
      const mov = await registrarMovimento({
        item_id: itemId,
        tipo: 'entrada',
        quantidade: linha.quantidade,
        custo_unitario: linha.custo_unitario,
        observacao: linha.observacao ?? null,
      });

      if (mov.status !== 'success') {
        resultados.push({
          nome: linha.nome,
          novo,
          ok: false,
          erro: mov.status === 'error' ? mov.message : 'Falha ao registrar a entrada.',
        });
        continue;
      }

      resultados.push({ nome: linha.nome, novo, ok: true });
    } catch (e) {
      resultados.push({
        nome: linha.nome,
        novo,
        ok: false,
        erro: e instanceof Error ? e.message : 'Erro desconhecido.',
      });
    }
  }

  const gravadas = resultados.filter((r) => r.ok).length;
  return {
    linhas: resultados,
    total: resultados.length,
    gravadas,
    falhas: resultados.length - gravadas,
  };
}
