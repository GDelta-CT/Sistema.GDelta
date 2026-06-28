/**
 * Camada de dados das Despesas (aba 💸 Despesas da Planilha-Sistema v2.0).
 *
 * O QUE FAZ: lê a tabela `despesas` (migration 0019) e devolve, já agregado para
 * a tela: a LISTA de despesas, os TOTAIS por tipo (fixa × variável) e os totais
 * POR CATEGORIA (agrupamento que a aba mostra). É a leitura por COMPETÊNCIA que
 * alimenta tanto o módulo Despesas quanto a linha "Despesas Operacionais" da DRE.
 *
 * FAIL-SOFT TOTAL (igual ./patio.ts, ./kpis.ts e ./dre.ts): este módulo NUNCA
 * lança. A leitura é feita dentro de try/catch e, em qualquer falha (tabela
 * inexistente, token ausente, RLS, timeout), degrada para vazio. A migration
 * 0019 (que cria `despesas`) AINDA NÃO foi aplicada no TEST — enquanto isso a
 * leitura falha (relação inexistente) e a tela mostra "aguardando dados", nunca
 * um erro. Quando a migration for aplicada, os dados aparecem sem mudar a API.
 *
 * Sem digitação dupla: tudo vem da tabela; nada é recriado. O `oficina_id` NUNCA
 * é enviado/filtrado aqui — a RLS isola por oficina via o claim do JWT.
 *
 * Contrato da tabela (ver migration 20260601001900_financeiro_gestao.sql):
 *   despesas(id, oficina_id, descricao, categoria, tipo 'fixa'|'variavel',
 *            valor numeric, data_competencia date, recorrente bool,
 *            periodicidade 'mensal'|'semanal'|'anual'|null, observacoes,
 *            criado_em, atualizado_em).
 *   Valores numéricos podem vir como string do PostgREST → sempre `Number(...)`.
 */

import { getSupabase } from './client';

/* ─────────────────────────── Identidade ──────────────────────────── */

/** Tipo da despesa — espelha o CHECK da tabela (`fixa` | `variavel`). */
export type TipoDespesa = 'fixa' | 'variavel';

/** Periodicidade da recorrência — espelha o CHECK da tabela. */
export type PeriodicidadeDespesa = 'mensal' | 'semanal' | 'anual';

/** Rótulo PT-BR fixo por tipo (apresentação consistente na tela). */
export const ROTULO_TIPO: Record<TipoDespesa, string> = {
  fixa: 'Fixa',
  variavel: 'Variável',
};

/** Rótulo PT-BR fixo por periodicidade. */
export const ROTULO_PERIODICIDADE: Record<PeriodicidadeDespesa, string> = {
  mensal: 'Mensal',
  semanal: 'Semanal',
  anual: 'Anual',
};

/** Rótulo amigável para a categoria (null/vazio → "Sem categoria"). */
export function rotuloCategoria(categoria: string | null): string {
  const c = (categoria ?? '').trim();
  return c.length > 0 ? c : 'Sem categoria';
}

/* ─────────────────────────── Linha de despesa ──────────────────────────── */

/**
 * Uma despesa, como vem da tabela (campos que a tela usa). Valores numéricos
 * podem chegar como string do PostgREST — quem consome aplica `Number(...)`.
 */
export type Despesa = {
  id: string;
  descricao: string;
  categoria: string | null;
  tipo: TipoDespesa;
  valor: number;
  data_competencia: string; // ISO date (YYYY-MM-DD)
  recorrente: boolean;
  periodicidade: PeriodicidadeDespesa | null;
};

/** Total de um agrupamento (por tipo ou por categoria): soma + contagem. */
export type TotalGrupo = {
  /** Soma dos valores do grupo. */
  total: number;
  /** Quantidade de lançamentos no grupo. */
  qtd: number;
};

/** Bloco de uma categoria: rótulo + total + as despesas dela. */
export type GrupoCategoria = {
  /** Categoria crua (null = sem categoria). */
  categoria: string | null;
  /** Rótulo já resolvido para exibição. */
  rotulo: string;
  total: number;
  qtd: number;
  /** Despesas da categoria, maior valor primeiro. */
  itens: Despesa[];
};

/**
 * Resumo completo das despesas para a tela. Sempre presente (mesmo vazio) — o
 * estado vazio é HONESTO via `aguardandoDados` / `temDados`.
 */
export type ResumoDespesas = {
  /** Todas as despesas, mais recentes (por competência) primeiro. */
  despesas: Despesa[];
  /** Totais por tipo: fixa × variável. */
  porTipo: Record<TipoDespesa, TotalGrupo>;
  /** Total geral (fixa + variável). */
  totalGeral: number;
  /** Quantidade total de lançamentos. */
  qtdTotal: number;
  /** Agrupamento por categoria, maior total primeiro. */
  porCategoria: GrupoCategoria[];
  /**
   * `true` quando a fonte ainda não está disponível sem aplicar a migration 0019
   * no TEST (tabela inexistente/erro de leitura). A tela mostra "aguardando
   * dados", não um erro.
   */
  aguardandoDados: boolean;
  /** `true` quando há pelo menos uma despesa lida. */
  temDados: boolean;
};

/* ───────────────────────────── Acesso a dados ────────────────────────────── */

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Conexão demorou demais. Verifique a internet.')),
      ms
    );
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

/** Linha crua da tabela `despesas` (subset que a tela consome). */
type DespesaRow = {
  id: string;
  descricao: string;
  categoria: string | null;
  tipo: string;
  valor: number | string;
  data_competencia: string;
  recorrente: boolean;
  periodicidade: string | null;
};

const COLS_DESPESAS =
  'id, descricao, categoria, tipo, valor, data_competencia, recorrente, periodicidade';

/**
 * Resultado da leitura: as linhas + se a fonte está indisponível. Distingue
 * "tabela ainda não existe" (aguardandoDados) de "existe e está vazia" — sem
 * isso a tela não saberia mostrar "aplicar migration 0019" vs. "sem despesas".
 */
type LeituraDespesas = { rows: DespesaRow[]; aguardandoDados: boolean };

/**
 * Lê a tabela `despesas`. FAIL-SOFT: qualquer erro (relação inexistente, token
 * ausente, RLS, timeout) NÃO lança — devolve linhas vazias com
 * `aguardandoDados: true`, para a tela renderizar o estado honesto.
 */
async function lerDespesas(): Promise<LeituraDespesas> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('despesas').select(COLS_DESPESAS)
    )) as QueryResult<DespesaRow[]>;
    // Erro de leitura (mais provável: tabela ainda não criada no TEST) → aguardando.
    if (error) return { rows: [], aguardandoDados: true };
    // Sem erro e sem dados = tabela existe, porém vazia (não é "aguardando").
    if (!data) return { rows: [], aguardandoDados: false };
    return { rows: data, aguardandoDados: false };
  } catch {
    // Timeout/exceção inesperada — degrada para aguardando, jamais lança.
    return { rows: [], aguardandoDados: true };
  }
}

/* ───────────────────────────── Normalização ──────────────────────────────── */

/** Soma segura (PostgREST pode devolver número como string). */
function num(v: number | string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Tipo válido ou fallback para 'variavel' (espelha o default da tabela). */
function normalizarTipo(tipo: string): TipoDespesa {
  return tipo === 'fixa' ? 'fixa' : 'variavel';
}

/** Periodicidade válida ou null (só importa quando recorrente). */
function normalizarPeriodicidade(p: string | null): PeriodicidadeDespesa | null {
  if (p === 'mensal' || p === 'semanal' || p === 'anual') return p;
  return null;
}

/** Converte uma linha crua na `Despesa` tipada e saneada. */
function normalizar(row: DespesaRow): Despesa {
  return {
    id: row.id,
    descricao: row.descricao,
    categoria: row.categoria,
    tipo: normalizarTipo(row.tipo),
    valor: num(row.valor),
    data_competencia: row.data_competencia,
    recorrente: Boolean(row.recorrente),
    periodicidade: normalizarPeriodicidade(row.periodicidade),
  };
}

/* ─────────────────────────── Montagem do resumo ──────────────────────────── */

/** Compara competência desc (mais recente primeiro), depois valor desc. */
function ordenarDespesas(a: Despesa, b: Despesa): number {
  if (a.data_competencia !== b.data_competencia) {
    return a.data_competencia < b.data_competencia ? 1 : -1;
  }
  return b.valor - a.valor;
}

/** Resumo vazio reutilizável (estado vazio / aguardando). */
function resumoVazio(aguardandoDados: boolean): ResumoDespesas {
  return {
    despesas: [],
    porTipo: { fixa: { total: 0, qtd: 0 }, variavel: { total: 0, qtd: 0 } },
    totalGeral: 0,
    qtdTotal: 0,
    porCategoria: [],
    aguardandoDados,
    temDados: false,
  };
}

/**
 * Monta o resumo a partir das despesas já normalizadas: totais por tipo, total
 * geral e o agrupamento por categoria (cada grupo ordenado por valor; os grupos
 * ordenados por total desc). Pura — sem I/O.
 */
function montarResumo(despesas: Despesa[]): ResumoDespesas {
  const porTipo: Record<TipoDespesa, TotalGrupo> = {
    fixa: { total: 0, qtd: 0 },
    variavel: { total: 0, qtd: 0 },
  };

  // Mapa preserva inserção; reduz à categoria crua (null vira chave própria).
  const mapaCat = new Map<string | null, { itens: Despesa[]; total: number }>();

  for (const d of despesas) {
    porTipo[d.tipo].total += d.valor;
    porTipo[d.tipo].qtd += 1;

    const chave = d.categoria;
    const grupo = mapaCat.get(chave) ?? { itens: [], total: 0 };
    grupo.itens.push(d);
    grupo.total += d.valor;
    mapaCat.set(chave, grupo);
  }

  const porCategoria: GrupoCategoria[] = Array.from(mapaCat.entries())
    .map(([categoria, g]) => ({
      categoria,
      rotulo: rotuloCategoria(categoria),
      total: g.total,
      qtd: g.itens.length,
      itens: [...g.itens].sort(ordenarDespesas),
    }))
    .sort((a, b) => b.total - a.total);

  const totalGeral = porTipo.fixa.total + porTipo.variavel.total;

  return {
    despesas: [...despesas].sort(ordenarDespesas),
    porTipo,
    totalGeral,
    qtdTotal: despesas.length,
    porCategoria,
    aguardandoDados: false,
    temDados: despesas.length > 0,
  };
}

/**
 * Carrega o resumo de despesas (lista + totais por tipo + por categoria).
 * FAIL-SOFT TOTAL: jamais lança. Se a tabela ainda não existe no TEST, devolve
 * um resumo vazio com `aguardandoDados: true` (a tela orienta aplicar a 0019).
 *
 * Sempre devolve a estrutura completa, para a tela renderizar em qualquer
 * cenário (banco vazio, sem token, tabela ausente).
 */
export async function carregarDespesas(): Promise<ResumoDespesas> {
  const { rows, aguardandoDados } = await lerDespesas();
  if (aguardandoDados) return resumoVazio(true);
  if (rows.length === 0) return resumoVazio(false);
  return montarResumo(rows.map(normalizar));
}
