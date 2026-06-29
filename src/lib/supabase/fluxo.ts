/**
 * Camada de dados do Fluxo de Caixa — projeção SEMANAL (aba 💵 Fluxo de Caixa da
 * Planilha-Sistema GDelta v2.0).
 *
 * O QUE FAZ: monta a projeção de caixa das próximas ~8 semanas (≈60 dias) a
 * partir da view `v_fluxo_caixa` (migration 0019), que já entrega POR SEMANA do
 * vencimento: entradas (a receber em aberto), saídas (a pagar em aberto) e o
 * líquido da semana. Aqui aplicamos a JANELA (semana atual + próximas 7),
 * casamos cada semana com seu bucket da view e ACUMULAMOS o saldo projetado —
 * sinalizando a PRIMEIRA semana em que o acumulado vira negativo. É o objetivo
 * da planilha: "prevê o saldo negativo ANTES de acontecer".
 *
 * FAIL-SOFT TOTAL (igual ./dre.ts, ./kpis.ts, ./patio.ts e ./tinta.ts): este
 * módulo NUNCA lança. A leitura é feita dentro de try/catch e, em qualquer falha
 * (view inexistente — 0019 ainda não aplicada no TEST —, token ausente, RLS,
 * timeout), degrada para vazio/zerado. A tela renderiza mesmo com banco vazio ou
 * sem sessão — só mostra "aguardando dados".
 *
 * Sem digitação dupla: tudo é derivado da view existente; nada é recriado. O
 * oficina_id NUNCA é enviado — a RLS isola por oficina via JWT.
 *
 * Premissa do saldo: a view NÃO conhece o saldo de caixa ATUAL (caixa/banco),
 * que ainda não tem fonte no TEST. Por isso o acumulado parte de ZERO e mede o
 * EFEITO LÍQUIDO dos vencimentos sobre o caixa — honesto e suficiente para
 * antecipar o ponto de virada. Quando houver saldo inicial, basta somá-lo aqui.
 */

import { getSupabase } from './client';
import { DEMO } from '@/lib/demo/mode';

/* ─────────────────────────── Parâmetros da janela ────────────────────────── */

/** Quantas semanas a projeção cobre por padrão (8 semanas ≈ 60 dias, planilha). */
export const SEMANAS_JANELA = 8;

/**
 * Janelas que o usuário pode escolher na tela (4 / 8 / 12 semanas). A view
 * `v_fluxo_caixa` já entrega POR SEMANA — só variamos quantas semanas montamos.
 */
export const JANELAS_SEMANAS = [4, 8, 12] as const;

/** Uma das janelas válidas (largura da projeção em semanas). */
export type JanelaSemanas = (typeof JANELAS_SEMANAS)[number];

/** Dias em uma semana — usado para avançar a janela e rotular o período. */
const DIAS_SEMANA = 7;

/* ─────────────────────────── Resultado da projeção ───────────────────────── */

/** Uma semana da projeção: período, entradas, saídas, líquido e acumulado. */
export type SemanaFluxo = {
  /** Início da semana (segunda-feira, ISO `YYYY-MM-DD`) — bucket da view. */
  semana: string;
  /** Fim da semana (domingo, ISO `YYYY-MM-DD`) — só para rótulo do período. */
  fimSemana: string;
  /** Total a receber com vencimento nesta semana (entradas projetadas). */
  entradas: number;
  /** Total a pagar com vencimento nesta semana (saídas projetadas). */
  saidas: number;
  /** Efeito líquido da semana (entradas − saídas). */
  liquido: number;
  /** Saldo acumulado projetado ATÉ o fim desta semana (parte de zero). */
  acumulado: number;
  /** `true` quando o acumulado projetado fica NEGATIVO ao fim desta semana. */
  negativa: boolean;
  /** `true` só na PRIMEIRA semana em que o acumulado vira negativo (o alerta). */
  primeiraNegativa: boolean;
};

/** A projeção inteira: as semanas + os totais e o ponto de virada do caixa. */
export type FluxoCaixa = {
  /** As semanas da janela, em ordem cronológica (tamanho = `semanasJanela`). */
  semanas: SemanaFluxo[];
  /** Quantas semanas esta projeção cobre (a janela escolhida na tela). */
  semanasJanela: number;
  /** Soma das entradas projetadas na janela. */
  totalEntradas: number;
  /** Soma das saídas projetadas na janela. */
  totalSaidas: number;
  /**
   * Líquido projetado da janela inteira — o número-herói. Igual ao acumulado da
   * última semana (parte de zero).
   */
  liquidoProjetado: number;
  /**
   * Índice (0-based) da primeira semana com acumulado negativo, ou `null` quando
   * o caixa nunca fica negativo na janela. É o "alerta antes de acontecer".
   */
  indicePrimeiraNegativa: number | null;
  /**
   * `true` quando a fonte (view `v_fluxo_caixa`) ainda não está disponível sem
   * aplicar a migration 0019 no TEST — a tela mostra "aguardando dados", não erro.
   * Distingue "banco vazio" (há fonte, sem títulos) de "fonte ausente".
   */
  aguardandoDados: boolean;
  /**
   * `true` quando a leitura falhou por motivo TRANSITÓRIO (timeout/rede/token):
   * a janela volta zerada mas NÃO é caixa real — a tela deve dizer "não foi
   * possível atualizar agora", jamais "caixa positivo / sem títulos". Distingue
   * falha transitória de "vazio real" (sem títulos) e de "fonte ausente".
   */
  erroTransitorio: boolean;
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
 * Linha da view `v_fluxo_caixa` (migration 0019): semana do vencimento +
 * entradas/saídas/líquido já somados pelo banco. Os numéricos podem vir como
 * string do PostgREST → sempre `Number()` ao consumir.
 */
type FluxoViewLinha = {
  semana: string;
  total_entrada: number;
  total_saida: number;
  liquido_semana: number;
};

/**
 * Resultado da leitura — três cenários distintos de janela zerada:
 *  - `fonteAusente`: a view não existe (0019 não aplicada) → "aguardando dados".
 *  - `erroTransitorio`: timeout/rede/token/erro inesperado → "tente de novo"
 *    (NUNCA "caixa positivo": a janela zerada não é caixa real).
 *  - ambos `false` com linhas vazias: vazio REAL (a view existe, sem títulos).
 */
type LeituraFluxo = {
  linhas: FluxoViewLinha[];
  fonteAusente: boolean;
  erroTransitorio: boolean;
};

/** Código PostgREST de relação/coluna inexistente (objeto ainda não criado). */
function ehFonteAusente(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('could not find') ||
    m.includes('not exist') ||
    m.includes('schema cache') ||
    m.includes('relation') ||
    m.includes('42p01') // undefined_table
  );
}

/**
 * Lê a view `v_fluxo_caixa` — fail-soft. Se a view não existir (0019 ainda não
 * aplicada no TEST), marca `fonteAusente: true` para a tela exibir "aguardando
 * dados". Qualquer outra falha degrada para vazio sem alarde.
 */
async function lerFluxoView(): Promise<LeituraFluxo> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('v_fluxo_caixa')
        .select('semana, total_entrada, total_saida, liquido_semana')
    )) as QueryResult<FluxoViewLinha[]>;
    if (error) {
      // Distinguir "fonte ausente" (0019 não aplicada) de erro de fato. Apenas a
      // classificação de fonte ausente usa o texto do PostgREST — o CAMINHO FELIZ
      // (sucesso) não depende de parse algum. Qualquer outro erro é tratado como
      // transitório: a janela zerada NÃO é caixa real, então sinalizamos para a
      // tela não exibir "caixa positivo / sem títulos".
      if (ehFonteAusente(error.message)) {
        return { linhas: [], fonteAusente: true, erroTransitorio: false };
      }
      return { linhas: [], fonteAusente: false, erroTransitorio: true };
    }
    // Sucesso: caminho feliz sem parse de texto. `data` vazio = vazio REAL.
    if (!data) return { linhas: [], fonteAusente: false, erroTransitorio: false };
    return { linhas: data, fonteAusente: false, erroTransitorio: false };
  } catch {
    // Timeout / rede / token: falha TRANSITÓRIA. NÃO é "fonte ausente" nem vazio
    // real — a tela deve pedir nova tentativa, jamais afirmar "caixa positivo".
    return { linhas: [], fonteAusente: false, erroTransitorio: true };
  }
}

/* ───────────────────────────── Datas (semana) ────────────────────────────── */

/** Soma segura: PostgREST pode devolver numérico como string. */
function num(v: number): number {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/** Formata uma Date como ISO local `YYYY-MM-DD` (sem fuso, casa com o bucket). */
function isoData(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Início da semana (segunda-feira) que contém `d` — espelha o
 * `date_trunc('week', ...)` do Postgres, que usa segunda como primeiro dia.
 */
function inicioSemana(d: Date): Date {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diaSemana = base.getDay(); // 0=domingo … 6=sábado
  // Quantos dias recuar até a segunda (domingo recua 6, os demais recuam dia−1).
  const recuo = diaSemana === 0 ? 6 : diaSemana - 1;
  base.setDate(base.getDate() - recuo);
  return base;
}

/** Avança `semanas` semanas a partir de uma data (cópia imutável). */
function somarSemanas(d: Date, semanas: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + semanas * DIAS_SEMANA);
  return r;
}

/* ───────────────────────────── Montagem da projeção ──────────────────────── */

/**
 * Monta a projeção: gera a janela de `semanasJanela` semanas a partir da semana
 * atual, casa cada semana com seu bucket da view (semanas sem vencimento ficam
 * zeradas, mas APARECEM — a planilha mostra a semana mesmo vazia) e acumula o
 * saldo, marcando a primeira virada negativa.
 *
 * `semanasJanela` é a largura escolhida na tela (4 / 8 / 12). A view já entrega
 * por semana — só variamos quantas montamos; nada muda na fonte.
 *
 * Acumulado parte de ZERO (sem saldo inicial de caixa ainda no TEST): mede o
 * efeito líquido dos vencimentos sobre o caixa — suficiente para antecipar a
 * virada. Vencimentos VENCIDOS (semanas passadas) ficam fora da janela futura
 * por decisão de produto (a projeção olha para frente; o atraso é tarefa do
 * Aging) — mas a view os mantém disponíveis caso a janela precise recuar depois.
 */
function montarFluxo(leitura: LeituraFluxo, semanasJanela: number): FluxoCaixa {
  // Mapa semana(ISO segunda) → totais, para casar com a janela em O(1).
  const porSemana = new Map<string, FluxoViewLinha>();
  for (const l of leitura.linhas) {
    porSemana.set(l.semana, l);
  }

  const segundaAtual = inicioSemana(new Date());
  const semanas: SemanaFluxo[] = [];

  let acumulado = 0;
  let indicePrimeiraNegativa: number | null = null;
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (let i = 0; i < semanasJanela; i++) {
    const inicio = somarSemanas(segundaAtual, i);
    const inicioIso = isoData(inicio);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + (DIAS_SEMANA - 1)); // domingo = segunda + 6 dias

    const bucket = porSemana.get(inicioIso);
    const entradas = bucket ? num(bucket.total_entrada) : 0;
    const saidas = bucket ? num(bucket.total_saida) : 0;
    const liquido = entradas - saidas;

    acumulado += liquido;
    totalEntradas += entradas;
    totalSaidas += saidas;

    const negativa = acumulado < 0;
    const primeiraNegativa = negativa && indicePrimeiraNegativa === null;
    if (primeiraNegativa) indicePrimeiraNegativa = i;

    semanas.push({
      semana: inicioIso,
      fimSemana: isoData(fim),
      entradas,
      saidas,
      liquido,
      acumulado,
      negativa,
      primeiraNegativa,
    });
  }

  return {
    semanas,
    semanasJanela,
    totalEntradas,
    totalSaidas,
    liquidoProjetado: acumulado,
    indicePrimeiraNegativa,
    aguardandoDados: leitura.fonteAusente,
    erroTransitorio: leitura.erroTransitorio,
  };
}

/** Garante uma janela válida (4/8/12), caindo no default em qualquer outro valor. */
function normalizarJanela(semanas: number): number {
  return (JANELAS_SEMANAS as readonly number[]).includes(semanas)
    ? semanas
    : SEMANAS_JANELA;
}

/**
 * Carrega a projeção de fluxo de caixa das próximas `semanas` semanas (4/8/12;
 * default 8 ≈ 60 dias), derivada da view `v_fluxo_caixa`. FAIL-SOFT TOTAL: jamais
 * lança; a leitura degrada para vazio. Quando a view ainda não existe (0019 não
 * aplicada no TEST), devolve a janela zerada com `aguardandoDados: true`; quando
 * a leitura falha por timeout/rede, devolve `erroTransitorio: true` (não é caixa).
 *
 * Sempre devolve a janela completa (todas as semanas), para a tela renderizar em
 * qualquer cenário (banco vazio, sem token, view ausente, erro transitório).
 */
export async function carregarFluxo(semanas: number = SEMANAS_JANELA): Promise<FluxoCaixa> {
  // MODO DEMO: projeção fictícia (com 1 virada negativa) para a janela pedida.
  if (DEMO) {
    const { fluxoDemo } = await import('@/lib/demo/dataset');
    return fluxoDemo(normalizarJanela(semanas));
  }
  const leitura = await lerFluxoView();
  return montarFluxo(leitura, normalizarJanela(semanas));
}
