# Protocolo de extração

O método de escavação. Cada fase produz evidência, não chute. A regra de ouro: **analise a página renderizada, nunca o HTML cru** — tokens vivem nos computed styles, não no source.

## Fase 1 — Reconhecimento

1. `agent-browser open <url>` → `agent-browser wait --load networkidle` → `agent-browser wait 1500` (deixa fontes/lazy carregarem).
2. Screenshot full-page a 1440px (`agent-browser screenshot`). Guarda como evidência e fallback de visão.
3. Identifica o nome da marca (`<title>`, og:site_name, logo) e mapeia páginas-chave: home, about, pricing/features, blog, contact, 404. Multi-página captura tokens contextuais que single-page perde.

## Fase 2 — Harvest (computed styles reais)

Roda o JS de captura via `agent-browser eval` (recipe completa em `computed-style-harvest.md`). Coleta, por página:

- **Cores** — `color`, `background-color`, `border-color`, `box-shadow`, `outline-color`, `fill`/`stroke` de SVG, de cada elemento visível. Frequência por cor (a mais usada no texto é provavelmente o texto primário; a mais usada em CTA é a primária de marca).
- **Tipografia** — `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform` de display/h1..h6/body/small/UI/code.
- **Espaçamento** — `padding`, `margin`, `gap` de 100+ elementos (para derivar a unidade base por GCD).
- **Bordas e raio** — `border-width/style/color`, `border-radius` de botões/cards/inputs.
- **Sombra/elevação** — todo `box-shadow` único, categorizado por nível.
- **Estados** — dispara hover/focus/active (`agent-browser hover`/`focus`) e recaptura: hover/focus/active são metade da linguagem visual.
- **Motion** — `transition-*` por elemento interativo, `@keyframes` no CSS, `scroll-behavior`, e a presença (ou ausência) de `@media (prefers-reduced-motion)`.
- **Logos** — header/footer/favicon/og:image; baixa SVG (preferido), PNG fallback.

Saída do harvest: `design-systems/<name>/_harvest.json` (cru, com frequências e estados).

## Fase 3 — Normalização (determinística)

`scripts/normalize-ds.ts _harvest.json --name <name>`:
- Normaliza toda cor para hex 6-dígitos (converte rgb/hsl/oklch).
- Deduplica e ordena por frequência; categoriza (primary/secondary/accent/neutral/semantic/bg/surface/border) por heurística de uso.
- Deriva escalas: unidade de espaçamento por GCD dos valores observados; razão da escala tipográfica a partir dos tamanhos; escala de raio e de elevação.
- Anexa `confidence` por token (frequência + consistência entre páginas).
- Emite `design-tokens.json` no formato do projeto.

Princípio anti-brandcraft: **medimos e mantemos** os valores reais; só impomos uma escala canônica quando a marca não tem nenhuma. Nunca sobrescrevemos o espaçamento medido por uma régua fixa.

## Fase 4 — Validação

`oklch-validate.ts design-systems/<name>/design-tokens.json` → gamut + APCA (hex e oklch). Cada par fg/bg recebe Lc e veredito (body 75 / large 60 / ui 45). Falhas viram gaps, não silêncio.

## Fase 5 — Síntese agêntica

Escreve `design-system.md` conforme `agentic-ds-format.md`. É a entrega primária: auto-suficiente para outro agente reproduzir a marca.

## Escape hatch — visão

Quando o DOM não entrega (anti-bot, SPA que bloqueia eval, canvas/WebGL, fonte só em PDF/Figma):
1. Screenshot(s) de alta resolução das páginas-chave (já capturados na Fase 1).
2. Manda ao modelo de visão com contrato JSON estrito pedindo tokens DTCG + `confidence` por token + `evidence_region`.
3. Tokens abaixo do threshold (0.6) vão para `ambiguities[]` com clarificação sugerida.
4. Marca a extração como `vision` na PROVENANCE e rebaixa a confiança global.

## Escalação

- URL inacessível: retry 3x backoff; depois pede URL alternativa ou upload.
- Só preto/branco extraído: análise por pixel do screenshot; marca LOW.
- Fontes genéricas: aumenta wait para 10s; checa `<link>` do Google Fonts; documenta como limitação.
- Cobertura < 70%: marca INCOMPLETE, gera `.md` parcial com a seção de gaps explícita.
