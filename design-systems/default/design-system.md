# Graphite Design System (default)

> Marca: Graphite · linguagem: monocromático + um acento · método: identidade original e neutra · confiança global: High
> Este é o design system padrão do projeto. Qualquer agente que leia este arquivo reproduz a linguagem visual sem depender de nada externo. Troque por outra marca com `/extract-ds <url> default`.

## 1. Identidade

- **Marca:** Graphite. **Onliness:** uma base neutra e severa que recua para deixar o conteúdo falar.
- **Emoção primária:** foco calmo.
- **Arquétipo:** o artesão silencioso — preciso, sem ornamento.
- **Metáfora visual:** grafite no papel. Preto, branco e cinza quase absolutos, com **um** acento índigo reservado para a ação. Tudo que não é ação recua para o neutro.
- **Voz:** direta, curta, sem floreio. Frases imperativas.

## 2. Cores

A linguagem é **achromática + um acento**. O peso é preto/branco/cinza; o índigo aparece só onde há ação.

### Primitivas

| Papel | Hex | Uso |
|---|---|---|
| fg | `#0a0a0a` | texto primário, ícones |
| bg | `#ffffff` | fundo padrão |
| surface | `#f6f6f6` | cards, seções alternadas |
| border | `#e2e2e2` | divisores, contornos de input |
| fg-muted | `#545454` | texto secundário |
| accent | `#4f46e5` | índigo — CTA, links, foco, estados ativos |
| accent-hover | `#3730a3` | hover/pressed do acento; link em tamanho de corpo |

### Escala neutra

`50 #f6f6f6` · `100 #eeeeee` · `200 #e2e2e2` · `300 #cbcbcb` · `400 #afafaf` · `500 #757575` · `600 #545454` · `700 #333333` · `800 #1f1f1f` · `900 #141414`

### Escala do acento (índigo)

`50 #eef2ff` · `100 #e0e7ff` · `300 #a5b4fc` · `500 #4f46e5` · `700 #3730a3` · `900 #312e81`

### Semânticas

`positive #05944f` · `negative #d11500` · `warning #b45309` · `info #4f46e5`

### Matriz de contraste (APCA, validada por oklch-validate.ts)

| Par | Contexto | Veredito |
|---|---|---|
| `#0a0a0a` sobre `#ffffff` | body | passa folgado |
| `#545454` sobre `#ffffff` | body | passa (texto secundário) |
| `#ffffff` sobre `#4f46e5` | large | passa (botão primário, texto bold/grande) |
| `#3730a3` sobre `#ffffff` | ui | passa; é o tom para link em tamanho de corpo |
| `#ffffff` sobre `#0a0a0a` | body | passa folgado (modo escuro / footer) |

### Tema escuro

`bg #0a0a0a` · `surface #141414` · `fg #fafafa` · `fg-muted #afafaf` · `border #333333` · `accent #818cf8` (clareado para contraste sobre preto).

## 3. Tipografia

- **Display:** `Space Grotesk` (peso 500-700). **Body:** `Manrope` (peso 400-500). Ambas open-source (OFL). Fallback: `ui-sans-serif, system-ui, sans-serif`.
- **Razão de escala:** ~1.2 (apertada, funcional — densidade de produto).
- **Measure:** 66ch.
- **Pesos:** regular 400, medium 500, bold 700.

| Nível | Tamanho | Peso |
|---|---|---|
| display | `clamp(2.5rem, 1.5rem + 4vw, 4rem)` | 700 |
| h1 | `2.25rem` (36px) | 700 |
| h2 | `1.5rem` (24px) | 500 |
| h3 | `1.25rem` (20px) | 500 |
| body | `1rem` (16px) | 400 |
| caption | `0.875rem` (14px) | 400 |
| label | `0.75rem` (12px) | 500, tracking levemente positivo |

## 4. Espaçamento

Base **8px** (incrementos de 4 para ajuste fino). Escala: `xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64`. Conteúdo: `clamp(1rem, 4vw, 2rem)`. Seção: `clamp(3rem, 8vh, 5rem)`.

## 5. Bordas e raio

Larguras de 1px (divisores/inputs). Raio: `control 8px` (botões/inputs), `card 12px`, `pill 999px` (chips). A linguagem é majoritariamente reta; o raio é discreto.

## 6. Elevação

Sombras sutis, nunca dramáticas (a linguagem é flat). `sm 0 1px 2px rgb(0 0 0/.08)` · `md 0 4px 12px rgb(0 0 0/.10)` · `lg 0 12px 32px rgb(0 0 0/.14)`.

## 7. Motion

Personalidade **tech**: rápido, funcional, sem bounce. Easing `cubic-bezier(0.4, 0, 0.2, 1)`. Durações: fast 150ms (hover/press), normal 250ms (entrada de painel), slow 400ms (transição de página). `prefers-reduced-motion` **obrigatório** — desliga tudo.

## 8. Atoms

- **Botão primário:** bg `#0a0a0a` (ou `#4f46e5` para ação-chave), texto branco, radius `control`, peso 500, padding `12px 24px`, min-height 48px. Hover: leve escurecimento; press: scale 0.98. Foco: anel `#4f46e5` 2px offset 2px.
- **Botão secundário:** bg `#f6f6f6`, texto `#0a0a0a`, border `#e2e2e2`.
- **Link:** `#3730a3` (corpo) / `#4f46e5` (grande), underline no hover.
- **Input:** border `#e2e2e2`, radius `control`, foco border `#4f46e5` + anel; label acima, caption de ajuda em `#545454`.
- **Badge/chip:** pill, `#f6f6f6` com texto `#333333`; estados usam as semânticas.

## 9. Molecules

- **Campo de formulário:** label (`#0a0a0a`) + input + caption (`#545454`) + erro (`#d11500`).
- **Card:** surface `#f6f6f6` (ou branco com border), radius `card`, padding `lg`, sombra `sm` no hover.
- **Nav item:** texto `#0a0a0a`, ativo com underline ou peso 500; mobile vira menu full-screen.

## 10. Organisms

- **Header:** wordmark à esquerda, nav central/direita, CTA escuro à direita; sticky com sombra sutil ao rolar.
- **Hero:** título display, subtítulo em `#545454`, um CTA primário, mídia à direita; grid assimétrico, muito branco.
- **Footer:** fundo `#0a0a0a`, texto branco, colunas de links, wordmark branco.

## 11. Templates e layout

Grid de conteúdo centrado com max-width ~1200px; breakpoints mobile-first; densidade de produto (listas, tabelas) vs densidade de marketing (hero arejado). Mobile-first é a regra.

## 12. Gaps de extração

- **Identidade original.** Não há logo nem fonte proprietária: o wordmark é textual e as fontes são open-source (OFL). Nada de terceiro embarcado.
- Esta é uma síntese coerente para servir de default neutro; confiança High para o esqueleto (monocromático + um acento) e para o contraste validado.
- Para uma identidade de marca real, rode `/extract-ds <url> default` (ou crie `design-systems/<name>/` e passe `--tokens`).
