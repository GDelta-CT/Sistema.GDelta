# Proibições (hard rejects)

Cada item aqui reprova o build no `/design-review`. A razão importa tanto quanto a regra.

| Proibição | Por quê | O que fazer no lugar |
|---|---|---|
| **Lenis / Locomotive / scroll-hijacking** | Desabilita a física nativa do SO (trackpad, roda), causa jank no mobile, risco de CLS, penalidade automática do awwwards | Scroll nativo + CSS Scroll-Driven Animations (smooth sem overhead) |
| **GSAP `toggleActions` / `once: true` para scroll** | Torna a animação unidirecional (não reverte ao subir) | Sempre `scrub` (bidirecional) |
| **Hero WebGL com `min-height` + `scrollY` manual** | Progresso impreciso, salta | `pin: true` + altura `100vh` + `self.progress` |
| **Bootstrap / Tailwind genérico não-customizado** | Lê como template; sem identidade | Tokens próprios (OKLCH single-hue), Tailwind mapeado aos tokens |
| **Stock photos** | Genérico, sem coerência com a metáfora | Assets gerados, abstratos ou geométricos coerentes com o vision-brief |
| **Lorem ipsum** | Sinaliza trabalho inacabado; reprova content | Copy real, específico, confiante (zero placeholder) |
| **Inter / Roboto / Arial / system fonts como escolha estética** | Default de IA; convergência genérica | Pareamento display + body distinto (ver `typography-scale.md`) |
| **Purple-gradient sobre branco** | Cliché de "AI slop" | Paleta derivada do arquétipo, budget 70/20/8/2 |
| **Grids `1fr 1fr 1fr` / tudo centralizado** | Simetria = template | Grids assimétricos (`2fr 1fr 3fr`), tension rule |
| **Animar `top/left/width/height`** | Força layout/paint, mata 60fps | Animar só `transform`/`opacity` |
| **`will-change` preventivo em tudo** | Consome memória da GPU sem ganho | `will-change` só em elementos prestes a animar |
| **Cor como único portador de informação** | Falha de acessibilidade (daltonismo) | Cor + ícone/label |
| **`outline: none` sem substituto de foco** | Quebra navegação por teclado | Foco visível sempre |
| **devicePixelRatio sem cap** | Tela retina renderiza 4x+ pixels, derruba FPS | `Math.min(window.devicePixelRatio, 2)` |

## Verificação

O `scripts/perf-audit.ts` grepa por `lenis`, `locomotive`, `bootstrap` e por fontes proibidas no output, e checa a presença do bloco `prefers-reduced-motion` e do `lang`. Itens que ele não pega (ex.: stock photo, lorem) são avaliados pelo `awwwards-judge` no `/design-review`.
