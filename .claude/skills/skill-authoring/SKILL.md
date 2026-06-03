---
name: skill-authoring
description: Como escrever uma skill ou um subagente novo no padrão do agents-guru, para o sistema crescer impecável e sem inchar. Use ao adicionar uma capacidade nova, ao extrair uma seção repetida do CLAUDE.md para uma skill, ou ao criar um papel. Triggers - "create a skill", "add a subagent", "extract this into a skill", "new capability", "how to write a skill".
---

# Skill Authoring

O agents-guru cresce sem inchar porque cada peça nova segue o mesmo padrão: fina no topo, profunda sob demanda, registrada no doctor. Consumido pelo dono ao estender o sistema. O método vem do padrão de Agent Skills (progressive disclosure) + o que já é convenção aqui.

## Skill vs subagente vs regra (escolha certa)

- **Regra no `CLAUDE.md`/`AGENTS.md`** — fato curto que vale SEMPRE e amplamente. Pode demais: arquivo inchado faz o agente ignorar regras.
- **Skill** — procedimento/conhecimento que vale ÀS VEZES. Carrega sob demanda; não pesa o contexto até ser usado.
- **Subagente** — um papel com contexto isolado (revisar, investigar, construir). Quando o ganho de isolamento justifica o custo de tokens.

## Anatomia de uma skill (ver `authoring-checklist.md`)

- `SKILL.md` fino: frontmatter `name` + `description` (o quê + QUANDO + triggers), princípio central, o fluxo, resumos que apontam para `references/`.
- `references/*.md`: o material longo, carregado só quando citado (progressive disclosure).
- Cite no `SKILL.md` todo arquivo que existe em `references/` — o doctor cobra isso.

## Anatomia de um subagente

- Frontmatter: `name`, `description` (com cláusula "Do NOT use para X — isso é o agente Y"), `tools` (o mínimo), `model`, `maxTurns`.
- Corpo: papel em uma linha, skills a carregar, DO / DO NOT / Processo / Output (PT-BR) / Safety.
- Read-only (Read/Grep/Glob/Bash) para analistas e juízes; +Write/Edit só para quem constrói.

## A regra de ouro

Toda peça nova é registrada no `scripts/doctor.ts` (agente, command, skill ou reference) e `bun doctor` volta a 0. Peça não registrada é peça que apodrece sem ninguém perceber.

## Anti-padrões

- Skill que repete o que o `CLAUDE.md` já diz.
- `description` sem o "quando usar" (o agente não sabe quando acionar).
- Reference órfã (existe mas não é citada) — o doctor reprova.
- Subagente com tools demais "por garantia".
