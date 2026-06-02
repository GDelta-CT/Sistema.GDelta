# GDelta — Design System

> Marca: **GDelta** · SaaS de gestão para oficinas de **funilaria e pintura** (Brasil) · método: síntese a partir do brief + pipeline `design-system-engine` · confiança global: **High**
> Promessa: **"a inteligência que faz a oficina dar lucro."**
> Herói do produto: tela de **Orçamento** com **lucro e margem AO VIVO** + semáforo.
> Este documento é auto-suficiente: qualquer agente o lê e reproduz a linguagem visual sem voltar ao brief.

---

## 1. Identidade

- **Onliness:** o único sistema de gestão para funilaria/pintura que mostra **lucro e margem ao vivo** enquanto o orçamento é montado.
- **Emoção primária:** **trust** (confiança) com um traço de **sophistication**. O dono precisa sentir, em 3 segundos, "isto é sério, é preciso, e está do meu lado".
- **Arquétipo:** **Sage** (a inteligência que orienta a decisão) com a **disciplina de Ruler** (autoridade e controle financeiro). Não é um app fofo; é um instrumento.
- **WHY:** dar ao dono de oficina o controle financeiro que ele nunca teve — transformar trabalho em **lucro visível**, antes de fechar o negócio.
- **Metáfora organizadora:** **o painel de instrumentos da oficina.** Um medidor de precisão (manômetro/velocímetro) que converte trabalho em lucro. O **semáforo** é a leitura literal desse medidor. Tudo — cor, motion, tipografia — se justifica por ela: números tabulares como mostradores, azul-aço como o metal da ferramenta, o verde/âmbar/vermelho como a luz do painel.
- **Voz (pt-BR, dono não-técnico):** direta, concreta, sem jargão. "Este orçamento dá **R$ 1.240 de lucro** (margem 23%)." Verbos no presente, números na frente. Zero "leverage", "otimize seu workflow". Fala de **dinheiro**, **peça**, **mão de obra**, **prazo**.

**Teste de irreplaceabilidade:** remova o nome "GDelta" e ainda se reconhece — o azul-aço tintando até os neutros, os números em mono tabular, o semáforo de lucro como elemento estrutural (não enfeite) e a densidade de "painel" são a assinatura. Não é um SaaS azul genérico nem um dashboard roxo.

---

## 2. Cores

Toda a paleta deriva de **um** `--brand-hue: 256deg` em OKLCH — um **azul-aço/cobalto**. Escolha deliberada:
- **256** lê como **azul confiável e industrial** (metal, automotivo), não o ciano de ~230 nem o azul-SaaS-genérico (#276ef1).
- Roxo começa em ~290 — **proibido aqui** (cliché de "AI slop").
- Os **neutros são tintados com 256** (não cinza frio puro): dá a sensação de **grafite/aço** coerente com a oficina.

Budget cromático **70/20/8/2**: 70% estrutura azul-aço + neutros; 20% apoio; 8% profundidade; **2% reservado para o semáforo** (o estado é raro e afiado, por isso salta).

### 2.1 Escala primária (azul-aço)

| Passo | OKLCH | Hex (ref.) | Uso |
|---|---|---|---|
| 50 | `0.97 0.010 256` | `#f1f6fc` | wash de fundo, hover sutil |
| 100 | `0.94 0.028 256` | `#dfecfe` | tint de seleção |
| 200 | `0.88 0.058 256` | `#bfdafe` | bordas de destaque suave |
| 300 | `0.80 0.100 256` | `#93c1fe` | ícones decorativos, charts |
| 400 | `0.68 0.155 256` | `#5299f6` | acento no escuro, charts |
| 500 | `0.56 0.175 256` | `#1b72d8` | anel de foco (light), charts |
| **600** | `0.50 0.165 256` | **`#0a60be`** | **ação primária (light)** |
| 700 | `0.44 0.145 256` | `#0750a0` | hover/link em corpo (light) |
| 800 | `0.34 0.115 256` | `#013671` | pressed, headings de marca |
| 900 | `0.26 0.090 256` | `#00224e` | texto sobre tint claro |
| 950 | `0.18 0.070 256` | `#00102f` | superfície de marca profunda |

### 2.2 Neutros (tintados com 256)

`0 #ffffff` · `50 #fafcfe` · `100 #f3f6f9` · `200 #e1e5ea` · `300 #ced6da` · `400 #97a0a4` · `500 #6b7377` · `600 #4c5458` · `700 #33393c` · `800 #1b2023` · `900 #0a1017` · `950 #02070a`
*(os hexes são referência; a fonte canônica é OKLCH no `design-tokens.json`)*

### 2.3 Semáforo do Orçamento (2% reservado)

A regra do produto: **verde ≥ 20% de margem · âmbar < 20% · vermelho margem negativa.** Hues escolhidos para **máxima distinção perceptual (daltonismo)**: verde **152**, âmbar **82**, vermelho **27**.

> **Regra inviolável:** cor **nunca** é o único portador. O estado sempre vem com **ícone + label**: ✓ **Lucrativo** / ▲ **Atenção** / ✕ **Prejuízo**.

**Tema claro**

| Estado | Texto sobre claro | Preenchimento (chip/barra) | Texto sobre preenchimento |
|---|---|---|---|
| Sucesso (≥20%) | `success-700` `#086733` | `success` `#1f8a4b` | branco |
| Atenção (<20%) | `warning-700` `#9a5505` | `warning` `#e8ac1d` | grafite `#3a2a14` |
| Prejuízo (<0) | `danger-700` `#a91518` | `danger-600` `#c7181d` | branco |

**Tema escuro** (versões luminosas, brilham sobre o fundo)

| Estado | Texto/Número sobre escuro | Preenchimento |
|---|---|---|
| Sucesso | `#76e699` | `#1f8a4b` |
| Atenção | `#ffc75a` | `#e8ac1d` |
| Prejuízo | `#fb988d` (bold + ícone) | `#cc2827` |

### 2.4 Papéis (o que a UI realmente consome)

| Papel | Claro | Escuro |
|---|---|---|
| `--bg` | `#fafcfe` | `#0a1017` |
| `--surface` | `#ffffff` | `#121921` |
| `--surface-raised` | `#ffffff` + sombra | `#1b222c` |
| `--border` | `#e1e5ea` | `#272e38` |
| `--fg` (texto) | `#192029` | `#eef2f7` |
| `--fg-muted` (secundário) | `#5d646e` | `#c8ced6` |
| `--primary` (ação) | `#0a60be` | `#64a6fe` (acento) / fill `#2378df` |
| `--on-primary` | `#fafcfe` | `#fafcfe` |

**Dark mode nunca usa `#000`/`#fff` puros** — o fundo é preto **tintado** `oklch(0.17 0.018 256)`. No escuro, o **primário e o semáforo são elevados** (mais claros/luminosos) — é a assinatura premium "acento que brilha sobre o escuro".

### 2.5 Matriz de contraste (APCA, validada pela math do `oklch-validate.ts`)

Alvos: **body ≥ 75 · large ≥ 60 · ui ≥ 45**. Todos os 20 pares declarados **passam**.

| Par | Contexto | Lc | Veredito |
|---|---|---|---|
| `fg #192029` sobre `bg #fafcfe` | body | 101.4 | passa folgado |
| `fg-muted #5d646e` sobre `bg` | body | 78.0 | passa (secundário) |
| `fg-subtle #808790` sobre `bg` | large | 62.0 | passa (rótulos grandes) |
| branco sobre `primary #0a60be` | body | 82.8 | passa (texto de botão) |
| `primary-700 #0750a0` sobre `bg` | body | 84.7 | passa (link em corpo) |
| branco sobre `success #137d41` | body | 78.4 | passa (chip de lucro) |
| `success-700 #086733` sobre `bg` | body | 81.9 | passa |
| grafite sobre `warning #e8ac1d` | large | 62.1 | passa (chip de atenção) |
| `warning-700 #9a5505` sobre `bg` | body | 76.2 | passa |
| branco sobre `danger #c7181d` | body | 80.3 | passa (chip de prejuízo) |
| `danger-700 #a91518` sobre `bg` | body | 82.1 | passa |
| **dark** `fg #eef2f7` sobre `bg #0a1017` | body | 98.7 | passa |
| **dark** `fg-muted #c8ced6` sobre `bg` | body | 76.2 | passa |
| **dark** `success #76e699` sobre `bg` | body | 77.8 | passa |
| **dark** `warning #ffc75a` sobre `bg` | body | 77.7 | passa |
| **dark** `danger #fb988d` sobre `bg` | large | 61.0 | passa (bold + ícone) |
| **dark** primary fill `#2378df`, texto branco | large | 72.8 | passa |
| **dark** `primary #64a6fe` sobre `bg` | ui | 52.9 | passa como acento/borda/ícone |

> **Limite honesto declarado:** o vermelho em OKLCH tem teto de gamut baixo no claro alto; no **escuro**, o `danger` como texto é puxado para `L0.78` (mais claro, menos saturado) para clarear ≥60 **dentro do gamut sRGB** — por isso é especificado em **peso bold + ícone**. O `primary` no escuro, como cor de acento pura sobre o fundo, clareia para **UI/ícone/borda (≥45)**; **texto de botão** no escuro vai sobre o `primary-fill` (`#2378df`, Lc 72.8), não sobre o fundo.

---

## 3. Tipografia

Pareamento **display + body distinto**, todas **web-available via Google Fonts**. Zero Inter/Roboto/Arial como escolha estética.

- **Display — `Space Grotesk`** (grotesk geométrica, técnica, com tabular figures). Lê como **instrumento de precisão** — combina com a metáfora do painel. Headings, números de marca, overlines.
- **Body — `Plus Jakarta Sans`** (humanista, calorosa, altamente legível). "Segura" a página e fala com o dono **não-técnico** sem frieza.
- **Numérica — `IBM Plex Mono`** (tabular). **Crítica para o produto:** R$, lucro, margem e a tabela do orçamento alinham na vertical e não "dançam" quando o valor muda ao vivo. Use em toda métrica financeira.

**Razão de escala 1.2 (minor third)** — apertada, **densidade de produto/dashboard** (não landing dramática). Tudo fluido com `clamp()`, sem breakpoints de font-size.

| Nível | Token / `clamp()` | Família | Peso |
|---|---|---|---|
| display | `--text-display` 2.75→4.5rem | Space Grotesk | 700 |
| metric / metric-lg | `--text-metric(-lg)` 2.5→5.5rem | **IBM Plex Mono** (tnum) | 600 |
| h1 | `--text-h1` 2→3rem | Space Grotesk | 700 |
| h2 | `--text-h2` 1.5→2.25rem | Space Grotesk | 600 |
| h3 | `--text-h3` 1.25→1.5rem | Space Grotesk | 600 |
| body-lg | `--text-body-lg` 1.06→1.125rem | Plus Jakarta Sans | 400 |
| body | `--text-body` 0.94→1rem | Plus Jakarta Sans | 400 |
| small | `--text-small` 0.81→0.875rem | Plus Jakarta Sans | 400/500 |
| caption | `--text-caption` 0.75→0.81rem | Plus Jakarta Sans | 500 |
| overline | `--text-overline` 0.69→0.75rem · `tracking 0.08em` · UPPER | Space Grotesk | 600 |

- **Measure:** `68ch` para texto corrido.
- **Leading:** display 1.02 · heading 1.12 · body 1.55. **Tracking:** display −0.02em · heading −0.01em · overline +0.08em.
- **Tabular nums obrigatório** em valores: classe `.tabular` aplica `font-variant-numeric: tabular-nums`.

---

## 4. Espaçamento, raio, elevação, motion

- **Espaço — base 8px** (incrementos de 4 no ajuste fino): `3xs 2 · 2xs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64 · 4xl 96`. Conteúdo `clamp(1rem,4vw,2rem)`, seção `clamp(2.5rem,6vh,4rem)`. Densidade de produto.
- **Raio (hierárquico, não uniforme):** `xs 4 · control 8` (botões/inputs) · `card 12` · `panel 16` (painel de lucro) · `lg 20` · `pill 999` (chips do semáforo). Industrial-sofisticado: cantos definidos, não pílula geral.
- **Elevação — sombras tintadas com o hue** (não preto puro), profundidade coerente com o aço. `xs · sm · md · lg · xl` + `focus`. No escuro, sombra preta + halo de foco no primário.
- **Motion — personalidade `tech`:** rápido, funcional, **sem bounce decorativo**. `--ease: cubic-bezier(0.4,0,0.2,1)`. Durações: instant 100 · fast 150 · normal 240 · slow 360ms.
  - **Exceções de propósito (a metáfora do medidor):** o **contador de lucro/margem ao vivo** anima com `--ease-spring` em ~600ms (`--dur-counter`) ao recalcular; o **semáforo pulsa 1×** ao **trocar de faixa** (ex.: cruzar 20%). Nada de scroll-hijacking.
  - `prefers-reduced-motion` **obrigatório**: desliga tudo (binário), inclusive o contador — o número troca instantâneo.

---

## 5. Como aplicar (Next.js 16 + Tailwind v4)

### 5.1 Fontes (next/font/google) — substitui o boilerplate Geist

Em `src/app/layout.tsx`:

```tsx
import { Space_Grotesk, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-next",
  display: "swap",
});
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-next",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-numeric-next",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      // tema: 'dark' ativa o bloco escuro. Persista a preferência do usuário.
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

> **Conecte as fontes do Next aos tokens.** No `tokens.css`, troque os três `--font-*` para apontar para as variáveis do next/font, mantendo os fallbacks:
> ```css
> --font-display: var(--font-display-next), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
> --font-body:    var(--font-body-next), 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
> --font-numeric: var(--font-numeric-next), 'IBM Plex Mono', ui-monospace, monospace;
> ```
> *(Alternativa sem build de fonte do Next: adicione `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');` no topo do CSS. O `next/font` é preferível: zero layout shift, self-host automático.)*

### 5.2 CSS

`src/app/globals.css` já tem `@import "tailwindcss";`. **Cole o conteúdo de `tokens.css` logo abaixo** (ele já inclui `@theme inline`, base, foco, reduced-motion). Substitui o `:root`/`@theme`/`body` do boilerplate atual (que usa Arial — remover).

### 5.3 Dark mode

O `tokens.css` define o escuro em `.dark, [data-theme="dark"]`. Para integrar com utilitários `dark:` do Tailwind v4, declare a variante apontando para a mesma classe:

```css
/* logo após @import "tailwindcss"; */
@custom-variant dark (&:where(.dark, .dark *));
```

Toggle (sem flash): defina a classe `dark` no `<html>` via script inline lendo `localStorage`/`prefers-color-scheme` antes da hidratação.

### 5.4 Utilitários gerados (exemplos)

`@theme` produz classes mapeadas aos papéis — **funcionam em light e dark automaticamente**:

```
bg-bg  bg-surface  bg-surface-raised  text-fg  text-fg-muted  border-border
bg-primary  text-on-primary  hover:bg-primary-hover  ring-ring
text-success  bg-success-bg  bg-success-tint   (idem warning / danger)
rounded-card  rounded-panel  rounded-pill
shadow-sm  shadow-md  shadow-lg
font-display  font-numeric  text-metric  text-h2  text-overline
ease-spring
```

---

## 6. Atoms (especificação)

- **Botão primário:** `bg-primary` + `text-on-primary`, `rounded-control`, peso 600, `min-height 44px`, padding `12px 20px`. Hover `bg-primary-hover`; active `scale-[0.98]`. Foco: `--shadow-focus` (anel 3px). No **escuro**, o fill é `--primary-fill` (texto branco passa body/large).
- **Botão secundário:** `bg-surface`, `text-fg`, `border-border`; hover `bg-bg-subtle`.
- **Link:** `primary-700` (`#0750a0`) em corpo no claro / `--primary` no escuro; underline no hover.
- **Input:** `border-border`, `rounded-control`, altura 44px, label acima (`text-fg`), ajuda em `text-fg-muted`, erro em `text-danger` + ícone. Foco: borda `--ring` + anel.
- **Chip do semáforo:** `rounded-pill`, ícone + label. Lucrativo → `bg-success-tint` / `text-success` (ou fill sólido em destaque). Atenção → warning. Prejuízo → danger.

## 7. Molecules / Organisms

- **KPI card (medidor):** `surface` + `shadow-sm`, `rounded-card`. Rótulo `overline` (UPPER, tracking +), valor em **`text-metric` mono tabular**, delta com ícone ↑/↓ colorido pelo semáforo (com sinal +/−, nunca só cor).
- **Painel de Lucro (herói do Orçamento):** ver §8.
- **Tabela de itens:** linhas com `border-border`, números à direita em `.tabular`, zebra com `bg-bg-subtle`. Touch ≥44px nas ações de linha.
- **Header/Sidebar (dashboard-shell):** sidebar `surface` com `border-border`, item ativo com barra `primary` à esquerda + peso 600; topbar com busca e toggle de tema.

---

## 8. Aplicação na tela de Orçamento (herói)

Layout **assimétrico** (proibido `1fr 1fr 1fr`): **formulário denso à esquerda** (itens, peças, mão de obra, tinta) + **Painel de Lucro fixo/sticky à direita** (`rounded-panel`, `surface-raised`, `shadow-lg`).

No Painel de Lucro, **ao vivo**:
1. **Lucro (R$)** em `text-metric-lg` mono tabular, cor pelo semáforo.
2. **Margem (%)** em `text-metric` mono, com o **chip de estado** (ícone+label).
3. **Barra de margem** com marca dos 20% (limiar verde/âmbar) e do 0% (âmbar/vermelho).
4. Recalcula com `--ease-spring` / `--dur-counter`; **pulso 1×** ao cruzar um limiar.

Mapa de estado → token:

| Margem | Estado | Light (texto/realce) | Dark |
|---|---|---|---|
| **≥ 20%** | ✓ Lucrativo | `success-700` / `success` | `#76e699` |
| **0–20%** | ▲ Atenção | `warning-700` / `warning` | `#ffc75a` |
| **< 0%** | ✕ Prejuízo | `danger-700` / `danger-600` | `#fb988d` (bold) |

Tom do copy: **"Margem 23% — este orçamento dá R$ 1.240 de lucro."** / **"Margem 11% — atenção: abaixo da sua meta de 20%."** / **"Prejuízo de R$ 380 — revise peças ou mão de obra."**

---

## 9. Proibições (respeitadas)

Inter/Roboto/Arial como escolha estética · purple-on-white · ciano genérico · grids `1fr 1fr 1fr` no Orçamento · cor como único portador (semáforo sempre com ícone+label) · `#000`/`#fff` puros no escuro · `outline:none` sem substituto (foco 3px sempre) · touch < 44px · scroll-hijacking (Lenis/Locomotive) · animar top/left/width/height (só transform/opacity).

## 10. Validação e gaps

- **Cor:** 100% in-gamut sRGB; 20/20 pares APCA nos alvos (math idêntica ao `oklch-validate.ts`). Re-rodar oficial: `bun .claude/skills/frontend-build-modes/scripts/oklch-validate.ts design-systems/gdelta/design-tokens.json`.
- **Limite real:** vermelho no escuro (gamut) — `danger` puxado para L0.78 + bold + ícone para clarear ≥60 in-gamut. Declarado, não defeito.
- **Re-temar:** mudar **só** `--brand-hue` re-tinge primários + neutros + sombras. Semânticos têm hue fixo (significado do semáforo não pode migrar).
- **Logo/wordmark:** fora do escopo deste DS (tokens de cor/tipo/motion). Quando existir, usar `primary-800` sobre claro / `fg` sobre escuro.
