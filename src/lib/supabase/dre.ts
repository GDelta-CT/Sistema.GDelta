/**
 * Camada de dados da DRE — Demonstração de Resultado (aba 📑 DRE da
 * Planilha-Sistema GDelta v2.0).
 *
 * O QUE FAZ: monta a DRE em estrutura contábil-padrão (linguagem do contador)
 * a partir do que JÁ existe no app, SEM migrations novas. A fonte da verdade é
 * a view `v_os_margem_real` (migration 0016), que já entrega por OS: a RECEITA
 * (`valor`), o custo das PEÇAS/itens do orçamento (`custo_itens`), o custo de
 * TINTAS/insumos baixados do estoque (`custo_material`) e a MARGEM real
 * (`margem_real`). Disso derivamos, ao vivo:
 *   - Receita Operacional Bruta (serviços + peças aplicadas, agregado)
 *   - CSP (custo de peças aplicadas + tintas/insumos)
 *   - Lucro Bruto + Margem Bruta
 *
 * As linhas que dependem de tabelas AINDA NÃO aplicadas no TEST — Deduções
 * (ISS), Mão-de-obra direta (folha), Despesas Operacionais, IRPJ+CSLL — voltam
 * com `valor: null` e `aguardandoDados: true`: um estado HONESTO, nunca um erro.
 * Sem essas linhas, os subtotais a jusante (Receita Líquida, EBITDA, Resultado)
 * também ficam aguardando — não inventamos número.
 *
 * FAIL-SOFT TOTAL (igual ./kpis.ts, ./tinta.ts e ./patio.ts): este módulo NUNCA
 * lança. A leitura é feita dentro de try/catch e, em qualquer falha (view
 * inexistente, token ausente, RLS, timeout), degrada para vazio/zerado. A tela
 * renderiza mesmo com banco vazio ou sem sessão — só mostra "—".
 *
 * Sem digitação dupla: tudo é derivado da view existente; nada é recriado. O
 * oficina_id NUNCA é enviado — a RLS isola por oficina via JWT.
 *
 * PREMISSAS contábeis (defaults da planilha v2.0, viram config depois): ficam
 * centralizadas em `PREMISSAS_DRE`. Hoje só documentam a intenção — as linhas
 * que dependem delas seguem aguardando até a fonte real existir, para a DRE não
 * mostrar um imposto "chutado" como se fosse medido.
 */

import { getSupabase } from './client';

/* ─────────────────────────── Premissas (defaults) ────────────────────────── */

/**
 * Premissas contábeis padrão da planilha v2.0 (Simples Nacional / oficina). São
 * apenas referência documentada por enquanto: as linhas que as usariam (ISS,
 * IRPJ+CSLL) permanecem aguardando dado, pois o regime/alíquota efetivos vêm da
 * configuração fiscal e do faturamento acumulado — tabelas ainda sem aplicar no
 * TEST. Centralizadas aqui para virarem config sem mexer na tela.
 */
export const PREMISSAS_DRE = {
  /** ISS sobre serviços (~5%, varia por município). */
  issPct: 5,
  /** IRPJ + CSLL no Simples Nacional (faixa típica de oficina). */
  irpjCsllPct: 6,
} as const;

/* ─────────────────────────── Identidade das linhas ───────────────────────── */

/**
 * Chave estável de cada linha da DRE, na ordem contábil canônica (espelha a
 * aba 📑 DRE). Subtotais (=) e detalhes de cada bloco têm chaves próprias para
 * a tela montar a hierarquia.
 */
export type DreChave =
  // Receita Operacional Bruta
  | 'receita_bruta'
  | 'receita_servicos'
  | 'receita_pecas'
  // Deduções
  | 'deducoes'
  | 'deducoes_iss'
  // Receita Líquida
  | 'receita_liquida'
  // Custo dos Serviços Prestados (CSP)
  | 'csp'
  | 'csp_mao_de_obra'
  | 'csp_pecas'
  | 'csp_tintas'
  // Lucro Bruto
  | 'lucro_bruto'
  // Despesas Operacionais
  | 'despesas_operacionais'
  | 'despesas_admin_fixas'
  | 'despesas_variaveis'
  | 'despesas_comerciais'
  // EBITDA
  | 'ebitda'
  // Resultado antes dos impostos
  | 'resultado_antes_impostos'
  // Impostos sobre o lucro
  | 'impostos_lucro'
  // Resultado Líquido
  | 'resultado_liquido';

/**
 * Papel visual/contábil da linha — diz à tela como renderizar:
 *  - `grupo`    : cabeçalho de bloco com subtotal (ex.: RECEITA BRUTA).
 *  - `detalhe`  : item dentro de um grupo (recuado, menor).
 *  - `deducao`  : linha subtrativa (ex.: (-) Deduções) — sinal negativo.
 *  - `subtotal` : linha de resultado parcial (=) em destaque.
 *  - `resultado`: o resultado final (número-herói).
 */
export type DrePapel = 'grupo' | 'detalhe' | 'deducao' | 'subtotal' | 'resultado';

/** Sinal contábil da linha no encadeamento (sobe ou desce o resultado). */
export type DreSinal = 'soma' | 'subtrai' | 'neutro';

/** Metadados de apresentação fixos por linha (rótulo, papel, sinal). */
export const DRE_META: Record<DreChave, { nome: string; papel: DrePapel; sinal: DreSinal }> = {
  receita_bruta: { nome: 'Receita operacional bruta', papel: 'grupo', sinal: 'soma' },
  receita_servicos: { nome: 'Faturamento de serviços', papel: 'detalhe', sinal: 'soma' },
  receita_pecas: { nome: 'Receita de peças aplicadas', papel: 'detalhe', sinal: 'soma' },

  deducoes: { nome: '(−) Deduções', papel: 'deducao', sinal: 'subtrai' },
  deducoes_iss: { nome: 'ISS sobre serviços (~5%)', papel: 'detalhe', sinal: 'subtrai' },

  receita_liquida: { nome: 'Receita operacional líquida', papel: 'subtotal', sinal: 'neutro' },

  csp: { nome: '(−) Custo dos serviços prestados (CSP)', papel: 'grupo', sinal: 'subtrai' },
  csp_mao_de_obra: { nome: 'Mão-de-obra direta (folha)', papel: 'detalhe', sinal: 'subtrai' },
  csp_pecas: { nome: 'Custo de peças aplicadas', papel: 'detalhe', sinal: 'subtrai' },
  csp_tintas: { nome: 'Tintas e insumos', papel: 'detalhe', sinal: 'subtrai' },

  lucro_bruto: { nome: 'Lucro bruto', papel: 'subtotal', sinal: 'neutro' },

  despesas_operacionais: { nome: '(−) Despesas operacionais', papel: 'grupo', sinal: 'subtrai' },
  despesas_admin_fixas: { nome: 'Administrativas fixas', papel: 'detalhe', sinal: 'subtrai' },
  despesas_variaveis: { nome: 'Variáveis', papel: 'detalhe', sinal: 'subtrai' },
  despesas_comerciais: { nome: 'Comerciais', papel: 'detalhe', sinal: 'subtrai' },

  ebitda: { nome: 'EBITDA', papel: 'subtotal', sinal: 'neutro' },

  resultado_antes_impostos: {
    nome: 'Resultado antes dos impostos',
    papel: 'subtotal',
    sinal: 'neutro',
  },

  impostos_lucro: { nome: '(−) IRPJ + CSLL (Simples Nacional)', papel: 'deducao', sinal: 'subtrai' },

  resultado_liquido: { nome: 'Resultado líquido', papel: 'resultado', sinal: 'neutro' },
};

/* ─────────────────────────── Resultado de uma linha ──────────────────────── */

/** Leitura completa de uma linha da DRE: valor (ou null), % AV e estado. */
export type DreLinha = {
  chave: DreChave;
  /** Valor monetário da linha; `null` quando a fonte ainda não existe. */
  valor: number | null;
  /**
   * Análise vertical: o valor como % da Receita Operacional Líquida (base da AV
   * contábil). `null` quando o valor está ausente ou a base é zero/ausente.
   */
  avPct: number | null;
  /**
   * `true` quando a fonte da verdade ainda não está disponível sem aplicar
   * migrations no TEST — a tela mostra "aguardando dados", não um erro.
   */
  aguardandoDados: boolean;
  /** Nota curta de contexto/limitação da medição (apresentação honesta). */
  nota?: string;
};

/** Indicador derivado da DRE (Markup, Ponto de Equilíbrio). */
export type DreDerivado = {
  chave: 'markup' | 'ponto_equilibrio';
  nome: string;
  /** Valor já calculado; `null` quando depende de linha aguardando dado. */
  valor: number | null;
  /** Unidade de exibição (multiplicador "x" ou moeda). */
  unidade: 'multiplo' | 'moeda';
  aguardandoDados: boolean;
  nota: string;
};

/** A DRE inteira: linhas na ordem contábil + derivados + flag de receita real. */
export type Dre = {
  linhas: DreLinha[];
  derivados: DreDerivado[];
  /** Receita líquida usada como base da AV (null quando aguardando/zero). */
  baseAv: number | null;
  /** Quantas OS entraram no agregado (transparência da medição). */
  qtdOs: number;
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
 * Linha mínima da view de margem real (v_os_margem_real, migration 0016) para a
 * DRE. `valor` = receita da OS; `custo_itens` = peças/itens do orçamento;
 * `custo_material` = tintas/insumos baixados do estoque; `margem_real` = receita
 * − custo_total. Valores podem vir como string do PostgREST → sempre `Number()`.
 */
type MargemDreLinha = {
  status: string;
  valor: number;
  custo_itens: number;
  custo_material: number;
  margem_real: number;
};

/** Lê a margem real por OS (view financeira) — fail-soft (retorna []). */
async function lerMargem(): Promise<MargemDreLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('v_os_margem_real')
        .select('status, valor, custo_itens, custo_material, margem_real')
    )) as QueryResult<MargemDreLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/* ───────────────────────────── Montagem da DRE ───────────────────────────── */

/** Status de OS que NÃO contam na DRE (não há receita/custo realizável). */
const STATUS_FORA_DRE = new Set(['cancelada']);

/** Soma segura (PostgREST pode devolver número como string). */
function num(v: number): number {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/** % de `valor` sobre `base` (AV), ou `null` quando não há base. */
function avSobre(valor: number | null, base: number | null): number | null {
  if (valor === null || base === null || base === 0) return null;
  return (valor / base) * 100;
}

/** Linha ao vivo (valor calculado), com AV resolvida sobre a base. */
function linhaViva(chave: DreChave, valor: number, base: number | null, nota?: string): DreLinha {
  return { chave, valor, avPct: avSobre(valor, base), aguardandoDados: false, nota };
}

/** Linha "aguardando dados" (fonte ainda indisponível no TEST). */
function linhaAguardando(chave: DreChave, nota: string): DreLinha {
  return { chave, valor: null, avPct: null, aguardandoDados: true, nota };
}

/** Nota padrão para linhas que dependem de tabelas ainda sem aplicar no TEST. */
const NOTA_TABELA_FALTA = 'Aguardando a tabela correspondente no ambiente — preenche sozinho quando aplicada.';

/**
 * Monta a DRE inteira a partir do agregado de margem real por OS.
 *
 * Decisões de paridade contábil:
 *  - RECEITA BRUTA é a soma de `valor` (a view não separa serviços × peças no
 *    MVP); por isso "Faturamento de serviços" e "Receita de peças aplicadas"
 *    ficam aguardando o desmembramento, mas o TOTAL bruto é real.
 *  - CSP: peças = soma `custo_itens`; tintas/insumos = soma `custo_material`
 *    (ambos AO VIVO). Mão-de-obra direta (folha) aguarda RH.
 *  - Como Deduções (ISS) e Mão-de-obra ainda não existem, RECEITA LÍQUIDA, CSP
 *    total e tudo a jusante (Lucro Bruto líquido de folha, EBITDA, Resultado)
 *    seguem aguardando — não fabricamos subtotal sobre buraco. O LUCRO BRUTO
 *    PARCIAL (receita − peças − tintas) é exibido como medida ao vivo honesta.
 */
function montarDre(margem: MargemDreLinha[]): Dre {
  const validas = margem.filter((m) => !STATUS_FORA_DRE.has(m.status));
  const qtdOs = validas.length;

  const receitaBruta = validas.reduce((a, m) => a + num(m.valor), 0);
  const custoPecas = validas.reduce((a, m) => a + num(m.custo_itens), 0);
  const custoTintas = validas.reduce((a, m) => a + num(m.custo_material), 0);

  const temReceita = receitaBruta > 0;

  // Base da Análise Vertical = Receita Líquida. Como as Deduções (ISS) ainda
  // não existem, NÃO temos a líquida real; usamos a BRUTA como base honesta da
  // AV (a nota da tela explica), preservando a leitura de proporção sem mentir
  // um número de imposto. Quando o ISS existir, a base vira a líquida real.
  const baseAv = temReceita ? receitaBruta : null;

  // Lucro bruto PARCIAL ao vivo (receita − peças − tintas; sem folha/ISS ainda).
  const lucroBrutoParcial = temReceita ? receitaBruta - custoPecas - custoTintas : null;

  const linhas: DreLinha[] = [
    // ── Receita Operacional Bruta ─────────────────────────────────────────
    temReceita
      ? linhaViva('receita_bruta', receitaBruta, baseAv)
      : linhaAguardando('receita_bruta', 'Sem OS faturadas ainda — aprove e produza para medir.'),
    linhaAguardando(
      'receita_servicos',
      'O total bruto é real; o desmembramento serviços × peças aguarda o detalhe de receita por tipo.'
    ),
    linhaAguardando(
      'receita_pecas',
      'O total bruto é real; o desmembramento serviços × peças aguarda o detalhe de receita por tipo.'
    ),

    // ── Deduções (ISS) ────────────────────────────────────────────────────
    linhaAguardando(
      'deducoes',
      'ISS e cancelamentos dependem da configuração fiscal por município. ' + NOTA_TABELA_FALTA
    ),
    linhaAguardando('deducoes_iss', `Padrão da planilha: ~${PREMISSAS_DRE.issPct}% sobre serviços. ` + NOTA_TABELA_FALTA),

    // ── Receita Líquida ───────────────────────────────────────────────────
    linhaAguardando(
      'receita_liquida',
      'Depende das deduções (ISS). Até lá, a Análise Vertical usa a receita bruta como base.'
    ),

    // ── CSP ───────────────────────────────────────────────────────────────
    linhaAguardando(
      'csp',
      'Peças e tintas já são reais; o total do CSP fecha quando a mão-de-obra direta (folha) entrar.'
    ),
    linhaAguardando('csp_mao_de_obra', 'Mão-de-obra direta vem da folha (RH). ' + NOTA_TABELA_FALTA),
    temReceita
      ? linhaViva('csp_pecas', custoPecas, baseAv)
      : linhaAguardando('csp_pecas', 'Sem custo de peças ainda — registra com OS produzidas.'),
    temReceita
      ? linhaViva('csp_tintas', custoTintas, baseAv)
      : linhaAguardando('csp_tintas', 'Sem custo de tintas/insumos ainda — baixa do estoque alimenta esta linha.'),

    // ── Lucro Bruto ───────────────────────────────────────────────────────
    lucroBrutoParcial !== null
      ? linhaViva(
          'lucro_bruto',
          lucroBrutoParcial,
          baseAv,
          'Lucro bruto PARCIAL (receita − peças − tintas). Fecha quando a mão-de-obra direta (folha) entrar.'
        )
      : linhaAguardando('lucro_bruto', 'Depende de receita e custos diretos — aprove e produza para medir.'),

    // ── Despesas Operacionais ─────────────────────────────────────────────
    linhaAguardando(
      'despesas_operacionais',
      'Admin fixas, variáveis e comerciais vêm do módulo Despesas. ' + NOTA_TABELA_FALTA
    ),
    linhaAguardando('despesas_admin_fixas', 'Despesas fixas mensais. ' + NOTA_TABELA_FALTA),
    linhaAguardando('despesas_variaveis', 'Despesas variáveis (caixa). ' + NOTA_TABELA_FALTA),
    linhaAguardando('despesas_comerciais', 'Despesas comerciais. ' + NOTA_TABELA_FALTA),

    // ── EBITDA ────────────────────────────────────────────────────────────
    linhaAguardando('ebitda', 'Depende das despesas operacionais e do lucro bruto fechado.'),

    // ── Resultado antes dos impostos ──────────────────────────────────────
    linhaAguardando(
      'resultado_antes_impostos',
      'Depende do EBITDA, depreciação e resultado financeiro.'
    ),

    // ── IRPJ + CSLL ───────────────────────────────────────────────────────
    linhaAguardando(
      'impostos_lucro',
      `Padrão da planilha: ~${PREMISSAS_DRE.irpjCsllPct}% (Simples Nacional). ` + NOTA_TABELA_FALTA
    ),

    // ── Resultado Líquido (herói) ─────────────────────────────────────────
    linhaAguardando(
      'resultado_liquido',
      'O resultado líquido fecha quando deduções, folha, despesas e impostos entrarem.'
    ),
  ];

  // ── Derivados ────────────────────────────────────────────────────────────
  // Markup geral (ao vivo, aproximado): receita ÷ custos diretos conhecidos
  // (peças + tintas). Honesto enquanto a folha não entra — a nota diz "parcial".
  const custosDiretos = custoPecas + custoTintas;
  const markup = temReceita && custosDiretos > 0 ? receitaBruta / custosDiretos : null;

  const derivados: DreDerivado[] = [
    {
      chave: 'markup',
      nome: 'Markup geral',
      valor: markup,
      unidade: 'multiplo',
      aguardandoDados: markup === null,
      nota:
        markup === null
          ? 'Sem custos diretos registrados ainda.'
          : 'Parcial: receita ÷ (peças + tintas). Inclui a folha quando o CSP fechar.',
    },
    {
      chave: 'ponto_equilibrio',
      nome: 'Ponto de equilíbrio',
      valor: null,
      unidade: 'moeda',
      aguardandoDados: true,
      nota: 'Exige despesas fixas e margem de contribuição (Despesas + folha). ' + NOTA_TABELA_FALTA,
    },
  ];

  return { linhas, derivados, baseAv, qtdOs };
}

/**
 * Carrega a DRE inteira, derivada da fonte JÁ existente (v_os_margem_real).
 * FAIL-SOFT TOTAL: jamais lança; a leitura degrada para vazio. As linhas sem
 * fonte disponível sem migrations no TEST voltam com `aguardandoDados: true`.
 *
 * Sempre devolve a estrutura contábil completa, na ordem da planilha, para a
 * tela renderizar em qualquer cenário (banco vazio, sem token, view ausente).
 */
export async function carregarDre(): Promise<Dre> {
  const margem = await lerMargem();
  return montarDre(margem);
}

/** Ordem canônica das linhas na tela (espelha a aba 📑 DRE da planilha). */
export const ORDEM_DRE: DreChave[] = [
  'receita_bruta',
  'receita_servicos',
  'receita_pecas',
  'deducoes',
  'deducoes_iss',
  'receita_liquida',
  'csp',
  'csp_mao_de_obra',
  'csp_pecas',
  'csp_tintas',
  'lucro_bruto',
  'despesas_operacionais',
  'despesas_admin_fixas',
  'despesas_variaveis',
  'despesas_comerciais',
  'ebitda',
  'resultado_antes_impostos',
  'impostos_lucro',
  'resultado_liquido',
];
