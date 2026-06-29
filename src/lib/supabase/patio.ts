/**
 * Camada de dados do Pátio (V3) — leitura das views de eficiência operacional
 * que alimentam os cards de "estouro de insumo" e "desperdício de cabine".
 *
 * Mesmo padrão estrutural de ./financeiro.ts: getSupabase() + withTimeout +
 * cast manual via QueryResult, lendo de VIEWS que já agregam no banco e aplicam
 * a RLS por oficina (claim `oficina_id` do JWT) — por isso o `oficina_id` NUNCA
 * é enviado/filtrado aqui.
 *
 * FAIL-SOFT (importante): as views v_insumo_estouro e v_cabine_desperdicio são
 * criadas na migration 0017 da V3, que AINDA NÃO foi aplicada no ambiente de
 * TEST. Enquanto isso, qualquer leitura falha (relação inexistente). Por isso,
 * diferente de ./financeiro.ts (que devolve FetchState e propaga o erro), aqui
 * cada função degrada SUAVE: try/catch retornando `[]` em qualquer erro, para
 * que a página NUNCA quebre por causa de uma view que ainda não existe. Quando
 * a migration 0017 for aplicada, os dados passam a aparecer sem mudar a API.
 *
 * Pontos de contrato (ver migration 0017):
 *  - v_insumo_estouro(oficina_id, os_comercial_id, numero, custo_insumo_estimado,
 *    custo_insumo_consumido, estouro): estouro = consumido − estimado por OS.
 *  - v_cabine_desperdicio(oficina_id, os_comercial_id, aplicacao_inicio,
 *    cura_inicio, cura_fim, cura_minutos_padrao, cura_minutos_real,
 *    desperdicio_minutos): minutos de cura além do padrão por OS.
 *  - Valores numéricos podem vir como string do PostgREST; o consumo na tela
 *    deve aplicar `Number(...)` antes de formatar/ordenar com precisão.
 */

import { getSupabase } from './client';
import { DEMO } from '@/lib/demo/mode';

/**
 * Estouro de insumo por OS (view v_insumo_estouro, migration 0017): quanto o
 * custo de insumo CONSUMIDO ultrapassou o ESTIMADO. `estouro` > 0 indica gasto
 * acima do previsto. Fail-soft até a migration 0017 ser aplicada.
 */
export type InsumoEstouro = {
  oficina_id: string;
  os_comercial_id: string;
  numero: number;
  custo_insumo_estimado: number;
  custo_insumo_consumido: number;
  estouro: number;
};

/**
 * Desperdício de cabine por OS (view v_cabine_desperdicio, migration 0017):
 * minutos de cura além do padrão (cura_minutos_real − cura_minutos_padrao).
 * Timestamps chegam como string ISO do PostgREST. Fail-soft até a migration
 * 0017 ser aplicada.
 */
export type CabineDesperdicio = {
  oficina_id: string;
  os_comercial_id: string;
  aplicacao_inicio: string | null;
  cura_inicio: string | null;
  cura_fim: string | null;
  // A view devolve NULL quando faltam timestamps/padrão (cura não medida ainda).
  cura_minutos_padrao: number | null;
  cura_minutos_real: number | null;
  desperdicio_minutos: number | null;
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

const COLS_INSUMO_ESTOURO =
  'oficina_id, os_comercial_id, numero, custo_insumo_estimado, custo_insumo_consumido, estouro';
const COLS_CABINE_DESPERDICIO =
  'oficina_id, os_comercial_id, aplicacao_inicio, cura_inicio, cura_fim, cura_minutos_padrao, cura_minutos_real, desperdicio_minutos';

/**
 * Estouro de insumo por OS, maiores estouros primeiro (ordenação no app, sobre
 * o campo `estouro`). FAIL-SOFT: retorna `[]` em qualquer erro — a view só
 * existe após a migration 0017, então a página nunca pode quebrar por isso.
 */
export async function getInsumoEstouro(): Promise<InsumoEstouro[]> {
  if (DEMO) {
    const { INSUMO_ESTOURO_DEMO } = await import('@/lib/demo/dataset');
    return [...INSUMO_ESTOURO_DEMO].sort((a, b) => b.estouro - a.estouro);
  }
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_insumo_estouro').select(COLS_INSUMO_ESTOURO)
    )) as QueryResult<InsumoEstouro[]>;
    if (error || !data) return [];
    return [...data].sort((a, b) => Number(b.estouro) - Number(a.estouro));
  } catch {
    return [];
  }
}

/**
 * Desperdício de cabine por OS. FAIL-SOFT: retorna `[]` em qualquer erro — a
 * view só existe após a migration 0017, então a página nunca pode quebrar por
 * isso.
 */
export async function getCabineDesperdicio(): Promise<CabineDesperdicio[]> {
  if (DEMO) {
    const { CABINE_DESPERDICIO_DEMO } = await import('@/lib/demo/dataset');
    return CABINE_DESPERDICIO_DEMO;
  }
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_cabine_desperdicio').select(COLS_CABINE_DESPERDICIO)
    )) as QueryResult<CabineDesperdicio[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
