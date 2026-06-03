---
description: Amplia a visão e as necessidades a partir de um brief - revela necessidades ocultas e ranqueia assumptions.
argument-hint: <brief-ou-objetivo> [--map <path-do-territory-map>]
allowed-tools: Read, Grep, Glob, Agent
---

Amplie o escopo a partir de: $ARGUMENTS

Passos:
1. Separe o brief do flag opcional `--map <path>`. Se houver `--map`, leia o mapa do território (output anterior do `/comprehend`) para ancorar a ampliação no que o projeto realmente é.
2. Dispare o agente `scope-amplifier` com o brief (e o mapa, se houver). Peça:
   - classificação Cynefin + abordagem,
   - necessidades explícitas vs ocultas (efeitos de 2ª a 5ª ordem, cada uma justificada),
   - assumptions ranqueadas por sensibilidade,
   - perguntas de validação priorizadas.
3. Reporte ao usuário e ofereça salvar em `.agents-guru/scope-amplified.md`.

Se o brief estiver ambíguo demais para ampliar com responsabilidade, traga as perguntas de validação antes de inventar escopo.
