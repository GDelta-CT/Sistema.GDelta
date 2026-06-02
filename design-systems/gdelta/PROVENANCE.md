# Provenance — gdelta (GDelta)

- **Marca:** GDelta · **produto:** SaaS de gestão para oficinas de funilaria e pintura (Brasil)
- **Método:** `synth` — derivação a partir do brief via pipeline `design-system-engine` (discovery → color OKLCH single-hue → typography → motion). Não é extração de site ao vivo.
- **Data:** 2026-06-02
- **Autor:** design-architect (frontend-guru)
- **Confiança global:** **High.** A paleta inteira deriva de um único `--brand-hue: 256deg`; toda cor foi convertida para sRGB e checada em gamut, e todos os pares de contraste foram medidos com a math do `oklch-validate.ts` (APCA). Tipografia/escala/motion seguem as references da skill.

## Decisões-chave

- **Hue 256 (azul-aço/cobalto)** escolhido por discovery: trust + industrial-sofisticado. Evita ciano (~230) e roxo (>=290, proibido). Neutros tintados com 256.
- **Semáforo** com hues perceptualmente distintos (verde 152 / âmbar 82 / vermelho 27) casando com a regra de margem (>=20% / <20% / <0). Sempre acompanhado de ícone+label.
- **Fontes:** Space Grotesk (display) + Plus Jakarta Sans (body) + IBM Plex Mono (números financeiros tabulares). Todas web-available (Google Fonts), nenhuma proprietária.

## Caveats honestos

- **Limite de gamut do vermelho no escuro.** Como texto sobre o fundo escuro, `danger` é puxado para `L0.78` (mais claro, chroma menor) para clarear Lc >= 60 **dentro** do gamut sRGB; especificado com peso bold + ícone. É um limite real do espaço de cor, declarado.
- **`primary` no escuro como cor pura sobre o fundo** clareia para alvo **UI (>=45)** — papel de acento/ícone/borda. Texto de botão no escuro vai sobre `--primary-fill` (clears large), não sobre o fundo.
- **Logo/wordmark** não fazem parte deste DS (apenas cor/tipografia/espaço/motion/sombra).

## Validação

- Gamut + APCA: math idêntica ao `.claude/skills/frontend-build-modes/scripts/oklch-validate.ts`. Resultado: **0 cores fora do gamut**, **20/20 pares de contraste nos alvos** (body 75 / large 60 / ui 45).
- Para re-rodar com a ferramenta oficial (requer bun):
  `bun .claude/skills/frontend-build-modes/scripts/oklch-validate.ts design-systems/gdelta/design-tokens.json`
- `tokens.css` é a tradução 1:1 dos tokens para CSS custom properties + `@theme` do Tailwind v4 (light + dark).
