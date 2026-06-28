/**
 * Camada de dados de Fornecedores & Contas a Pagar (aba 🧾 Fornecedores da
 * Planilha-Sistema GDelta v2.0).
 *
 * O QUE FAZ: lê o cadastro de fornecedores e os títulos a pagar (com status,
 * vencimento e fornecedor), e deriva o resumo do módulo — total a pagar EM
 * ABERTO e total VENCIDO (vencimento < hoje e ainda em aberto). Agrupa os
 * títulos por fornecedor para a tela montar a lista.
 *
 * FAIL-SOFT TOTAL (igual ./patio.ts, ./kpis.ts e ./dre.ts): este módulo NUNCA
 * lança. Cada leitura é feita dentro de try/catch e, em qualquer falha (tabela
 * inexistente, token ausente, RLS, timeout), degrada para vazio. A tabela
 * `fornecedores` e `contas_a_pagar` nascem na migration 0019, que AINDA NÃO foi
 * aplicada no TEST — até lá tudo volta vazio e a tela mostra um estado HONESTO
 * ("aguardando dados — aplicar migration 0019 no TEST"), nunca um erro. Quando a
 * 0019 for aplicada, os dados aparecem sem mudar a API.
 *
 * Sem digitação dupla: tudo vem das tabelas (fonte da verdade); nada é recriado.
 * O `oficina_id` NUNCA é enviado/filtrado aqui — a RLS isola por oficina via JWT.
 *
 * Pontos de contrato (ver migration 0019):
 *  - fornecedores(id, nome, categoria, email, telefone, ativo): cabeçalho.
 *  - contas_a_pagar(id, fornecedor_id, descricao, categoria, valor, vencimento,
 *    status 'aberto'|'pago', pago_em): título a pagar. `valor` pode vir como
 *    string do PostgREST → sempre `Number(...)` antes de somar/formatar.
 */

import { getSupabase } from './client';
import type { ChipTone } from '@/lib/status';

/* ───────────────────────────── Tipos do domínio ──────────────────────────── */

/** Status persistido do título a pagar (espelha o CHECK da tabela). */
export type StatusContaPagar = 'aberto' | 'pago';

/**
 * Status EXIBIDO de um título — deriva do persistido + do vencimento: um título
 * 'aberto' com vencimento no passado é apresentado como 'vencida' (não muda o
 * dado, só a leitura). 'pago' permanece 'pago'.
 */
export type StatusExibicaoConta = 'aberta' | 'vencida' | 'paga';

/** Fornecedor (cadastro) — campos da tabela `fornecedores` usados pela tela. */
export type Fornecedor = {
  id: string;
  nome: string;
  categoria: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

/** Título a pagar (linha de `contas_a_pagar`) usado pela tela. */
export type ContaPagar = {
  id: string;
  fornecedor_id: string | null;
  descricao: string;
  categoria: string | null;
  valor: number;
  vencimento: string; // data ISO (YYYY-MM-DD)
  status: StatusContaPagar;
  pago_em: string | null;
};

/** Título já enriquecido para a tela: status de exibição resolvido + flag. */
export type ContaPagarEnriquecida = ContaPagar & {
  /** Status de exibição (aberta | vencida | paga), derivado de status + vencimento. */
  statusExibicao: StatusExibicaoConta;
  /** `true` quando 'aberto' e vencimento < hoje (entra no total vencido). */
  vencida: boolean;
};

/** Grupo de títulos sob um fornecedor (ou "Sem fornecedor" quando FK nula). */
export type GrupoFornecedor = {
  /** id do fornecedor, ou `null` para o grupo "Sem fornecedor". */
  fornecedorId: string | null;
  /** Nome do fornecedor (resolvido do cadastro) ou rótulo padrão. */
  nome: string;
  /** Categoria do fornecedor (do cadastro), quando houver. */
  categoria: string | null;
  /** Títulos do fornecedor, já enriquecidos (ordenados por vencimento asc). */
  contas: ContaPagarEnriquecida[];
  /** Total a pagar EM ABERTO deste fornecedor (aberta + vencida). */
  totalAberto: number;
  /** Total VENCIDO deste fornecedor (subconjunto do aberto). */
  totalVencido: number;
};

/** Resumo do módulo: o que a oficina deve, e o que já está vencido. */
export type ResumoContasPagar = {
  /** Soma dos títulos em aberto (status 'aberto'), inclui os vencidos. */
  totalAberto: number;
  /** Soma dos títulos vencidos (aberto e vencimento < hoje). */
  totalVencido: number;
  /** Quantidade de títulos em aberto. */
  qtdAberta: number;
  /** Quantidade de títulos vencidos. */
  qtdVencida: number;
  /** Quantidade total de títulos lidos (qualquer status). */
  qtdTotal: number;
};

/** Pacote completo do módulo Fornecedores — tudo o que a tela precisa. */
export type FornecedoresContasPagar = {
  fornecedores: Fornecedor[];
  contas: ContaPagarEnriquecida[];
  /** Títulos agrupados por fornecedor (ordenados por total em aberto desc). */
  grupos: GrupoFornecedor[];
  resumo: ResumoContasPagar;
  /**
   * `true` quando NÃO há nenhum dado (sem fornecedores e sem contas) — a tela
   * mostra o estado honesto "aguardando dados (aplicar migration 0019 no TEST)".
   * Vale tanto para banco vazio quanto para a tabela ainda não existir.
   */
  aguardandoDados: boolean;
};

/* ─────────────────────── Apresentação do status (chip) ────────────────────── */

/** Rótulo PT-BR + tom do chip por status de exibição (fonte única daqui). */
export const STATUS_CONTA_APPEARANCE: Record<
  StatusExibicaoConta,
  { label: string; tone: ChipTone }
> = {
  aberta: { label: 'Em aberto', tone: 'primary' },
  vencida: { label: 'Vencida', tone: 'danger' },
  paga: { label: 'Paga', tone: 'success' },
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

const COLS_FORNECEDORES = 'id, nome, categoria, email, telefone, ativo';
const COLS_CONTAS_PAGAR =
  'id, fornecedor_id, descricao, categoria, valor, vencimento, status, pago_em';

/**
 * Lê o cadastro de fornecedores (ativos e inativos) — fail-soft (retorna []).
 * A tabela nasce na migration 0019; até lá qualquer erro degrada para vazio.
 */
async function lerFornecedores(): Promise<Fornecedor[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('fornecedores').select(COLS_FORNECEDORES)
    )) as QueryResult<Fornecedor[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Lê os títulos a pagar — fail-soft (retorna []). A tabela nasce na migration
 * 0019; até lá qualquer erro degrada para vazio.
 */
async function lerContasPagar(): Promise<ContaPagar[]> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('contas_a_pagar').select(COLS_CONTAS_PAGAR)
    )) as QueryResult<ContaPagar[]>;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/* ───────────────────────────── Derivações ────────────────────────────────── */

/** Número seguro (PostgREST pode devolver numérico como string). */
function num(v: number): number {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/** Data de hoje em ISO (YYYY-MM-DD), para comparar com `vencimento` (date). */
function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Enriquece um título: resolve o status de exibição (aberta | vencida | paga)
 * comparando o vencimento com hoje. 'pago' sempre vira 'paga'; 'aberto' com
 * vencimento estritamente anterior a hoje vira 'vencida'.
 */
function enriquecer(conta: ContaPagar, hoje: string): ContaPagarEnriquecida {
  const valor = num(conta.valor);
  if (conta.status === 'pago') {
    return { ...conta, valor, statusExibicao: 'paga', vencida: false };
  }
  const vencida = conta.vencimento < hoje;
  return {
    ...conta,
    valor,
    statusExibicao: vencida ? 'vencida' : 'aberta',
    vencida,
  };
}

/**
 * Monta o pacote do módulo a partir do cadastro e dos títulos.
 *
 * Agrupa por fornecedor (chave = fornecedor_id; títulos com FK nula caem no
 * grupo "Sem fornecedor"), ordena cada grupo por vencimento crescente (o mais
 * urgente primeiro) e os grupos por total em aberto decrescente (quem mais se
 * deve no topo). O resumo soma os títulos em aberto e o subconjunto vencido.
 */
function montar(
  fornecedores: Fornecedor[],
  contas: ContaPagar[]
): FornecedoresContasPagar {
  const hoje = hojeIso();
  const enriquecidas = contas.map((c) => enriquecer(c, hoje));

  // Resumo global.
  const emAberto = enriquecidas.filter((c) => c.status === 'aberto');
  const vencidas = emAberto.filter((c) => c.vencida);
  const resumo: ResumoContasPagar = {
    totalAberto: emAberto.reduce((a, c) => a + c.valor, 0),
    totalVencido: vencidas.reduce((a, c) => a + c.valor, 0),
    qtdAberta: emAberto.length,
    qtdVencida: vencidas.length,
    qtdTotal: enriquecidas.length,
  };

  // Índice de fornecedores por id (nome/categoria do cadastro).
  const porId = new Map(fornecedores.map((f) => [f.id, f]));

  // Agrupa os títulos por fornecedor_id (null = "Sem fornecedor").
  const grupos = new Map<string, GrupoFornecedor>();
  const CHAVE_SEM = '__sem_fornecedor__';

  for (const conta of enriquecidas) {
    const chave = conta.fornecedor_id ?? CHAVE_SEM;
    let grupo = grupos.get(chave);
    if (!grupo) {
      const f = conta.fornecedor_id ? porId.get(conta.fornecedor_id) : undefined;
      grupo = {
        fornecedorId: conta.fornecedor_id,
        nome: f?.nome ?? 'Sem fornecedor',
        categoria: f?.categoria ?? null,
        contas: [],
        totalAberto: 0,
        totalVencido: 0,
      };
      grupos.set(chave, grupo);
    }
    grupo.contas.push(conta);
    if (conta.status === 'aberto') {
      grupo.totalAberto += conta.valor;
      if (conta.vencida) grupo.totalVencido += conta.valor;
    }
  }

  // Garante um grupo para fornecedores cadastrados SEM nenhum título (cadastro
  // existe mas ainda não há conta) — aparecem com totais zerados/sem títulos.
  for (const f of fornecedores) {
    if (!grupos.has(f.id)) {
      grupos.set(f.id, {
        fornecedorId: f.id,
        nome: f.nome,
        categoria: f.categoria,
        contas: [],
        totalAberto: 0,
        totalVencido: 0,
      });
    }
  }

  // Ordena os títulos de cada grupo por vencimento crescente (mais urgente 1º).
  const listaGrupos = [...grupos.values()];
  for (const g of listaGrupos) {
    g.contas.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }
  // Grupos: quem tem mais em aberto primeiro; empate vai por nome (estável e
  // previsível), com "Sem fornecedor" naturalmente ao fim quando zerado.
  listaGrupos.sort(
    (a, b) => b.totalAberto - a.totalAberto || a.nome.localeCompare(b.nome, 'pt-BR')
  );

  const aguardandoDados = fornecedores.length === 0 && enriquecidas.length === 0;

  return {
    fornecedores,
    contas: enriquecidas,
    grupos: listaGrupos,
    resumo,
    aguardandoDados,
  };
}

/**
 * Carrega o módulo Fornecedores & Contas a Pagar inteiro.
 * FAIL-SOFT TOTAL: jamais lança; cada leitura degrada para vazio. Enquanto a
 * migration 0019 não estiver aplicada no TEST, volta tudo vazio com
 * `aguardandoDados: true` — a tela renderiza o estado honesto, nunca um erro.
 */
export async function carregarFornecedoresContasPagar(): Promise<FornecedoresContasPagar> {
  const [fornecedores, contas] = await Promise.all([
    lerFornecedores(),
    lerContasPagar(),
  ]);
  return montar(fornecedores, contas);
}
