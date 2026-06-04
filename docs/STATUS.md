# GDelta Sistema — Status & Handoff

> Documento vivo. Última atualização autônoma: sessão de construção dos Marcos 1–3.
> Fonte da verdade de regras: [`CLAUDE.md`](../CLAUDE.md). Decisões de arquitetura:
> [`docs/design/`](./design).

## 1. Resumo executivo

O **Sistema G Delta** está **funcionalmente completo nos Marcos 1, 2 e 3**, construído,
auditado, contra-revisado, **aplicado e validado por smoke no ambiente de TESTE**, e
rodando no navegador. O que falta para "em produção, vendendo" é **ativação operacional**
que depende de insumos do fundador (não de código): agregador fiscal, dados fiscais,
e a promoção ao PROD.

**% de conclusão (calibrado):**
- **Código dos Marcos 1–3:** ~100% (clientes, veículo, orçamento ao vivo, seguradora, OS comercial, Pátio, notas, financeiro com markup real, estoque).
- **Ativação fiscal real (NFS-e):** ~70% — fundação + camada agnóstica + emissão server-side prontas; falta o `fetch` real do agregador (gated: conta + certificado).
- **Produção:** 0% — nada aplicado no PROD ainda (proposital; aguarda OK + dados reais).
- **Convergência com o Totem:** fora de escopo agora (fase futura, por decisão do fundador).

## 2. O que está construído (e onde)

| Módulo | Código | Migration | TESTE |
|---|---|---|---|
| Auth + multi-tenant (oficina_id no JWT + RLS) | `supabase/migrations/0001–0002` | ✅ | ✅ |
| Clientes (PF / seguradora 1ª classe / cooperativa) | `src/lib/supabase/clientes.ts`, `seguradoras.ts`, `painel/clientes` | 0003, 0008 | ✅ |
| Veículo (placa + FIPE + chassi + renavam) | `src/lib/supabase/veiculos.ts`, `lib/fipe.ts`, `painel/veiculos` | 0004, 0007 | ✅ |
| Orçamento ao vivo (margem/lucro em tempo real) | `src/lib/supabase/orcamentos.ts`, `painel/orcamentos` | 0005 | ✅ |
| OS comercial (aprovar → OS) + Pátio (dias × R$) | `os-comercial.ts`, RPC `aprovar_orcamento`, `painel/os` | 0009, 0010, 0011 | ✅ |
| Notas fiscais (registro) + emissão **server-side** | `notas.ts`, `lib/fiscal/*`, `app/api/fiscal/emitir` | 0012 | ✅ (sem agregador) |
| Financeiro (KPIs, funil, ranking, **markup real**) | `financeiro.ts`, `painel/financeiro` | 0013, 0016 | ✅ |
| Estoque (itens, movimentos, custo médio, alertas) | `estoque.ts`, `painel/estoque` | 0014 | ✅ |
| Hardening (FORCE RLS em todas as tabelas) | — | 0015 | ✅ |
| UX (dark mode anti-flash, skeletons, count-up, marca) | `components/theme-toggle.tsx`, `skeleton.tsx`, `brand.tsx` | — | ✅ |

**TESTE (`zivdqykrppatcgdezvqu`):** migrations **0001→0016 aplicadas** e validadas por smoke
(incl. o capstone do markup real: receita − custo de itens − material baixado = margem real).

## 3. Segurança (estado)

- **RLS + `FORCE ROW LEVEL SECURITY`** em todas as tabelas de tenant (isolamento por `oficina_id`).
- RPC `aprovar_orcamento` e triggers: `security invoker` + `search_path` fixo.
- Todas as views: `security_invoker = true` (herdam a RLS — sem vazamento entre oficinas).
- Emissão fiscal **só server-side** (`/api/fiscal/emitir`, runtime nodejs); token do agregador nunca vai ao browser.
- Segredos (`.env*`) fora do git; `.claude/settings.json` nega leitura de `.env`/secrets.
- Auditado por squads de QA + contra-review adversarial em cada bloco.

## 4. Pendências — TUDO depende do fundador (runbooks)

### 4.1 Revogar tokens do Supabase (higiene)
Acesse **https://supabase.com/dashboard/account/tokens** (conta do Sistema) e revogue
quaisquer tokens `gdelta-*` que sobraram. Tokens só devem existir durante um uso.

### 4.2 Ligar a emissão de NFS-e de verdade (Marco 2)
1. Escolher o agregador (recomendado testar 2 em homologação: **Focus NFe**, Nuvem Fiscal, PlugNotas) — ver [`docs/design/marco2-nfse-agregador.md`](./design/marco2-nfse-agregador.md).
2. Criar conta + chave de API; ter **CNPJ**, **certificado digital A1**, **regime (Simples Nacional)**, inscrição municipal e código de serviço.
3. Definir as env vars **server-side** (nunca `NEXT_PUBLIC_`): `FISCAL_AGREGADOR=focus`, `FISCAL_FOCUS_TOKEN=...`.
4. Implementar o `fetch` real em `src/lib/fiscal/focus-nfe.ts` (os TODOs). **Sanitizar erros** (não ecoar resposta/credencial do agregador) — ressalva da auditoria de segurança.
5. Testar em **homologação** antes de produção.

### 4.3 Promover ao PROD (`oycgiebdeoffjbcqycef`) — só quando vender
1. **OK explícito** do fundador (regra inegociável).
2. Aplicar `supabase/migrations/0001→0016` no PROD **na ordem** (mesmo método do TESTE: API de Management com um PAT da conta do Sistema).
3. Verificar RLS/FORCE + smoke no PROD.
4. **Onboarding:** criar a conta da 1ª oficina (o fundador fornece nome + e-mail + senha — **nunca inventar credencial de produção**).
5. Deploy do app (Vercel) com as env vars de PROD (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` do PROD + `FISCAL_*`).

## 5. Follow-ups técnicos (BAIXA, opcionais)

- FK composta `(oficina_id, item_id/orcamento_id)` em movimentos/OS/notas para reforçar
  co-tenancy por constraint (hoje garantido por RLS + guard de trigger no estoque).
- Registrar o custo do material **no momento da baixa** (saída) em vez de usar `custo_medio`
  atual — torna o markup real um snapshot exato (hoje é aproximação documentada).
- Versionar o registro do hook `custom_access_token_hook` (config de plataforma) em `supabase/`.
- Refino: ação "Enviar" no orçamento; sub-UI de mão de obra da seguradora; tempo
  **produtivo** real no Pátio (via Totem, fase futura).

## 6. Como rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000 (ou 3001)
npm run qa         # typecheck + build (gate de qualidade)
```
`.env.local` aponta para o **TESTE**. Migrations em `supabase/migrations/` (TESTE antes de PROD, sempre).
