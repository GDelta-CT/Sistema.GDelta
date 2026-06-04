'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Reveal-on-scroll discreto, via IntersectionObserver (sem biblioteca).
 *
 * Princípios (skill frontend-build-modes):
 * - Anima APENAS `opacity` + `transform` (compositing na GPU, 60fps).
 * - Respeita `prefers-reduced-motion`: aparece instantâneo, zero transição.
 * - SSR-safe: o conteúdo é renderizado de cara (visível por padrão). A classe
 *   inicial "escondida" só é aplicada no cliente, quando há motion permitido —
 *   assim, sem JS ou com reduced-motion, nada fica preso invisível.
 * - Dispara uma vez (a entrada é a recompensa; não re-anima ao subir, evitando
 *   distração — diferente de scroll-scrub de experiência imersiva).
 */

type RevealProps = {
  children: ReactNode;
  /** Tag semântica do wrapper (default: div). */
  as?: ElementType;
  /** Atraso em ms para escalonar (stagger) elementos irmãos. */
  delay?: number;
  /** Deslocamento vertical inicial em px (default 24). */
  y?: number;
  className?: string;
  /** id para âncoras de navegação. */
  id?: string;
};

export function Reveal({
  children,
  as,
  delay = 0,
  y = 24,
  className = '',
  id,
}: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  // animate=false => renderiza visível (estado SSR / sem-motion). Só vira true
  // no cliente quando confirmamos que há motion e que devemos escondê-lo antes.
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setShown(true);
      return;
    }

    // Há motion permitido: arma o estado inicial escondido e observa a entrada.
    setArmed(true);

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  const hidden = armed && !shown;

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0, ${y}px, 0)` : 'translate3d(0, 0, 0)',
        transition: armed
          ? `opacity 640ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 640ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
          : undefined,
        willChange: hidden ? 'opacity, transform' : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
