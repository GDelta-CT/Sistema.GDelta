'use client';

import { IconContext } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

/**
 * Provider único de estilo dos ícones Phosphor (client-side).
 * Padrão do projeto: weight "regular" + size 20 (fallback).
 * Trocar o weight AQUI muda todos os ícones de client components de uma vez.
 * Ícones que passam weight/size explícito continuam mandando neles.
 *
 * Obs.: a landing (page.tsx) usa ícones de @phosphor-icons/react/dist/ssr,
 * que são estáticos e NÃO leem este contexto — por isso não são afetados.
 */
export function IconProvider({ children }: { children: ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: 'regular', size: 20 }}>
      {children}
    </IconContext.Provider>
  );
}
