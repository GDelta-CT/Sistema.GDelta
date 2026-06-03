/**
 * Camada de dados do módulo Financeiro / Dashboard (Fase 1) — a leitura
 * agregada que vira KPI, funil e ranking na tela. Tudo vem de VIEWS que
 * agregam no banco (migration 0013), com security_invoker -> a RLS por
 * oficina (claim `oficina_id` do JWT) é a fronteira e o `oficina_id` NUNCA
 * é enviado/filtrado aqui.
 *
 * Mesmo padrão dos demais módulos: FetchState + withTimeout + erros traduzidos
 * (traduzirErro reusado de './clientes') + cast manual via QueryResult.
 *
 * Pontos de contrato (ver migration 0013):
 *  - v_financeiro_kpis: UMA linha por oficina (lida com .maybeSingle()); pode
 *    ser null quando a oficina ainda não tem nenhuma OS.
 *  - v_funil_os / v_funil_orcamentos: uma linha por status (StatusOs /
 *    StatusOrcamento), para o gráfico de funil.
 *  - v_ranking_clientes: ranking por valor faturado (order desc + limit).
 *  - Se as views ainda não existirem (migration 0013 não aplicada), o erro é
 *    degradado por traduzirErro como qualquer outra falha de leitura.
 */

import { getSupabase } from './client';
import { traduzirErro, type FetchState } from './clientes';
import type { StatusOs } from './os-comercial';
import type { StatusOrcamento } from './orcamentos';

/** KPIs do topo do dashboard: contagens por status + receita + ticket médio. */
export type FinanceiroKpis = {
  oficina_id: string;
  os_abertas: number;
  os_em_producao: number;
  os_concluidas: number;
  os_entregues: number;
  os_canceladas: number;
  receita_aberta: number;
  receita_entregue: number;
  ticket_medio: number;
};

/** Linha do funil de OS: contagem e valor agregados por status. */
export type FunilOsLinha = {
  oficina_id: string;
  status: StatusOs;
  qtd: number;
  valor_total: number;
};

/** Linha do funil de orçamentos: contagem agregada por status. */
export type FunilOrcamentoLinha = {
  oficina_id: string;
  status: StatusOrcamento;
  qtd: number;
};

/** Linha do ranking de clientes por valor faturado. */
export type RankingCliente = {
  oficina_id: string;
  cliente_id: string | null;
  cliente_nome: string;
  qtd_os: number;
  valor_total: number;
};

/**
 * Margem real por OS (view v_os_margem_real, migration 0016): receita −
 * (custo dos itens do orçamento + custo do material baixado do estoque).
 * `custo_material` usa o custo_medio ATUAL do item (a saída não guarda o custo
 * no MVP) — aproximação assumida na própria view. Valores numéricos podem vir
 * como string do PostgREST; o consumo na tela já faz `Number(...)`.
 */
export type MargemRealOs = {
  os_id: string;
  numero: number;
  status: StatusOs;
  valor: number;
  custo_itens: number;
  custo_material: number;
  custo_total: number;
  margem_real: number;
  margem_pct: number;
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

const COLS_KPIS =
  'oficina_id, os_abertas, os_em_producao, os_concluidas, os_entregues, os_canceladas, receita_aberta, receita_entregue, ticket_medio';
const COLS_FUNIL_OS = 'oficina_id, status, qtd, valor_total';
const COLS_FUNIL_ORCAMENTOS = 'oficina_id, status, qtd';
const COLS_RANKING = 'oficina_id, cliente_id, cliente_nome, qtd_os, valor_total';
const COLS_MARGEM_REAL =
  'os_id, numero, status, valor, custo_itens, custo_material, custo_total, margem_real, margem_pct';

/**
 * KPIs do dashboard (uma linha por oficina via RLS). `null` quando a oficina
 * ainda não tem nenhuma OS — por isso `.maybeSingle()` e não `.single()`.
 */
export async function getFinanceiroKpis(): Promise<FetchState<FinanceiroKpis | null>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_financeiro_kpis').select(COLS_KPIS).maybeSingle()
    )) as QueryResult<FinanceiroKpis>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    return { status: 'success', data: data ?? null };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Funil de OS por status (contagem + valor), para o gráfico do dashboard. */
export async function getFunilOs(): Promise<FetchState<FunilOsLinha[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_funil_os').select(COLS_FUNIL_OS)
    )) as QueryResult<FunilOsLinha[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Funil de orçamentos por status (contagem), para o gráfico do dashboard. */
export async function getFunilOrcamentos(): Promise<FetchState<FunilOrcamentoLinha[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_funil_orcamentos').select(COLS_FUNIL_ORCAMENTOS)
    )) as QueryResult<FunilOrcamentoLinha[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Ranking de clientes por valor faturado (maiores primeiro), limitado a
 * `limite` linhas (padrão 10) para o card "Top clientes".
 */
export async function getRankingClientes(limite = 10): Promise<FetchState<RankingCliente[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('v_ranking_clientes')
        .select(COLS_RANKING)
        .order('valor_total', { ascending: false })
        .limit(limite)
    )) as QueryResult<RankingCliente[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Margem real por OS (maiores números primeiro = OS mais recentes), limitada a
 * `limite` linhas (padrão 20) para o card "Margem real por OS". A view já filtra
 * OS canceladas e aplica a RLS por oficina (security_invoker). Se a view ainda
 * não existir (migration 0016 não aplicada), o erro é degradado por traduzirErro.
 */
export async function getMargemRealOs(limite = 20): Promise<FetchState<MargemRealOs[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('v_os_margem_real')
        .select(COLS_MARGEM_REAL)
        .order('numero', { ascending: false })
        .limit(limite)
    )) as QueryResult<MargemRealOs[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
