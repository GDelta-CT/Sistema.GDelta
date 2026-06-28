# Brief de Integração — Sistema ↔ Totem (Banco Único GDelta)

> **Status:** PLANEJAMENTO. Nada aqui foi aplicado. Nenhuma migration final foi escrita. Nenhum arquivo do Totem foi tocado (apenas Read/Grep/Glob). Não li `.env`/segredos.
> **Convenção de responsabilidade:** **[LADO SISTEMA — eu]** = repo `C:\Users\Eliel\dev\Sistema-GDelta`, eu aplico. **[LADO TOTEM — dono]** = repo `C:\Users\Eliel\Documents\GDelta-Totem` (atenção: `Documents`, não OneDrive `Documentos`), READ-ONLY para mim; só o dono aplica.
> **FATO** = lido em arquivo do repo. **INFERÊNCIA** = leitura/dedução minha, a confirmar por introspecção de banco.

---

## 1. Tese — o que é "comunicação perfeita" aqui

Comunicação perfeita, num **banco único Supabase compartilhado** (Totem + Sistema, isolados por `oficina_id` + RLS), é **um carro = um `oficina_id` = um JWT que os dois produtos entendem**, com a OS do orçamento (Sistema) e a OS de chão de fábrica (Totem) **ligadas por chave**, e o tempo MEDIDO do Totem visível ao Sistema por **views read-only** — sem job de sync, sem segundo banco, sem API server-to-server. O loop que isso destrava: **orçamento aprovado → OS desce ao pátio → operário aponta tempo real → Sistema cruza tempo real × `meta_horas` orçado → IEO/ROI/Delta acendem** (hoje fail-soft/vazios). A peça que torna tudo possível (e o risco nº 1) é **um único `custom_access_token_hook` emitindo os três claims** — `oficina_id` + `user_role` (Sistema) + `oficina_role` (Totem) — provado ANTES de qualquer fusão de tabela: a Ordem Sagrada (claim antes da RLS) aplicada à fusão.

---

## 2. Contrato de dados — o que flui, de onde para onde, por qual mecanismo, e quando

> Mecanismo padrão do banco único: **não há "push" HTTP**. Tudo é leitura/escrita na mesma base, isolada por RLS via `oficina_id` do JWT. Chave de ligação OS↔OS = `ordens_servico.os_comercial_id` (FK no lado Totem, ver §3).

| # | Dado que flui | Produto ORIGEM → DESTINO | Mecanismo (tabela/view/RPC compartilhada) | Quando | Estado hoje (FATO) |
|---|---|---|---|---|---|
| 2a | OS do orçamento (placa, modelo, chassi, valor, data prometida, tipo_cliente, ref_externa) | **Sistema → Totem** | RPC do Sistema (`SECURITY INVOKER`, `oficina_id` do JWT) que insere/atualiza `ordens_servico` e grava o elo `os_comercial_id`; marca `os_comercial.totem_sync_status='enviada'` | Ao gerar/aprovar a OS comercial do orçamento | Não existe escrita Sistema→`ordens_servico`. `totem_sync_status`/`os_ref` são scaffold não-usado (0009). |
| 2b | Horas tocadas reais = Σ `(hora_fim − hora_inicio − tempo_pausado_seg)` por OS | **Totem → Sistema** | View `v_os_tempo_real` (`security_invoker=true`) agregando `apontamentos` por `ordem_servico_id`, ligada via `os_comercial_id` até `os_comercial.id` | Tempo real (a cada leitura do dashboard) | Tempo existe no Totem; nunca chega ao Sistema. Sistema lê vazio (fail-soft `→ []`). |
| 2c | Flag `retrabalho` (bool) por apontamento | **Totem → Sistema** | Mesma família de views (`v_os_tempo_real` / KPI dedicado) | Tempo real | KPI `retrabalho` hard-coded `aguardandoDados:true` (kpis.ts:499). |
| 2d | Etapa atual + bloqueio (`etapa_atual`, `bloqueado`, `motivo_bloqueio`) | **Totem → Sistema** | View `v_os_status_consolidado` juntando `os_comercial.status` + `ordens_servico.status_geral/etapa_atual` pelo elo | Tempo real (Daily Huddle, gargalo, Delta) | Sem elo hoje; Sistema não vê etapa do Totem. |
| 2e | Status consolidado da OS → Delta (prazo/andamento) | **Totem → Sistema → Delta** | `v_os_status_consolidado` (sem escrita cross-produto; Delta lê o status efetivo) | Tempo real | Delta (bot WhatsApp) hoje vive só no Totem; Sistema não alimenta. |
| 2f | `meta_horas` (tempo ORÇADO, denominador do IEO) | **Sistema (interno)** | Coluna `os_comercial.meta_horas` (0017) — produzida na geração da OS a partir do orçamento (horas Audatex/Cília) ou, na falta, do `tarefas_catalogo.tempo_padrao_minutos` do Totem como proxy | Na criação da OS | Coluna existe (0017); **sem produtor** — vazia hoje. **Decisão pendente do fundador** (ver §5). |

**Direção dominante:** o tempo medido e o status fluem **Totem → Sistema** por **views read-only** (zero risco ao Totem). A OS desce **Sistema → Totem** por **uma RPC** (única escrita cross-produto). `meta_horas` é interno ao Sistema mas pode depender de dado do catálogo do Totem.

---

## 3. Modelo unificado

### 3.1 `oficinas` ÚNICA — superset do Totem

**DECISÃO:** uma só `public.oficinas` = **superset do Totem** (que já contém as 11 colunas do Sistema + `capacidade_boxes`, `funcionarios_ativos`, `horas_dia_disponivel`, `hora_homem_venda/custo`, metas, prazos/multas, Asaas). O Sistema convive com colunas extras que ignora.

**Por quê o superset do Totem (FATO):** as 11 colunas do Sistema são subconjunto exato das ~30 do Totem. Adotar o superset → Sistema não perde nada, Totem não muda nada. Migrar "para baixo" quebraria o Totem (proibido). `user_oficinas` é **idêntica** nos dois (PK `(user_id, oficina_id)`, `role IN dono/gerente/operario/contador`) — convergência natural.

- **[LADO SISTEMA — eu]** Tornar a migration `…000100_tenant_base_e_claim_hook.sql` tolerante a tabela pré-existente: `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` para cada coluna que o Sistema usa (todas já no superset → no-op). **Nunca** dropar/alterar tipo de coluna do Totem.
- **[LADO TOTEM — dono]** Nada na estrutura de `oficinas` (já é o superset). Garantir que a 002 do Totem rode antes das migrations adaptadas do Sistema, ou ambas com `IF NOT EXISTS`.

### 3.2 HOOK UNIFICADO — a peça mais crítica

**COLISÃO CRÍTICA (FATO):** os dois produtos definem `public.custom_access_token_hook(event jsonb)` com a **mesma assinatura** mas **corpos diferentes** — Sistema emite `oficina_id`+`user_role`; Totem emite `oficina_id`+`oficina_role`. Num banco único, o último `CREATE OR REPLACE` vence e **quebra o claim do outro produto silenciosamente**.

**DECISÃO:** **um único** hook que emite **os três claims**. Como `role` em `user_oficinas` é a mesma coluna nos dois, o hook carimba o **mesmo valor** em duas chaves:

```
claims := jsonb_set(claims, '{oficina_id}',   to_jsonb(v_oficina::text));
claims := jsonb_set(claims, '{user_role}',    to_jsonb(v_role));   -- lido pelo Sistema
claims := jsonb_set(claims, '{oficina_role}', to_jsonb(v_role));   -- lido pelo Totem (mesmo valor)
```

Assim **nenhum produto muda seu código de leitura**: Sistema segue lendo `user_role`, Totem segue lendo `oficina_role`, ambos com o valor certo.

- **[LADO SISTEMA — eu]** Atualizar o hook para emitir os 3 claims; manter `STABLE`, `grant execute … to supabase_auth_admin`, `revoke … from authenticated/anon`, policy `auth_admin_le_user_oficinas`.
- **[LADO TOTEM — dono]** **Não reaplicar** a parte (B) da `009` (a que redefine o hook) no banco único — senão sobrescreve o unificado. Confirmar no painel (Authentication > Hooks > Custom Access Token) que aponta para a função unificada (um registro serve os dois produtos).

### 3.3 OS — DECISÃO: **LINKAR, não fundir**

**DECISÃO: manter as duas tabelas e ligá-las por chave.** Elo no lado Totem: `ordens_servico.os_comercial_id uuid REFERENCES public.os_comercial(id) ON DELETE SET NULL`. Cardinalidade lógica 1:1.

**Justificativa (dura):**
1. **Eu não edito o Totem.** Fundir exigiria reescrever queries, RPCs `fn_*_apontamento` (dependem de `ordens_servico`), FK `apontamentos.ordem_servico_id`, índice único de placa — trabalho do dono, alto risco de derrubar produto vivo. Linkar = **zero alteração destrutiva** no Totem (uma coluna nullable, OS antigas ficam NULL).
2. **Propósitos distintos:** `os_comercial` é a OS **comercial/contratual** (nasce do orçamento, snapshot de valores/itens, `numero` por oficina); `ordens_servico` é a OS **de chão de fábrica** (placa, `etapa_atual`, kanban, apontamentos). Fundir mistura duas vidas do mesmo carro.
3. **Aditivo e reversível:** adicionar uma FK opcional é reversível (`DROP COLUMN`); fundir é irreversível na prática.
4. **A 0017 já assume isso** (FATO): "não toca em `ordens_servico`/`apontamentos` — Fase B na DB compartilhada". O desenho original já previa duas tabelas ligadas.

> O contrato de API `os_ref` server-to-server (doc `GDelta-Sistema_Contrato-API-Totem-Sistema.md`) pressupunha **dois bancos** → com banco único ele vira **obsoleto/opcional**. O scaffold `os_ref`/`totem_sync_status` (0009) nunca é escrito pelo app (FATO), então abandoná-lo não quebra nada.

- **[LADO SISTEMA — eu]** RPC que "desce" a OS grava o elo; mapear `status` (de-para §5). `os_ref` opcional, não obrigatório.
- **[LADO TOTEM — dono]** `ADD COLUMN IF NOT EXISTS os_comercial_id …` + índice (aditivo, idempotente). Validar a **regra de placa**: a unique parcial `(oficina_id, placa) WHERE status_geral <> 'Entregue'` (005) → a RPC do Sistema deve **atualizar** se já existe OS ativa daquela placa, não inserir (senão viola a constraint).

---

## 4. Plano por fases (ordem que não quebra nenhum produto vivo)

> Tudo em **TESTE primeiro**, provado, e só então **PROD com OK explícito do fundador**, confirmando o `ref` de destino em voz alta antes de cada escrita. PROD do Totem (`ccpxwnbxvmadcafxnbjs`) hoje é single-tenant via `anon` (INFERÊNCIA forte: hook/lockdown/RPCs 005–014 não aplicados) — migrá-lo para device-login + claim + lockdown é **pré-condição [LADO TOTEM — dono]**.

### Fase 0 — Definição da base (BLOQUEANTE, decisão do fundador)
- **[FUNDADOR]** Definir qual `ref`/banco é o banco único (recomendado: o do Totem, que já tem o superset e dados reais de pátio).
- **[FUNDADOR]** Responder: a oficina real tem **um `oficina_id` único** ou **IDs distintos** em cada produto hoje? Decide se é só fusão de schema ou se há **remapeamento de IDs** (muito mais arriscado).
- **Pronto quando:** banco-base e política de `oficina_id` definidos por escrito.

### Fase 1 — Tenant convergido (`oficinas` + `user_oficinas`)
- **[LADO SISTEMA — eu]** Adaptar `…000100…` para `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` (§3.1). Aplicar no TESTE.
- **[LADO TOTEM — dono]** Confirmar que `oficinas` (superset) e `user_oficinas` continuam lidas pelo Totem.
- **Pronto quando:** no TESTE, app do Sistema e app do Totem leem/escrevem `oficinas`/`user_oficinas` sem erro; nenhuma coluna do Totem perdida.

### Fase 2 — HOOK UNIFICADO (Ordem Sagrada)
- **[LADO SISTEMA — eu]** Aplicar o hook que emite `oficina_id`+`user_role`+`oficina_role` (§3.2) no TESTE.
- **[LADO TOTEM — dono]** Neutralizar a parte (B) da `009` (não redefinir o hook); confirmar registro no painel.
- **Pronto quando (GATE OBRIGATÓRIO):** decodificar o JWT de um usuário real e mostrar os **3 claims** simultâneos com o valor certo; **login no Sistema** (lê `user_role`) **e** no Totem (lê `oficina_role`) funcionando com o **mesmo** hook. **Nada avança sem isto.**

### Fase 3 — Elo de OS
- **[LADO TOTEM — dono]** `ADD COLUMN IF NOT EXISTS ordens_servico.os_comercial_id …` + índice (aditivo). Totem segue rodando (coluna nula em tudo).
- **Pronto quando:** Totem roda normal com a coluna nova vazia; FK aponta para `os_comercial`.

### Fase 4 — Fluxo 2a (OS do orçamento → pátio)
- **[LADO SISTEMA — eu]** RPC `SECURITY INVOKER` que insere/atualiza `ordens_servico` com `oficina_id` do JWT casado nos dois lados, grava `os_comercial_id`, marca `totem_sync_status='enviada'`; respeita a unique de placa (atualiza se OS ativa já existe). De-para de status (§5).
- **[LADO TOTEM — dono]** Validar que a policy `FOR ALL` de `ordens_servico` aceita o INSERT de `authenticated` com `oficina_id` do JWT (já aceita); validar a regra de placa.
- **Pronto quando:** uma `os_comercial` X aparece ligada a uma `ordens_servico` Y, **mesma `oficina_id`**, sem violar constraint de placa.

### Fase 5 — Views 2b/2c/2d/2e (tempo medido + status → IEO/ROI/Delta)
- **[LADO SISTEMA — eu]** Criar `v_os_tempo_real` e `v_os_status_consolidado` com **`security_invoker=true`** (herdam RLS das bases; tratar apontamento aberto sem `hora_fim`). Dashboards IEO/ROI/Delta passam a ler delas.
- **[LADO TOTEM — dono]** Nada (views só LEEM `apontamentos`/`ordens_servico`); confirmar `SELECT` de `authenticated` nessas tabelas (já existe).
- **Pronto quando:** IEO mostra tempo real × `meta_horas` por OS; KPI retrabalho e Daily Huddle acendem; Delta lê status consolidado.

### Fase 6 — Prova de isolamento + PROD
- **[LADO SISTEMA — eu / LADO TOTEM — dono]** Teste cross-produto com **2 oficinas**: oficina A **não lê** nenhum dado de B em **nenhuma** view/tabela dos dois lados (especialmente as views novas).
- **[FUNDADOR + ambos os lados]** Repetir Fases 1–5 em PROD, item a item, com OK explícito e verificação após cada passo. Pré-condição: PROD do Totem migrado para device-login + claim + lockdown.
- **Pronto quando:** isolamento provado em TESTE e PROD; os dois produtos vivos seguem funcionando.

---

## 5. Riscos e decisões do fundador

### Só o dono do Totem pode aplicar (LADO TOTEM)
- Adicionar `ordens_servico.os_comercial_id` (Fase 3).
- Neutralizar a parte (B) da `009` (não redefinir o hook) (Fase 2).
- **Migrar PROD do Totem** de `anon` single-tenant para device-login + claim hook + lockdown (pré-condição de PROD). **INFERÊNCIA forte:** hoje o device de PROD nem loga, então **PROD pode não ter `oficina_id` no JWT** — os dois lados não falam o mesmo dialeto de auth em produção ainda.
- Validar a regra de placa e a policy `FOR ALL` de `ordens_servico` (Fase 4).

### Precisa do token / acesso de banco (não disponível neste workflow)
- Aplicar qualquer migration (TESTE ou PROD).
- Registrar o hook no painel Authentication > Hooks.
- **Introspecção para confirmar INFERÊNCIAS:** quais migrations estão de fato live em PROD do Totem; se o hook está registrado em cada projeto; se a oficina real tem `oficina_id` único ou divergente entre produtos.

### Provas de isolamento RLS (gates inegociáveis)
- **Prova do claim (Fase 2):** JWT com os 3 claims + login duplo OK. É a falha que já travou o Totem antes (RLS sem claim) — **não inverter a ordem**.
- **Prova das views (Fase 5/6):** toda view nova com `security_invoker=true`. **Sem essa flag a view roda como owner e VAZA entre oficinas.** Testar "A não lê apontamento de B via a view".
- **Prova da RPC 2a:** sempre `oficina_id := (auth.jwt()->>'oficina_id')::uuid` (nunca de parâmetro), `SECURITY INVOKER` — para não gravar `ordens_servico` com `oficina_id` de outra oficina.

### Decisões pendentes do fundador (bloqueiam detalhamento das migrations)
1. **Banco-base + identidade de `oficina_id`** (Fase 0) — bloqueia tudo. Define se há remapeamento de IDs.
2. **`meta_horas`: o orçamento da seguradora chega com HORAS** (Audatex/Cília → vira `meta_horas` direto) **ou só com R$** (precisa do `tarefas_catalogo.tempo_padrao_minutos` do Totem como orçado-proxy)? **Define se o IEO acende no dia 1 ou depende de build extra.** Sem horas, o IEO não tem denominador.
3. **De-para de status** Sistema (`aberta/em_producao/concluida/entregue/cancelada`) ↔ Totem (`Aguardando Produção/Em Produção/Pronto para Entrega/Entregue`) — acordar a tabela de mapeamento explícita.
4. **Regra de placa** quando a OS desce e já existe `ordens_servico` ativa da mesma placa (atualizar, não inserir).
5. **Cálculo do tempo real** para apontamentos abertos/em-andamento (usar `now()` ou ignorar abertos) — para não dar tempo negativo/nulo.

### Riscos de valor (o número pode enganar o dono)
- **Calendário ≠ horas tocadas:** `v_os_dias_rs` mede permanência (aprovação→entrega), não esforço. Mostrar **dois eixos** (dias E horas tocadas) — juntá-los esconde o gargalo (carro parado esperando peça ≠ operário lento).
- **Relógio do cliente corrompe o IEO:** auditoria do Totem flagrou (ALTA) tempo calculado com `Date.now()` do tablet, não `now()` do banco. O IEO **espera** o relógio-servidor; senão o ROI nasce envenenado.
- **Retrabalho destrutivo / caça-às-bruxas seca a fonte:** retrabalho deve entrar **coletivo e append-only** no piloto, nunca ranking-dedo — senão o operário para de marcar e o KPI mais vendável morre.
- **OS sem apontamento = IEO fantasma:** OS comercial sem contrapartida apontada no Totem aparece "0h tocadas" (eficiência fantasma por falta de dado). Garantir que toda OS aprovada vira OS de pátio e recebe apontamento.
- **ROI com taxa-hora inventada engana o dono:** se a taxa for placeholder (85/28), o "antes" é fabricado. Coletar a taxa-hora real antes de ligar o ROI; senão mostrar só "dias × R$" honesto + IEO em horas.

### O hábito que sustenta a adoção
- O gancho de venda é o IEO/ROI; o que faz **abrir o painel 1x/dia** é o **Daily Huddle**: "quem está produzindo agora?" + "qual carro travou?". O dado existe (apontamento ativo = produzindo; `bloqueado=true` = travado). Sem ritual de huddle, o painel morre por mais bonito que seja o IEO.

---

## Arquivos de referência (FATO, caminhos absolutos)
**Sistema (editável — só planejamento aqui):**
- `C:\Users\Eliel\dev\Sistema-GDelta\supabase\migrations\20260601000100_tenant_base_e_claim_hook.sql` (hook + `oficinas` + `user_oficinas`)
- `…\20260601000200_rls_por_oficina.sql`, `…\20260601000300_clientes.sql` (`set_oficina_id_from_jwt`)
- `…\20260601000900_os_comercial.sql` (OS comercial + scaffold `os_ref`/`totem_sync_status`), `…\20260601002000_gerar_os_de_orcamento.sql` (`os_comercial_itens`)
- `…\20260601001700_v3_patio_fase_a.sql` (`meta_horas`, views de gargalo), `…\20260601001100_view_os_dias_rs.sql`
- `…\src\lib\supabase\kpis.ts` (KPIs `aguardandoDados`), `…\src\lib\supabase\patio.ts` (gargalos fail-soft), `…\src\app\painel\financeiro\page.tsx` (seção "Gargalos do pátio")
- Docs base: `…\docs\design\v3-patio-ieo-schema.md`, `…\docs\GDelta-Sistema_Contrato-API-Totem-Sistema.md` (contrato API — obsoleto no banco único)

**Totem (READ-ONLY — só o dono aplica):**
- `C:\Users\Eliel\Documents\GDelta-Totem\supabase\test-setup\000_bootstrap_test.sql` (schema fiel)
- `…\supabase\migrations\002_multi_tenant.sql` (`oficinas` superset + `user_oficinas`), `009_captura_hook_triggers_oficina.sql` (hook `oficina_role` + `set_oficina_id_from_jwt`)
- `003_campos_os_mvp.sql` / `005_status_os_e_placa_parcial.sql` / `016_chassi_os.sql` (`ordens_servico`)
- `011_relogio_servidor.sql` / `012_retrabalho_complexidade.sql` / `014_os_container.sql` (`apontamentos`, RPCs `fn_*_apontamento`)
- `…\src\lib\supabase\admin-queries.ts` (`criarOS`), `…\src\lib\orcamento\extrair.ts` (extração do PDF do orçamento)

> Refs Supabase (FATO): Totem TESTE `pvrnimckfgdmgjrjueap` (multi-tenant, modelo-alvo) · Totem PROD `ccpxwnbxvmadcafxnbjs` (anon single-tenant, a migrar).
