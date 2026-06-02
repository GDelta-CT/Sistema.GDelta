---
name: frontend-build-modes
description: Constrói frontends e dashboards em dois modos (experience e product) com os padrões corretos de scroll, performance e proibições. Use ao implementar uma landing imersiva, uma experiência WebGL, um app React, ou um dashboard. Triggers - "build experience", "build product", "single-file HTML", "Next.js dashboard", "implement the frontend", "create the landing page", "build the dashboard".
---

# Frontend Build Modes

Decide o modo, implementa com os padrões certos e valida o output. Consome os tokens do `design-system-engine`. É a skill que o `frontend-forge` executa.

## Seletor de modo

| O brief é sobre... | Modo | Reference |
|---|---|---|
| landing, marketing, storytelling, portfolio, lançamento, "imersivo", "WebGL", "cinematográfico" | **experience** | `mode-experience.md` |
| app, dashboard, painel admin, CRUD, "dados", "tabela", "gráficos", produto com estado | **product** | `mode-product.md` |

Em dúvida, pergunte uma coisa: "isto é uma página para impressionar e converter (experience) ou uma ferramenta com estado e dados (product)?". Não construa nos dois modos de uma vez.

## Contrato de saída por modo

- **experience** → um arquivo `.html` self-contained (CSS + JS embedded ou via CDN) que abre direto no browser. Estrutura em `templates/experience-shell.html`.
- **product** → um projeto React/Next.js. Esqueleto de page em `templates/product-page.tsx.txt`.

Builds vão para `build-output/<modo>-<slug>/` (use `scripts/scaffold-output.ts` para criar a pasta).

## Sequência de build

1. Garanta que há `design-tokens.json` (se não, chame o `design-architect` antes).
2. Escolha o modo e leia o reference do modo + `scroll-patterns.md`.
3. Implemente seguindo os padrões. Releia `prohibitions.md` antes de escrever motion/grid/fonte.
4. Rode `scripts/oklch-validate.ts` nos tokens e `scripts/perf-audit.ts` no build.
5. Entregue com um relatório de conformidade (o que passou/falhou em `performance-budget.md`).

## Invioláveis (resumem `prohibitions.md`)

- Scroll nativo sempre. Zero Lenis/Locomotive.
- GSAP de scroll sempre com `scrub`, bidirecional. Nunca `toggleActions`/`once`.
- Anime só `transform`/`opacity`. 60fps.
- `prefers-reduced-motion` desliga tudo.
- Sem stock photos, sem lorem ipsum, sem Inter/Roboto default, sem grid `1fr 1fr 1fr`.

## shadcn MCP (modo product)

Se o shadcn MCP estiver disponível na sessão, use-o para buscar e instalar componentes (ver `mode-product.md`). Se ausente, há fallback por instruções de `npx shadcn@latest add` — o build não depende do MCP para funcionar.
