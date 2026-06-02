# Typography scale

Tipografia derivada de uma razão, fluida por construção. Sem breakpoints para font-size.

## Escala modular (derive de uma razão)

Escolha a razão pela personalidade da marca:

| Razão | Valor | Caráter |
|---|---|---|
| Minor third | 1.200 | compacto, denso (dashboards, UI) |
| Major third | 1.250 | equilibrado |
| Perfect fourth | 1.333 | confortável, editorial (padrão seguro) |
| Golden | 1.618 | dramático, alto contraste (landing/hero) |

A escala é `base × razão^n`. Com base 16px e perfect fourth: 16 → 21 → 28 → 37 → 50 → 67px.

## Fluid type com clamp() (sem media queries)

```css
:root {
  --text-caption: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);
  --text-base:    clamp(1rem, 0.95rem + 0.3vw, 1.125rem);
  --text-h3:      clamp(1.25rem, 1rem + 1.2vw, 2rem);
  --text-h2:      clamp(2rem, 1.4rem + 3vw, 4rem);
  --text-display: clamp(3rem, 1.5rem + 8vw, 10rem);
}
```

`clamp(min, preferred, max)`: escala suave entre mobile e desktop, sem saltos de breakpoint.

## Measure (comprimento de linha)

Body em 45-75 caracteres por linha (`max-width: 65ch` é um bom default). Linhas longas demais cansam; curtas demais picotam o ritmo de leitura.

## Pareamento display + body (distinto)

Pareie uma display font distinta com uma body font refinada. **Nunca** use Inter/Roboto/Arial/system como a escolha estética padrão (são o default de IA). Estratégias de pareamento:

- Contraste de classe: serifa display + grotesk body (ou vice-versa).
- Mesma família, pesos extremos: variable font com 900 no display e 400 no body.
- Tensão controlada: display expressiva, body neutra que "segura" a página.

## Line-height e tracking

- Display/headings: line-height apertado (0.95-1.1), tracking levemente negativo em tamanhos grandes.
- Body: line-height 1.5-1.65.
- Overline/labels ALL CAPS: tracking positivo (0.05-0.15em) para legibilidade.

## Saída

```
typography (em design-tokens.json):
  ratio: 1.333
  font_display: "<família>"
  font_body: "<família>"
  scale: { caption, base, h3, h2, display }  (valores clamp())
  measure: "65ch"
```
