/**
 * VoltarPainel — o link "voltar" padrão das telas internas do painel.
 *
 * Server-safe: `next/link` não exige 'use client', e o componente é puramente
 * apresentacional (sem estado/efeitos). Padroniza o controle de retorno ao
 * /painel que hoje é repetido à mão em cada cabeçalho de tela.
 *
 * Anatomia: botão-link discreto (borda + texto fg-muted) com seta à esquerda e
 * o rótulo "Painel", realçando borda/texto no hover. Sem cor crua — só tokens.
 *
 * Acessibilidade: área de toque >= 44px (`min-h-11`, alinhada ao --min-touch do
 * globals); a seta é decorativa (aria-hidden), pois o texto "Painel" já rotula
 * o destino. Sem emoji.
 */

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';

export function VoltarPainel() {
  return (
    <Link
      href="/painel"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      <ArrowLeft size={16} weight="bold" aria-hidden />
      Painel
    </Link>
  );
}
