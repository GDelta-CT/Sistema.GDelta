# Formato do design system agêntico

A entrega primária da extração é o `design-system.md`: um documento **auto-suficiente** que qualquer agente lê para reproduzir a linguagem visual da marca em qualquer meio, sem voltar à URL. "Agêntico" significa: escrito para ser consumido por um modelo, com tudo explícito (valores, papéis, estados, confiança).

## Princípios

1. **Auto-suficiência.** Se um agente só tem este arquivo, ele consegue construir uma página fiel. Sem "ver o site original" como pré-requisito.
2. **Valores, não adjetivos.** "primária #276EF1 (Safety Blue)", não "azul vibrante". Toda cor com hex; toda fonte com nome + fallback; todo espaço com px.
3. **Papel + estado.** Cada token diz onde se aplica (texto/superfície/CTA/borda) e em que estado (default/hover/focus/active/disabled).
4. **Confiança explícita.** Cada seção carrega um label (`High`/`Moderate`/`Low`/`Speculative`) e a razão.
5. **Gaps honestos.** O que não deu para extrair e por quê. Gap é dado.

## Esqueleto

```markdown
# <Marca> Design System
> Fonte: <url> · extraído em <data> · método: <dom|vision|synth> · confiança global: <label>

## 1. Identidade
nome, URL, logos (caminhos locais), descritores de voz, metáfora visual (a lente pela qual tudo se explica)

## 2. Cores
### Primitivas (paleta completa: hex + oklch + papel + frequência)
### Semânticas (primary, secondary, accent, neutral 50-900, success/error/warning, bg, surface, border)
### Matriz de contraste (cada par fg/bg: APCA Lc + veredito body/large/ui)
### Tema escuro (se houver)

## 3. Tipografia
### Famílias (display + body, com pesos e stack de fallback)
### Escala (razão + cada degrau com tamanho/peso/line-height/letter-spacing)
### Uso por nível (display/h1..h6/body/caption/ui/code)

## 4. Espaçamento
### Unidade base + escala (valores medidos)
### Layout (container, seção, grid, gutter) · Componente (card, form, list)

## 5. Bordas e raio
larguras, estilos, escala de raio com mapeamento de componente

## 6. Elevação
escala de sombra (xs..xl com CSS) + mapa de componente

## 7. Motion
duração (instant/fast/normal/slow), easing nomeado, transições por componente×estado,
keyframes, reduced-motion (presente? o que degrada?)

## 8-10. Atoms / Molecules / Organisms
cada um com variantes, tamanhos, estados, e referência aos tokens

## 11. Templates & layout
breakpoints, grid, padrões de página

## 12. Gaps de extração
o que não foi extraído e por quê (honesto)
```

## Por que separar do JSON

- `design-tokens.json` é para máquina (o `frontend-forge`, o `ds-to-css.ts`).
- `design-system.md` é para o agente raciocinar (qual papel cada cor tem, quando usar hover, qual a metáfora). Um agente que só tem o JSON sabe os valores mas não a intenção; o `.md` carrega a intenção.

Ambos vivem em `design-systems/<name>/`. O `default` do projeto (Graphite) é o exemplo de referência de um `.md` completíssimo.
