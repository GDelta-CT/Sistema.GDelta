---
description: Identifica as necessidades técnicas e escolhe a arquitetura + padrões de desenho de código, com trade-offs e plano.
argument-hint: <brief> [--path <codebase>]
allowed-tools: Bash, Read, Grep, Glob, Agent
---

Desenhe a arquitetura para: $ARGUMENTS

Passos:
1. Separe o brief do flag `--path <codebase>`. Se houver `--path`, é brownfield: rode ou leia o mapa do `brownfield-cartographer` antes de decidir.
2. Dispare o agente `backend-architect`. Ele deve: extrair as forças, listar 2-3 padrões candidatos (skill `code-design-patterns`), escolher pelo trade-off, definir fronteiras/dados/contratos e produzir um plano implementável com critérios de sucesso.
3. Reporte ao usuário: o architecture-brief (forças, candidatos comparados, decisão + trade-off, riscos), o plano e a confiança. Ofereça salvar em `.agents-guru/architecture-brief.md` + `.agents-guru/plan.md`.
4. Sugira `/build-backend` (ou o `build-*` do modo) no resultado.

O arquiteto não implementa — decide e planeja. Em brownfield, respeita o stack detectado e só propõe mudança estrutural com custo declarado.
