# Semantic amplification

Como converter um brief vago em direção visual precisa e reproduzível. Vagueza produz output genérico; precisão produz design.

## Expansion protocol (5 fases)

```
INTENÇÃO VAGA
  ↓ 1. Decomposição estrutural — quebre em 10 dimensões
  ↓ 2. Saturação semântica — troque vago por vetores precisos
  ↓ 3. Tecelagem relacional — amarre as dimensões em harmonia matemática
  ↓ 4. Ancoragem atmosférica — metáfora + sensorial + negativos
ATMOSFERA → OUTPUT DETERMINÍSTICO
```

### Fase 1 — 10 dimensões a decompor
layout, sistema tipográfico, sistema de cor, ritmo de espaçamento, inventário de componentes, camada de interação, estratégia responsiva, hierarquia de conteúdo, direção atmosférica, baseline de acessibilidade.

### Fase 2 — saturação (vago → preciso)

| Vago | Amplificado |
|---|---|
| "texto grande" | "display no passo 7 da escala perfect-fourth (~48px na base 16)" |
| "parece moderno" | "neo-grotesk, whitespace generoso, monocromático + um acento de alta croma, grid assimétrico" |
| "espaçamento limpo" | "base 8px, padding de conteúdo 24-48px, espaçamento de seção 80-120px, gap de componente 16px" |
| "animação legal" | "300ms cubic-bezier(0.22,1,0.36,1), transição de opacity com stagger de 50ms entre irmãos" |

### Fase 3 — tecelagem relacional
"A escala de tipo ancora no baseline de 4px; o espaçamento deriva da mesma unidade de 4px — harmonia matemática." "Cor primária só em elementos interativos + dado-chave → o olho vai naturalmente aos CTAs."

### Fase 4 — ancoragem atmosférica
"Precisão suíça: tipo geométrico nítido, grid matemático, whitespace clínico — NÃO quente, NÃO lúdico."

## 5 power moves

1. **Negative constraint stack** — liste o que NÃO fazer: "não usar hero centralizado sobre stock photo, cards Material default, gradiente roxo-azul, Inter/Roboto, grids uniformes, sombras sem contexto."
2. **Reference anchor** — "precisão tipográfica da Stripe, generosidade espacial da Apple, densidade de informação do Bloomberg Terminal."
3. **Specificity spike** — um detalhe hiper-específico levanta o teto de tudo: "CTA primário: 300ms cubic-bezier(0.22,1,0.36,1), scale 1.0→1.02 no hover, box-shadow de 8px de spread."
4. **Cross-domain bridge** — "o layout deve ter o ritmo de boa prosa: parágrafos de tamanhos variados, pausas deliberadas, um momento de clímax, resolução tranquila."
5. **Constraint paradox** — mais constraints = melhor output criativo: "só 3 cores. só 2 pesos de fonte. no máximo 4 tipos de componente. faça cada elemento contar."

## Quando usar

Sempre que o brief chega vago ("quero algo bonito e moderno"). Rode o protocolo até ter direção que o `frontend-forge` consiga implementar sem adivinhar. O resultado entra no vision-brief como `atmospheric_direction` + a negative constraint stack.
