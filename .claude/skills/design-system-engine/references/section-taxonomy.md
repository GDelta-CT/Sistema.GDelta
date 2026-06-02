# Section taxonomy

Vocabulário de seções e regras de ordem. Vale para landing (modo experience) e para dashboards/apps (modo product, adaptado).

## Os 21 tipos (required / optional)

| Tipo | Propósito | Required | Optional |
|---|---|---|---|
| hero | primeira impressão (regra dos 5s) | heading, CTA primário | subheading, mídia, prova social |
| navigation | orientação | links, logo | CTA, busca |
| features | comunicar capacidades | título+desc por item (3+) | ícone, screenshot |
| how-it-works | explicar processo | passos numerados | ilustração por passo |
| portfolio | mostrar trabalho | itens com mídia | filtro, categoria |
| testimonials | prova social | quote, autor | papel, empresa, avatar |
| stats | provar valor com números | número+label (3-6) | ícone, indicador de crescimento |
| social-proof | confiança | logos/contagem | depoimento curto |
| pricing | conversão por comparação | tier, preço, features, CTA | toggle, badge "popular" |
| comparison | diferenciar de alternativas | tabela com critérios | destaque da coluna própria |
| faq | remover objeções | pergunta+resposta | categorias |
| cta-block | ação única de conversão | heading, botão | subheading, fundo |
| about | contexto/história | narrativa | timeline, foto de time |
| team | pessoas | nome, papel, foto | bio, social |
| blog | conteúdo/SEO | título, excerpt, link | data, tag, autor |
| newsletter | captura | campo, botão | incentivo |
| integrations | ecossistema | logos/lista | descrição por item |
| logos | autoridade | grade de logos | — |
| contact | conversão direta | form ou canais | mapa, horário |
| footer | navegação/legal | links, copyright | newsletter, social |
| dashboard-shell (modo product) | layout de app | sidebar/topbar, área de conteúdo | breadcrumb, comando |

## Para modo product (dashboards), adicione

KPI cards (número grande + delta + sparkline), tabela de dados (TanStack), gráficos (Recharts), filtros/segmentação, estado vazio, estado de carregamento, estado de erro. Dark mode obrigatório.

## Regras de ordem (invioláveis)

1. Hero sempre primeiro (100vh, acima da dobra).
2. Nunca duas seções do mesmo tipo consecutivas.
3. Alterne dense ↔ sparse (2 dense : 1 sparse).
4. cta-block após no máximo 3 seções de conteúdo (ritmo de conversão).
5. stats/social-proof ANTES de pricing (construa valor primeiro).
6. footer sempre por último.

## Minimum viable page

4 seções: hero + (features ou about) + cta-block + footer. Qualquer landing séria tem pelo menos isso.

## Density modes por seção

Cada seção recebe `sparse` ou `dense` no plano (ver `composition-grammar.md`). O ritmo é parte do design, não acaso.

## Saída

```
section_plan: [
  { type: "hero", density: "sparse", concept: "<o que acontece visualmente aqui>" },
  { type: "features", density: "dense", grid: "2fr 1fr 3fr", concept: "..." },
  ...
]
```
