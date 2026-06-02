# Performance budget

Targets verificáveis. Não são aspirações: o `perf-audit.ts` mede o que dá para medir, e o `awwwards-judge` checa o resto. Budget estourado é gap.

## Targets

| Métrica | Target | Limite duro |
|---|---|---|
| FPS (durante scroll) | 60 | nunca < 30 |
| LCP (Largest Contentful Paint) | < 2.5s | < 4s |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| Bundle (comprimido) | < 1MB | < 2MB |
| devicePixelRatio | cap 2x | nunca sem cap |

## Checklist de compositing (60fps)

- Animar apenas `transform` e `opacity` (compositing na GPU).
- `will-change` só em elementos prestes a animar, removido depois.
- `devicePixelRatio` capado em `Math.min(window.devicePixelRatio, 2)`.
- Resize handlers com debounce (~150ms).
- `requestAnimationFrame` para qualquer loop JS de animação.
- `IntersectionObserver` para pausar animações/Three.js fora da viewport.

## Checklist de scroll

- Sem Lenis/Locomotive/custom scroll.
- CSS Scroll-Driven usa GPU nativa.
- GSAP ScrollTrigger sempre com `scrub`.
- Todas as animações de scroll bidirecionais.
- Counters scrub-driven (revertem ao subir).
- Hero WebGL com `pin: true` + `100vh` + `self.progress`.
- Carrosséis horizontais com `invalidateOnRefresh: true`.

## Carregamento

- Fontes via `display=swap`; preconnect ao Google Fonts.
- Imagens `loading="lazy"` abaixo da dobra; dimensões explícitas para evitar CLS.
- Three.js só carregado quando o hero está prestes a entrar (ou no load, se for o hero).
- CSS crítico inline no modo experience (single-file já resolve).

## Acessibilidade (entra no budget de qualidade)

- WCAG AA: contraste APCA (Lc ≥ 75 body), navegação por teclado, foco visível, touch targets ≥ 44px, heading hierarchy, alt text, `prefers-reduced-motion`, `prefers-color-scheme`.

## O que o perf-audit.ts verifica

Tamanho de bundle/arquivo, presença de deps proibidas (grep), presença do bloco `prefers-reduced-motion`, atributo `lang`, meta SEO (title/description/og). O que ele não mede (LCP/CLS/FPS reais) deve ser confirmado manualmente ou via Lighthouse, e o `awwwards-judge` exige a evidência.
