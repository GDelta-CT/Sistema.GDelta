---
description: Constrói uma experiência frontend imersiva (single-file HTML, Three.js/GSAP/CSS scroll-driven, 60fps).
argument-hint: <brief> [--tokens <path-do-design-tokens.json>]
allowed-tools: Bash, Read, Write, Edit, Glob, Agent
---

Construa uma experiência imersiva para: $ARGUMENTS

Modo fixado: experience (single-file HTML).

Passos:
1. Separe o brief do flag opcional `--tokens <path>`. Se não houver `--tokens`, o padrão do projeto é `design-systems/default/design-tokens.json` (a marca Uber).
2. Decida a fonte dos tokens: (a) `--tokens <path>` explícito; (b) se o brief pede uma marca já em `design-systems/<name>/`, use-a; (c) se o brief pede uma estética nova/própria, dispare o `design-architect` para gerar tokens do zero; (d) caso contrário, use o `default` (Uber). Leia o `design-system.md` do design system escolhido para carregar a intenção (papéis, estados, metáfora), não só os valores.
3. Dispare o agente `frontend-forge` com modo experience e os tokens. Ele deve:
   - criar a pasta via `scaffold-output.ts experience <slug>`,
   - implementar conforme `mode-experience.md` + `scroll-patterns.md` (CSS scroll-driven primeiro, GSAP scrub depois),
   - respeitar todas as proibições,
   - validar com `oklch-validate.ts` e `perf-audit.ts`.
4. Reporte ao usuário o caminho do `.html`, o relatório de conformidade e como abrir no browser.

Builds só escrevem em `build-output/`. Sugira rodar `/design-review` no resultado.
