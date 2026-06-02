---
name: design-system-extractor
description: Extrai um design system agêntico completo de um website ao vivo - tokens, componentes e motion - lendo a página RENDERIZADA via browser real (agent-browser), não o HTML cru. Use para clonar a linguagem visual de uma marca a partir de uma URL, ou recuperar tokens de um site. Triggers - "extract design system from", "rip the tokens of", "clone the brand at", "what's the design system of <url>", "extrair design system de".
---

# Design System Extractor

Faz a engenharia reversa do design system de um site e o escreve como um **design system agêntico**: um par `design-tokens.json` (máquina) + `design-system.md` (auto-suficiente para outro agente reproduzir a marca sem voltar à URL). Saída canônica em `design-systems/<name>/`.

## Por que este é melhor que extrair "na marra"

A falha comum (e a do brandcraft que auditamos) é *afirmar* que lê computed styles mas usar uma ferramenta que só devolve markdown/HTML. Aqui não:

1. **Browser real, computed styles reais.** Usa o CLI `agent-browser` para navegar a página renderizada, esperar fontes + network idle, e executar JS que lê `getComputedStyle` de elementos reais. Sem isso, "cor primária" é chute. Ver `references/computed-style-harvest.md`.
2. **Fonte única de verdade.** Tudo vai para `design-systems/<name>/` (um diretório por marca). Nunca arquivos `.md` soltos e duplicados.
3. **Determinístico onde dá, agêntico onde precisa.** O harvest (captura) e a normalização (`scripts/normalize-ds.ts`) são scripts; a síntese semântica (categorizar primária vs neutra, nomear a metáfora, escrever o `.md`) é o agente.
4. **Validado, não prometido.** Contraste APCA + gamut via `frontend-build-modes/scripts/oklch-validate.ts` (agora aceita hex e oklch). Build budget via `perf-audit.ts`.
5. **Zero dependência de terceiro.** Sem catálogo externo. Funciona em qualquer URL pública.
6. **Honesto.** Confiança calibrada por token e uma seção de gaps (o que não deu para extrair e por quê). Ver `reasoning-toolkit/references/confidence-calibration.md`.

## Pipeline

```
1. RECON      → agent-browser abre a URL, espera render, screenshot, mapeia páginas-chave
2. HARVEST    → eval do JS de captura (computed styles de 100+ elementos, todos os estados)   [computed-style-harvest.md]
3. NORMALIZE  → normalize-ds.ts: dedup cores, deriva escalas (GCD), categoriza, gera confiança
4. VALIDATE   → oklch-validate.ts (gamut + APCA, hex/oklch); flag o que falha
5. SYNTHESIZE → design-system.md agêntico (identidade, cor, tipo, espaço, motion, componentes, gaps)  [agentic-ds-format.md]
6. SAVE       → design-systems/<name>/{design-tokens.json, design-system.md, tokens.css}
```

Quando o DOM falha (anti-bot, SPA opaca, fonte só-PDF/Figma), caia para o escape hatch de visão descrito em `references/extraction-protocol.md` (screenshot → modelo de visão → tokens com confiança).

## Camadas (Atomic Design)

Extraia em todas: Tokens → Atoms → Molecules → Organisms → Templates → Pages. Parar em cor e fonte é uma paleta, não um design system. Detalhe do que capturar por camada em `references/extraction-protocol.md`.

## Saída

`design-systems/<name>/`:
- `design-tokens.json` — tokens canônicos (formato do projeto; valida no oklch-validate).
- `design-system.md` — o documento agêntico auto-suficiente (entrega primária).
- `tokens.css` — CSS custom properties prontas para aplicar (geradas por `scripts/ds-to-css.ts`).
- `PROVENANCE.md` — fonte, data, confiança e gaps.

## Aplicar

Para usar um design system extraído num build, ver o command `/apply-ds <name>` e `scripts/ds-to-css.ts`. O `default` do projeto é a marca **Uber** (`design-systems/default/`).
