---
name: component-libraries
description: Arsenal catalogado das melhores bibliotecas de UI/UX do ecossistema JS/TS (112 verificadas - gráficos, tabelas, grafos, fluxo, animação, 3D, canvas, design systems, headless, ícones, styling, markdown, editores, terminal, estado, forms, microinterações), todas com aceitação verificada em 2026 e CDN moderna. Use para ESCOLHER a biblioteca certa ao construir o que o usuário precisa. Triggers - "qual biblioteca para", "preciso de um gráfico", "lib de markdown", "componente de fluxo", "tabela de dados", "best library for", "which library", "node editor", "terminal component".
---

# Component Libraries (arsenal)

Catálogo de 112 bibliotecas (o pedido era ~100; entregamos mais, todas verificadas), garimpadas com evidência de downloads npm, stars e releases de jan-jun 2026. Cada uma com: para que serve, categoria, CDN moderna (esm.sh + jsdelivr) e a evidência de aceitação. Fonte única: `catalog.json`.

## Como o agente escolhe (workflow)

1. **Descubra a categoria** da necessidade. Liste-as: `bun ./.claude/skills/component-libraries/scripts/lib-search.ts --list-categories`.
2. **Busque por necessidade** (palavras): `lib-search.ts --need "node based flow editor"` ou por categoria: `lib-search.ts --category charts`. Retorna nome + propósito + CDN + nota.
3. **Pegue a CDN** do resultado: `cdn_esm` (ESM moderno via esm.sh, para import em browser/build) ou `cdn_script` (UMD via jsdelivr, para `<script>`); `null` em `cdn_script` significa que a lib exige bundler (React/headless/build-time).
4. **Respeite as proibições do projeto.** Se a escolha conflita com `frontend-build-modes/references/prohibitions.md` (ex.: Lenis = scroll-hijacking), não use em build de produção — o catálogo a marca com nota.
5. **Cheque o caveat** antes de adotar (só React? build-time? licença? cadência baixa?).

## Categorias

charts, tables, graph, flow, animation, 3d, canvas, scroll, component-library, headless, blocks, icons, styling, markdown, syntax, editor, terminal, state, forms, validation, toast, command, carousel, dnd, overlay, date, micro, virtualization.

O catálogo legível e agrupado fica em `references/catalog.md` (gerado de `catalog.json`).

## Critério de inclusão (não-negociável)

Só entram bibliotecas **vivas e bem aceitas nos últimos 5 meses** (jan-jun 2026): downloads npm reais, stars com atividade de commits, e releases em 2026. As declinantes/mortas foram descartadas (ex.: Drawflow sem release 2026, Locomotive em declínio). Onde um número não pôde ser confirmado, o `why_now` diz "não confirmado" — sem inventar.

## Escolha por modo de build

- **experience** (HTML imersivo): prefira o que tem `cdn_script`/`cdn_esm` usável direto (ECharts, GSAP, Three.js, Pixi, tsParticles, Embla, Splitting evitado). Single-file não tem bundler.
- **product** (Next.js/shadcn): prefira pacotes React (TanStack Table/Query, Recharts/visx, Radix/Base UI, Zustand, React Hook Form, Sonner, cmdk, dnd-kit).

## Atualizar o catálogo

`catalog.json` é a fonte única. Após editá-lo, regenere o legível:
`bun ./.claude/skills/component-libraries/scripts/lib-search.ts --md > ./.claude/skills/component-libraries/references/catalog.md`
