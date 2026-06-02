---
description: Constrói um app/dashboard de produção (Next.js + shadcn + Recharts + TanStack, dark mode, acessível).
argument-hint: <brief> [--tokens <path-do-design-tokens.json>]
allowed-tools: Bash, Read, Write, Edit, Glob, Agent
---

Construa um produto (app/dashboard) para: $ARGUMENTS

Modo fixado: product (Next.js/shadcn).

Passos:
1. Separe o brief do flag opcional `--tokens <path>`. Se não houver `--tokens`, o padrão do projeto é `design-systems/default/design-tokens.json` (a marca Uber).
2. Decida a fonte dos tokens: (a) `--tokens <path>` explícito; (b) uma marca já em `design-systems/<name>/`; (c) o `design-architect` para uma estética nova; (d) caso contrário, o `default` (Uber). Leia o `design-system.md` do design system escolhido para carregar a intenção (papéis, estados), não só os valores.
3. Dispare o agente `frontend-forge` com modo product e os tokens. Ele deve:
   - criar a pasta via `scaffold-output.ts product <slug>`,
   - implementar conforme `mode-product.md` (Next.js App Router, shadcn via MCP se disponível ou CLI como fallback, Recharts, TanStack Table, dark mode, WCAG AA),
   - respeitar as proibições (Tailwind customizado com tokens, sem genérico),
   - validar com `oklch-validate.ts` e `perf-audit.ts`.
4. Reporte ao usuário o caminho do projeto, o relatório de conformidade e como rodar o dev server.

Comandos de install (`npx shadcn`, `npm install`) exigem confirmação. Builds só escrevem em `build-output/`. Sugira `/design-review` no resultado.
