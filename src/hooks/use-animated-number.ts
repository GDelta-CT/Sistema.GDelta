/**
 * useAnimatedNumber — count-up suave de um número até o alvo, com easeOutCubic
 * via requestAnimationFrame, ciente de `prefers-reduced-motion`.
 *
 * Origem: a lógica vivia inline em `src/app/painel/orcamentos/page.tsx` (KPIs de
 * lucro e margem). Extraída aqui sem mudança de comportamento para qualquer KPI
 * animado reusar — a tela de orçamentos NÃO foi tocada.
 *
 * Comportamento preservado do original:
 *  - anima do valor ANTERIOR até o novo `value` quando `value` muda (guarda o
 *    ponto de partida em ref, então mudanças encadeiam de onde parou);
 *  - `setState` só dentro do callback do rAF (nunca no corpo do efeito);
 *  - respeita reduced-motion: salta direto ao alvo (duração 0);
 *  - cancela o frame pendente no cleanup.
 *
 * É a única razão de o hook ser client-only; quem o usa já roda em componente
 * 'use client'.
 */

import { useEffect, useRef, useState } from 'react';

/** Opções do count-up. */
export type AnimatedNumberOptions = {
  /** Duração da animação em ms (ignorada sob reduced-motion). Padrão 500. */
  duration?: number;
};

/**
 * Retorna `value` interpolado (count-up) em direção ao alvo. Passe o número de
 * destino; o hook devolve o valor corrente do quadro atual para renderizar.
 */
export function useAnimatedNumber(value: number, opts?: AnimatedNumberOptions): number {
  const duration = opts?.duration ?? 500;
  const [val, setVal] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : duration;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (value - from) * eased); // setState só no callback do rAF (não no corpo do effect)
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return val;
}
