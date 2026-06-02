---
description: Rastreia dependências (código e lógicas) até o elo mais fraco e deriva a ordem de resolução.
argument-hint: <path-ou-lista-de-gaps>
allowed-tools: Bash, Read, Grep, Glob, Agent
---

Rastreie as dependências de: $ARGUMENTS

Passos:
1. Determine se o alvo é código (um path) ou lógica (uma lista de gaps/decisões, ex.: do `.frontend-guru/gap-report.md`).
2. Para código, mapeie imports/acoplamentos com `grep`/`find` para dar ao agente o grafo bruto.
3. Dispare o agente `dependency-tracer`. Peça:
   - o grafo/DAG textual com tipo de cada aresta,
   - o elo mais fraco e o que ele derruba,
   - a ordem de resolução (primeiro o que destrava mais),
   - confiança do mapa.
4. Reporte ao usuário e ofereça salvar em `.frontend-guru/dependency-map.md`.

Não altere código. Aponte ciclos (código) ou raciocínio circular (lógica) como gaps de dependência.
