/**
 * Layout do Painel — host da faixa de MODO DEMO.
 *
 * É um passthrough: renderiza a `DemoBanner` (que só aparece quando
 * `NEXT_PUBLIC_DEMO=1`; caso contrário devolve `null`) acima das páginas do
 * painel. Em produção/dev normal este layout não muda nada visível — a banner
 * vira `null` e o `{children}` continua exatamente como antes. 100% aditivo.
 *
 * Server Component (sem 'use client'): só compõe a árvore.
 */

import type { ReactNode } from 'react';
import { DemoBanner } from '@/components/demo-banner';

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DemoBanner />
      {children}
    </>
  );
}
