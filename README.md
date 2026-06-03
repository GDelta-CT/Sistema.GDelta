# Sistema G Delta

SaaS de gestão para oficinas de **funilaria e pintura** de pequeno e médio porte. Nasce da inteligência financeira já vendida hoje (o "Dashboard Gestão G Delta") e constrói o operacional ao redor dela.

> **Fonte da verdade do projeto:** [`CLAUDE.md`](./CLAUDE.md). Leia antes de qualquer mudança — as regras de segurança/ambiente prevalecem.

## O que é

- **Marca:** G Delta · **Produto:** Sistema G Delta (este repositório, `sistema-gdelta`).
- **Não confundir com o Totem G Delta** (chão de fábrica: apontamento + painel de produção) — é **outro projeto/repositório** (`totem-gdelta`). A convergência entre os dois é fase futura.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** — tokens OKLCH, tema claro/escuro
- **Supabase** — Auth + Postgres + **RLS**. Multi-tenant por `oficina_id` carimbado no JWT (access token hook) **antes** de qualquer política RLS.

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:3000
```

Variáveis de ambiente em `.env.local` (modelo em `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # publishable key (pública por design)
```

> **Nunca** commitar `.env*`. Segredos e dados pessoais seguem a **LGPD**.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run qa` | typecheck + build |
| `npm run lint` | ESLint |

## Estrutura

```
src/app/              Rotas (landing, login, painel: clientes, veículos, orçamentos)
src/lib/              Camadas de dados (Supabase, FIPE)
src/components/       Componentes (marca, providers)
supabase/migrations/  Schema versionado (TESTE antes de PROD)
design-systems/gdelta/ Design system do projeto
docs/                 PRD, estratégia, roadmap, design
```

## Banco de dados (Supabase)

- Dois ambientes: **TESTE** e **PROD**. Migrations rodam **sempre no TESTE primeiro**; PROD só com autorização explícita do fundador.
- Ordem sagrada: **auth + claim `oficina_id` no JWT → só então RLS**.

## Roadmap (resumo)

- **Marco 1 (cunha vendável):** Clientes · Veículo por placa + FIPE · Orçamento ao vivo.
- **Próximos:** Pátio/OS · NFS-e (via agregador fiscal) · Estoque · Financeiro (DRE, margem, aging, ranking).

Detalhes em [`docs/`](./docs).

---

Ferramentas de desenvolvimento (agents/commands/skills) documentadas em [`AGENTS.md`](./AGENTS.md) e em `.claude/`.
