# Motion grammar

Motion tem propósito: cada animação transmite significado, não decoração. Regras que mantêm 60fps e nível awwwards.

## Hierarquia de implementação (prioridade)

1. **CSS Scroll-Driven Animations** (nativo, zero JS): `animation-timeline: view()` + `animation-range`. Cobre ~80% das animações de scroll. GPU-aceleradas, bidirecionais por construção.
2. **GSAP 3.12 ScrollTrigger** com `scrub` — para coreografia complexa que o CSS não cobre. Sempre `scrub`, nunca `toggleActions`/`once`.
3. **IntersectionObserver** — para disparos leves (lazy-load, pausar off-screen). Threshold ~0.15.

## Valores de scrub

| Valor | Uso |
|---|---|
| `0.5` | carrosséis horizontais, movimento que segue o dedo de perto |
| `0.8` | reveals de seção (padrão) |
| `1.0` | parallax lento, profundidade |

`scrub: true` (sem número) prende ao scroll 1:1; o número adiciona suavização (lag em segundos).

## Bidirecionalidade (não-negociável)

Animações de scroll avançam ao descer e **revertem ao subir**, pixel a pixel. Counters numéricos revertem quando o scroll volta. É por isso que `toggleActions: "play none none none"` e `once: true` são proibidos para scroll — eles tornam a animação unidirecional, o que a jury do awwwards penaliza.

## Curvas por personalidade

(Espelha `brand-discovery.md`.)

| Personalidade | Easing | Duração |
|---|---|---|
| Luxury | `cubic-bezier(0.76, 0, 0.24, 1)` | 700-1200ms |
| Tech | `cubic-bezier(0.4, 0, 0.2, 1)` | 200-300ms |
| Playful | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 400-600ms |
| Editorial | `cubic-bezier(0.9, 0, 0.1, 1)` | 800-1500ms |

GSAP `power3.out` é um default premium para reveals.

## O que NÃO usa scrub

Nem tudo é scroll-driven: hover states, focus, glows/pulsos contínuos, preloaders e micro-interações de clique usam transitions/timelines normais. Scrub é só para o que deve acompanhar o scroll.

## prefers-reduced-motion (binário, não "sutil")

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Não tente "reduzir" a animação — desligue. O conteúdo deve ficar 100% utilizável e visível sem nenhum movimento.

## Performance

Anime apenas `transform` e `opacity` (compositing na GPU). `will-change` só em elementos prestes a animar, nunca preventivamente. Detalhe de budget em `frontend-build-modes/references/performance-budget.md`.

## Saída

```
motion (em design-tokens.json):
  personality: "luxury"
  easing: "cubic-bezier(0.76, 0, 0.24, 1)"
  scrub: { section: 0.8, carousel: 0.5, parallax: 1.0 }
  stagger: 0.08
```
