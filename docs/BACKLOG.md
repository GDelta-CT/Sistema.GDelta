# GDelta — Sistema · Backlog

> Fontes: roadmap (Marcos 1–3), awwwards-judge, Diretriz V3 (Pátio/IEO/ROI), inteligência competitiva ([Cília](research/cilia/cilia-pesquisa-mercado.md) · [Sigma](research/sigma/sigma-pesquisa-mercado.md) · [Battlecard](research/battlecard-gdelta-sigma-cilia.md)) e GTM ([pricing + validação](gtm/pricing-e-validacao.md)).
> Atualizado: jun/2026.

## Escopo — Sistema × Totem (linha que não cruzo)
- **Sistema** (`dev/Sistema-GDelta`) — inteligência de gestão (painel do dono). **É o que construo.**
- **Totem** (`Documents/GDelta-Totem`) — captura no chão de fábrica. **Projeto separado — NÃO toco.**
- **Banco ÚNICO compartilhado** (decidido): Totem + Sistema no mesmo Supabase (`oficina_id` + RLS). Modelo em [`design/v3-patio-ieo-schema.md`](design/v3-patio-ieo-schema.md). **Risco aberto:** unificar o `custom_access_token_hook` (emitir `oficina_role` E `user_role`) e a tabela `oficinas` antes de fundir.

---

## ✅ Concluído (e pushado pro GitHub)
- **App SOTD** (8.6) + **landing 9.0** (wedge competitivo + 3 refinos do juiz: ROI provado, contraste APCA, repetição).
- **ROI card** "o software se paga" + **painéis de gargalo** (fail-soft) + **chips unificados** (`lib/status.ts`).
- **Schema V3 Fase A** — migration 0017 (aditiva) + rollback + design doc. *(escrito; pendente aplicar no TEST)*
- **Inteligência competitiva** — Cília + Sigma + battlecard (fontes citadas, verificação adversarial).
- **GTM** — pricing value-based (3 planos) + roteiro de validação + versão imprimível.
- **Squads-Genius** instalado global (`~/.claude` + `/criar-squad`, `/usar-squad`) e analisado.
- **Higiene** — nomes de oficina genericizados; tudo commitado e **em sync com o `origin`**.

---

## 🔥 P0 — Validação de mercado (AGORA — sem código, é a fronteira viva)
1. **Rodar 3 entrevistas** com donos de oficina (roteiro pronto: [`gtm/roteiro-entrevista.html`](gtm/roteiro-entrevista.html)). Escutar, não vender.
2. **Decidir segmento-alvo** (premium × média) + apetite de ancoragem.
3. **Achar 1 candidato a piloto** → medir **horas salvas reais** → fecha o preço (sai do `[ASSUMPTION]`).

## 🔑 P0b — Gated (só você libera)
4. **Token do TEST** → aplico a 0017 e ligo os painéis de gargalo com dados reais.

## P1 — Inteligência da V3 (depende do banco único + dados reais)
5. **Unificar hook + `oficinas`** (Totem ↔ Sistema) — pré-requisito do banco único.
6. **IEO** (Tempo Real × Orçado) · **Gargalo Cabine/Estufa** · **Retrabalho** (gráfico causa-raiz) · **Flag "Orçamento Complementar Urgente"**.

## P2 — Marketing (desbloqueado)
7. **Conteúdo de lançamento** (skill `gdelta-marketing` / squad de Instagram).
8. **Mensagem de abordagem** (WhatsApp) pra marcar as entrevistas/piloto.
9. **Resposta ao euBati** — "acompanhe seu reparo" via link WhatsApp (fatia do valor do moat do Sigma, sem a rede).

## P3 — Polish & dívidas (opcional)
10. **`squad-pcfp` → doc "engine calcula, LLM explica"** pro motor de margem (rec #1 da análise de squads).
11. Centralizar status fiscal (`StatusNota`) em `lib/status.ts` (duplicado em os/notas).
12. Trocar cópias inline de `useAnimatedNumber` pelo hook compartilhado.
13. Baixa: key do pulse em orçamentos. *(contraste `fg-subtle` dark já fechado nos refinos)*

## P4 — Comercialização (gated)
14. **NFS-e real** (agregador + CNPJ + certificado A1 + regime).
15. **PROD + 1ª oficina** (credenciais reais).
16. **Revogar token** `gdelta-aplicar-0015-0016`.

## Higiene
- `main` em sync com `origin` (pushado).
- 🧹 Limpar o clone redundante `dev/Squads-Genius` (biblioteca já vive em `~/.claude/squads-genius`).
- Battlecard + pricing são **documentos vivos**: atualizar com o dado real das entrevistas.
