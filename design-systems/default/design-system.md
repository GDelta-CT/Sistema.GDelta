# Uber Design System (default)

> Marca: Uber · linguagem: Uber Base · método: síntese a partir da linguagem pública Uber Base · confiança global: High
> Este é o design system padrão do projeto. Qualquer agente que leia este arquivo consegue reproduzir a linguagem visual da Uber sem voltar ao site.

## 1. Identidade

- **Marca:** Uber. **Onliness:** a única plataforma de mobilidade/entrega cuja identidade é movimento confiável reduzido ao essencial.
- **Emoção primária:** confiança calma (segurança sem frieza).
- **Arquétipo:** Everyman com disciplina de Ruler — acessível, mas rigoroso.
- **Metáfora visual:** sinal no ruído. Preto e branco quase absolutos, com **um** acento (Safety Blue) reservado para a ação. Tudo que não é ação recua para o neutro.
- **Voz:** direta, imperativa, sem floreio ("Peça uma viagem", "Comece a ganhar"). Frases curtas.

## 2. Cores

A linguagem é **achromática + um acento**. O peso é preto/branco/cinza; o Safety Blue aparece só onde há ação.

### Primitivas

| Papel | Hex | Uso |
|---|---|---|
| fg | `#000000` | texto primário, ícones, wordmark sobre claro |
| bg | `#ffffff` | fundo padrão |
| surface | `#f6f6f6` | cards, seções alternadas |
| border | `#e2e2e2` | divisores, contornos de input |
| fg-muted | `#545454` | texto secundário |
| accent | `#276ef1` | Safety Blue — CTA, links, foco, estados ativos |
| accent-hover | `#1e54b7` | hover/pressed do acento; link em tamanho de corpo |

### Escala neutra (Uber gray ramp)

`50 #f6f6f6` · `100 #eeeeee` · `200 #e2e2e2` · `300 #cbcbcb` · `400 #afafaf` · `500 #757575` · `600 #545454` · `700 #333333` · `800 #1f1f1f` · `900 #141414`

### Escala do acento (Safety Blue)

`50 #eef3fd` · `100 #d4e2fc` · `300 #a0bff8` · `500 #276ef1` · `700 #1e54b7` · `900 #174291`

### Semânticas

`positive #05944f` · `negative #e11900` · `warning #ffc043` · `info #276ef1`

### Matriz de contraste (APCA, validada por oklch-validate.ts)

| Par | Contexto | Veredito |
|---|---|---|
| `#000000` sobre `#ffffff` | body | passa folgado |
| `#545454` sobre `#ffffff` | body | passa (texto secundário) |
| `#ffffff` sobre `#276ef1` | large | passa (botão primário, texto bold/grande) |
| `#276ef1` sobre `#ffffff` | ui | passa como UI/large; **para link em tamanho de corpo, use `#1e54b7`** |
| `#ffffff` sobre `#000000` | body | passa folgado (modo escuro / footer) |

### Tema escuro

`bg #000000` · `surface #141414` · `fg #ffffff` · `fg-muted #afafaf` · `border #333333` · `accent #5b91f5` (clareado para contraste sobre preto).

## 3. Tipografia

- **Display:** `Uber Move` (peso 500-700). **Body:** `Uber Move Text` (peso 400-500). Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
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

Larguras de 1px (divisores/inputs). Raio: `control 8px` (botões/inputs), `card 12px`, `pill 999px` (chips, alguns CTAs de marketing). A linguagem é majoritariamente reta; raio é discreto.

## 6. Elevação

Sombras sutis, nunca dramáticas (a marca é flat). `sm 0 1px 2px rgb(0 0 0/.08)` · `md 0 4px 12px rgb(0 0 0/.10)` · `lg 0 12px 32px rgb(0 0 0/.14)`.

## 7. Motion

Personalidade **tech**: rápido, funcional, sem bounce. Easing `cubic-bezier(0.4, 0, 0.2, 1)`. Durações: fast 150ms (hover/press), normal 250ms (entrada de painel), slow 400ms (transição de página). `prefers-reduced-motion` **obrigatório** — desliga tudo.

## 8. Atoms

- **Botão primário:** bg `#000000` (ou `#276ef1` para ação-chave), texto branco, radius `control`, peso 500, padding `12px 24px`, min-height 48px. Hover: leve escurecimento; press: scale 0.98. Foco: anel `#276ef1` 2px offset 2px.
- **Botão secundário:** bg `#f6f6f6`, texto `#000000`, border `#e2e2e2`.
- **Link:** `#1e54b7` (corpo) / `#276ef1` (grande), underline no hover.
- **Input:** border `#e2e2e2`, radius `control`, foco border `#276ef1` + anel; label acima, caption de ajuda em `#545454`.
- **Badge/chip:** pill, `#f6f6f6` com texto `#333333`; estados usam semânticas.

## 9. Molecules

- **Campo de formulário:** label (`#000`) + input + caption (`#545454`) + erro (`#e11900`).
- **Card:** surface `#f6f6f6` (ou branco com border), radius `card`, padding `lg`, sombra `sm` no hover.
- **Nav item:** texto `#000`, ativo com underline ou peso 500; mobile vira menu full-screen.

## 10. Organisms

- **Header:** wordmark à esquerda, nav central/direita, CTA preto à direita; sticky com sombra sutil ao rolar.
- **Hero:** título display, subtítulo em `#545454`, um CTA primário, imagem/ilustração à direita; grid assimétrico, muito branco.
- **Footer:** fundo `#000000`, texto branco, colunas de links, wordmark branco.

## 11. Templates e layout

Grid de conteúdo centrado com max-width ~1200px; breakpoints mobile-first; densidade de produto (listas, mapas) vs densidade de marketing (hero arejado). Mobile-first é regra — a Uber nasce no telefone.

## 12. Gaps de extração

- **Logo/wordmark e a fonte Uber Move são proprietários** — não embarcados. Em entregas públicas, use placeholder e fallback de fonte.
- Os hexes exatos do gray ramp e os tamanhos de tipo **variam por superfície/versão** (marketing vs app); os valores aqui são a síntese coerente da linguagem Base, confiança High para os icônicos (preto/branco/Safety Blue/Uber Move) e Moderate para os degraus finos de cinza.
- Motion de produto (transições de mapa, sheets) é dirigido por código nativo, fora do escopo de CSS.
- Para valores frescos do site atual, rode `/extract-ds https://uber.com default`.
