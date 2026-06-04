/**
 * PageHeader — cabeçalho de tela consistente em todo o painel.
 *
 * Server-safe (sem estado/efeitos → sem 'use client'): puramente
 * apresentacional. A `acao` (ex.: link "voltar ao painel") chega já montada,
 * então quem precisa de interatividade continua sendo o componente que chama.
 *
 * Anatomia: overline (uppercase, tracking, fg-subtle) → título (font-display,
 * text-h1) → descrição opcional, com um slot de ação alinhado à direita.
 *
 * Acessibilidade: usa um <header> semântico; a ação é só um slot, então fica a
 * cargo de quem chama garantir rótulo/área de toque (>= 44px, já no globals).
 * Sem cor crua e sem emoji — apenas tokens.
 */

import type { ReactNode } from 'react';

type PageHeaderProps = {
  /** Eyebrow curto acima do título (ex.: "GDelta · Cadastro"). */
  overline?: string;
  /** Título da tela (ex.: "Clientes"). */
  titulo: string;
  /** Subtítulo opcional, uma linha de contexto sob o título. */
  descricao?: string;
  /** Ação à direita (ex.: link de voltar). Renderizada no topo da linha. */
  acao?: ReactNode;
};

export function PageHeader({ overline, titulo, descricao, acao }: PageHeaderProps) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {overline && (
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">{overline}</p>
        )}
        <h1 className="font-display text-h1 text-fg">{titulo}</h1>
        {descricao && <p className="mt-1.5 text-small text-fg-muted">{descricao}</p>}
      </div>

      {acao && <div className="shrink-0">{acao}</div>}
    </header>
  );
}
