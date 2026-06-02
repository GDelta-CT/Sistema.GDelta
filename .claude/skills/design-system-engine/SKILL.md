---
name: design-system-engine
description: Deriva o sistema de design de um frontend - descoberta de marca, tokens OKLCH, composição, tipografia, taxonomia de seções e coreografia de motion. Use antes de qualquer build, quando precisar definir paleta, escala tipográfica, layout, plano de seções, ou traduzir um brief vago em direção visual precisa. Triggers - "design tokens", "color palette", "brand discovery", "typography scale", "section plan", "make it look premium", "design system".
---

# Design System Engine

O pipeline que vira um brief em um sistema de design reproduzível — antes de uma linha de HTML/React. O `design-architect` consome esta skill; o `frontend-forge` implementa o que ela produz.

## Pipeline

```
1. DISCOVERY    → arquétipo de marca, emoção primária, onliness, metáfora   (brand-discovery.md)
2. AMPLIFY      → traduz vagueza em direção precisa                          (semantic-amplification.md)
3. COLOR        → paleta OKLCH single-hue + contraste APCA + budget          (color-engineering.md)
4. TYPE         → escala modular fluida + pareamento display/body            (typography-scale.md)
5. COMPOSE      → grids, densidade, hierarquia (Gestalt quantificado)        (composition-grammar.md)
6. SECTIONS     → quais seções, em que ordem, com que ritmo                  (section-taxonomy.md)
7. MOTION       → curvas, scrub, bidirecionalidade                           (motion-grammar.md)
```

A saída é um `design-tokens.json` (esqueleto em `assets/tokens.template.json`) + um vision-brief + section plan.

## Regra fundadora: derive, não escolha à mão

A paleta inteira deriva de **uma** variável (`--brand-hue`) via OKLCH. A escala tipográfica deriva de uma razão. O espaçamento deriva de uma base de 8px. Sistemas derivados são coesos por construção; escolhas hex/px à mão produzem o "look genérico".

## Teste de irreplaceabilidade

Antes de fechar o sistema: remova o nome da marca do design. Ainda dá para dizer de quem é? Se não, volte ao discovery. Um sistema que poderia ser de qualquer um falhou.

## O que combater (sempre)

O "look de IA genérica": Inter/Roboto, purple-gradient sobre branco, grids `1fr 1fr 1fr`, tudo centralizado, cantos uniformes, sombras sem contexto, paletas tímidas e uniformemente distribuídas. As references dizem o que fazer no lugar, com números.

## Acessibilidade não é etapa final

Contraste APCA (Lc ≥ 75 body, ≥ 60 large) entra na escolha de cor, não num check depois. Touch targets ≥ 44px e hierarquia de heading entram na composição. Ver `color-engineering.md` e `composition-grammar.md`.
