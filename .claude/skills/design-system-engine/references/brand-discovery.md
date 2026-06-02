# Brand discovery

Nenhuma decisão visual antes desta. O discovery extrai a essência da marca e a traduz em DNA visual. Sem ele, o design é arbitrário.

## Minimum Viable Discovery (obrigatório)

Quatro artefatos. Recuse seguir para o design sem eles:

1. **Onliness statement** — "Somos o ÚNICO [categoria] que [diferenciador]." (Neumeier) Se a marca não consegue completar, o posicionamento não existe ainda.
2. **Emoção primária** — uma de: trust, excitement, sophistication, wonder, rebellion, calm. É o que o visitante deve sentir nos primeiros 3 segundos.
3. **Arquétipo** — um de 12 (abaixo).
4. **WHY** — por que a marca existe além do lucro. (Sinek)

## Concept Mechanism (sequência inviolável)

```
WHY + emoção        → DNA visual base
arquétipo           → família de paleta + tipografia + curva de motion
onliness            → espaço visual diferenciado (o que DEVE e o que NÃO PODE parecer)
teste de irreplaceabilidade → remova o nome; ainda se reconhece? se não, volte ao início
```

## 12 arquétipos → DNA visual

| Arquétipo | Paleta | Tipografia | Motion | Densidade |
|---|---|---|---|---|
| Hero | primárias fortes, alto contraste | geométrica forte, pesada | rápido, decisivo | alta |
| Sage | azuis frios, terrosos suaves | serifa clássica + limpa | medido, deliberado | média |
| Explorer | terrosos vivos, naturais | grotesk robusta | dinâmico, livre | média |
| Creator | vibrante, eclética | display expressiva | lúdico, experimental | variável |
| Ruler | profundas, metálicas, contraste | serifa de autoridade | controlado, majestoso | alta |
| Magician | roxo profundo, neon elétrico | sans futurista, variável | cinematográfico, transformativo | alta |
| Outlaw | alto contraste, vermelho/preto | condensada, angular | rápido, agressivo, glitch | alta |
| Lover | rosas quentes, dourados, creme | serifa fluida, delicada | suave, sensual | baixa |
| Jester | saturadas, inesperadas | display divertida | spring, bouncy | variável |
| Caregiver | azuis/verdes suaves, quentes | humanista amigável | acolhedor, gentil | baixa |
| Everyman | neutros honestos, acessíveis | grotesk neutra | direto, sem firulas | média |
| Innocent | claras, leves, pastéis | sans limpa, redonda | leve, simples | baixa |

## Curvas de motion por personalidade

| Personalidade | Easing | Duração | Caráter |
|---|---|---|---|
| Luxury | `cubic-bezier(0.76, 0, 0.24, 1)` | 700-1200ms | cinematográfico, início lento, dramático |
| Tech | `cubic-bezier(0.4, 0, 0.2, 1)` | 200-300ms | rápido, funcional |
| Playful | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 400-600ms | spring com overshoot |
| Editorial | `cubic-bezier(0.9, 0, 0.1, 1)` | 800-1500ms | início e fim lentos, narrativo |

## Kapferer Prism (6 facetas → onde cada uma aterrissa no design)

| Faceta | Pergunta | Aterrissa em |
|---|---|---|
| Physique | como a marca parece? | tokens de cor, tipografia, estilo visual |
| Personality | se fosse pessoa? | voz do copy, personalidade de motion |
| Culture | que valores? | direção de conteúdo, imagery |
| Relationship | como interage? | padrões de UX, estilo de CTA |
| Reflection | usuário idealizado? | nível de aspiração, direção de foto |
| Self-image | como o usuário se vê? | tom de testimonial, prova social |

## Saída do discovery

```
vision-brief:
  onliness: "..."
  primary_emotion: "..."
  archetype: "..."
  why: "..."
  metaphor: "<metáfora física que organiza a experiência: shield/fluid/constellation/fabric/...>"
  visual_dna: { palette_family, typography_direction, motion_curve, density }
```

A metáfora não é decoração — é o sistema pelo qual toda a experiência é compreendida. Tudo (cor, motion, copy, layout) deve poder ser justificado por ela.
