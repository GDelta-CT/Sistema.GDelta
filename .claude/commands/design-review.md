---
description: Avalia um build pelos critérios de uma jury awwwards (24 itens) com evidência objetiva e verdict.
argument-hint: <path-do-build>
allowed-tools: Bash, Read, Grep, Glob, Agent
---

Avalie o build em: $ARGUMENTS

Passos:
1. Resolva o path do build (arquivo .html ou diretório do projeto). Confirme que existe.
2. Dispare o agente `awwwards-judge` no build. Ele deve:
   - rodar `perf-audit.ts` e `oklch-validate.ts` para evidência objetiva,
   - percorrer o checklist de 24 itens (Design 40 / Usability 30 / Creativity 20 / Content 10),
   - aplicar os hard rejects,
   - pontuar e classificar (SOTD / Honorable Mention / Needs Work / Fail).
3. Reporte ao usuário o scorecard com evidência por item, os sub-scores, o total ponderado, o veredito e as ações priorizadas por impacto. Ofereça salvar em `.frontend-guru/awwwards-score.md`.

O juiz não conserta o build — propõe as correções. Itens BLOCKING não passam sem evidência.
