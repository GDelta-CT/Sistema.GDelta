# GDelta — Sistema · Backlog

> Fonte: roadmap (Marcos 1–3), achados do awwwards-judge, itens travados de comercialização, e a **Diretriz Estratégica V3** (PDF "Otimização de Pátio, IEO e ROI").
> Atualizado: 2026-06-06.

## Escopo — Sistema × Totem (linha que eu não cruzo)

- **Sistema** (este repo, `dev/Sistema-GDelta`) — **inteligência de gestão**: o painel do dono/gestor. Dashboards, alertas, financeiro, orçamento, OS comercial. **É o que eu construo.**
- **Totem** (`Documents/GDelta-Totem`) — **captura no chão de fábrica**: relógio de pátio, botões grandes, bipagem. **Projeto separado — eu NÃO toco.**
- A Diretriz V3 é majoritariamente Totem, **mas define a camada de inteligência que o Sistema precisa exibir** (IEO, ROI, Gargalos) = nosso diferencial. O Totem captura, o Sistema mostra.

## ⚠️ Decisão que destrava quase todo o P1

O Sistema precisa dos dados de pátio que o Totem captura (horas reais, insumos bipados, motivo de retrabalho). Hoje o Sistema roda num Supabase dedicado novo.
- **Banco ÚNICO compartilhado** (Sistema lê o pátio ao vivo) **ou** **bancos separados + integração/sync**?
- Sem decidir, IEO/Gargalos só dá pra "esqueletar" com dados placeholder. (Minha recomendação: banco único — é o que a Visão/Estratégia já assume.)

---

## P0 — Agora, 100% Sistema (não depende do Totem)

1. **Card ROI "o software se paga"** (financeiro). Fórmula do PDF: `((Horas Salvas × R$85) − Licença) / Licença`. Entrada manual de "horas salvas" até o IEO fluir. → **arma de venda matadora**.
2. **Schema aditivo (migrations no TEST)** pro pátio/gargalos, seguindo o protocolo seguro do PDF (**só ALTER / novas tabelas, nunca DROP**):
   - `os_patio.meta_horas` (tempo orçado pela seguradora)
   - `os_insumos_consumidos` (associativa OS × insumo × preparador)
   - `os_auditoria_cabine` (aplicação × ciclo de cura)
   - `motivo_retrabalho` enum (Escorrido, Cisco, Tonalidade, Massa Mapeando)
   - colunas **JSONB future-proof** p/ Audatex/Cília
   - **Apresentar o modelo relacional ANTES de mexer em rotas** (exigência do PDF).
3. **Alerta de estouro de insumo** — já tenho `estoque_itens`/`estoque_movimentos`: cruzar Custo Estimado (orçamento) × Consumido (estoque) → alerta no painel do dono.
4. **Fix landing** — o número-herói do lucro (R$) corta na borda direita em ~1366px. Ajustar clamp / `min-w-0`.

## P1 — Inteligência da Diretriz V3 (precisa da decisão de banco)

5. **IEO — medidor de eficiência** (Tempo Real × Tempo Orçado) como medidor de lucro/prejuízo no painel.
6. **Gargalo Cabine/Estufa** — alerta de ciclo de cura acima do padrão (desperdício de energia/combustível).
7. **Retrabalho — gráfico de causa-raiz** por equipe (usa `motivo_retrabalho`).
8. **Flag "Orçamento Complementar Urgente"** — inbox da administração, vinda do checklist de desmontagem.

## P2 — Fechar SOTD (awwwards-judge, achados abertos)

9. **Unificar chips** — adotar `StatusChip` em orçamentos/financeiro/estoque/clientes (+ um `Chip`/`Badge` genérico p/ categorias).
10. **Centralizar faixas/cores de status** em `lib/status.ts` (fonte única — hoje há duplicação entre telas).
11. **Baixas** — dedupe `chipTipo`/`avatarTipo` (clientes); contraste `fg-subtle` em texto pequeno; key do pulse em orçamentos (re-monta o nó).

## P3 — Comercialização (depende de você; runbooks no STATUS.md)

12. **NFS-e real** — conta no agregador fiscal + CNPJ + certificado A1 + regime.
13. **PROD + 1ª oficina** — promover e onboardar com credenciais reais.
14. **Revogar token** `gdelta-aplicar-0015-0016` (sobra).

## Higiene

- **2 commits à frente, sem push** (`84680b0` SOTD + `46e4a56` docs) — espera "pode dar push".
- Docs do OneDrive limpos (nomes de oficina) in-place; repo dev já commitado.
