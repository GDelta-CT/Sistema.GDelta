---
description: Aplica um design system salvo (de design-systems/<name>/) a um build - gera tokens.css/Tailwind e o ativa como tokens correntes.
argument-hint: [name] [--tailwind]
allowed-tools: Bash, Read, Write, Glob, Agent
---

Aplique o design system: $ARGUMENTS

Padrão: se nenhum `name` for dado, use `default` (a marca Uber).

Passos:
1. Resolva `name` (default = `default`). Confirme que `design-systems/<name>/design-tokens.json` existe; se não, liste os disponíveis em `design-systems/` e pare.
2. Gere o CSS aplicável: `bun ./.claude/skills/design-system-extractor/scripts/ds-to-css.ts design-systems/<name>/design-tokens.json --out design-systems/<name>/tokens.css` (adicione `--tailwind` se pedido).
3. Valide os tokens: `bun ./.claude/skills/frontend-build-modes/scripts/oklch-validate.ts design-systems/<name>/design-tokens.json` e reporte o contraste APCA.
4. Leia `design-systems/<name>/design-system.md` para carregar a intenção (papéis, estados, metáfora) — é o que o build deve respeitar, não só os valores.
5. Para usar num build: passe `--tokens design-systems/<name>/design-tokens.json` ao `/build-experience` ou `/build-product`. Sem `--tokens`, os builds já usam `design-systems/default/` (Uber).

Reporte ao usuário o caminho do `tokens.css`, o resultado do contraste, e a metáfora/voz do design system aplicado.
