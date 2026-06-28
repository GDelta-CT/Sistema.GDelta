/**
 * Camada de dados do Aging — idade de recebíveis e pagáveis (aba 📅 Aging da
 * Planilha-Sistema GDelta v2.0).
 *
 * O QUE FAZ: lê a view `v_aging` (migration 0019) — recebíveis + pagáveis EM
 * ABERTO, cada título já classificado pelo banco numa faixa de idade pela
 * distância de hoje ao vencimento (`a_vencer | 1-30 | 31-60 | 60+`). Aqui só
 * AGREGAMOS: por lado (receber × pagar) × faixa, somando valor e contando
 * títulos, mais o total de cada lado. O banco faz a classificação; o app só
 * organiza e apresenta — sem recriar a regra de faixa (sem digitação dupla).
 *
 * FAIL-SOFT TOTAL (igual ./dre.ts, ./kpis.ts, ./patio.ts e ./tinta.ts): este
 * módulo NUNCA lança. A leitura é feita dentro de try/catch e, em qualquer
 * falha (view inexistente — 0019 ainda não aplicada no TEST —, token ausente,
 * RLS, timeout), degrada para vazio/zerado. A tela renderiza mesmo com banco
 * vazio ou sem sessão — só mostra "aguardando dados".
 *
 * O oficina_id NUNCA é enviado — a RLS isola por oficina via JWT (a view tem
 * security_invoker, herda a RLS das tabelas base).
 */

import { getSupabase } from './client';

/* ─────────────────────────── Identidade das faixas ───────────────────────── */

/**
 * Faixa de idade de um título, EXATAMENTE como a view `v_aging` rotula. Ordem
 * crescente de severidade: a vencer (saudável) → 60+ (perigo / provisão alta).
 */
export type FaixaAging = 'a_vencer' | '1-30' | '31-60' | '60+';

/** Lado do Aging: o que a oficina vai RECEBER × o que vai PAGAR. */
export type LadoAging = 'receber' | 'pagar';

/** Ordem canônica das faixas na tela (da mais saudável à mais crítica). */
export const ORDEM_FAIXAS: FaixaAging[] = ['a_vencer', '1-30', '31-60', '60+'];

/** Ordem canônica dos lados na tela (recebíveis primeiro). */
export const ORDEM_LADOS: LadoAging[] = ['receber', 'pagar'];

/**
 * Severidade de cada faixa — diz à tela o tom do semáforo, sem cor crua aqui:
 *  - `a_vencer` : neutro/saudável (ainda no prazo).
 *  - `1-30`     : atenção leve (começou a vencer).
 *  - `31-60`    : atenção forte (atraso relevante).
 *  - `60+`      : perigo (provisão de risco alta).
 */
export type SeveridadeFaixa = 'saudavel' | 'atencao' | 'alerta' | 'perigo';

/** Mapa faixa → severidade (a tela traduz severidade em tom/cor). */
export const SEVERIDADE_FAIXA: Record<FaixaAging, SeveridadeFaixa> = {
  a_vencer: 'saudavel',
  '1-30': 'atencao',
  '31-60': 'alerta',
  '60+': 'perigo',
};

/** Rótulo PT-BR de cada faixa (apresentação). */
export const ROTULO_FAIXA: Record<FaixaAging, string> = {
  a_vencer: 'A vencer',
  '1-30': '1–30 dias',
  '31-60': '31–60 dias',
  '60+': '60+ dias',
};

/** Linha de apoio de cada faixa (uma frase de contexto honesto). */
export const AJUDA_FAIXA: Record<FaixaAging, string> = {
  a_vencer: 'Dentro do prazo — vence hoje ou no futuro.',
  '1-30': 'Vencido há até 30 dias — cobrar/negociar logo.',
  '31-60': 'Vencido entre 31 e 60 dias — risco crescendo.',
  '60+': 'Vencido há mais de 60 dias — provisão de risco alta.',
};

/** Rótulo PT-BR de cada lado. */
export const ROTULO_LADO: Record<LadoAging, string> = {
  receber: 'A receber',
  pagar: 'A pagar',
};

/* ─────────────────────────── Estrutura do resultado ──────────────────────── */

/** Agregado de uma faixa: total em R$, nº de títulos e participação no lado. */
export type FaixaResultado = {
  faixa: FaixaAging;
  /** Soma dos valores dos títulos desta faixa (R$). */
  total: number;
  /** Quantidade de títulos nesta faixa. */
  qtd: number;
  /** Participação desta faixa no total do lado (0–100), `null` se o lado é zero. */
  pctDoLado: number | null;
};

/** Agregado de um lado (receber|pagar): as 4 faixas + os totais do lado. */
export type LadoResultado = {
  lado: LadoAging;
  /** As 4 faixas, sempre na ORDEM_FAIXAS (mesmo zeradas). */
  faixas: FaixaResultado[];
  /** Total geral do lado (soma das 4 faixas), em R$. */
  total: number;
  /** Total de títulos do lado. */
  qtd: number;
  /**
   * Provisão de risco: soma das faixas vencidas (1-30, 31-60, 60+) — o que NÃO
   * está mais "a vencer". A leitura honesta de risco do lado.
   */
  vencido: number;
  /** Total vencido há mais de 60 dias (a faixa de perigo), em R$. */
  perigo: number;
};

/** O Aging inteiro: os dois lados + flag honesta de "aguardando dados". */
export type Aging = {
  /** Os dois lados (receber, pagar), sempre na ORDEM_LADOS. */
  lados: LadoResultado[];
  /**
   * `true` quando a fonte (`v_aging`) ainda não está disponível sem aplicar a
   * migration 0019 no TEST, OU quando não há NENHUM título em aberto. A tela
   * mostra "aguardando dados", não um erro. (Sem títulos = nada para envelhecer
   * ainda; o estado vazio honesto cobre os dois casos.)
   */
  aguardandoDados: boolean;
  /** Total de títulos em aberto lidos da view (transparência da medição). */
  qtdTitulos: number;
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

/**
 * Linha mínima da view `v_aging` (migration 0019). `lado` e `faixa` chegam já
 * classificados pelo banco; `valor` pode vir como string do PostgREST → sempre
 * `Number()`. Lemos só o necessário para agregar — não trazemos descrição/datas.
 */
type AgingLinha = {
  lado: LadoAging;
  faixa: FaixaAging;
  valor: number;
};

/** Lê a view de aging — fail-soft (retorna []). */
async function lerAging(): Promise<AgingLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_aging').select('lado, faixa, valor')
    )) as QueryResult<AgingLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/* ───────────────────────────── Montagem do Aging ─────────────────────────── */

/** Soma segura (PostgREST pode devolver número como string). */
function num(v: number): number {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/** Faixas vencidas (entram na provisão de risco) — tudo que não é "a vencer". */
const FAIXAS_VENCIDAS: ReadonlySet<FaixaAging> = new Set(['1-30', '31-60', '60+']);

/** Monta o agregado de um lado a partir das linhas já filtradas por lado. */
function montarLado(lado: LadoAging, linhas: AgingLinha[]): LadoResultado {
  // Acumula por faixa (R$ e contagem), aceitando só as faixas conhecidas.
  const acc = new Map<FaixaAging, { total: number; qtd: number }>();
  for (const f of ORDEM_FAIXAS) acc.set(f, { total: 0, qtd: 0 });

  for (const l of linhas) {
    const slot = acc.get(l.faixa);
    if (!slot) continue; // faixa desconhecida: ignora (fail-soft, não quebra)
    slot.total += num(l.valor);
    slot.qtd += 1;
  }

  const total = ORDEM_FAIXAS.reduce((a, f) => a + (acc.get(f)?.total ?? 0), 0);
  const qtd = ORDEM_FAIXAS.reduce((a, f) => a + (acc.get(f)?.qtd ?? 0), 0);

  const faixas: FaixaResultado[] = ORDEM_FAIXAS.map((faixa) => {
    const slot = acc.get(faixa) ?? { total: 0, qtd: 0 };
    return {
      faixa,
      total: slot.total,
      qtd: slot.qtd,
      pctDoLado: total > 0 ? (slot.total / total) * 100 : null,
    };
  });

  const vencido = ORDEM_FAIXAS.filter((f) => FAIXAS_VENCIDAS.has(f)).reduce(
    (a, f) => a + (acc.get(f)?.total ?? 0),
    0
  );
  const perigo = acc.get('60+')?.total ?? 0;

  return { lado, faixas, total, qtd, vencido, perigo };
}

/** Monta o Aging inteiro a partir das linhas cruas da view. */
function montarAging(linhas: AgingLinha[]): Aging {
  const lados: LadoResultado[] = ORDEM_LADOS.map((lado) =>
    montarLado(
      lado,
      linhas.filter((l) => l.lado === lado)
    )
  );

  const qtdTitulos = linhas.length;

  return {
    lados,
    // Sem nenhuma linha: ou a view não existe (0019 não aplicada) ou não há
    // título em aberto. Em ambos os casos não há aging para mostrar — estado
    // vazio honesto, nunca um erro.
    aguardandoDados: qtdTitulos === 0,
    qtdTitulos,
  };
}

/**
 * Carrega o Aging inteiro a partir da view `v_aging`. FAIL-SOFT TOTAL: jamais
 * lança; a leitura degrada para vazio. Quando a fonte ainda não existe (0019
 * sem aplicar no TEST) ou não há títulos em aberto, devolve a estrutura completa
 * com os dois lados zerados e `aguardandoDados: true`.
 *
 * Sempre devolve os dois lados com as 4 faixas, para a tela renderizar em
 * qualquer cenário (banco vazio, sem token, view ausente).
 */
export async function carregarAging(): Promise<Aging> {
  const linhas = await lerAging();
  return montarAging(linhas);
}
