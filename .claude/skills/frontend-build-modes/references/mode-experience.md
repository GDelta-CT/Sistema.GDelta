# Modo experience (single-file HTML imersivo)

Para landing, storytelling, portfolio, lançamento. Entrega um `.html` que abre direto no browser, 60fps, nível awwwards.

## Stack

- **HTML5 semântico** — `<header> <main> <section> <nav> <footer>`, `<html lang="pt-BR">`.
- **CSS embedded** — design tokens via custom properties (OKLCH single-hue). Container queries para responsividade de componente.
- **CSS Scroll-Driven Animations** (prioridade 1) — `animation-timeline: view()`, `animation-range`. Cobre a maioria dos reveals sem JS.
- **GSAP 3.12 + ScrollTrigger** (prioridade 2, via CDN) — coreografia complexa, sempre com `scrub`. Padrões em `scroll-patterns.md`.
- **Three.js 0.170** (só modo cinematic, via CDN) — hero WebGL, partículas, shaders. Pinned + progress (ver `scroll-patterns.md`).
- **View Transitions API** — transições de seção/estado quando aplicável.

## CDNs (versões pinadas)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/ScrollTrigger.min.js"></script>
<!-- cinematic apenas: -->
<script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.170.0/build/three.module.js" } }</script>
```

Carregue fontes via Google Fonts com `display=swap`. Nunca Inter/Roboto/Arial como escolha estética (ver `prohibitions.md`).

## Estrutura do arquivo

Use `templates/experience-shell.html` como base. Ordem: `<head>` (meta SEO + og + `<style>` com tokens e `prefers-reduced-motion`) → `<body>` (header/nav, main com seções, footer) → `<script>` (GSAP/Three embedded).

## Princípios

- Whitespace massivo: `padding: clamp(5rem,12vh,8rem) clamp(1.5rem,4vw,3rem)`; hero `min-height: 100vh`.
- Grids assimétricos (`2fr 1fr 3fr`), section rhythm 2 dense:1 sparse (ver `composition-grammar.md`).
- Glassmorphism (`backdrop-filter: blur()`) como linguagem de elevação; noise overlay/gradient mesh sutil para tirar a chatice digital.
- Custom cursor / magnetic buttons como assinatura — opcional, mas sempre com fallback e `prefers-reduced-motion`.
- Cada animação serve à metáfora do vision-brief. Motion sem significado é decoração.

## Não testar antes de apresentar

Evite testar o artefato antes de mostrá-lo (adiciona latência entre o pedido e o resultado visível). Apresente, depois teste e itere.

## Output

`build-output/experience-<slug>/index.html` + (se houver) `/assets`. Rode `perf-audit.ts` apontando para o arquivo.
