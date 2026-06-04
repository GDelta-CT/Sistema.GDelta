/**
 * EmptyState — estado vazio premium, consistente em todo o painel.
 *
 * Server-safe (sem estado/efeitos → sem 'use client'): é puramente
 * apresentacional. Quando precisar de uma ação interativa (botão/link), passe-a
 * já montada via `acao` — o client component fica com quem chama.
 *
 * Anatomia: ícone num círculo tintado (bg-primary/10 text-primary) → título
 * (font-display) → descrição opcional → ação opcional. Centralizado, com
 * respiro, dentro de um card de borda tracejada (mesma linguagem das telas).
 *
 * Acessibilidade: o ícone é decorativo (aria-hidden, via IconProps). O bloco usa
 * role="status" para anunciar discretamente "lista vazia" a leitores de tela
 * sem roubar o foco. Sem cor crua e sem emoji — só tokens.
 */

import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  /** Ícone Phosphor (o componente, ex.: `Storefront`). Renderizado decorativo. */
  icon: Icon;
  /** Título curto do estado vazio (ex.: "Nenhum cliente ainda"). */
  titulo: string;
  /** Linha de apoio opcional, orientando o próximo passo. */
  descricao?: string;
  /** Ação opcional (ex.: botão/link "Adicionar"), renderizada abaixo do texto. */
  acao?: ReactNode;
};

export function EmptyState({ icon: Icone, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <span
        className="inline-flex h-14 w-14 items-center justify-center rounded-pill bg-primary/10 text-primary"
        aria-hidden
      >
        <Icone size={28} weight="duotone" />
      </span>

      <div className="flex flex-col gap-1.5">
        <p className="font-display text-h3 text-fg">{titulo}</p>
        {descricao && <p className="max-w-prose text-small text-fg-muted">{descricao}</p>}
      </div>

      {acao && <div className="mt-1">{acao}</div>}
    </div>
  );
}
