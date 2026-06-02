# Modo product (Next.js + shadcn + dashboards)

Para apps, painéis e dashboards de produção: estado, dados, CRUD. Entrega um projeto React/Next.js acessível e com dark mode.

## Stack

- **Next.js** (App Router) — Server Components por padrão; `"use client"` só onde há interatividade/estado.
- **Tailwind CSS** — customizado com os design tokens (nunca o default genérico). Mapeie os tokens OKLCH para CSS variables consumidas pelo Tailwind.
- **shadcn/ui** — componentes copiados para `components/ui/` (não é npm package; o CLI copia o source). Radix por baixo = acessível por padrão.
- **Recharts** — gráficos (line, area, bar, donut). Via `ChartContainer` para theming consistente.
- **TanStack Table** — tabelas de dados (sorting, filtering, paginação).
- **Dark mode** — obrigatório. CSS variables em `oklch`, alternância class-based (`.dark`).

## Setup (com fallback sem MCP)

Se o **shadcn MCP** estiver na sessão: use-o para buscar componentes/blocks e gerar os comandos de add. Caso contrário, fallback por CLI:

```bash
npx shadcn@latest init
npx shadcn@latest add button card table tabs dialog dropdown-menu chart
```

Esses comandos exigem confirmação (estão em `permissions.ask`).

## Padrões de dashboard

- **KPI cards**: número grande + delta (com cor semântica positive/negative) + sparkline opcional. Cowan 4±1 cards por linha.
- **Grid assimétrico** mesmo em dashboard: evite 4 cards idênticos `1fr 1fr 1fr 1fr`; varie peso e tamanho por importância.
- **Tabela**: TanStack com header sticky, zebra sutil via token, ações por linha com `aria-label`.
- **Gráficos**: Recharts com paleta derivada dos tokens (não as cores default do Recharts), tooltip custom, sem 3D gratuito.
- **Estados**: empty, loading (skeleton), error — todos desenhados, não esquecidos.
- **Densidade**: dashboards são naturalmente dense; compense com whitespace entre grupos (proximidade ≤0.5x) e hierarquia tipográfica clara.

## Acessibilidade (WCAG AA, não opcional)

- Contraste APCA conforme `color-engineering.md`.
- Navegação por teclado completa; foco visível.
- Touch targets ≥ 44px.
- Heading hierarchy sem pular níveis.
- `prefers-reduced-motion` respeitado (transições do shadcn já respeitam, confirme).
- Tabela e gráfico com alternativa textual/aria onde a informação é só visual.

## Estrutura do projeto

```
build-output/product-<slug>/
  app/            (rotas, layout com dark-mode provider)
  components/
    ui/           (shadcn)
    dashboard/    (KPI cards, charts, tables compostos)
  lib/            (utils, data fetching)
  styles/         (tokens OKLCH -> tailwind theme)
```

Use `templates/product-page.tsx.txt` como ponto de partida da page principal.

## Output

Projeto em `build-output/product-<slug>/`. Rode `perf-audit.ts` no diretório (checa deps proibidas, presença de dark mode e a11y básica). Bundle alvo < 1MB comprimido.
