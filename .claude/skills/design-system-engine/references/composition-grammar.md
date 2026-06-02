# Composition grammar (Gestalt quantificado)

Regras de composição com números. "Equilíbrio" e "hierarquia" viram limites verificáveis.

## Cowan 4±1 (carga cognitiva)

Máximo 4-5 elementos visuais distintos por viewport. Acima de 5, a compreensão cai.

```
Hero: 1 heading + 1 subheading + 1 CTA + 1 mídia = 4  (ok)
Grid de 6 cards todos visíveis de uma vez = overload  (quebrar em scroll/grupos)
```

## Von Restorff (hierarquia)

Máximo 1 CTA primário por seção (+ até 2 secundários). Se tudo é destacado, nada é. Três CTAs primários = ausência de hierarquia.

## Proximidade

Espaço intra-grupo ≤ 0.5× espaço inter-grupo. O olho agrupa pelo espaço.

```
padding interno do card: 24px  →  gap entre cards: 48px+   (grupos legíveis)
```

## Figura-fundo

Mínimo 2 níveis de elevação para superfícies interativas: um card = cor diferente do fundo + sombra (ou borda). Sem isso, o que é clicável não se separa.

## Grids assimétricos (anti-template)

| Genérico (evitar) | Premium (usar) |
|---|---|
| `1fr 1fr 1fr` | `2fr 1fr 3fr` |
| `1fr 1fr` | `5fr 3fr` |
| tudo centralizado | corpo à esquerda, acento à direita |

Simetria perfeita lê como template. Assimetria deliberada lê como design.

## Tension rule

Pelo menos 1 elemento por seção quebra o grid ou sangra para fora do container (bleed/overlap). Isso cria interesse visual e tira a página da rigidez de planilha.

## Section rhythm (respiração editorial)

Alterne seções sparse (tipo massivo, muito whitespace) e dense (muita informação). Razão 2 dense : 1 sparse. **Nunca duas dense consecutivas.**

```
Hero (sparse) → Features (dense) → About (normal) → Stats (sparse) → Pricing (dense) → CTA (sparse)
```

## Tipografia na composição (hierarquia)

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | `clamp(3rem, 8vw, 10rem)` | 700-900 | headline do hero, uso único |
| H2 | `clamp(2rem, 4vw, 4rem)` | 600-700 | títulos de seção |
| H3 | `clamp(1.25rem, 2vw, 2rem)` | 600 | títulos de card |
| Body | `clamp(1rem, 0.5vw, 1.125rem)` | 400 | medida 45-75ch |

(Detalhe e razões de escala em `typography-scale.md`.)

## Acessibilidade na composição (não depois)

- Touch targets ≥ 44×44px.
- Hierarquia de heading sem pular níveis (h1 → h2 → h3).
- Foco visível sempre (nunca `outline: none` sem substituto).
- Contraste conforme `color-engineering.md` (APCA), checado na escolha de cor.

## Saída

A composição entra no `design-tokens.json` como `spacing`, `grid` (templates assimétricos por seção) e `density` (sparse/dense por seção), e no section plan como o ritmo.
