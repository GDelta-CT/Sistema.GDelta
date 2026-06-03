---
description: Verifica que um build funciona e roda o loop corrige -> re-testa até passar (ou escala).
argument-hint: <path-do-build> [--max-iter 3]
allowed-tools: Bash, Read, Write, Edit, Glob, Agent
---

Verifique e estabilize o build em: $ARGUMENTS

Modo: loop de verificação (testar → corrigir → re-testar até GREEN).

Passos:
1. Resolva o path do build (arquivo `.html` = experience; diretório do projeto = product). Confirme que existe. Separe o flag `--max-iter <n>` (default 3).
2. Carregue os critérios de sucesso de `.agents-guru/plan.md` se existir; senão derive-os do contexto/brief e registre-os antes de iterar (skill `verification-loop`, reference `success-criteria.md`).
3. Itere até GREEN ou esgotar `--max-iter`:
   a. Dispare o agente `build-verifier` no build. Ele devolve GREEN/RED com evidência por falha.
   b. Se GREEN: pare o loop.
   c. Se RED: dispare o `frontend-forge` para corrigir **somente** as falhas reportadas (Surgical Changes — não refatore o resto), respeitando tokens e proibições. Volte ao passo (a).
4. Regra de ouro: se a MESMA falha sobreviver a duas correções, pare antes do limite e escale com a evidência e uma hipótese — não martele (reference `systematic-debugging.md`).
5. Reporte ao usuário: verdict final (GREEN/RED), o log de iterações (o que falhou e o que foi corrigido em cada uma) e a confiança. Em GREEN, sugira `/design-review` para a camada estética.

Builds só escrevem em `build-output/`. Verificação não julga estética — isso é `/design-review`.
