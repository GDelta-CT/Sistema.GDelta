# Checklist de autoria

Antes de considerar uma peça nova pronta:

## Skill

- [ ] `SKILL.md` com frontmatter `name` + `description` (o quê + quando + triggers).
- [ ] `description` começa pelo caso de uso principal (é truncada em ~1536 chars no listing).
- [ ] Princípio central em 1-2 frases; o resto em `references/` citado sob demanda.
- [ ] Toda reference em `references/` é citada no `SKILL.md` (doctor cobra).
- [ ] Adicionada ao array `SKILLS` em `scripts/doctor.ts`.

## Subagente

- [ ] Frontmatter: `name`, `description` (com "Do NOT use para X"), `tools` (mínimo), `model`, `maxTurns`.
- [ ] Tools certas: analista/juiz = Read/Grep/Glob/Bash; construtor = +Write/Edit.
- [ ] Corpo: DO / DO NOT / Processo / Output (PT-BR) / Safety.
- [ ] Carrega as skills que usa (não duplica o conhecimento delas).
- [ ] Adicionado ao array `AGENTS` em `scripts/doctor.ts`.

## Command (se houver)

- [ ] `.claude/commands/<nome>.md` com frontmatter `description` + `argument-hint` + `allowed-tools`.
- [ ] Passos numerados que despacham o agente certo.
- [ ] Adicionado ao array `COMMANDS` em `scripts/doctor.ts`.

## Sempre

- [ ] `bun ./scripts/doctor.ts` volta a 0.
- [ ] PT-BR no output, inglês nos identifiers, UTF-8, sem emoji.
- [ ] Registrado no índice de capacidades do `AGENTS.md` se for capacidade nova.
