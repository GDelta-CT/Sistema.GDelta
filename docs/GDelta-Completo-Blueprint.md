# BLUEPRINT MESTRE — GDelta Completo

> **O que é este doc:** o plano único que unifica TODA a pesquisa e design do GDelta num só mapa. Funde o **ESTADO ATUAL** (o que existe no repo/banco hoje) com a **FEATURE-ALVO** (o conjunto-alvo de features dos 8 docs de pesquisa/design) num **mapa de gaps** + **roadmap priorizado** até "completo".
>
> **Método:** read-only sobre `C:/Users/Eliel/dev/Sistema-GDelta` (commit `d65fadd`, `main` em sync com `origin/main`). Síntese de dois eixos já produzidos (ESTADO ATUAL por módulo + CONJUNTO-ALVO de features). **FATO** = verificado no repo/schema/doc citado. **INFERÊNCIA** = leitura interpretativa, marcada. Nada foi inventado.
>
> **Contexto do autor:** fundador SOLO. Todo o realismo deste plano é calibrado para uma pessoa só. Data: 2026-06-27.

---

## 1. VISÃO — o que é o GDelta completo

O **GDelta completo** é uma suíte única para oficinas de funilaria/pintura onde **3 produtos + 1 módulo** se fecham num só loop: **Administrativo** (orçamento com margem ao vivo → OS → fiscal → financeiro → estoque/tinta), **Operacional/Totem** (chão de fábrica medindo tempo real por etapa), **Delta** (atendente IA no WhatsApp respondendo "tá pronto?" sozinho) e **Peças/Marketplace** (novo × usado dentro da própria OS). O **fosso** é o **loop dado→insight→ação AO VIVO**: o tempo MEDIDO no Totem vira IEO e markup real no Administrativo, que vira o card "o software se paga", que o Delta entrega ao cliente — nenhum concorrente fecha esse circuito porque nenhum tem os 3 produtos no mesmo banco. Hoje o Administrativo está construído e pushado; o resto é gated ou greenfield. Este blueprint é o caminho honesto de "construído" até "completo".

---

## 2. MAPA DE MÓDULOS — Estado Atual × Alvo = Gap

**Legenda de Estado:**
- **feito** — código/migration escrito, pushado E aplicado no banco TEST.
- **escrito-nao-aplicado** — código pushado, migration NÃO aplicada no banco (gated token TEST). App degrada fail-soft.
- **parcial** — existe com stub/caveat/dependência externa explícita.
- **nao** — só design ou nada (greenfield / fora deste repo).

**Legenda de Desbloqueio (o gate que libera):**
- **JA** — desbloqueado, só depende de codar/aplicar.
- **token TEST** — depende de aplicar migration 0017/0018 no TEST.
- **banco-unico** — depende de fundir Totem+Sistema (hook JWT + tabela `oficinas`).
- **PROD-fiscal** — depende de conta agregador + CNPJ + cert A1 + regime, e/ou PROD ligado.
- **Marco3** — depende do marco NFS-e (deadline 01/09/2026) estar fechado.

**Legenda Prioridade:** P0 (núcleo do fosso / desbloqueia receita) · P1 (alto valor, perto) · P2 (importante, depois).

---

### A. ADMINISTRATIVO (este repo — Next/Supabase)

| Feature | Estado | Fonte + tag | Desbloqueio | Prioridade |
|---|---|---|---|---|
| Auth multi-tenant (`oficina_id` no JWT + RLS + FORCE RLS) | feito | repo migr. `...000100/000200/001500` | JA | P0 |
| Clientes (PF / seguradora / cooperativa) | feito | repo `lib/supabase/clientes.ts` | JA | P0 |
| Veículos (placa + FIPE + chassi + renavam) | feito | repo `lib/supabase/veiculos.ts` + VIN/placa `[PARIDADE]` | JA | P0 |
| Orçamento com **margem ao vivo** item-a-item | feito | repo `orcamentos.ts` `calcularTotais` · MM/WM/BC/SIG/PRC `[DIFERENCIAL]` | JA | P0 |
| Semáforo de piso de margem configurável | nao | MM/WM/SIG `[DIFERENCIAL]` | JA | P1 |
| Margem separada por componente (peça/MO/material/sublet) | parcial (peça/MO/insumo) | repo `orcamentos.ts` · MM `[PARIDADE]` | JA | P1 |
| OS comercial (aprovar orçamento → OS via RPC) | feito | repo `os-comercial.ts` migr. `...000900/001000` · WM `[EXTRAIR-WM]` | JA | P0 |
| Pipeline Orçamento→OS→Nota sem redigitar | parcial (orç→OS ok; OS→nota manual) | repo `notas.ts` · WM `[EXTRAIR-WM]` | JA | P1 |
| Pátio (dias × R$) view | feito | repo migr. `...001100` `view_os_dias_rs` · WM `[DIFERENCIAL]` | JA | P1 |
| Notas fiscais (registro) | feito | repo `notas.ts` migr. `...001200` | JA | P1 |
| **Emissão NFS-e server-side** (rota + camada agnóstica) | parcial (adapter STUB) | repo `api/fiscal/emitir`, `lib/fiscal/*` · MM/WM `[PARIDADE]` | PROD-fiscal | P0 |
| NFS-e + NF-e híbrida na mesma OS | nao | MM/WM `[PARIDADE]` | PROD-fiscal | P1 |
| NFS-e Nacional nativa (NT 003/004/005, IBS/CBS) | parcial (fundação na camada fiscal) | MM `[PARIDADE]` | Marco3 | P0 |
| Financeiro (KPIs, funil OS, funil orç, ranking) | feito | repo `financeiro.ts` migr. `...001300` | JA | P0 |
| Markup/margem REAL por OS (receita − custo − material) | feito | repo view `v_os_margem_real` migr. `...001600` · WM/V3 `[DIFERENCIAL]` | JA | P0 |
| ROI card "o software se paga" | feito | repo `painel/financeiro/page.tsx` · MM/BC/V3/PRC `[DIFERENCIAL]` | JA (calibra c/ piloto) | P0 |
| Estoque (itens, movimentos, custo médio, alerta) | feito | repo `estoque.ts` migr. `...001400` | JA | P0 |
| **Tinta — fórmula/custeio por grama** (custo vivo via custo_medio) | escrito-nao-aplicado | repo migr. `...001800` `v_tinta_formula_custo`, `tintas/page.tsx` · MM/WM `[DIFERENCIAL]` | token TEST | P0 |
| **V3 Pátio/IEO — gargalo insumo + cabine** (campos OS + views) | escrito-nao-aplicado | repo migr. `...001700` `patio.ts` · V3 `[V3-PATIO]` | token TEST | P0 |
| Flag "Orçamento Complementar Urgente" (inbox) | escrito-nao-aplicado | repo migr. `...001700` · V3 `[V3-PATIO]` | token TEST + banco-unico | P1 |
| 6 relatórios financeiros (DRE/fluxo prev×real/ticket/ABC) | parcial (KPIs base; falta DRE/ABC/conciliação) | WM/SIG `[EXTRAIR-WM]` | JA | P1 |
| Contas a pagar/receber + caixa×competência | nao | MM/WM `[PARIDADE]` | JA | P1 |
| Fluxo de caixa + conciliação bancária | nao | MM/WM/SIG `[PARIDADE]` | JA | P1 |
| Recebíveis seguradora (aging + prazo SUSEP + risco glosa) | nao | MM `[DIFERENCIAL]` | JA | P1 |
| Importação XML NF-e compra → entrada estoque + custo médio | nao | WM `[EXTRAIR-WM]` | JA | P1 |
| Curva ABC + estoque mínimo + giro (tinta em g/ml) | nao | WM `[EXTRAIR-WM]` | JA | P2 |
| Catálogo de tempos/preços parametrizado | nao | MM `[PARIDADE]` | JA | P2 |
| Pré-orçamento por foto via IA (PT-BR) | nao | MM/CIL `[PARIDADE]` | JA | P2 |
| Assinatura/aprovação digital orçamento e OS | nao | WM/CIL `[EXTRAIR-WM]` | JA | P1 |
| UX premium (dark, skeletons, count-up, chips, marca) | feito | repo `components/*` | JA | — |
| Landing comercial (wedge, demo ao vivo, ROI provado) | feito | repo `components/landing/*` | JA | — |

---

### B. OPERACIONAL / TOTEM (projeto separado — `Documents/GDelta-Totem`)

> **FATO (BACKLOG.md):** "Totem — captura no chão de fábrica. Projeto separado — NÃO toco." Estado interno do Totem não é rastreável a partir deste repo. As features abaixo são o ALVO; o lado-Sistema do contrato existe.

| Feature | Estado | Fonte + tag | Desbloqueio | Prioridade |
|---|---|---|---|---|
| Cronômetro start/stop por etapa/produtivo (tempo MEDIDO) | nao (fora do repo) | MM/WM/BC/SIG `[DIFERENCIAL]` — o fosso central | banco-unico | P0 |
| Kanban produção tempo real (8 etapas, Realtime, TV) | nao (fora do repo) | MM/WM/CIL/SIG `[PARIDADE]` | banco-unico | P0 |
| Painel Touch Time + Eficiência (medido vs vendido) | nao | MM `[DIFERENCIAL]` | banco-unico | P1 |
| Detector de gargalo + Andon (WIP por estágio) | nao | MM/SIG `[DIFERENCIAL]` | banco-unico | P1 |
| Controle de jornada/ponto (fase A não-fiscal) | nao | MM/BC/SIG `[DIFERENCIAL]` | banco-unico | P1 |
| Gate de Blueprinting (libera baia só c/ peças+procedimento) | nao | MM `[PARIDADE]` | banco-unico | P2 |
| Cycle Time keys-to-keys automático + semáforo | nao | MM `[PARIDADE]` | banco-unico | P2 |
| UX luva/poeira (PWA touch, offline-first) | nao | MM `[DIFERENCIAL]` | banco-unico | P1 |
| Checklist de ENTRADA com fotos (km/avarias/assinatura) | nao | WM `[EXTRAIR-WM]` | banco-unico | P1 |
| Checklist de SAÍDA / qualidade na entrega | nao | WM `[EXTRAIR-WM]` (superar) | banco-unico | P2 |
| Comissionamento automático sobre tempo MEDIDO | nao | WM/SIG/CIL `[DIFERENCIAL]` | banco-unico | P1 |
| Métrica "dias na oficina × R$ do orçamento" | feito (lado-Sistema: view dias×R$) | repo `view_os_dias_rs` · WM `[DIFERENCIAL]` | JA (Sistema) / banco-unico (Totem) | P1 |
| Causa-raiz do retrabalho (`motivo_retrabalho` + gráfico) | nao (campo é lado-Totem) | V3 `[V3-PATIO]` | banco-unico | P1 |
| Auditoria cabine/estufa (`os_auditoria_cabine`) | escrito-nao-aplicado (lado-Sistema) | repo migr. `...001700` · V3 `[V3-PATIO]` | token TEST + banco-unico | P1 |
| **IEO por OS** (tempo real apontamentos × `meta_horas`) | parcial (campo `meta_horas` escrito; falta tempo real do Totem) | repo migr. `...001700` · V3 `[DIFERENCIAL]` | banco-unico | P0 |
| Status público do veículo (empacotar o que o Totem mede) | nao | WM `[EXTRAIR-WM]` | banco-unico | P1 |

---

### C. DELTA (bot WhatsApp — em n8n, fora deste repo)

> **FATO:** nenhum código nem doc de Delta dentro de `Sistema-GDelta`. Estado real não verificável a partir deste repo. Tudo abaixo é ALVO. **INFERÊNCIA:** o moat do Delta depende do Operacional já estar publicando status (logo, depende de banco-unico).

| Feature | Estado | Fonte + tag | Desbloqueio | Prioridade |
|---|---|---|---|---|
| Status por placa/OS AO VIVO do Operacional ("tá pronto?") | nao (n8n) | MM/WM/SIG `[DIFERENCIAL]` — moat dos 3 produtos | banco-unico | P0 |
| NLU PT-BR + transcrição de áudio | nao (n8n) | MM `[DIFERENCIAL]` | JA (lado-bot) | P1 |
| Handoff humano com contexto completo | nao (n8n) | MM `[PARIDADE]` | JA | P1 |
| 24/7 + resposta instantânea + coleta de mídia | nao (n8n) | MM/PRC `[PARIDADE]` | JA | P1 |
| Follow-up PROATIVO disparado pelo Operacional | nao | MM/WM `[DIFERENCIAL]` | banco-unico | P1 |
| Entrega de orçamento/OS/nota/checklist por WhatsApp | nao | WM/CIL/SIG `[EXTRAIR-WM]` | JA (lê do Admin) | P1 |
| Link público de acompanhamento da OS por etapa | nao | WM/BC/SIG `[EXTRAIR-WM]` | banco-unico | P2 |
| Lembrete recompra/revisão/garantia (CRM por placa) | nao | MM/WM `[EXTRAIR-WM]` | JA | P2 |
| Agendamento + remarcação + lembrete no-show | nao | MM/WM `[PARIDADE]` | JA | P2 |
| RAG base de conhecimento da oficina | nao | MM `[DIFERENCIAL]` | JA | P2 |
| Painel de métricas do Delta (% resolvido sozinho, CSAT) | nao | MM `[DIFERENCIAL]` | JA | P2 |

---

### D. PEÇAS / MARKETPLACE (só design — greenfield)

> **FATO:** `docs/design/integracao-pecas-marketplace.md` declara "nenhum código de app escrito, nada rodado". Decisão arquitetural: módulo NATIVO no GDelta (schema `market`, abordagem A). **FATO (PEC §4, R3):** agendado DEPOIS do Marco 3 NFS-e.

| Feature | Estado | Fonte + tag | Desbloqueio | Prioridade |
|---|---|---|---|---|
| Marketplace usado × novo lado a lado dentro da OS | nao | PEC/WM `[DIFERENCIAL]` | Marco3 | P1 |
| Busca de peça por placa → Aplicação + Similaridade | nao | WM/CIL/PEC `[EXTRAIR-WM]` | Marco3 | P1 |
| Margem ao vivo na cotação (injeta custo real → recalcula) | nao | PEC/WM `[DIFERENCIAL]` | Marco3 | P1 |
| Pedido de peça com PREVISÃO DE CHEGADA → alimenta painel | nao | PEC `[DIFERENCIAL]` — mata o "aguardando peça cego" | Marco3 | P1 |
| Catálogo de peças NOVAS (SKU/qualidade/estoque) | nao | WM/CIL/PEC `[EXTRAIR-WM]` | Marco3 | P2 |
| Listagem de peça USADA (% conservação, grau, foto) | nao | WM/PEC `[DIFERENCIAL]` | Marco3 | P2 |
| Cotação/RFQ multi-fornecedor por placa | nao | WM/SIG/PEC `[EXTRAIR-WM]` | Marco3 | P2 |
| Taxonomia global de peça/dano por painel | nao | PEC `[DIFERENCIAL]` — chave demanda↔oferta | Marco3 | P1 |
| Máquina de estados do pedido (solicitado→entregue) | nao | PEC `[DIFERENCIAL]` | Marco3 | P2 |
| Amarração origem da peça ↔ aceitação da seguradora | nao | PEC `[DIFERENCIAL]` — evita glosa | Marco3 | P2 |
| Re-pedido: peça rejeitada re-abre bloqueio c/ nova previsão | nao | PEC `[DIFERENCIAL]` | Marco3 | P2 |
| Custo/piso do fornecedor nunca visível ao comprador (RLS) | nao | PEC `[DIFERENCIAL]` — 2º padrão de RLS | Marco3 | P1 |
| Moat de rede de 2 lados (resposta de OFERTA ao euBati) | nao | PEC/SIG `[DIFERENCIAL]` | Marco3 | P2 |

---

### E. TRANSVERSAL · FISCAL · IA · INFRA

| Feature | Estado | Fonte + tag | Desbloqueio | Prioridade |
|---|---|---|---|---|
| Delta copiloto EMBARCADO + insights proativos no app | nao | MM `[DIFERENCIAL]` | JA (read-only sugestivo) | P2 |
| ROI ao vivo (Horas Salvas × R$ − licença) | feito (card) / parcial (Horas Salvas reais) | repo + MM/BC/V3/PRC `[DIFERENCIAL]` | JA (estrutura) / banco-unico (horas reais) | P0 |
| Onboarding "1º orçamento c/ margem em 5 min" | nao | MM `[DIFERENCIAL]` | JA | P1 |
| NFS-e terceirizada via agregador (Focus/Nuvem/PlugNotas) | parcial (camada agnóstica pronta, adapter STUB) | repo `lib/fiscal/*` · MM/WM `[PARIDADE]` | PROD-fiscal | P0 |
| LGPD by-design (MFA, RLS, criptografia) | parcial (RLS + FORCE RLS feito) | repo + MM `[PARIDADE]` | JA | P1 |
| Posicionamento janela NFS-e Nacional 2026 + Reforma | parcial (GTM escrito) | MM `[DIFERENCIAL]` (GTM) | JA | P1 |
| Command palette (Ctrl-K) + interfaces por papel | nao | MM `[PARIDADE]` | JA / banco-unico (papéis Totem) | P2 |
| Status page + SLA/confiabilidade | nao | MM/WM `[DIFERENCIAL]` | JA | P2 |
| Billing à prova de bug (degrada read-only, nunca tranca dado) | nao | WM `[DIFERENCIAL]` (anti-WM) | JA | P2 |
| Cancelamento self-service + export 1 clique (LGPD) | nao | WM/SIG/CIL `[DIFERENCIAL]` | JA | P2 |
| **Banco único compartilhado Totem+Sistema** (hook unificado) | nao (decidido, não fundido) | repo BACKLOG P1#5 · V3 `[V3-PATIO]` | banco-unico (é o gate em si) | P0 |
| Ponte OS comercial ↔ OS de pátio (`v_os_bridge`) | nao | V3 `[V3-PATIO]` | banco-unico | P0 |
| 3 padrões de RLS convivendo (public/fornecedor/market) | parcial (public feito) | PEC/V3 `[DIFERENCIAL]` (infra) | JA (desenho) / Marco3 (market) | P1 |
| Integração read-only/complementar com Cilia | nao | BC/CIL `[PARIDADE]` | JA | P2 |
| Pricing value-based por degrau (modular, ancorado em ROI) | parcial (GTM escrito; preço em `[ASSUMPTION]`) | BC/PRC `[DIFERENCIAL]` (GTM) | JA (fecha c/ piloto) | P1 |

---

## 3. ROADMAP MESTRE — fases até "completo"

> Cada fase tem **critério de pronto** binário. As fases são encadeadas por gate, não por calendário (exceto Marco 3, com deadline externo 01/09/2026).

### Fase 0 — AGORA (desbloqueado, sem gate)
Construir o que já é possível sem token/PROD/banco-único. Em paralelo, rodar as 3 entrevistas (P0 do BACKLOG) que fecham o preço.
- **Pronto quando:** semáforo de piso de margem + contas a pagar/receber + DRE/ABC + importação XML de compra estão no TEST; `STATUS.md` reconciliado com `BACKLOG.md`; onboarding "5 min" funcionando.

### Fase 1 — PÓS-TOKEN TEST
Aplicar 0017 + 0018 no TEST. Liga gargalo de insumo, auditoria de cabine e a tela de Tintas com dados reais.
- **Pronto quando:** migrations 0017+0018 aplicadas no TEST; cards de gargalo e Tintas mostram dados reais (não fail-soft vazio); token de aplicação revogado.

### Fase 2 — PÓS-BANCO-ÚNICO (Totem+Sistema)
Unificar `custom_access_token_hook` (emitir `oficina_role` E `user_role`) + tabela `oficinas`. Fundir os dois Supabase. Ligar a ponte `v_os_bridge` e o IEO real (tempo medido × `meta_horas`).
- **Pronto quando:** hook emite ambos os claims sem vazamento entre tenants (teste de RLS verde); `v_os_bridge` casa OS comercial ↔ OS de pátio por `oficina_id`+placa normalizada; IEO por OS calcula com tempo REAL do Totem; ROI usa Horas Salvas reais. **Desbloqueia o moat do Delta** (status ao vivo).

### Fase 3 — PÓS-MARCO3-FISCAL (deadline 01/09/2026)
Implementar os `fetch` reais nos TODOs de `focus-nfe.ts`, emissão NFS-e Nacional ponta a ponta no agregador. **Gate externo do Módulo Peças.**
- **Pronto quando:** uma NFS-e real é emitida/consultada/cancelada via agregador em homologação; NFS-e Nacional (NT 003/004/005) validada; camada fiscal deixa de lançar "Agregador não configurado".

### Fase 4 — PÓS-MARCO3 → PEÇAS/MARKETPLACE (greenfield)
Schema `market`, 2º/3º padrão de RLS (leitura-pública-por-status), taxonomia de peça/dano, pedido com previsão de chegada que alimenta o painel.
- **Pronto quando:** schema `market` no TEST com gate de vazamento de RLS verde; busca por placa retorna novo×usado com margem ao vivo; pedido de peça publica previsão de chegada no painel da OS; custo do fornecedor nunca visível ao comprador.

### Fase 5 — PÓS-PROD (comercialização)
Aplicar 0001→0018(+) no PROD, onboarding da 1ª oficina com credenciais reais, billing/SLA/status page.
- **Pronto quando:** PROD com todas as migrations; 1ª oficina operando; billing degrada para read-only sem trancar dado; status page no ar. **= GDelta comercialmente "completo".**

---

## 4. FAZER JÁ — shortlist do que codar agora (desbloqueado, alto valor)

> Tudo abaixo é **JA** (sem depender de token/PROD/banco-único). Ordem por valor × esforço para solo.

1. **Reconciliar `STATUS.md` com `BACKLOG.md`** — STATUS está desatualizado (não reflete 0017/0018 gated). Higiene de meia hora que para a divergência de docs. *(FATO: divergência verificada.)*
2. **Semáforo de piso de margem configurável** no orçamento — o motor `calcularTotais` já calcula a margem; falta o limiar + cor. Reforça o diferencial nº1 (margem ao vivo) com baixo custo.
3. **Onboarding "primeiro orçamento com margem ao vivo em 5 min"** — walkthrough 3–7 passos + tabela de tinta/serviços pré-populada. Converte demo em "uau" no piloto.
4. **Contas a pagar/receber + fluxo de caixa previsto×realizado** — completa o Financeiro (hoje só KPIs/funis). Table-stakes que o piloto vai cobrar.
5. **DRE + Curva ABC** (aproveitando estoque + OS já existentes) — começa os "6 relatórios" que o WM tem e nós ainda não.
6. **Importação de XML de NF-e de compra → entrada de estoque + custo médio** — alimenta o custo real que a margem ao vivo consome. Liga estoque ao mundo real.
7. **Assinatura/aprovação digital do orçamento e da OS** (link/WhatsApp) — blindagem jurídica, baixo esforço, alto valor percebido.
8. **Desenhar (sem aplicar) o hook JWT unificado + os 3 padrões de RLS** com teste de vazamento — prepara o terreno do banco-único e do market sem ainda fundir nada. *(INFERÊNCIA: reduz o risco da Fase 2/4, que é o elo mais frágil.)*

---

## 5. DESTRAVAS DO FUNDADOR — os gates e o que cada um libera

> São os pontos onde o progresso depende de uma ação SUA (não-código), não de mais código. Honesto sobre o que está travado.

1. **Token do TEST** (P0b do BACKLOG)
   → **Libera:** aplicar migrations **0017 (Pátio/IEO lado-Sistema)** e **0018 (tinta fórmula/custeio por grama)**. Liga os cards de gargalo de insumo, a auditoria de cabine e a **tela de Tintas com dados reais** (hoje todos fail-soft / vazios). É o destrave mais barato e imediato.

2. **Banco único Totem + Sistema**
   → **Libera:** o **fosso central** — tempo MEDIDO no Totem fluindo para **IEO real**, markup real e o card ROI com **Horas Salvas reais**; e o **moat do Delta** (status "tá pronto?" ao vivo). **Pré-requisito (risco aberto, FATO no BACKLOG):** unificar o `custom_access_token_hook` (emitir `oficina_role` E `user_role`) e a tabela `oficinas` ANTES de fundir, com teste de vazamento de RLS verde.

3. **PROD/fiscal + agregador** (conta no agregador + CNPJ + certificado A1 + regime + inscrição municipal)
   → **Libera:** a **emissão real de NFS-e** (implementar os `fetch` hoje em STUB `// TODO(fiscal)` em `focus-nfe.ts`) e o fechamento do **Marco 3 (deadline 01/09/2026)**. Sem isso, a camada fiscal está arquiteturalmente pronta mas lança "Agregador não configurado".

4. **Marco 3 fechado** → **destrava o Módulo Peças/Marketplace** (PEC §4, R3: agendado DEPOIS do Marco 3). Todo o marketplace (novo×usado na OS, previsão de chegada, RLS de mercado) espera este gate.

5. **OK para PROD + 1ª oficina** (credenciais reais)
   → **Libera:** aplicar 0001→0018(+) no PROD (hoje 0% proposital) e o onboarding comercial. É o último gate para "completo".

---

> **Honestidade final (FATO):** o Administrativo é o único módulo majoritariamente **feito**. Operacional/Totem e Delta vivem **fora deste repo** e seu valor real está **gated por banco-único**. Peças é **greenfield gated por Marco 3**. O caminho mais curto para valor incremental hoje é a shortlist do item 4 + o destrave do **token TEST** (item 5.1). O salto de valor maior — o loop ao vivo dos 3 produtos — está atrás do **banco-único** (item 5.2).
