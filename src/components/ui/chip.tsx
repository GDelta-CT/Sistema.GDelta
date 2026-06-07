/**
 * Chip — pílula genérica para rótulos de CATEGORIA (não status semântico).
 *
 * Quando usar: marcar coisas que classificam, mas não significam progresso/
 * saúde — tipo de cliente, categoria de estoque, etiquetas. Para status com
 * semáforo (orçamento, OS, margem) use `StatusChip` + o mapa de `@/lib/status`.
 *
 * Mesma anatomia visual do `StatusChip` (pílula `inline-flex` + gap, fundo
 * tintado, texto na cor do tom e anel interno via `color-mix(in oklch,
 * currentColor 15%, transparent)` — a mistura é fixada explicitamente porque
 * no Tailwind v4 `ring-current/15` sobre `currentColor` não resolve de forma
 * confiável). A diferença é só o padrão: aqui o tom é `neutral`, pois categoria
 * não carrega semáforo. Só tokens — sem cor crua, sem emoji.
 *
 * Server-safe (apresentacional puro, sem estado/efeitos → sem 'use client').
 */

import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

/** Tons disponíveis — idênticos aos do `StatusChip`, mapeados via tokens. */
type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

type ChipProps = {
  /** Tom da pílula. Padrão `neutral` — categoria não tem semáforo. */
  tone?: Tone;
  /** Ícone Phosphor opcional (o componente, ex.: `Tag`). Decorativo. */
  icon?: Icon;
  /** Rótulo do chip (ex.: "Seguradora"). */
  children: ReactNode;
};

/** Classes de fundo/texto por tom — só tokens, sem cor crua. */
const toneClass: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  neutral: 'bg-surface-sunken text-fg-muted',
};

export function Chip({ tone = 'neutral', icon: Icone, children }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-caption font-medium ring-1 ring-inset ring-[color-mix(in_oklch,currentColor_15%,transparent)] ${toneClass[tone]}`}
    >
      {Icone && <Icone size={13} weight="fill" aria-hidden className="shrink-0" />}
      {children}
    </span>
  );
}
