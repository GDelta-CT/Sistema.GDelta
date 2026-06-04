/**
 * StatusChip — chip "pílula" de status consistente em todo o painel.
 *
 * Server-safe (sem estado/efeitos → sem 'use client'): é puramente
 * apresentacional. O semáforo vem de `tone`, mapeado SÓ por tokens (sem cor
 * crua), e o ícone opcional chega já como componente Phosphor via quem chama.
 *
 * Anatomia: pílula com `inline-flex` + gap, fundo tintado e texto na cor do
 * tom, mais um anel interno discreto que herda a cor do texto. O anel usa
 * `color-mix(in oklch, currentColor 15%, transparent)` em vez do frágil
 * `ring-current/15` — no Tailwind v4 a sintaxe `/<alpha>` sobre `currentColor`
 * não resolve de forma confiável, então fixamos a mistura explicitamente.
 *
 * Acessibilidade: o ícone é decorativo (aria-hidden via IconProps), pois o
 * texto do chip já nomeia o status. Sem cor crua e sem emoji — apenas tokens.
 */

import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

/** Tons do semáforo, cada um mapeado para um par fundo/texto via tokens. */
type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

type StatusChipProps = {
  /** Tom semântico do status (define fundo + cor do texto). */
  tone: Tone;
  /** Ícone Phosphor opcional (o componente, ex.: `CheckCircle`). Decorativo. */
  icon?: Icon;
  /** Rótulo do chip (ex.: "Autorizada"). */
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

export function StatusChip({ tone, icon: Icone, children }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-caption font-medium ring-1 ring-inset ring-[color-mix(in_oklch,currentColor_15%,transparent)] ${toneClass[tone]}`}
    >
      {Icone && <Icone size={13} weight="fill" aria-hidden className="shrink-0" />}
      {children}
    </span>
  );
}
