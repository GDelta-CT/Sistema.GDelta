# GDelta — Sistema · Backlog

> Fontes: roadmap (Marcos 1–3), awwwards-judge, Diretriz Estratégica V3 (PDF "Pátio, IEO e ROI"), e a inteligência competitiva ([Cília](research/cilia/cilia-pesquisa-mercado.md) · [Sigma](research/sigma/sigma-pesquisa-mercado.md) · [Battlecard](research/battlecard-gdelta-sigma-cilia.md)).
> Atualizado: jun/2026.

## Escopo — Sistema × Totem (linha que eu não cruzo)

- **Sistema** (`dev/Sistema-GDelta`) — **inteligência de gestão**: painel do dono/gestor. **É o que eu construo.**
- **Totem** (`Documents/GDelta-Totem`) — captura no chão de fábrica. **Projeto separado — NÃO toco.**
- A Diretriz V3 define a camada que o Sistema exibe (IEO, ROI, Gargalos). O Totem captura, o Sistema mostra.

## ✅ Decisão tomada — banco ÚNICO compartilhado

Totem + Sistema no **mesmo Supabase multi-tenant** (`oficina_id` + RLS). Modelo relacional desenhado em [`docs/design/v3-patio-ieo-schema.md`](design/v3-patio-ieo-schema.md). **Risco aberto:** o hook de login (`custom_access_token_hook`) e a tabela `oficinas` existem nos dois lados com corpos diferentes → unificar antes de fundir (o hook deve emitir `oficina_role` E `user_role`).

---

## ✅ Concluído nesta leva (jun/2026)

- **Card ROI "o software se paga"** (financeiro) — medidor de arco + count-up, inputs editáveis. *(arma de venda; reforçada pela pesquisa: o Sigma não tem ROI ao vivo)*
- **Painéis de gargalo** (estouro de insumo, cabine/estufa) — fail-soft, ligam quando a 0017 for aplicada.
- **Fix landing** — número-herói do lucro não corta mais.
- **Chips unificados** — `lib/status.ts` (fonte única) + `Chip`/`StatusChip` em orçamentos/financeiro/estoque/clientes; dedupe de `chipTipo`/`avatarTipo`.
- **Schema V3 escrito** — migration 0017 (aditiva) + rollback + design doc. *(pendente aplicar no TEST)*
- **Inteligência competitiva** — pesquisas Cília + Sigma + battlecard (fontes citadas, verificação adversarial).

---

## P0 — destrava o resto (precisa de você)

1. **Aplicar a migration 0017 no TEST** — gere o token do Supabase (projeto TEST), cole no arquivo da Área de Trabalho; eu aplico + rodo smoke. *(sem isso os painéis de gargalo ficam vazios)*

## P1 — Inteligência da V3 (depende do banco único executado)

2. **IEO — medidor de eficiência** (Tempo Real × Tempo Orçado) no painel.
3. **Gargalo Cabine/Estufa** — alerta de ciclo de cura acima do padrão.
4. **Retrabalho — gráfico de causa-raiz** por equipe (`motivo_retrabalho`).
5. **Flag "Orçamento Complementar Urgente"** — inbox da administração (vinda da desmontagem).
6. **Unificar o hook + `oficinas`** entre Totem e Sistema (pré-requisito do banco único).

## P2 — Competitivo / Posicionamento (novo — da pesquisa)

7. **Trazer o wedge pra landing/marketing** — assinatura "**Lucro ao vivo. Tempo medido, não digitado.**" + bloco "por que não é mais um sistema de oficina" (lucro na hora · tempo cronometrado automático · ROI ao vivo). *Copy pronta no battlecard — a aprovar antes de tocar a landing SOTD.*
8. **Resposta ao euBati (lacuna nossa)** — não disputar lead-gen; entregar **"acompanhe seu reparo" via link WhatsApp** (usa dado que já temos = fatia do valor do euBati sem a rede).
9. **Validar os "Indeterminados"** — preço e cobertura reais do Sigma e do Cília via demo/comercial (decidir preço do GDelta e a via de integração com o Cília).
10. **Battlecard vivo** — atualizar quando tiver preço/cobertura reais.

## P3 — Polish restante (awwwards-judge)

11. Centralizar status fiscal (`StatusNota`) em `lib/status.ts` (hoje duplicado em os/notas).
12. Trocar cópias inline de `useAnimatedNumber` pelo hook compartilhado (financeiro, orcamento-demo).
13. Baixas: contraste `fg-subtle` em texto pequeno; key do pulse em orçamentos.

## P4 — Comercialização (depende de você; runbooks no STATUS.md)

14. **NFS-e real** — agregador fiscal + CNPJ + certificado A1 + regime.
15. **PROD + 1ª oficina** — promover e onboardar com credenciais reais.
16. **Revogar token** `gdelta-aplicar-0015-0016`.

## Higiene

- Working tree commitado; **`main` à frente do `origin`, sem push** (espera "pode dar push").
- Docs do OneDrive (nomes de oficina) limpos in-place.
