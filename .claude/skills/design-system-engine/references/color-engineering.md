# Color engineering (OKLCH)

A paleta inteira deriva de **uma** variável. Isso garante coesão e mata o "look genérico" de hex escolhidos à mão.

## Por que OKLCH (e não HSL/hex)

OKLCH separa lightness perceptual, chroma e hue. Mudar o hue mantém a lightness percebida constante — coisa que HSL não faz (amarelo e azul no mesmo L parecem ter brilhos diferentes). Resultado: escalas que parecem uniformes de verdade.

## Single-hue derivation

Mude o tema inteiro alterando só `--brand-hue`:

```css
@property --brand-hue   { syntax: "<angle>";  inherits: true; initial-value: 220deg; }
@property --brand-chroma { syntax: "<number>"; inherits: true; initial-value: 0.18; }

:root {
  --brand-hue: 220deg;     /* mude SÓ isto para re-temar */
  --brand-chroma: 0.12;    /* teto de chroma; o gamut real varia por hue+lightness */

  /* escala 9 passos, auto-derivada do hue */
  --color-50:  oklch(0.97 calc(var(--brand-chroma) * 0.30) var(--brand-hue));
  --color-100: oklch(0.93 calc(var(--brand-chroma) * 0.50) var(--brand-hue));
  --color-300: oklch(0.78 calc(var(--brand-chroma) * 0.80) var(--brand-hue));
  --color-500: oklch(0.55 var(--brand-chroma)              var(--brand-hue));
  --color-700: oklch(0.40 calc(var(--brand-chroma) * 0.85) var(--brand-hue));
  --color-900: oklch(0.15 calc(var(--brand-chroma) * 0.50) var(--brand-hue));

  /* neutros TINTADOS com o hue da marca (nunca cinza frio puro) */
  --neutral-50:  oklch(0.97 0.008 var(--brand-hue));
  --neutral-500: oklch(0.55 0.010 var(--brand-hue));
  --neutral-900: oklch(0.15 0.008 var(--brand-hue));

  /* accent complementar automático */
  --accent-500: oklch(0.55 var(--brand-chroma) calc(var(--brand-hue) + 180deg));
}

[data-theme="violet"] { --brand-hue: 285deg; }
[data-theme="forest"] { --brand-hue: 150deg; --brand-chroma: 0.16; }
```

## Contraste APCA (preferido sobre WCAG 2.x)

APCA mede contraste perceptual (Lc). Mínimos:

- **Lc ≥ 75** — body text (16px+)
- **Lc ≥ 60** — texto grande (24px+) e UI importante
- **Lc ≥ 45** — elementos não-texto (bordas, ícones desativados)

Cheque cada par texto/fundo declarado. O `frontend-build-modes/scripts/oklch-validate.ts` calcula isto.

## Budget cromático (70/20/8/2)

- **70%** cor primária — dominante, estrutura.
- **20%** secundária — apoio.
- **8%** terciária — profundidade, textura.
- **2%** reservado — estados (erro/aviso/sucesso).

Paletas tímidas e uniformemente distribuídas parecem genéricas. Dominância com acentos afiados parece intencional.

## Dark mode

Nunca `#000000` puro nem `#ffffff` puro. Fundo escuro: `oklch(0.10-0.15 0.01-0.02 var(--brand-hue))` — preto tintado com o hue. Acentos neon de alto contraste sobre escuro são a assinatura premium.

## Gotchas

- **Gamut sRGB:** a chroma máxima depende de lightness E hue — para azuis (hue ~220) ela despenca nas pontas clara e escura, e raramente passa de ~0.10 no L médio. Não existe um `--brand-chroma` fixo seguro para todo hue. Faça a chroma **tapertar** nas pontas (multiplicadores menores em 50/100 e 700/900) e rode o `oklch-validate.ts` até passar: ele converte cada cor para sRGB e flagra o que estoura.
- **Daltonismo:** garanta ΔE perceptual suficiente entre cores que carregam significado (não confie só no hue para diferenciar estados).
- Não use cor como único portador de informação (ex.: erro só por ficar vermelho) — adicione ícone/label.
