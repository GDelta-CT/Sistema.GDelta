/**
 * status.ts — fonte ÚNICA de aparência por status/categoria do GDelta.
 *
 * Por que existe: o app vinha duplicando o mapa "status → rótulo + semáforo"
 * inline em cada tela (ex.: o objeto `OS_STATUS` e o ternário do semáforo de
 * margem em `painel/orcamentos/page.tsx`). Centralizar aqui garante rótulo e
 * tom idênticos em qualquer lugar e remove a chance de duas telas divergirem.
 *
 * Contrato: cada função devolve `{ label, tone }`, onde `tone` é EXATAMENTE um
 * dos tons que `src/components/ui/status-chip.tsx` aceita — nenhum tom novo é
 * inventado. O `label` é PT-BR e reusa a mesma grafia dos `const`s de domínio
 * (`STATUS_ORCAMENTO`, `STATUS_OS`, `CATEGORIAS_ESTOQUE`, `TIPOS_CLIENTE`), de
 * modo que esta camada é só apresentação — nenhuma lógica/dado/RPC é tocado.
 *
 * Puramente apresentacional e sem efeitos: server-safe (sem 'use client').
 */

import type { StatusOrcamento } from '@/lib/supabase/orcamentos';
import type { StatusOs } from '@/lib/supabase/os-comercial';
import type { CategoriaEstoque } from '@/lib/supabase/estoque';
import type { TipoCliente } from '@/lib/supabase/clientes';

/**
 * Tom do semáforo do chip — espelha 1:1 o tipo `Tone` aceito pelo `StatusChip`.
 * Mantido aqui como o tipo canônico de aparência para o app inteiro consumir.
 */
export type ChipTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

/** Aparência resolvida de um status/categoria: rótulo PT-BR + tom do chip. */
export type ChipAppearance = {
  /** Rótulo legível em PT-BR (ex.: "Em produção"). */
  label: string;
  /** Tom semântico aceito pelo `StatusChip`/`Chip`. */
  tone: ChipTone;
};

/* ── Orçamento ─────────────────────────────────────────────────────────── */

const ORCAMENTO_APPEARANCE: Record<StatusOrcamento, ChipAppearance> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  enviado: { label: 'Enviado', tone: 'primary' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  recusado: { label: 'Recusado', tone: 'danger' },
};

/** Aparência do chip para o status de um orçamento. */
export function statusOrcamento(status: StatusOrcamento): ChipAppearance {
  return ORCAMENTO_APPEARANCE[status];
}

/* ── OS comercial ──────────────────────────────────────────────────────── */

const OS_APPEARANCE: Record<StatusOs, ChipAppearance> = {
  aberta: { label: 'Aberta', tone: 'primary' },
  em_producao: { label: 'Em produção', tone: 'warning' },
  concluida: { label: 'Concluída', tone: 'success' },
  entregue: { label: 'Entregue', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

/** Aparência do chip para o status de uma OS comercial. */
export function statusOs(status: StatusOs): ChipAppearance {
  return OS_APPEARANCE[status];
}

/* ── Margem (semáforo) ─────────────────────────────────────────────────── */

/**
 * Semáforo de margem por faixa de percentual:
 *  - `< 0`   → Prejuízo  (danger)
 *  - `< 20`  → Atenção   (warning)
 *  - `>= 20` → Lucrativo (success)
 *
 * Recebe o percentual já calculado (ex.: `totais.margemPct`). É função, e não
 * mapa, porque a entrada é contínua — as mesmas faixas do semáforo inline da
 * tela de orçamentos.
 */
export function statusMargem(margemPct: number): ChipAppearance {
  if (margemPct < 0) return { label: 'Prejuízo', tone: 'danger' };
  if (margemPct < 20) return { label: 'Atenção', tone: 'warning' };
  return { label: 'Lucrativo', tone: 'success' };
}

/* ── Categoria de estoque (rótulo neutro de categoria, não status) ─────── */

const ESTOQUE_APPEARANCE: Record<CategoriaEstoque, ChipAppearance> = {
  peca: { label: 'Peça', tone: 'neutral' },
  materia_prima: { label: 'Matéria-prima', tone: 'neutral' },
  escritorio: { label: 'Escritório', tone: 'neutral' },
};

/** Aparência do chip para a categoria de um item de estoque. */
export function categoriaEstoque(categoria: CategoriaEstoque): ChipAppearance {
  return ESTOQUE_APPEARANCE[categoria];
}

/* ── Tipo de cliente ───────────────────────────────────────────────────── */

/**
 * Tom por tipo de cliente — fonte ÚNICA (rótulo + tom). O particular é neutro;
 * seguradora e cooperativa recebem tom próprio porque sinalizam o canal/origem
 * do faturamento (decisão de produto). A tela consome `tone` daqui — não pode
 * manter um mapa local divergente.
 */
const CLIENTE_APPEARANCE: Record<TipoCliente, ChipAppearance> = {
  particular: { label: 'Particular', tone: 'neutral' },
  seguradora: { label: 'Seguradora', tone: 'primary' },
  cooperativa: { label: 'Cooperativa', tone: 'success' },
};

/** Aparência do chip para o tipo de um cliente. */
export function tipoCliente(tipo: TipoCliente): ChipAppearance {
  return CLIENTE_APPEARANCE[tipo];
}
