# Awwwards Quality Gate (24 itens)

Os critérios reais de uma jury awwwards, com os pesos reais. Cada item: PASS / NEEDS WORK / FAIL com evidência. Itens BLOCKING não passam sem prova. Sem emojis nos labels.

## Design — 40% (16 pontos)

1. **[BLOCKING]** Hierarquia visual clara (primária → secundária → terciária).
2. **[BLOCKING]** Fonte customizada (não system fonts; não Inter/Roboto/Arial como escolha estética).
3. **[BLOCKING]** Escala tipográfica consistente com `clamp()`.
4. **[BLOCKING]** Paleta intencional e coesa (OKLCH single-hue; budget 70/20/8/2).
5. **[BLOCKING]** Consistência em todas as seções.
6. [ADVISORY] Micro-detalhes (hover states, transitions, cursor com propósito).
7. [ADVISORY] Textura/profundidade (noise overlay, glassmorphism, gradient mesh).
8. [ADVISORY] Grid assimétrico ou layout não-convencional (não 1fr 1fr 1fr).

## Usability — 30% (12 pontos)

9. **[BLOCKING]** 60fps durante scroll (sem jank). Evidência: perf-audit + observação.
10. **[BLOCKING]** Mobile responsive com touch (sem overflow horizontal a 375px).
11. **[BLOCKING]** Navegação por teclado funcional; foco visível.
12. **[BLOCKING]** Contraste APCA (Lc ≥ 75 body / ≥ 60 large). Evidência: oklch-validate.
13. **[BLOCKING]** `prefers-reduced-motion` desliga todas as animações. Evidência: perf-audit.
14. **[BLOCKING]** Scroll nativo (zero Lenis/Locomotive/custom). Evidência: perf-audit.
15. [ADVISORY] Core Web Vitals (LCP < 2.5s, CLS < 0.1).
16. [ADVISORY] Cross-browser (Chrome, Safari, Firefox, Edge).

## Creativity — 20% (8 pontos)

17. **[BLOCKING]** Metáfora visual traduz o negócio em experiência (não decoração).
18. **[BLOCKING]** Ao menos 1 interação customizada única.
19. [ADVISORY] Scroll journey distinto por seção (bidirecional).
20. [ADVISORY] First impression marcante em 3 segundos.

## Content — 10% (4 pontos)

21. **[BLOCKING]** Zero lorem ipsum — todo copy real e confiante.
22. **[BLOCKING]** Meta tags SEO (title, description, og:title, og:image). Evidência: perf-audit.
23. [ADVISORY] HTML5 semântico (header, main, section, nav, footer).
24. [ADVISORY] Alt text em imagens e canvas.

## Hard rejects (qualquer um derruba o veredito)

- Scroll hijacking (Lenis/Locomotive) → FAIL.
- Lorem ipsum → FAIL de content.
- Animações unidirecionais (toggleActions/once em scroll) → -1.5.
- Hero WebGL sem pin correto → -0.8 usability.
- Stock photos → -1.0 design.
- Templates reconhecíveis (Bootstrap/Tailwind genérico) → -1.5 design.

## Scoring

```
Total = Design(16) + Usability(12) + Creativity(8) + Content(4) = 40 pontos
Normalizado = Total / 4  → escala 0-10

Veredito:
  >= 8.5   SOTD competitive — pronto para submissão
  7.0-8.4  Honorable Mention — melhorias pontuais
  5.0-6.9  Needs Work — iteração significativa
  < 5.0    Fail — retrabalho fundamental
```

Itens BLOCKING que falham impedem verdicts altos independentemente da soma — um build com lorem ipsum não é "Honorable Mention com ressalva", é Fail de content.
