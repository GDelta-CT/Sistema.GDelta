/**
 * Camada de dados do Pipeline Comercial (aba 🎯 Orçamentos da Planilha-Sistema
 * GDelta v2.0): "pipeline comercial — conversão e ticket médio por canal".
 *
 * O QUE FAZ: deriva o funil de orçamentos a partir do que JÁ existe no app
 * (tabela `orcamentos` + seus `orcamento_itens` + o `tipo` do cliente), SEM
 * migrations novas. Calcula:
 *  - TAXA DE CONVERSÃO  = orçamentos aprovados ÷ total decidido (aprovado +
 *    recusado). Rascunho/enviado ainda não viraram decisão, então não entram no
 *    denominador da conversão (medida honesta: "do que foi decidido, quanto
 *    fechou"). O total geral fica disponível à parte para contexto.
 *  - TICKET MÉDIO       = valor total dos orçamentos APROVADOS ÷ nº de aprovados
 *    (o ticket é do que de fato fechou — espelha a receita contratada).
 *  - CANAL (Seguradora × Particular × Cooperativa) = mesmos números recortados
 *    pelo `tipo` do cliente do orçamento.
 *  - FUNIL POR STATUS   = contagem + valor por status (rascunho/enviado/aprovado
 *    /recusado), na ordem do ciclo de vida.
 *
 * FAIL-SOFT TOTAL (igual ./kpis.ts e ./tinta.ts): este módulo NUNCA lança. As
 * fontes são lidas dentro de try/catch e, em qualquer falha (tabela inexistente,
 * token ausente, RLS, timeout), degradam para vazio. A tela renderiza mesmo com
 * banco vazio ou sem sessão — só mostra zeros e o estado "sem orçamentos ainda".
 *
 * Sem digitação dupla: tudo é derivado dos orçamentos que já existem; nada é
 * recriado. O oficina_id NUNCA é enviado — a RLS isola por oficina via JWT.
 *
 * Os VALORES por orçamento vêm da soma de `total_venda` dos itens menos o
 * `desconto` do cabeçalho — exatamente o `totalVenda` que o módulo Orçamento
 * calcula AO VIVO (ver calcularTotais em ./orcamentos.ts). Mantemos a mesma
 * regra aqui para não divergir do número que o usuário vê ao montar.
 */

import { getSupabase } from './client';
import type { StatusOrcamento } from './orcamentos';
import type { TipoCliente } from './clientes';

/* ─────────────────────────── Tipos do canal/funil ─────────────────────────── */

/**
 * Canal comercial do orçamento — derivado do `tipo` do cliente. Quando o
 * orçamento não tem cliente vinculado (rascunho solto), cai em `sem_cliente`,
 * para nunca somar errado num canal real.
 */
export type CanalComercial = TipoCliente | 'sem_cliente';

/** Ordem canônica do funil (ciclo de vida do orçamento). */
export const ORDEM_STATUS: StatusOrcamento[] = ['rascunho', 'enviado', 'aprovado', 'recusado'];

/** Ordem de exibição dos canais (os tipos reais primeiro, "sem cliente" por último). */
export const ORDEM_CANAIS: CanalComercial[] = ['seguradora', 'particular', 'cooperativa', 'sem_cliente'];

/** Rótulo PT-BR de cada canal (apresentação; tom fica em @/lib/status). */
export const ROTULO_CANAL: Record<CanalComercial, string> = {
  seguradora: 'Seguradora',
  particular: 'Particular',
  cooperativa: 'Cooperativa',
  sem_cliente: 'Sem cliente',
};

/** Rótulo PT-BR de cada status do funil. */
export const ROTULO_STATUS_FUNIL: Record<StatusOrcamento, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

/** Uma etapa do funil: contagem e valor somado dos orçamentos naquele status. */
export type EtapaFunil = {
  status: StatusOrcamento;
  quantidade: number;
  /** Soma do valor (total_venda − desconto) dos orçamentos deste status. */
  valor: number;
};

/**
 * Recorte de um canal: conversão e ticket médio só daquele canal. Mesmos
 * conceitos do total geral, calculados sobre o subconjunto do canal.
 */
export type RecorteCanal = {
  canal: CanalComercial;
  /** Total de orçamentos do canal (qualquer status). */
  total: number;
  /** Decididos no canal (aprovado + recusado) — denominador da conversão. */
  decididos: number;
  /** Aprovados no canal. */
  aprovados: number;
  /** Conversão do canal (aprovados ÷ decididos × 100); 0 quando sem decididos. */
  conversaoPct: number;
  /** Valor somado dos aprovados do canal (receita contratada). */
  valorAprovado: number;
  /** Ticket médio do canal (valorAprovado ÷ aprovados); 0 quando sem aprovados. */
  ticketMedio: number;
};

/**
 * Resultado completo do pipeline comercial — tudo já calculado, pronto para a
 * tela apenas formatar. Quando não há orçamento algum, `temDados` é false e os
 * números ficam zerados (estado vazio honesto, nunca erro).
 */
export type PipelineComercial = {
  /** false quando não há NENHUM orçamento (banco vazio / sem sessão / erro). */
  temDados: boolean;
  /** Total de orçamentos (todos os status). */
  total: number;
  /** Decididos (aprovado + recusado) — denominador da conversão. */
  decididos: number;
  /** Aprovados (numerador da conversão e base do ticket). */
  aprovados: number;
  /** Recusados (contexto do funil). */
  recusados: number;
  /** Em aberto (rascunho + enviado) — ainda sem decisão. */
  emAberto: number;
  /** Taxa de conversão geral (aprovados ÷ decididos × 100); 0 sem decididos. */
  conversaoPct: number;
  /** Valor somado dos aprovados (receita contratada). */
  valorAprovado: number;
  /** Ticket médio geral (valorAprovado ÷ aprovados); 0 sem aprovados. */
  ticketMedio: number;
  /** Funil por status, na ordem do ciclo de vida (sempre os 4, com 0 quando vazio). */
  funil: EtapaFunil[];
  /** Recorte por canal, na ordem canônica (só os canais COM ao menos 1 orçamento). */
  canais: RecorteCanal[];
};

/* ─────────────────────────── Acesso a dados ──────────────────────────── */

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

/**
 * Linha mínima de orçamento para o pipeline: status, desconto e o canal (via o
 * `tipo` do cliente) + os `total_venda` dos itens para somar o valor. FAIL-SOFT.
 * O `cliente` pode vir null (orçamento sem cliente) — tratado como `sem_cliente`.
 */
type OrcamentoPipelineLinha = {
  status: StatusOrcamento;
  desconto: number;
  cliente: { tipo: TipoCliente } | null;
  itens: { total_venda: number }[];
};

/**
 * Lê os orçamentos com o `tipo` do cliente e os `total_venda` dos itens — em uma
 * única consulta com joins (sem digitação dupla). FAIL-SOFT: qualquer erro
 * (relação inexistente, RLS, sem sessão, timeout) degrada para `[]`, então a
 * tela mostra o estado vazio honesto em vez de quebrar.
 */
async function lerOrcamentos(): Promise<OrcamentoPipelineLinha[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('orcamentos')
        .select('status, desconto, cliente:clientes(tipo), itens:orcamento_itens(total_venda)')
    )) as QueryResult<OrcamentoPipelineLinha[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/* ─────────────────────────── Cálculo do pipeline ──────────────────────────── */

/** Valor de UM orçamento: soma dos total_venda dos itens menos o desconto (>= 0). */
function valorDoOrcamento(linha: OrcamentoPipelineLinha): number {
  const bruto = linha.itens.reduce((a, i) => a + Number(i.total_venda), 0);
  const liquido = bruto - Number(linha.desconto);
  return liquido > 0 ? liquido : 0;
}

/** Canal de UM orçamento: o tipo do cliente, ou `sem_cliente` quando não há. */
function canalDoOrcamento(linha: OrcamentoPipelineLinha): CanalComercial {
  return linha.cliente?.tipo ?? 'sem_cliente';
}

/** Acumulador interno por subconjunto (geral ou um canal). */
type Acc = { total: number; aprovados: number; recusados: number; valorAprovado: number };

function novoAcc(): Acc {
  return { total: 0, aprovados: 0, recusados: 0, valorAprovado: 0 };
}

/** Conta UM orçamento dentro de um acumulador (status + valor se aprovado). */
function acumular(acc: Acc, linha: OrcamentoPipelineLinha): void {
  acc.total += 1;
  if (linha.status === 'aprovado') {
    acc.aprovados += 1;
    acc.valorAprovado += valorDoOrcamento(linha);
  } else if (linha.status === 'recusado') {
    acc.recusados += 1;
  }
}

/** Conversão segura (aprovados ÷ decididos × 100); 0 quando não há decididos. */
function conversao(aprovados: number, decididos: number): number {
  return decididos > 0 ? (aprovados / decididos) * 100 : 0;
}

/** Ticket médio seguro (valor ÷ aprovados); 0 quando não há aprovados. */
function ticket(valorAprovado: number, aprovados: number): number {
  return aprovados > 0 ? valorAprovado / aprovados : 0;
}

/**
 * Pipeline vazio (sem nenhum orçamento ou após qualquer falha): números zerados
 * e funil completo com os 4 status em zero. Estado HONESTO, nunca um erro.
 */
function pipelineVazio(): PipelineComercial {
  return {
    temDados: false,
    total: 0,
    decididos: 0,
    aprovados: 0,
    recusados: 0,
    emAberto: 0,
    conversaoPct: 0,
    valorAprovado: 0,
    ticketMedio: 0,
    funil: ORDEM_STATUS.map((status) => ({ status, quantidade: 0, valor: 0 })),
    canais: [],
  };
}

/**
 * Carrega o Pipeline Comercial completo, derivado só dos orçamentos existentes.
 * FAIL-SOFT TOTAL: jamais lança; sem dados volta o pipeline vazio (temDados:
 * false). Sempre devolve o funil com os 4 status (zerados quando vazio) para a
 * tela renderizar a estrutura completa em qualquer cenário.
 */
export async function carregarPipeline(): Promise<PipelineComercial> {
  const linhas = await lerOrcamentos();
  if (linhas.length === 0) return pipelineVazio();

  // ── Agregação geral + por canal num único passo ──────────────────────────
  const geral = novoAcc();
  const porCanal = new Map<CanalComercial, Acc>();
  // Funil por status: contagem + valor somado de cada status.
  const funilMap = new Map<StatusOrcamento, EtapaFunil>(
    ORDEM_STATUS.map((status) => [status, { status, quantidade: 0, valor: 0 }])
  );

  for (const linha of linhas) {
    acumular(geral, linha);

    const canal = canalDoOrcamento(linha);
    let accCanal = porCanal.get(canal);
    if (!accCanal) {
      accCanal = novoAcc();
      porCanal.set(canal, accCanal);
    }
    acumular(accCanal, linha);

    const etapa = funilMap.get(linha.status);
    if (etapa) {
      etapa.quantidade += 1;
      etapa.valor += valorDoOrcamento(linha);
    }
  }

  const decididos = geral.aprovados + geral.recusados;
  const emAberto = geral.total - decididos;

  // Canais na ordem canônica, só os que têm ao menos 1 orçamento.
  const canais: RecorteCanal[] = ORDEM_CANAIS.flatMap((canal) => {
    const acc = porCanal.get(canal);
    if (!acc || acc.total === 0) return [];
    const dec = acc.aprovados + acc.recusados;
    return [{
      canal,
      total: acc.total,
      decididos: dec,
      aprovados: acc.aprovados,
      conversaoPct: conversao(acc.aprovados, dec),
      valorAprovado: acc.valorAprovado,
      ticketMedio: ticket(acc.valorAprovado, acc.aprovados),
    }];
  });

  return {
    temDados: true,
    total: geral.total,
    decididos,
    aprovados: geral.aprovados,
    recusados: geral.recusados,
    emAberto,
    conversaoPct: conversao(geral.aprovados, decididos),
    valorAprovado: geral.valorAprovado,
    ticketMedio: ticket(geral.valorAprovado, geral.aprovados),
    funil: ORDEM_STATUS.map((status) => funilMap.get(status) as EtapaFunil),
    canais,
  };
}
