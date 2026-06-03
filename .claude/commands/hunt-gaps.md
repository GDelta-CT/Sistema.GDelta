---
description: Caça gaps num escopo, código ou plano - com severidade, evidência por linha e fechamento proposto.
argument-hint: <path-ou-escopo> [--against <referência>]
allowed-tools: Bash, Read, Grep, Glob, Agent
---

Cace os gaps em: $ARGUMENTS

Passos:
1. Separe o alvo do flag opcional `--against <referência>` (ex.: comparar o código contra um escopo/spec). Se o alvo for um path, faça um inventário rápido com `find`/`grep` para o agente.
2. Dispare o agente `gap-hunter` no alvo. Se houver `--against`, peça que avalie o alvo contra a referência. Peça:
   - decomposição (Toulmin para argumentos; requisitos para features),
   - testes de gap (base-rate, falsificabilidade, hierarquia de evidência, loops, 9 padrões de Nous),
   - cada gap com severidade (Critical/Major/Minor), evidência por linha, fechamento e confiança.
3. Reporte ao usuário os gaps ordenados por severidade + os 3 que mais importam fechar. Ofereça salvar em `.agents-guru/gap-report.md`.

Verdicts categóricos, sem suavizar. Não implemente as correções — isso é fechamento proposto.
