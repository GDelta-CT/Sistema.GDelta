/**
 * Camada de dados dos KPIs estratégicos (aba 📈 KPIs da Planilha-Sistema v2.0).
 *
 * O QUE FAZ: deriva os 9 indicadores estratégicos — cada um com META + leitura
 * atual — a partir do que JÁ existe no app (clientes, OS, pátio, financeiro),
 * SEM migrations novas. Onde a fonte ainda não existe sem aplicar tabelas no
 * TEST (retrabalho, RH/folha, ocupação por boxes), o KPI volta com valor `null`
 * e `aguardandoDados: true` — um estado HONESTO, nunca um erro.
 *
 * FAIL-SOFT TOTAL (igual ./patio.ts e ./tinta.ts): este módulo NUNCA lança. Cada
 * fonte é lida dentro de try/catch e, em qualquer falha (view inexistente,
 * token ausente, RLS, timeout), degrada para vazio/zerado. A tela renderiza
 * mesmo com banco vazio ou sem sessão — só mostra "—" / "aguardando dados".
 *
 * Sem digitação dupla: tudo é derivado das views/tabelas existentes; nada é
 * recriado. O oficina_id NUNCA é enviado — a RLS isola por oficina via JWT.
 *
 * As METAS são os defaults da planilha (configuráveis depois): ficam num objeto
 * único `METAS`, e o sentido de cada uma (maior-é-melhor, menor-é-melhor ou
 * faixa) é declarado por KPI para o semáforo saber comparar.
 */

import { getSupabase } from './client';
import type { ChipTone } from '@/lib/status';

/* ─────────────────────────── Identidade dos KPIs ─────────────────────────── */

/** Chave estável de cada um dos 9 KPIs estratégicos. */
export type KpiChave =
  | 'permanencia'
  | 'os_no_prazo'
  | 'retrabalho'
  | 'faturamento_por_funcionario'
  | 'ocupacao_patio'
  | 'pct_particulares'
  | 'concentracao_maior_cliente'
  | 'margem'
  | 'custo_rh';

/**
 * Sentido da meta — diz ao semáforo como comparar valor × meta:
 *  - `maior` : melhor quando ACIMA da meta (ex.: % no prazo > 90%).
 *  - `menor` : melhor quando ABAIXO da meta (ex.: retrabalho < 5%).
 *  - `faixa` : melhor DENTRO de [min, max] (ex.: ocupação 70–85%).
 */
export type SentidoMeta = 'maior' | 'menor' | 'faixa';

/** Unidade de exibição do valor (formatação na tela). */
export type UnidadeKpi = 'pct' | 'dias' | 'moeda';

/**
 * Definição de meta de um KPI: o alvo + como interpretá-lo. União discriminada
 * por `sentido` com UM literal por variante (`maior`/`menor` separados), para o
 * TypeScript estreitar cada ramo com segurança.
 */
export type MetaKpi =
  | { sentido: 'maior'; alvo: number }
  | { sentido: 'menor'; alvo: number }
  | { sentido: 'faixa'; min: number; max: number };

/**
 * Metas padrão (defaults da planilha v2.0). São o "piso" canônico de paridade;
 * ficam centralizadas aqui para virarem configuráveis depois sem mexer na tela.
 */
export const METAS: Record<KpiChave, MetaKpi> = {
  permanencia: { sentido: 'menor', alvo: 25 }, // < 25 dias
  os_no_prazo: { sentido: 'maior', alvo: 90 }, // > 90%
  retrabalho: { sentido: 'menor', alvo: 5 }, // < 5%
  faturamento_por_funcionario: { sentido: 'maior', alvo: 8000 }, // > R$ 8.000/mês
  ocupacao_patio: { sentido: 'faixa', min: 70, max: 85 }, // 70–85%
  pct_particulares: { sentido: 'maior', alvo: 20 }, // > 20%
  concentracao_maior_cliente: { sentido: 'menor', alvo: 40 }, // < 40%
  margem: { sentido: 'maior', alvo: 20 }, // > 20%
  custo_rh: { sentido: 'menor', alvo: 40 }, // < 40%
};

/** Metadados de apresentação fixos por KPI (rótulo, unidade, ajuda curta). */
export const KPI_META: Record<
  KpiChave,
  { nome: string; unidade: UnidadeKpi; ajuda: string }
> = {
  permanencia: {
    nome: 'Tempo médio de permanência',
    unidade: 'dias',
    ajuda: 'Quanto cada carro fica na oficina, em média.',
  },
  os_no_prazo: {
    nome: '% de OS no prazo',
    unidade: 'pct',
    ajuda: 'OS entregues dentro do prazo combinado.',
  },
  retrabalho: {
    nome: 'Taxa de retrabalho',
    unidade: 'pct',
    ajuda: 'Carros que voltaram para refazer serviço.',
  },
  faturamento_por_funcionario: {
    nome: 'Faturamento por funcionário',
    unidade: 'moeda',
    ajuda: 'Receita do mês ÷ número de funcionários.',
  },
  ocupacao_patio: {
    nome: 'Ocupação do pátio',
    unidade: 'pct',
    ajuda: 'Boxes ocupados ÷ total de boxes.',
  },
  pct_particulares: {
    nome: '% de faturamento de particulares',
    unidade: 'pct',
    ajuda: 'Diversificação além das seguradoras.',
  },
  concentracao_maior_cliente: {
    nome: 'Concentração do maior cliente',
    unidade: 'pct',
    ajuda: 'Quanto do faturamento vem de um só cliente.',
  },
  margem: {
    nome: 'Margem',
    unidade: 'pct',
    ajuda: 'Resultado ÷ receita das OS (margem real).',
  },
  custo_rh: {
    nome: 'Custo RH / faturamento',
    unidade: 'pct',
    ajuda: 'Quanto da receita vai para a folha.',
  },
};

/* ─────────────────────────── Resultado de um KPI ─────────────────────────── */

/**
 * Status semáforo de um KPI, por % de atingimento vs. meta:
 *  - `atingida` (success) · `atencao` (warning) · `abaixo` (danger)
 *  - `aguardando` (neutral) quando a fonte ainda não existe.
 */
export type KpiStatus = 'atingida' | 'atencao' | 'abaixo' | 'aguardando';

/** Leitura completa de um KPI: valor (ou null), meta e o status já resolvido. */
export type KpiResultado = {
  chave: KpiChave;
  /** Valor atual já calculado; `null` quando a fonte ainda não existe. */
  valor: number | null;
  /** Meta declarada para este KPI (defaults da planilha). */
  meta: MetaKpi;
  /** Status semáforo derivado de valor × meta. */
  status: KpiStatus;
  /**
   * Razão de atingimento (1 = exatamente na meta) ou `null` quando aguardando.
   * Usada só para ordenar/contar; a tela mostra o valor bruto.
   */
  atingimento: number | null;
  /**
   * `true` quando a fonte da verdade ainda não está disponível sem aplicar
   * migrations no TEST — a tela mostra "aguardando dados", não um erro.
   */
  aguardandoDados: boolean;
  /** Nota curta de contexto/limitação da medição (apresentação honesta). */
  nota?: string;
};

/* ───────────────────────────── Semáforo (regras) ─────────────────────────── */

/**
 * Mapeia status do semáforo para o `ChipTone` do design system — fonte única de
 * aparência (mesmos tons de @/lib/status). Sem cor crua aqui.
 */
export const TOM_STATUS: Record<KpiStatus, ChipTone> = {
  atingida: 'success',
  atencao: 'warning',
  abaixo: 'danger',
  aguardando: 'neutral',
};

/** Rótulo PT-BR do status do semáforo. */
export const ROTULO_STATUS: Record<KpiStatus, string> = {
  atingida: 'Meta atingida',
  atencao: 'Atenção',
  abaixo: 'Abaixo da meta',
  aguardando: 'Aguardando dados',
};

/**
 * Avalia valor × meta e devolve { status, atingimento }.
 *
 * Faixa de tolerância "atenção" = 10% antes da linha de corte (heurística da
 * planilha: perto da meta acende amarelo, não vermelho).
 */
export function avaliarKpi(valor: number, meta: MetaKpi): { status: KpiStatus; atingimento: number } {
  if (meta.sentido === 'maior') {
    const atingimento = meta.alvo > 0 ? valor / meta.alvo : 1;
    if (valor >= meta.alvo) return { status: 'atingida', atingimento };
    if (valor >= meta.alvo * 0.9) return { status: 'atencao', atingimento };
    return { status: 'abaixo', atingimento };
  }
  if (meta.sentido === 'menor') {
    // Quanto menor, melhor: atingimento alto = bem abaixo do teto.
    const atingimento = valor > 0 ? meta.alvo / valor : 2;
    if (valor <= meta.alvo) return { status: 'atingida', atingimento };
    if (valor <= meta.alvo * 1.1) return { status: 'atencao', atingimento };
    return { status: 'abaixo', atingimento };
  }
  // Faixa [min, max]: dentro = atingida; perto das bordas = atenção; longe = abaixo.
  const { min, max } = meta;
  const centro = (min + max) / 2;
  const atingimento = centro > 0 ? 1 - Math.abs(valor - centro) / centro : 0;
  if (valor >= min && valor <= max) return { status: 'atingida', atingimento };
  const margem = (max - min) * 0.15; // tolerância de 15% da largura da faixa
  if (valor >= min - margem && valor <= max + margem) return { status: 'atencao', atingimento };
  return { status: 'abaixo', atingimento };
}

/** Monta um KpiResultado calculado (valor presente) avaliando contra a meta. */
function resultadoCalculado(chave: KpiChave, valor: number, nota?: string): KpiResultado {
  const meta = METAS[chave];
  const { status, atingimento } = avaliarKpi(valor, meta);
  return { chave, valor, meta, status, atingimento, aguardandoDados: false, nota };
}

/** Monta um KpiResultado "aguardando dados" (fonte ainda indisponível no TEST). */
function resultadoAguardando(chave: KpiChave, nota: string): KpiResultado {
  return {
    chave,
    valor: null,
    meta: METAS[chave],
    status: 'aguardando',
    atingimento: null,
    aguardandoDados: true,
    nota,
  };
}

/* ───────────────────────────── Acesso a dados ────────────────────────────── */

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

/** Linha mínima de OS para os KPIs de produção (datas + status). FAIL-SOFT. */
type OsKpiLinha = {
  id: string;
  status: string;
  data_aprovacao: string | null;
  prazo_entrega: string | null;
  data_entrega_real: string | null;
};

/** Linha mínima de cliente para os KPIs comerciais (tipo). FAIL-SOFT. */
type ClienteKpiLinha = { id: string; tipo: string };

/** Linha do ranking de clientes (faturamento por cliente). FAIL-SOFT. */
type RankingKpiLinha = { cliente_id: string | null; valor_total: number };

/** Linha de margem real por OS (receita + margem real). FAIL-SOFT. */
type MargemKpiLinha = { valor: number; margem_real: number };

/** Linha do pátio (dias na oficina por OS). FAIL-SOFT. */
type PatioKpiLinha = { dias: number; status: string };

/** Lê OS (datas/status) direto da tabela — fail-soft (retorna []). */
async function lerOs(): Promise<OsKpiLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('os_comercial')
        .select('id, status, data_aprovacao, prazo_entrega, data_entrega_real')
    )) as QueryResult<OsKpiLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/** Lê os clientes (id + tipo) — fail-soft (retorna []). */
async function lerClientes(): Promise<ClienteKpiLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('clientes').select('id, tipo')
    )) as QueryResult<ClienteKpiLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/** Lê o ranking de clientes (view financeira) — fail-soft (retorna []). */
async function lerRanking(): Promise<RankingKpiLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_ranking_clientes').select('cliente_id, valor_total')
    )) as QueryResult<RankingKpiLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/** Lê a margem real por OS (view financeira) — fail-soft (retorna []). */
async function lerMargem(): Promise<MargemKpiLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_os_margem_real').select('valor, margem_real')
    )) as QueryResult<MargemKpiLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/** Lê os dias na oficina por OS (view do pátio) — fail-soft (retorna []). */
async function lerPatio(): Promise<PatioKpiLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('v_os_dias_rs').select('dias, status')
    )) as QueryResult<PatioKpiLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/* ─────────────────────────── Cálculo dos 9 KPIs ──────────────────────────── */

/** Status de OS consideradas "no pátio" (ainda não saíram nem foram canceladas). */
const STATUS_ATIVAS = new Set(['aberta', 'em_producao', 'concluida']);
/** Status de OS já saídas/entregues. */
const STATUS_ENTREGUE = 'entregue';

/** Diferença em dias entre duas datas ISO (b − a), arredondada para baixo. */
function diasEntre(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86_400_000));
}

/**
 * Tempo médio de permanência (dias). Prioriza a view do pátio (v_os_dias_rs, que
 * o banco já calcula); se ela não existir, cai para as datas da OS (aprovação →
 * entrega/hoje). Aguardando só quando não há NENHUMA OS para medir.
 */
function calcularPermanencia(patio: PatioKpiLinha[], os: OsKpiLinha[]): KpiResultado {
  // Caminho preferido: a view já entrega `dias` por OS (inclui as ainda no pátio).
  const ativasView = patio.filter((p) => STATUS_ATIVAS.has(p.status) || p.status === STATUS_ENTREGUE);
  if (ativasView.length > 0) {
    const media = ativasView.reduce((a, p) => a + Number(p.dias), 0) / ativasView.length;
    return resultadoCalculado('permanencia', media);
  }
  // Fallback: calcula pelos timestamps da própria OS.
  const agora = new Date().toISOString();
  const medíveis = os.filter((o) => o.status !== 'cancelada' && o.data_aprovacao);
  if (medíveis.length === 0) {
    return resultadoAguardando(
      'permanencia',
      'Sem OS para medir ainda — ativa quando o pátio tiver carros.'
    );
  }
  const soma = medíveis.reduce(
    (a, o) => a + diasEntre(o.data_aprovacao as string, o.data_entrega_real ?? agora),
    0
  );
  return resultadoCalculado('permanencia', soma / medíveis.length);
}

/**
 * % de OS no prazo: das OS já entregues COM prazo definido, quantas saíram até
 * a data prometida. Aguardando quando nenhuma OS entregue tem prazo registrado.
 */
function calcularOsNoPrazo(os: OsKpiLinha[]): KpiResultado {
  const entregues = os.filter(
    (o) => o.status === STATUS_ENTREGUE && o.prazo_entrega && o.data_entrega_real
  );
  if (entregues.length === 0) {
    return resultadoAguardando(
      'os_no_prazo',
      'Sem OS entregues com prazo registrado ainda.'
    );
  }
  const noPrazo = entregues.filter(
    (o) => new Date(o.data_entrega_real as string).getTime() <= new Date(o.prazo_entrega as string).getTime()
  ).length;
  return resultadoCalculado('os_no_prazo', (noPrazo / entregues.length) * 100);
}

/**
 * % de faturamento de particulares: soma do faturamento dos clientes do tipo
 * `particular` ÷ faturamento total, cruzando o ranking (valor por cliente) com
 * o tipo de cada cliente. Aguardando quando ainda não há faturamento.
 */
function calcularPctParticulares(
  ranking: RankingKpiLinha[],
  clientes: ClienteKpiLinha[]
): KpiResultado {
  const tipoPorId = new Map(clientes.map((c) => [c.id, c.tipo]));
  const total = ranking.reduce((a, r) => a + Number(r.valor_total), 0);
  if (total <= 0) {
    return resultadoAguardando(
      'pct_particulares',
      'Sem faturamento por cliente ainda — aprove OS para medir.'
    );
  }
  const particulares = ranking.reduce((a, r) => {
    const tipo = r.cliente_id ? tipoPorId.get(r.cliente_id) : undefined;
    return tipo === 'particular' ? a + Number(r.valor_total) : a;
  }, 0);
  return resultadoCalculado('pct_particulares', (particulares / total) * 100);
}

/**
 * Concentração do maior cliente: faturamento do cliente nº 1 ÷ faturamento
 * total. Aguardando quando ainda não há faturamento.
 */
function calcularConcentracao(ranking: RankingKpiLinha[]): KpiResultado {
  const total = ranking.reduce((a, r) => a + Number(r.valor_total), 0);
  if (total <= 0) {
    return resultadoAguardando(
      'concentracao_maior_cliente',
      'Sem faturamento por cliente ainda — aprove OS para medir.'
    );
  }
  const maior = ranking.reduce((m, r) => Math.max(m, Number(r.valor_total)), 0);
  return resultadoCalculado('concentracao_maior_cliente', (maior / total) * 100);
}

/**
 * Margem (real): soma das margens reais ÷ soma da receita das mesmas OS — a
 * mesma agregação do medidor do Financeiro. É a margem REAL/operacional (não a
 * líquida do DRE, que exige despesas ainda sem tabela no TEST); a nota deixa
 * isso explícito. Aguardando quando ainda não há OS com margem calculada.
 */
function calcularMargem(margem: MargemKpiLinha[]): KpiResultado {
  const somaValor = margem.reduce((a, m) => a + Number(m.valor), 0);
  if (somaValor <= 0) {
    return resultadoAguardando(
      'margem',
      'Sem OS com margem calculada ainda — aprove e produza para medir.'
    );
  }
  const somaMargem = margem.reduce((a, m) => a + Number(m.margem_real), 0);
  return resultadoCalculado(
    'margem',
    (somaMargem / somaValor) * 100,
    'Margem real (receita − custos diretos). A líquida do DRE exige despesas — em construção.'
  );
}

/**
 * Carrega os 9 KPIs estratégicos, todos derivados das fontes JÁ existentes.
 * FAIL-SOFT TOTAL: jamais lança; cada fonte degrada para vazio. KPIs sem fonte
 * disponível sem migrations no TEST voltam com `aguardandoDados: true`.
 *
 * Sempre devolve os 9 na ordem da planilha (mapa por chave preserva a ordem de
 * `KpiChave`), para a tela renderizar o grid completo em qualquer cenário.
 */
export async function carregarKpis(): Promise<Record<KpiChave, KpiResultado>> {
  const [patio, os, clientes, ranking, margem] = await Promise.all([
    lerPatio(),
    lerOs(),
    lerClientes(),
    lerRanking(),
    lerMargem(),
  ]);

  return {
    // ── Ao vivo (derivados do que já existe) ──────────────────────────────
    permanencia: calcularPermanencia(patio, os),
    os_no_prazo: calcularOsNoPrazo(os),
    pct_particulares: calcularPctParticulares(ranking, clientes),
    concentracao_maior_cliente: calcularConcentracao(ranking),
    margem: calcularMargem(margem),

    // ── Aguardando dados (fonte exige tabelas ainda não aplicadas no TEST) ─
    retrabalho: resultadoAguardando(
      'retrabalho',
      'Precisa do registro de retornos/garantia — aplicar migrations no TEST.'
    ),
    faturamento_por_funcionario: resultadoAguardando(
      'faturamento_por_funcionario',
      'Precisa do módulo RH (nº de funcionários) — aplicar migrations no TEST.'
    ),
    ocupacao_patio: resultadoAguardando(
      'ocupacao_patio',
      'Precisa do total de boxes do pátio (config) — aplicar migrations no TEST.'
    ),
    custo_rh: resultadoAguardando(
      'custo_rh',
      'Precisa da folha (RH) e do faturamento do período — aplicar migrations no TEST.'
    ),
  };
}

/** Ordem canônica dos KPIs na tela (espelha a aba da planilha). */
export const ORDEM_KPIS: KpiChave[] = [
  'permanencia',
  'os_no_prazo',
  'retrabalho',
  'faturamento_por_funcionario',
  'ocupacao_patio',
  'pct_particulares',
  'concentracao_maior_cliente',
  'margem',
  'custo_rh',
];
