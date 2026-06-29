/**
 * DATASET DA DEMONSTRAÇÃO — a "oficina de mentira" Auto Premium Demo.
 *
 * Dados fictícios RICOS e realistas (funilaria/pintura BR), tipados batendo com
 * o RETORNO de cada camada de dados (`src/lib/supabase/*`). Cada export aqui é
 * consumido por um `if (DEMO) return ...` no topo da função de carregamento
 * correspondente — então os TIPOS precisam casar exatamente, e casam (este
 * arquivo importa os mesmos tipos das camadas).
 *
 * Princípio: NENHUMA chamada de rede. Tudo é literal, montado uma vez. Os
 * números dos painéis (KPIs, DRE) são os alvos combinados para a apresentação;
 * os cadastros (clientes/veículos/orçamentos/OS) são coerentes entre si para a
 * navegação parecer um sistema vivo.
 *
 * Este módulo é puro e SEM efeitos: só descreve dados. Em modo normal ele nem é
 * importado nos caminhos quentes (o `if (DEMO)` curto-circuita antes).
 */

import type { Cliente } from '@/lib/supabase/clientes';
import type { VeiculoComCliente } from '@/lib/supabase/veiculos';
import type { OrcamentoLinha } from '@/lib/supabase/orcamentos';
import type { OsComercialComRefs, PatioLinha } from '@/lib/supabase/os-comercial';
import {
  METAS,
  avaliarKpi,
  type KpiChave,
  type KpiResultado,
} from '@/lib/supabase/kpis';
import type { Dre, DreChave, DreLinha, DreDerivado } from '@/lib/supabase/dre';
import {
  ORDEM_STATUS,
  ORDEM_CANAIS,
  type PipelineComercial,
  type EtapaFunil,
  type RecorteCanal,
} from '@/lib/supabase/comercial';
import type { FluxoCaixa, SemanaFluxo } from '@/lib/supabase/fluxo';
import type { ResumoDespesas, Despesa, GrupoCategoria } from '@/lib/supabase/despesas';
import type {
  FornecedoresContasPagar,
  Fornecedor,
  ContaPagarEnriquecida,
} from '@/lib/supabase/fornecedores';
import {
  ORDEM_FAIXAS,
  ORDEM_LADOS,
  type Aging,
  type LadoResultado,
  type FaixaAging,
  type LadoAging,
} from '@/lib/supabase/aging';
import type { EstoqueItem, EstoqueAlerta } from '@/lib/supabase/estoque';
import type { FormulaComCusto } from '@/lib/supabase/tinta';
import type {
  FinanceiroKpis,
  FunilOsLinha,
  FunilOrcamentoLinha,
  RankingCliente,
  MargemRealOs,
} from '@/lib/supabase/financeiro';
import type { NotaFiscal } from '@/lib/supabase/notas';

/* ───────────────────────────── Datas relativas ──────────────────────────── */

/** "hoje" da demo, fixado no carregamento do módulo (estável durante a sessão). */
const HOJE = new Date();

/** ISO `YYYY-MM-DD` de hoje + `dias` (negativo = passado). */
function dataRel(dias: number): string {
  const d = new Date(HOJE);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** ISO completo (timestamp) de hoje + `dias`. */
function tsRel(dias: number): string {
  const d = new Date(HOJE);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

const OFICINA_ID = 'demo-oficina-0001';

/* ════════════════════════════════ CLIENTES ═══════════════════════════════ */

/** 8 clientes: mix de seguradoras grandes, cooperativa e particulares. */
export const CLIENTES_DEMO: Cliente[] = [
  {
    id: 'cli-porto',
    tipo: 'seguradora',
    nome: 'Porto Seguro',
    documento: '61.198.164/0001-60',
    email: 'sinistros@portoseguro.com.br',
    telefone: '(11) 3366-3377',
    observacoes: 'Prazo médio de aprovação 3 dias úteis.',
    ativo: true,
    criado_em: tsRel(-210),
  },
  {
    id: 'cli-bradesco',
    tipo: 'seguradora',
    nome: 'Bradesco Seguros',
    documento: '92.682.038/0001-00',
    email: 'autos@bradescoseguros.com.br',
    telefone: '(11) 4004-2700',
    observacoes: null,
    ativo: true,
    criado_em: tsRel(-198),
  },
  {
    id: 'cli-tokio',
    tipo: 'seguradora',
    nome: 'Tokio Marine',
    documento: '33.164.021/0001-00',
    email: 'oficinas@tokiomarine.com.br',
    telefone: '(11) 3527-0200',
    observacoes: 'Franquia padrão R$ 2.500.',
    ativo: true,
    criado_em: tsRel(-176),
  },
  {
    id: 'cli-coop',
    tipo: 'cooperativa',
    nome: 'Unimed Frota',
    documento: '78.342.011/0001-22',
    email: 'frota@unimed.coop.br',
    telefone: '(19) 3251-9000',
    observacoes: 'Contrato de frota — 12 veículos.',
    ativo: true,
    criado_em: tsRel(-150),
  },
  {
    id: 'cli-marcos',
    tipo: 'particular',
    nome: 'Marcos Tadeu Oliveira',
    documento: '187.442.318-07',
    email: 'marcos.tadeu@gmail.com',
    telefone: '(11) 98821-4477',
    observacoes: null,
    ativo: true,
    criado_em: tsRel(-92),
  },
  {
    id: 'cli-juliana',
    tipo: 'particular',
    nome: 'Juliana Prado',
    documento: '305.119.762-44',
    email: 'ju.prado@hotmail.com',
    telefone: '(11) 99710-8852',
    observacoes: 'Indicação do Marcos.',
    ativo: true,
    criado_em: tsRel(-61),
  },
  {
    id: 'cli-roberto',
    tipo: 'particular',
    nome: 'Roberto Carvalho ME',
    documento: '24.881.330/0001-19',
    email: 'roberto@transportescarvalho.com.br',
    telefone: '(11) 3771-2200',
    observacoes: 'Utilitários da transportadora.',
    ativo: true,
    criado_em: tsRel(-45),
  },
  {
    id: 'cli-fernanda',
    tipo: 'particular',
    nome: 'Fernanda Lima',
    documento: '412.700.985-31',
    email: 'fernanda.lima@gmail.com',
    telefone: '(11) 98344-1290',
    observacoes: null,
    ativo: true,
    criado_em: tsRel(-18),
  },
];

/* ════════════════════════════════ VEÍCULOS ═══════════════════════════════ */

/** 10 veículos, vinculados aos clientes (placas Mercosul e antigas). */
export const VEICULOS_DEMO: VeiculoComCliente[] = [
  {
    id: 'vei-01', cliente_id: 'cli-marcos', placa: 'RIO2A18', marca: 'Toyota', modelo: 'Corolla XEi 2.0',
    ano_modelo: '2022', combustivel: 'Flex', cor: 'Prata', chassi: '9BRBLWHE0N0123456', renavam: '01234567890',
    fipe_codigo: '002-1', fipe_valor: 132500, criado_em: tsRel(-92),
    cliente: { nome: 'Marcos Tadeu Oliveira' },
  },
  {
    id: 'vei-02', cliente_id: 'cli-juliana', placa: 'FQP8H72', marca: 'Honda', modelo: 'Civic Touring',
    ano_modelo: '2021', combustivel: 'Gasolina', cor: 'Preto', chassi: '93HFC2670M0234567', renavam: '11234567891',
    fipe_codigo: '014-3', fipe_valor: 148900, criado_em: tsRel(-61),
    cliente: { nome: 'Juliana Prado' },
  },
  {
    id: 'vei-03', cliente_id: 'cli-porto', placa: 'GAB4C09', marca: 'Volkswagen', modelo: 'Nivus Highline',
    ano_modelo: '2023', combustivel: 'Flex', cor: 'Branco', chassi: '9BWDB45U7P0345678', renavam: '21234567892',
    fipe_codigo: '021-7', fipe_valor: 121300, criado_em: tsRel(-40),
    cliente: { nome: 'Porto Seguro' },
  },
  {
    id: 'vei-04', cliente_id: 'cli-bradesco', placa: 'HTU1J55', marca: 'Jeep', modelo: 'Compass Limited',
    ano_modelo: '2022', combustivel: 'Diesel', cor: 'Cinza', chassi: '988MJ5A29N0456789', renavam: '31234567893',
    fipe_codigo: '033-2', fipe_valor: 184700, criado_em: tsRel(-37),
    cliente: { nome: 'Bradesco Seguros' },
  },
  {
    id: 'vei-05', cliente_id: 'cli-tokio', placa: 'KMV7B31', marca: 'Hyundai', modelo: 'Creta Action',
    ano_modelo: '2024', combustivel: 'Flex', cor: 'Azul', chassi: '9BHBG51CASP567890', renavam: '41234567894',
    fipe_codigo: '045-9', fipe_valor: 139900, criado_em: tsRel(-30),
    cliente: { nome: 'Tokio Marine' },
  },
  {
    id: 'vei-06', cliente_id: 'cli-coop', placa: 'OAB2D44', marca: 'Renault', modelo: 'Duster Iconic',
    ano_modelo: '2023', combustivel: 'Flex', cor: 'Vermelho', chassi: '93YHSR2H4PJ678901', renavam: '51234567895',
    fipe_codigo: '057-4', fipe_valor: 118400, criado_em: tsRel(-26),
    cliente: { nome: 'Unimed Frota' },
  },
  {
    id: 'vei-07', cliente_id: 'cli-roberto', placa: 'PXR9F87', marca: 'Fiat', modelo: 'Toro Volcano',
    ano_modelo: '2021', combustivel: 'Diesel', cor: 'Branco', chassi: '988226176M0789012', renavam: '61234567896',
    fipe_codigo: '068-1', fipe_valor: 156200, criado_em: tsRel(-45),
    cliente: { nome: 'Roberto Carvalho ME' },
  },
  {
    id: 'vei-08', cliente_id: 'cli-fernanda', placa: 'QTL3G20', marca: 'Chevrolet', modelo: 'Tracker Premier',
    ano_modelo: '2023', combustivel: 'Flex', cor: 'Prata', chassi: '9BGEC76H0PB890123', renavam: '71234567897',
    fipe_codigo: '079-6', fipe_valor: 127800, criado_em: tsRel(-18),
    cliente: { nome: 'Fernanda Lima' },
  },
  {
    id: 'vei-09', cliente_id: 'cli-porto', placa: 'BRA2E19', marca: 'Nissan', modelo: 'Kicks Exclusive',
    ano_modelo: '2022', combustivel: 'Flex', cor: 'Laranja', chassi: '94DFCAE18N0901234', renavam: '81234567898',
    fipe_codigo: '081-0', fipe_valor: 113600, criado_em: tsRel(-15),
    cliente: { nome: 'Porto Seguro' },
  },
  {
    id: 'vei-10', cliente_id: 'cli-roberto', placa: 'SCV5K63', marca: 'Volkswagen', modelo: 'Saveiro Robust',
    ano_modelo: '2020', combustivel: 'Flex', cor: 'Branco', chassi: '9BWKB45U1L0012345', renavam: '91234567899',
    fipe_codigo: '092-5', fipe_valor: 78900, criado_em: tsRel(-12),
    cliente: { nome: 'Roberto Carvalho ME' },
  },
];

/* ════════════════════════════════ ORÇAMENTOS ═════════════════════════════ */
/**
 * 12 orçamentos. Cada um já com `itens` resolvidos (peça/mão de obra/insumo) no
 * formato que `OrcamentoLinha` espera: `{ total_venda, total_custo, margem }`.
 * A margem por item = total_venda − total_custo (a tela soma e desconta o
 * cabeçalho). Misturamos status para o funil/pipeline ter forma realista.
 */

type ItemDemo = { total_venda: number; total_custo: number };
/** Helper: monta a tripla {venda, custo, margem} para um item da listagem. */
function item({ total_venda, total_custo }: ItemDemo) {
  return { total_venda, total_custo, margem: total_venda - total_custo };
}

export const ORCAMENTOS_DEMO: OrcamentoLinha[] = [
  // ── APROVADOS (viraram OS) ───────────────────────────────────────────────
  {
    id: 'orc-01', cliente_id: 'cli-porto', status: 'aprovado', desconto: 0, criado_em: tsRel(-38),
    cliente: { nome: 'Porto Seguro' }, veiculo: { placa: 'GAB4C09' },
    itens: [
      item({ total_venda: 1850, total_custo: 1180 }), // para-choque dianteiro
      item({ total_venda: 2400, total_custo: 900 }),  // mão de obra funilaria
      item({ total_venda: 1320, total_custo: 540 }),  // pintura + tinta
    ],
  },
  {
    id: 'orc-02', cliente_id: 'cli-bradesco', status: 'aprovado', desconto: 150, criado_em: tsRel(-34),
    cliente: { nome: 'Bradesco Seguros' }, veiculo: { placa: 'HTU1J55' },
    itens: [
      item({ total_venda: 3200, total_custo: 2050 }), // capô
      item({ total_venda: 2800, total_custo: 1050 }), // mão de obra
      item({ total_venda: 1600, total_custo: 660 }),  // pintura
    ],
  },
  {
    id: 'orc-03', cliente_id: 'cli-marcos', status: 'aprovado', desconto: 200, criado_em: tsRel(-29),
    cliente: { nome: 'Marcos Tadeu Oliveira' }, veiculo: { placa: 'RIO2A18' },
    itens: [
      item({ total_venda: 980, total_custo: 520 }),
      item({ total_venda: 1500, total_custo: 560 }),
      item({ total_venda: 720, total_custo: 300 }),
    ],
  },
  {
    id: 'orc-04', cliente_id: 'cli-tokio', status: 'aprovado', desconto: 0, criado_em: tsRel(-24),
    cliente: { nome: 'Tokio Marine' }, veiculo: { placa: 'KMV7B31' },
    itens: [
      item({ total_venda: 2650, total_custo: 1700 }),
      item({ total_venda: 3100, total_custo: 1180 }),
      item({ total_venda: 1450, total_custo: 600 }),
    ],
  },
  {
    id: 'orc-05', cliente_id: 'cli-coop', status: 'aprovado', desconto: 300, criado_em: tsRel(-19),
    cliente: { nome: 'Unimed Frota' }, veiculo: { placa: 'OAB2D44' },
    itens: [
      item({ total_venda: 1240, total_custo: 760 }),
      item({ total_venda: 1900, total_custo: 720 }),
      item({ total_venda: 860, total_custo: 360 }),
    ],
  },
  {
    id: 'orc-06', cliente_id: 'cli-juliana', status: 'aprovado', desconto: 0, criado_em: tsRel(-12),
    cliente: { nome: 'Juliana Prado' }, veiculo: { placa: 'FQP8H72' },
    itens: [
      item({ total_venda: 1380, total_custo: 700 }),
      item({ total_venda: 2100, total_custo: 800 }),
      item({ total_venda: 980, total_custo: 410 }),
    ],
  },
  // ── ENVIADOS (aguardando decisão) ────────────────────────────────────────
  {
    id: 'orc-07', cliente_id: 'cli-roberto', status: 'enviado', desconto: 0, criado_em: tsRel(-6),
    cliente: { nome: 'Roberto Carvalho ME' }, veiculo: { placa: 'PXR9F87' },
    itens: [
      item({ total_venda: 2200, total_custo: 1400 }),
      item({ total_venda: 2600, total_custo: 990 }),
      item({ total_venda: 1100, total_custo: 470 }),
    ],
  },
  {
    id: 'orc-08', cliente_id: 'cli-fernanda', status: 'enviado', desconto: 100, criado_em: tsRel(-4),
    cliente: { nome: 'Fernanda Lima' }, veiculo: { placa: 'QTL3G20' },
    itens: [
      item({ total_venda: 1650, total_custo: 1020 }),
      item({ total_venda: 1800, total_custo: 690 }),
      item({ total_venda: 760, total_custo: 320 }),
    ],
  },
  {
    id: 'orc-09', cliente_id: 'cli-porto', status: 'enviado', desconto: 0, criado_em: tsRel(-3),
    cliente: { nome: 'Porto Seguro' }, veiculo: { placa: 'BRA2E19' },
    itens: [
      item({ total_venda: 1980, total_custo: 1280 }),
      item({ total_venda: 2300, total_custo: 880 }),
    ],
  },
  // ── RASCUNHO ─────────────────────────────────────────────────────────────
  {
    id: 'orc-10', cliente_id: 'cli-roberto', status: 'rascunho', desconto: 0, criado_em: tsRel(-1),
    cliente: { nome: 'Roberto Carvalho ME' }, veiculo: { placa: 'SCV5K63' },
    itens: [
      item({ total_venda: 1450, total_custo: 920 }),
      item({ total_venda: 1300, total_custo: 500 }),
    ],
  },
  // ── RECUSADOS ────────────────────────────────────────────────────────────
  {
    id: 'orc-11', cliente_id: 'cli-marcos', status: 'recusado', desconto: 0, criado_em: tsRel(-22),
    cliente: { nome: 'Marcos Tadeu Oliveira' }, veiculo: { placa: 'RIO2A18' },
    itens: [
      item({ total_venda: 4200, total_custo: 2600 }),
      item({ total_venda: 1800, total_custo: 700 }),
    ],
  },
  {
    id: 'orc-12', cliente_id: 'cli-fernanda', status: 'recusado', desconto: 0, criado_em: tsRel(-9),
    cliente: { nome: 'Fernanda Lima' }, veiculo: { placa: 'QTL3G20' },
    itens: [
      item({ total_venda: 2900, total_custo: 1900 }),
    ],
  },
];

/* ════════════════════════════════ OS COMERCIAL ═══════════════════════════ */
/**
 * 6 OS (uma por orçamento aprovado), em vários estágios do pátio. `numero`
 * sequencial; valores batem com a soma dos itens menos o desconto do orçamento.
 */
function osBase(
  o: {
    id: string; orcamento_id: string; cliente_id: string; veiculo_id: string;
    numero: number; valor: number; status: OsComercialComRefs['status'];
    diasAprov: number; prazo: number | null; entrega: number | null;
    cliente: string; placa: string; marca: string; modelo: string;
  }
): OsComercialComRefs {
  return {
    id: o.id,
    oficina_id: OFICINA_ID,
    orcamento_id: o.orcamento_id,
    cliente_id: o.cliente_id,
    veiculo_id: o.veiculo_id,
    numero: o.numero,
    valor_orcamento: o.valor,
    status: o.status,
    os_ref: null,
    totem_sync_status: 'sincronizado',
    data_aprovacao: tsRel(o.diasAprov),
    prazo_entrega: o.prazo === null ? null : dataRel(o.prazo),
    data_entrega_real: o.entrega === null ? null : tsRel(o.entrega),
    criado_em: tsRel(o.diasAprov),
    atualizado_em: tsRel(Math.min(0, o.entrega ?? o.diasAprov + 3)),
    cliente: { nome: o.cliente },
    veiculo: { placa: o.placa, marca: o.marca, modelo: o.modelo },
  };
}

export const OS_DEMO: OsComercialComRefs[] = [
  osBase({ id: 'os-01', orcamento_id: 'orc-01', cliente_id: 'cli-porto', veiculo_id: 'vei-03', numero: 47, valor: 5570, status: 'entregue', diasAprov: -38, prazo: -25, entrega: -27, cliente: 'Porto Seguro', placa: 'GAB4C09', marca: 'Volkswagen', modelo: 'Nivus Highline' }),
  osBase({ id: 'os-02', orcamento_id: 'orc-02', cliente_id: 'cli-bradesco', veiculo_id: 'vei-04', numero: 48, valor: 7450, status: 'entregue', diasAprov: -34, prazo: -20, entrega: -22, cliente: 'Bradesco Seguros', placa: 'HTU1J55', marca: 'Jeep', modelo: 'Compass Limited' }),
  osBase({ id: 'os-03', orcamento_id: 'orc-03', cliente_id: 'cli-marcos', veiculo_id: 'vei-01', numero: 49, valor: 3000, status: 'entregue', diasAprov: -29, prazo: -16, entrega: -14, cliente: 'Marcos Tadeu Oliveira', placa: 'RIO2A18', marca: 'Toyota', modelo: 'Corolla XEi 2.0' }),
  osBase({ id: 'os-04', orcamento_id: 'orc-04', cliente_id: 'cli-tokio', veiculo_id: 'vei-05', numero: 50, valor: 7200, status: 'concluida', diasAprov: -24, prazo: -2, entrega: null, cliente: 'Tokio Marine', placa: 'KMV7B31', marca: 'Hyundai', modelo: 'Creta Action' }),
  osBase({ id: 'os-05', orcamento_id: 'orc-05', cliente_id: 'cli-coop', veiculo_id: 'vei-06', numero: 51, valor: 3700, status: 'em_producao', diasAprov: -19, prazo: 3, entrega: null, cliente: 'Unimed Frota', placa: 'OAB2D44', marca: 'Renault', modelo: 'Duster Iconic' }),
  osBase({ id: 'os-06', orcamento_id: 'orc-06', cliente_id: 'cli-juliana', veiculo_id: 'vei-02', numero: 52, valor: 4460, status: 'aberta', diasAprov: -12, prazo: 8, entrega: null, cliente: 'Juliana Prado', placa: 'FQP8H72', marca: 'Honda', modelo: 'Civic Touring' }),
];

/** Pátio (view v_os_dias_rs): dias-na-oficina por OS ativa/saída. */
export const PATIO_DEMO: PatioLinha[] = [
  { oficina_id: OFICINA_ID, os_id: 'os-04', numero: 50, valor_orcamento: 7200, status: 'concluida', dias: 22 },
  { oficina_id: OFICINA_ID, os_id: 'os-05', numero: 51, valor_orcamento: 3700, status: 'em_producao', dias: 19 },
  { oficina_id: OFICINA_ID, os_id: 'os-06', numero: 52, valor_orcamento: 4460, status: 'aberta', dias: 12 },
];

/* ════════════════════════════════ KPIs (9) ═══════════════════════════════ */
/**
 * Os 9 KPIs estratégicos com os valores ALVO da apresentação. Cada um avaliado
 * contra a meta real (`METAS`) pelo mesmo `avaliarKpi` da camada — então o
 * semáforo (atingida/atenção/abaixo) sai consistente com as regras de produção.
 */
function kpi(chave: KpiChave, valor: number, nota?: string): KpiResultado {
  const meta = METAS[chave];
  const { status, atingimento } = avaliarKpi(valor, meta);
  return { chave, valor, meta, status, atingimento, aguardandoDados: false, nota };
}

export const KPIS_DEMO: Record<KpiChave, KpiResultado> = {
  permanencia: kpi('permanencia', 18, 'Média do pátio nos últimos 90 dias.'),
  os_no_prazo: kpi('os_no_prazo', 93, 'OS entregues dentro do prazo combinado.'),
  retrabalho: kpi('retrabalho', 6.4, 'Carros que voltaram para refazer serviço.'),
  faturamento_por_funcionario: kpi('faturamento_por_funcionario', 20555, 'Receita do mês ÷ 9 funcionários.'),
  ocupacao_patio: kpi('ocupacao_patio', 75, '6 de 8 boxes ocupados.'),
  pct_particulares: kpi('pct_particulares', 28, 'Diversificação além das seguradoras.'),
  concentracao_maior_cliente: kpi('concentracao_maior_cliente', 46, 'Porto Seguro concentra quase metade.'),
  margem: kpi('margem', 23.7, 'Margem real de OS concluídas/entregues.'),
  custo_rh: kpi('custo_rh', 25, 'Folha ÷ faturamento do período.'),
};

/* ════════════════════════════════ DRE ════════════════════════════════════ */
/**
 * DRE da demo com a estrutura contábil completa e os números alvo. Diferente da
 * produção (onde várias linhas ficam "aguardando dados"), na demo TODAS as
 * linhas estão vivas — é a oficina madura que o investidor quer ver. A AV usa a
 * receita líquida como base.
 */
const RECEITA_BRUTA = 185000;
const RECEITA_SERVICOS = 115000;
const RECEITA_PECAS = 70000;
const DEDUCOES_ISS = 5750; // ~5% sobre serviços
const RECEITA_LIQUIDA = RECEITA_BRUTA - DEDUCOES_ISS; // 179.250
const CSP_MAO_DE_OBRA = 46000;
const CSP_PECAS = 47000;
const CSP_TINTAS = 7805;
const CSP_TOTAL = CSP_MAO_DE_OBRA + CSP_PECAS + CSP_TINTAS; // 100.805
const LUCRO_BRUTO = RECEITA_LIQUIDA - CSP_TOTAL; // 78.445
const DESP_ADMIN = 18400;
const DESP_VARIAVEIS = 9650;
const DESP_COMERCIAIS = 6800;
const DESP_OPERACIONAIS = DESP_ADMIN + DESP_VARIAVEIS + DESP_COMERCIAIS; // 34.850
const EBITDA = LUCRO_BRUTO - DESP_OPERACIONAIS; // 43.595
const RESULTADO_ANTES = EBITDA; // sem depreciação/financeiro na demo
const IMPOSTOS_LUCRO = 4115; // IRPJ+CSLL Simples
const RESULTADO_LIQUIDO = RESULTADO_ANTES - IMPOSTOS_LUCRO; // 39.480

/** % AV sobre a receita líquida (base contábil). */
function av(valor: number): number {
  return (valor / RECEITA_LIQUIDA) * 100;
}

/** Linha viva da DRE da demo. */
function dreLinha(chave: DreChave, valor: number, nota?: string): DreLinha {
  return { chave, valor, avPct: av(valor), aguardandoDados: false, nota };
}

const DRE_LINHAS_DEMO: DreLinha[] = [
  dreLinha('receita_bruta', RECEITA_BRUTA, 'Serviços + peças aplicadas no período.'),
  dreLinha('receita_servicos', RECEITA_SERVICOS),
  dreLinha('receita_pecas', RECEITA_PECAS),
  dreLinha('deducoes', DEDUCOES_ISS),
  dreLinha('deducoes_iss', DEDUCOES_ISS, 'ISS ~5% sobre serviços.'),
  dreLinha('receita_liquida', RECEITA_LIQUIDA),
  dreLinha('csp', CSP_TOTAL),
  dreLinha('csp_mao_de_obra', CSP_MAO_DE_OBRA, 'Folha direta da produção.'),
  dreLinha('csp_pecas', CSP_PECAS),
  dreLinha('csp_tintas', CSP_TINTAS, 'Tintas e insumos baixados do estoque.'),
  dreLinha('lucro_bruto', LUCRO_BRUTO, 'Receita líquida − custo dos serviços prestados.'),
  dreLinha('despesas_operacionais', DESP_OPERACIONAIS),
  dreLinha('despesas_admin_fixas', DESP_ADMIN),
  dreLinha('despesas_variaveis', DESP_VARIAVEIS),
  dreLinha('despesas_comerciais', DESP_COMERCIAIS),
  dreLinha('ebitda', EBITDA, 'Resultado operacional antes de juros e impostos.'),
  dreLinha('resultado_antes_impostos', RESULTADO_ANTES),
  dreLinha('impostos_lucro', IMPOSTOS_LUCRO, 'IRPJ + CSLL (Simples Nacional).'),
  dreLinha('resultado_liquido', RESULTADO_LIQUIDO, 'O que sobra de fato no fim do mês.'),
];

const DRE_DERIVADOS_DEMO: DreDerivado[] = [
  {
    chave: 'markup',
    nome: 'Markup geral',
    valor: 2.8,
    unidade: 'multiplo',
    aguardandoDados: false,
    nota: 'Receita ÷ custos diretos (peças + tintas + folha).',
  },
  {
    chave: 'ponto_equilibrio',
    nome: 'Ponto de equilíbrio',
    valor: 81652,
    unidade: 'moeda',
    aguardandoDados: false,
    nota: 'Faturamento mensal mínimo para não ter prejuízo.',
  },
];

export const DRE_DEMO: Dre = {
  linhas: DRE_LINHAS_DEMO,
  derivados: DRE_DERIVADOS_DEMO,
  baseAv: RECEITA_LIQUIDA,
  qtdOs: 6,
};

/* ═══════════════════════════════ PIPELINE COMERCIAL ══════════════════════ */
/**
 * Pipeline com conversão 68% e ticket médio R$ 12.400 (alvos). Funil e canais
 * coerentes com os orçamentos acima. Construído manualmente para casar os
 * números-herói exatamente (a tela só formata).
 */
const FUNIL_DEMO: EtapaFunil[] = [
  { status: 'rascunho', quantidade: 1, valor: 2250 },
  { status: 'enviado', quantidade: 3, valor: 18890 },
  { status: 'aprovado', quantidade: 6, valor: 32500 },
  { status: 'recusado', quantidade: 2, valor: 0 },
];

const CANAIS_DEMO: RecorteCanal[] = [
  {
    canal: 'seguradora', total: 5, decididos: 3, aprovados: 3,
    conversaoPct: 100, valorAprovado: 16980, ticketMedio: 5660,
  },
  {
    canal: 'particular', total: 5, decididos: 4, aprovados: 2,
    conversaoPct: 50, valorAprovado: 7900, ticketMedio: 3950,
  },
  {
    canal: 'cooperativa', total: 1, decididos: 1, aprovados: 1,
    conversaoPct: 100, valorAprovado: 3700, ticketMedio: 3700,
  },
];

export const PIPELINE_DEMO: PipelineComercial = {
  temDados: true,
  total: 12,
  decididos: 8,
  aprovados: 6,
  recusados: 2,
  emAberto: 4,
  conversaoPct: 68,
  ticketMedio: 12400,
  valorAprovado: 74400, // 6 × 12.400 (receita contratada de exibição)
  funil: ORDEM_STATUS.map((s) => FUNIL_DEMO.find((f) => f.status === s) as EtapaFunil),
  canais: ORDEM_CANAIS.flatMap((c) => {
    const r = CANAIS_DEMO.find((x) => x.canal === c);
    return r ? [r] : [];
  }) as RecorteCanal[],
};

/* ════════════════════════════════ FLUXO DE CAIXA ═════════════════════════ */
/**
 * Projeção de 8 semanas com UMA virada negativa (semana 4): as entradas caem e
 * um lote de contas a pagar concentra. Construímos as semanas a partir da
 * segunda-feira da semana atual para casar com o que a tela espera, e parametr.
 * por janela (4/8/12) repetindo o padrão. Acumulado parte de zero (como a prod.).
 */
function inicioSemanaDemo(d: Date): Date {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = base.getDay();
  const recuo = dia === 0 ? 6 : dia - 1;
  base.setDate(base.getDate() - recuo);
  return base;
}
function isoLocal(d: Date): string {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${a}-${m}-${dd}`;
}

/** Entradas/saídas por semana (índice 0 = semana atual). 8 valores. */
const FLUXO_SEMANAS: { entradas: number; saidas: number }[] = [
  { entradas: 18500, saidas: 12300 },
  { entradas: 14200, saidas: 15800 },
  { entradas: 9800, saidas: 11200 },
  { entradas: 6400, saidas: 18900 }, // virada: acumulado fica negativo aqui
  { entradas: 21300, saidas: 13400 },
  { entradas: 17600, saidas: 12100 },
  { entradas: 13900, saidas: 14600 },
  { entradas: 19200, saidas: 11800 },
];

export function fluxoDemo(semanasJanela: number): FluxoCaixa {
  const segunda = inicioSemanaDemo(HOJE);
  const semanas: SemanaFluxo[] = [];
  let acumulado = 0;
  let indicePrimeiraNegativa: number | null = null;
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (let i = 0; i < semanasJanela; i++) {
    const inicio = new Date(segunda);
    inicio.setDate(inicio.getDate() + i * 7);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);

    const base = FLUXO_SEMANAS[i % FLUXO_SEMANAS.length];
    const entradas = base.entradas;
    const saidas = base.saidas;
    const liquido = entradas - saidas;
    acumulado += liquido;
    totalEntradas += entradas;
    totalSaidas += saidas;

    const negativa = acumulado < 0;
    const primeiraNegativa = negativa && indicePrimeiraNegativa === null;
    if (primeiraNegativa) indicePrimeiraNegativa = i;

    semanas.push({
      semana: isoLocal(inicio),
      fimSemana: isoLocal(fim),
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
    aguardandoDados: false,
    erroTransitorio: false,
  };
}

/* ════════════════════════════════ DESPESAS ═══════════════════════════════ */

function despesa(
  id: string, descricao: string, categoria: string,
  tipo: Despesa['tipo'], valor: number, diaCompetencia: number,
  recorrente = false, periodicidade: Despesa['periodicidade'] = null
): Despesa {
  return {
    id, descricao, categoria, tipo, valor,
    data_competencia: dataRel(diaCompetencia), recorrente, periodicidade,
  };
}

const DESPESAS_DEMO: Despesa[] = [
  despesa('des-01', 'Aluguel do galpão', 'Instalações', 'fixa', 8200, -8, true, 'mensal'),
  despesa('des-02', 'Folha administrativa', 'Pessoal', 'fixa', 6400, -5, true, 'mensal'),
  despesa('des-03', 'Energia elétrica', 'Utilidades', 'fixa', 2350, -10, true, 'mensal'),
  despesa('des-04', 'Software de gestão (GDelta)', 'Tecnologia', 'fixa', 690, -3, true, 'mensal'),
  despesa('des-05', 'Internet + telefonia', 'Utilidades', 'fixa', 760, -3, true, 'mensal'),
  despesa('des-06', 'Tintas e vernizes', 'Insumos', 'variavel', 4180, -12, false, null),
  despesa('des-07', 'Lixas e abrasivos', 'Insumos', 'variavel', 1240, -15, false, null),
  despesa('des-08', 'Energia da cabine de pintura', 'Utilidades', 'variavel', 1870, -9, false, null),
  despesa('des-09', 'Comissão de captação', 'Comercial', 'variavel', 2360, -6, false, null),
  despesa('des-10', 'Marketing local', 'Comercial', 'variavel', 1450, -14, false, null),
  despesa('des-11', 'Manutenção de equipamentos', 'Manutenção', 'variavel', 980, -20, false, null),
];

function montarResumoDespesasDemo(): ResumoDespesas {
  const porTipo = {
    fixa: { total: 0, qtd: 0 },
    variavel: { total: 0, qtd: 0 },
  };
  const mapaCat = new Map<string | null, { itens: Despesa[]; total: number }>();
  for (const d of DESPESAS_DEMO) {
    porTipo[d.tipo].total += d.valor;
    porTipo[d.tipo].qtd += 1;
    const g = mapaCat.get(d.categoria) ?? { itens: [], total: 0 };
    g.itens.push(d);
    g.total += d.valor;
    mapaCat.set(d.categoria, g);
  }
  const porCategoria: GrupoCategoria[] = Array.from(mapaCat.entries())
    .map(([categoria, g]) => ({
      categoria,
      rotulo: categoria ?? 'Sem categoria',
      total: g.total,
      qtd: g.itens.length,
      itens: [...g.itens].sort((a, b) => b.valor - a.valor),
    }))
    .sort((a, b) => b.total - a.total);
  return {
    despesas: [...DESPESAS_DEMO].sort((a, b) => b.valor - a.valor),
    porTipo,
    totalGeral: porTipo.fixa.total + porTipo.variavel.total,
    qtdTotal: DESPESAS_DEMO.length,
    porCategoria,
    aguardandoDados: false,
    temDados: true,
  };
}

export const DESPESAS_RESUMO_DEMO: ResumoDespesas = montarResumoDespesasDemo();

/* ════════════════════════════ FORNECEDORES / CONTAS A PAGAR ══════════════ */

const FORNECEDORES_DEMO: Fornecedor[] = [
  { id: 'for-01', nome: 'Distribuidora AutoPeças Brasil', categoria: 'Peças', email: 'vendas@autopecasbrasil.com.br', telefone: '(11) 2155-3000', ativo: true },
  { id: 'for-02', nome: 'Tintas PPG do Brasil', categoria: 'Tintas', email: 'oficinas@ppg.com', telefone: '(11) 4003-1900', ativo: true },
  { id: 'for-03', nome: 'Sherwin-Williams Automotive', categoria: 'Tintas', email: 'atendimento@sherwin.com.br', telefone: '(11) 3429-8000', ativo: true },
  { id: 'for-04', nome: 'Parafusos & Fixadores Cia', categoria: 'Insumos', email: 'pedidos@parafusoscia.com.br', telefone: '(11) 2098-4422', ativo: true },
];

function conta(
  id: string, fornecedorId: string | null, descricao: string, categoria: string,
  valor: number, venc: number, status: 'aberto' | 'pago', pagoEm: number | null
): ContaPagarEnriquecida {
  const vencimento = dataRel(venc);
  const hoje = dataRel(0);
  const vencida = status === 'aberto' && vencimento < hoje;
  return {
    id, fornecedor_id: fornecedorId, descricao, categoria, valor, vencimento, status,
    pago_em: pagoEm === null ? null : dataRel(pagoEm),
    statusExibicao: status === 'pago' ? 'paga' : vencida ? 'vencida' : 'aberta',
    vencida,
  };
}

const CONTAS_DEMO: ContaPagarEnriquecida[] = [
  conta('cp-01', 'for-01', 'NF 88231 · para-choques e capôs', 'Peças', 9800, 6, 'aberto', null),
  conta('cp-02', 'for-01', 'NF 88410 · faróis e lanternas', 'Peças', 4200, -4, 'aberto', null), // vencida
  conta('cp-03', 'for-02', 'NF 33120 · base e verniz', 'Tintas', 6450, 12, 'aberto', null),
  conta('cp-04', 'for-02', 'NF 33044 · catalisador', 'Tintas', 1980, -18, 'aberto', null), // vencida
  conta('cp-05', 'for-03', 'NF 71002 · tinta perolizada', 'Tintas', 3120, 20, 'aberto', null),
  conta('cp-06', 'for-04', 'NF 1209 · parafusos e presilhas', 'Insumos', 870, 3, 'aberto', null),
  conta('cp-07', 'for-01', 'NF 87990 · grade dianteira', 'Peças', 2300, -30, 'pago', -28),
  conta('cp-08', 'for-03', 'NF 70880 · primer', 'Tintas', 1540, -12, 'pago', -10),
];

function montarFornecedoresDemo(): FornecedoresContasPagar {
  const emAberto = CONTAS_DEMO.filter((c) => c.status === 'aberto');
  const vencidas = emAberto.filter((c) => c.vencida);
  const porId = new Map(FORNECEDORES_DEMO.map((f) => [f.id, f]));
  const grupos = new Map<string, FornecedoresContasPagar['grupos'][number]>();
  const SEM = '__sem__';
  for (const c of CONTAS_DEMO) {
    const chave = c.fornecedor_id ?? SEM;
    let g = grupos.get(chave);
    if (!g) {
      const f = c.fornecedor_id ? porId.get(c.fornecedor_id) : undefined;
      g = {
        fornecedorId: c.fornecedor_id,
        nome: f?.nome ?? 'Sem fornecedor',
        categoria: f?.categoria ?? null,
        contas: [],
        totalAberto: 0,
        totalVencido: 0,
      };
      grupos.set(chave, g);
    }
    g.contas.push(c);
    if (c.status === 'aberto') {
      g.totalAberto += c.valor;
      if (c.vencida) g.totalVencido += c.valor;
    }
  }
  const lista = [...grupos.values()];
  for (const g of lista) g.contas.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  lista.sort((a, b) => b.totalAberto - a.totalAberto || a.nome.localeCompare(b.nome, 'pt-BR'));
  return {
    fornecedores: FORNECEDORES_DEMO,
    contas: CONTAS_DEMO,
    grupos: lista,
    resumo: {
      totalAberto: emAberto.reduce((a, c) => a + c.valor, 0),
      totalVencido: vencidas.reduce((a, c) => a + c.valor, 0),
      qtdAberta: emAberto.length,
      qtdVencida: vencidas.length,
      qtdTotal: CONTAS_DEMO.length,
    },
    aguardandoDados: false,
  };
}

export const FORNECEDORES_RESUMO_DEMO: FornecedoresContasPagar = montarFornecedoresDemo();

/* ════════════════════════════════ AGING ══════════════════════════════════ */
/**
 * Aging dos dois lados (receber × pagar), por faixa de idade. Valores de
 * exibição realistas; o "a vencer" domina (saúde), com cauda vencida visível.
 */
type FaixaValor = Record<FaixaAging, { total: number; qtd: number }>;

const AGING_RECEBER: FaixaValor = {
  a_vencer: { total: 42800, qtd: 7 },
  '1-30': { total: 12400, qtd: 3 },
  '31-60': { total: 5600, qtd: 2 },
  '60+': { total: 3200, qtd: 1 },
};
const AGING_PAGAR: FaixaValor = {
  a_vencer: { total: 20240, qtd: 4 },
  '1-30': { total: 4200, qtd: 1 },
  '31-60': { total: 1980, qtd: 1 },
  '60+': { total: 0, qtd: 0 },
};

function montarLadoDemo(lado: LadoAging, fv: FaixaValor): LadoResultado {
  const total = ORDEM_FAIXAS.reduce((a, f) => a + fv[f].total, 0);
  const qtd = ORDEM_FAIXAS.reduce((a, f) => a + fv[f].qtd, 0);
  const faixas = ORDEM_FAIXAS.map((faixa) => ({
    faixa,
    total: fv[faixa].total,
    qtd: fv[faixa].qtd,
    pctDoLado: total > 0 ? (fv[faixa].total / total) * 100 : null,
  }));
  const vencido = fv['1-30'].total + fv['31-60'].total + fv['60+'].total;
  return { lado, faixas, total, qtd, vencido, perigo: fv['60+'].total };
}

export const AGING_DEMO: Aging = {
  lados: ORDEM_LADOS.map((lado) =>
    montarLadoDemo(lado, lado === 'receber' ? AGING_RECEBER : AGING_PAGAR)
  ),
  aguardandoDados: false,
  qtdTitulos:
    ORDEM_FAIXAS.reduce((a, f) => a + AGING_RECEBER[f].qtd + AGING_PAGAR[f].qtd, 0),
};

/* ════════════════════════════════ ESTOQUE ════════════════════════════════ */

function estoqueItem(
  id: string, nome: string, categoria: EstoqueItem['categoria'], unidade: string,
  quantidade: number, custoMedio: number, minimo: number
): EstoqueItem {
  return {
    id, oficina_id: OFICINA_ID, nome, categoria, unidade,
    quantidade, custo_medio: custoMedio, estoque_minimo: minimo,
    ativo: true, criado_em: tsRel(-120), atualizado_em: tsRel(-2),
  };
}

export const ESTOQUE_ITENS_DEMO: EstoqueItem[] = [
  estoqueItem('est-01', 'Base PU branca', 'materia_prima', 'L', 8, 92.5, 4),
  estoqueItem('est-02', 'Verniz HS premium', 'materia_prima', 'L', 3, 148.0, 5), // abaixo do mínimo
  estoqueItem('est-03', 'Massa rápida poliéster', 'materia_prima', 'kg', 14, 32.0, 6),
  estoqueItem('est-04', 'Lixa d’água 400', 'materia_prima', 'un', 120, 1.8, 50),
  estoqueItem('est-05', 'Para-choque dianteiro Corolla', 'peca', 'un', 2, 680.0, 1),
  estoqueItem('est-06', 'Farol LED Civic', 'peca', 'un', 1, 1240.0, 2), // abaixo do mínimo
  estoqueItem('est-07', 'Capô Compass', 'peca', 'un', 1, 2050.0, 1),
  estoqueItem('est-08', 'Catalisador 2.0', 'materia_prima', 'L', 6, 76.0, 3),
  estoqueItem('est-09', 'Fita crepe automotiva', 'escritorio', 'un', 40, 9.5, 15),
  estoqueItem('est-10', 'Estopa branca', 'materia_prima', 'kg', 22, 12.0, 8),
];

/** Alertas (view v_estoque_alertas): itens no/abaixo do mínimo. */
export const ESTOQUE_ALERTAS_DEMO: EstoqueAlerta[] = ESTOQUE_ITENS_DEMO.filter(
  (i) => i.quantidade <= i.estoque_minimo
).map((i) => ({
  oficina_id: i.oficina_id,
  id: i.id,
  nome: i.nome,
  categoria: i.categoria,
  unidade: i.unidade,
  quantidade: i.quantidade,
  estoque_minimo: i.estoque_minimo,
}));

/* ════════════════════════════════ TINTAS ═════════════════════════════════ */
/**
 * Fórmulas de cor já com custo (view v_tinta_formula_custo). custo_por_grama é o
 * que sustenta a margem ao vivo da pintura.
 */
export const TINTAS_FORMULAS_DEMO: FormulaComCusto[] = [
  { oficina_id: OFICINA_ID, id: 'tf-01', nome: 'Prata Sterling (Toyota 1F7)', codigo_cor: '1F7', ativo: true, gramas_total: 850, custo_total: 78.2, custo_por_grama: 0.092 },
  { oficina_id: OFICINA_ID, id: 'tf-02', nome: 'Preto Cristal (Honda NH-731P)', codigo_cor: 'NH-731P', ativo: true, gramas_total: 720, custo_total: 61.9, custo_por_grama: 0.086 },
  { oficina_id: OFICINA_ID, id: 'tf-03', nome: 'Branco Banchisa (VW B4B4)', codigo_cor: 'B4B4', ativo: true, gramas_total: 940, custo_total: 70.5, custo_por_grama: 0.075 },
  { oficina_id: OFICINA_ID, id: 'tf-04', nome: 'Azul Biscay (Hyundai YP5)', codigo_cor: 'YP5', ativo: true, gramas_total: 680, custo_total: 74.8, custo_por_grama: 0.110 },
  { oficina_id: OFICINA_ID, id: 'tf-05', nome: 'Vermelho Flame (Renault NNP)', codigo_cor: 'NNP', ativo: true, gramas_total: 760, custo_total: 98.8, custo_por_grama: 0.130 },
];

/* ════════════════════════════════ FINANCEIRO ═════════════════════════════ */
/**
 * Dashboard financeiro (views v_financeiro_kpis, v_funil_*, v_ranking_clientes,
 * v_os_margem_real). Derivado dos mesmos clientes/OS para coerência.
 */
export const FINANCEIRO_KPIS_DEMO: FinanceiroKpis = {
  oficina_id: OFICINA_ID,
  os_abertas: 1,
  os_em_producao: 1,
  os_concluidas: 1,
  os_entregues: 3,
  os_canceladas: 0,
  receita_aberta: 15360,
  receita_entregue: 16020,
  ticket_medio: 5230,
};

export const FUNIL_OS_DEMO: FunilOsLinha[] = [
  { oficina_id: OFICINA_ID, status: 'aberta', qtd: 1, valor_total: 4460 },
  { oficina_id: OFICINA_ID, status: 'em_producao', qtd: 1, valor_total: 3700 },
  { oficina_id: OFICINA_ID, status: 'concluida', qtd: 1, valor_total: 7200 },
  { oficina_id: OFICINA_ID, status: 'entregue', qtd: 3, valor_total: 16020 },
];

export const FUNIL_ORCAMENTOS_DEMO: FunilOrcamentoLinha[] = [
  { oficina_id: OFICINA_ID, status: 'rascunho', qtd: 1 },
  { oficina_id: OFICINA_ID, status: 'enviado', qtd: 3 },
  { oficina_id: OFICINA_ID, status: 'aprovado', qtd: 6 },
  { oficina_id: OFICINA_ID, status: 'recusado', qtd: 2 },
];

export const RANKING_CLIENTES_DEMO: RankingCliente[] = [
  { oficina_id: OFICINA_ID, cliente_id: 'cli-porto', cliente_nome: 'Porto Seguro', qtd_os: 2, valor_total: 11140 },
  { oficina_id: OFICINA_ID, cliente_id: 'cli-bradesco', cliente_nome: 'Bradesco Seguros', qtd_os: 1, valor_total: 7450 },
  { oficina_id: OFICINA_ID, cliente_id: 'cli-tokio', cliente_nome: 'Tokio Marine', qtd_os: 1, valor_total: 7200 },
  { oficina_id: OFICINA_ID, cliente_id: 'cli-juliana', cliente_nome: 'Juliana Prado', qtd_os: 1, valor_total: 4460 },
  { oficina_id: OFICINA_ID, cliente_id: 'cli-coop', cliente_nome: 'Unimed Frota', qtd_os: 1, valor_total: 3700 },
  { oficina_id: OFICINA_ID, cliente_id: 'cli-marcos', cliente_nome: 'Marcos Tadeu Oliveira', qtd_os: 1, valor_total: 3000 },
];

function margemOs(
  osId: string, numero: number, status: MargemRealOs['status'],
  valor: number, custoItens: number, custoMaterial: number
): MargemRealOs {
  const custoTotal = custoItens + custoMaterial;
  const margemReal = valor - custoTotal;
  return {
    os_id: osId, numero, status, valor,
    custo_itens: custoItens, custo_material: custoMaterial, custo_total: custoTotal,
    margem_real: margemReal, margem_pct: valor > 0 ? (margemReal / valor) * 100 : 0,
  };
}

export const MARGEM_REAL_DEMO: MargemRealOs[] = [
  margemOs('os-06', 52, 'aberta', 4460, 1910, 380),
  margemOs('os-05', 51, 'em_producao', 3700, 1840, 290),
  margemOs('os-04', 50, 'concluida', 7200, 3480, 540),
  margemOs('os-03', 49, 'entregue', 3000, 1380, 210),
  margemOs('os-02', 48, 'entregue', 7450, 3760, 470),
  margemOs('os-01', 47, 'entregue', 5570, 2620, 360),
];

/* ════════════════════════════════ PÁTIO (V3) ═════════════════════════════ */

export const INSUMO_ESTOURO_DEMO = [
  { oficina_id: OFICINA_ID, os_comercial_id: 'os-04', numero: 50, custo_insumo_estimado: 480, custo_insumo_consumido: 620, estouro: 140 },
  { oficina_id: OFICINA_ID, os_comercial_id: 'os-02', numero: 48, custo_insumo_estimado: 420, custo_insumo_consumido: 470, estouro: 50 },
];

export const CABINE_DESPERDICIO_DEMO = [
  { oficina_id: OFICINA_ID, os_comercial_id: 'os-05', aplicacao_inicio: tsRel(-2), cura_inicio: tsRel(-2), cura_fim: tsRel(-2), cura_minutos_padrao: 40, cura_minutos_real: 58, desperdicio_minutos: 18 },
  { oficina_id: OFICINA_ID, os_comercial_id: 'os-04', aplicacao_inicio: tsRel(-5), cura_inicio: tsRel(-5), cura_fim: tsRel(-5), cura_minutos_padrao: 40, cura_minutos_real: 47, desperdicio_minutos: 7 },
];

/* ════════════════════════════════ NOTAS FISCAIS ══════════════════════════ */

function nota(
  id: string, osId: string, tipo: NotaFiscal['tipo'], status: NotaFiscal['status'],
  numero: string | null, valor: number, dias: number
): NotaFiscal {
  return {
    id, oficina_id: OFICINA_ID, os_comercial_id: osId, tipo, status,
    agregador: 'focus-nfe', agregador_ref: numero ? `ref-${numero}` : null,
    numero, serie: numero ? '1' : null, valor,
    chave_acesso: status === 'autorizada' ? `3520${dataRel(dias).replace(/-/g, '')}00000000000000${numero ?? ''}` : null,
    xml_url: null, pdf_url: null,
    mensagem: status === 'autorizada' ? 'Autorizada pela SEFAZ.' : status === 'rascunho' ? 'Aguardando emissão.' : null,
    emitida_em: status === 'autorizada' ? tsRel(dias) : null,
    cancelada_em: null,
    criado_em: tsRel(dias), atualizado_em: tsRel(dias),
  };
}

/** Notas por OS (consumido por OS page via getNotasPorOs). */
export const NOTAS_POR_OS_DEMO: Record<string, NotaFiscal[]> = {
  'os-01': [nota('nf-01', 'os-01', 'nfse', 'autorizada', '1042', 4250, -27)],
  'os-02': [nota('nf-02', 'os-02', 'nfse', 'autorizada', '1043', 6000, -22)],
  'os-03': [nota('nf-03', 'os-03', 'nfse', 'autorizada', '1044', 1500, -14)],
  'os-04': [nota('nf-04', 'os-04', 'nfse', 'rascunho', null, 6200, -1)],
};
