---
description: Implementa o backend/serviço/API no stack do projeto, seguindo o architecture-brief, e valida (build/typecheck/testes).
argument-hint: <brief|plano> [--path <codebase>]
allowed-tools: Bash, Read, Write, Edit, Glob, Agent
---

Construa o backend para: $ARGUMENTS

Modo fixado: service (backend).

Passos:
1. Se existir `.agents-guru/plan.md` / `.agents-guru/architecture-brief.md`, carregue-os. Senão, rode `/architect` antes — não implemente sem decisão de arquitetura.
2. Confirme o stack: em brownfield (`--path`), o detectado; em greenfield, o recomendado no brief.
3. Dispare o agente `backend-forge`. Ele deve implementar passo a passo conforme o plano (domínio → casos de uso → adapters/IO → contratos), escrever testes junto, e rodar build/typecheck/lint/suíte.
4. Encaminhe para `/verify` (modo service): testa → corrige → re-testa até verde.
5. Reporte o que foi implementado, os comandos e saídas de verificação, e como rodar.

Serviço novo e isolado vai em `build-output/`; alterações no source de um projeto-alvo seguem a política de permissões do projeto. Verificação objetiva é obrigatória antes de declarar pronto.
