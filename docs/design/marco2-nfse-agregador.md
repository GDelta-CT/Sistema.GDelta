DESIGN — Marco 2; fundação como código, emissão real pendente de insumos do fundador.

> **DESIGN — nada aplicado em PROD; emissão real pendente de insumos do fundador.**
> Este documento é o **esboço de arquitetura** da emissão fiscal. A **fundação já existe em código**
> (tabela `notas_fiscais` — migration 0012; interface `AgregadorFiscal` e adapter stub — `src/lib/fiscal/*`),
> mas **nenhuma nota real foi emitida**: falta escolher o agregador, homologar e ligar o `fetch`.
> Disciplina herdada: **fiscal SEMPRE via agregador, nunca conformidade própria** (CLAUDE.md §2.8);
> **TESTE antes de PROD**; **auth + claim (`oficina_id` no JWT) + RLS antes de qualquer regra de negócio**.
> Todo SQL/shape aqui é **ilustrativo** quando não citar uma migration já aplicada.

**Autor:** Especialista de Arquitetura de Sistemas · **Data:** 2026-06-03 · **Status:** rascunho para decisão

---

## 0. Nota de numeração (ler primeiro)

Este documento usa **"Marco 2 = emissão fiscal"**, conforme o pedido do fundador e o nome do arquivo
(`marco2-nfse-agregador.md`). **Atenção:** no `docs/GDelta-Sistema_06_Roadmap.md` a emissão de NFS-e via
agregador é o **MARCO 3 ("Onda fiscal")**, e o "Marco 2" do roadmap é a cunha premium (Orçamento + Clientes +
Placa/FIPE). É a **mesma entrega fiscal**, com rótulo diferente entre os dois textos. **Decisão para o fundador
(§9, item 0):** unificar a numeração — recomendação: manter o roadmap como fonte da verdade (este é o "Marco 3 — Onda
fiscal") e tratar "Marco 2" apenas como o apelido deste documento. Nada na arquitetura muda com a escolha do rótulo.

---

## 1. Contexto e prazo — por que agora

A oficina opera no escuro fiscal e, a partir de **1º/09/2026**, passa a ser **obrigada** a emitir **NFS-e de padrão
nacional**. A regra (Doc 2 §1, Doc 4 §3): **Resolução CGSN nº 189, de 23/04/2026** torna a NFS-e nacional obrigatória
para **ME e EPP optantes do Simples Nacional a partir de 01/09/2026**, exclusivamente pelo **Emissor Nacional** (web ou
API). O MEI já está obrigado desde set/2023.

**Estratégia:** *surfar essa janela.* Milhares de oficinas terão de trocar o fluxo fiscal num prazo curto; quem
oferecer "emite a NFS-e nacional sem dor, a partir da OS que você já fez" tem um gancho de adoção datado (Doc 4 §3:
*"Pronto para a NFS-e nacional obrigatória de setembro — sem dor de cabeça"*). O `06_Roadmap.md` é explícito: esta
entrega precisa estar **pronta antes de 01/09/2026**, e **tem prioridade sobre aprofundar a cunha premium** se o
calendário apertar — *a janela fiscal não espera.*

**Princípio inegociável (CLAUDE.md §2.8 / Doc 5 §7):** o GDelta **nunca implementa conformidade fiscal própria**.
Quem conhece layouts municipais de NFS-e, regras da SEFAZ, certificado digital e os campos da reforma tributária
(IBS/CBS) é o **agregador**. O GDelta **registra** a nota; o **agregador transmite e mantém conformidade**. Em termos
simples: nós montamos o pedido a partir da OS e mandamos para um parceiro especializado — não viramos uma empresa fiscal.

**Anti-escopo deste documento:**
- Não desenhamos o interior do agregador nem reimplementamos regra fiscal.
- Não aplicamos nada em PROD; não criamos conta nem manuseamos segredo (isso é do fundador — §8).
- Não desenhamos o financeiro (Marco 4); a nota apenas **deixa o recebível pronto** para alimentá-lo depois.

---

## 2. Arquitetura — a nota nasce da OS, o agregador transmite

```
   Orçamento aprovado ──(RPC aprovar_orcamento, Marco 1)──► os_comercial  (FONTE da nota; sem redigitar)
                                                                  │
                                            "Emitir NFS-e"  (dono/gerente, server-side)
                                                                  ▼
   ┌──────────────────────────── GDelta Sistema (este repo) ───────────────────────────┐
   │  notas_fiscais (registro/espelho LOCAL)   ◄──►   src/lib/fiscal (camada AGNÓSTICA) │
   │      tipo, status, agregador_ref,                  interface AgregadorFiscal        │
   │      numero, chave, xml_url, pdf_url               (emitir / consultar / cancelar)  │
   └─────────────────────────────────────────────────────────────┬────────────────────-┘
                                                                  │  HTTPS server-to-server
                                                                  │  (chave de API + certificado A1)
                                                                  ▼
                                    AGREGADOR FISCAL  (Focus NFe / Nuvem Fiscal / PlugNotas)
                                                                  │
                                                                  ▼
                                    Prefeitura (NFS-e)  /  SEFAZ (NF-e)  — autoridade fiscal
```

**Dois lados, responsabilidades separadas:**

| | Responsabilidade | Fonte da verdade |
|---|---|---|
| **GDelta Sistema** | montar o pedido a partir da `os_comercial`; **registrar** o documento (`notas_fiscais`); orquestrar o ciclo (emitir/consultar/cancelar); guardar número/chave/XML/PDF | **GDelta registra** |
| **Agregador** | transmitir à prefeitura/SEFAZ; conformidade (layout municipal, certificado A1, IBS/CBS); devolver autorização/rejeição | **Agregador é a autoridade fiscal** |

### 2.1 A nota nasce de uma `os_comercial` (sem digitação dupla)

A `os_comercial` (migration `20260601000900_os_comercial.sql`) já existe e carrega tudo que a nota precisa, **sem
redigitação**: `cliente_id`, `veiculo_id`, `valor_orcamento` (snapshot do contrato), `numero` (sequencial humano por
oficina). O fluxo de emissão **lê** dessa OS — nunca pede ao usuário os dados de novo. É a regra "sem digitação dupla"
(CLAUDE.md §2.5) aplicada ao fiscal: a nota é uma consequência do que já foi orçado e aprovado.

- **NFS-e** = serviço (mão de obra de funilaria/pintura). É a nota da janela 01/09/2026.
- **NF-e** = peças (produto). Entra de fato no Marco 4 (estoque), mas a camada já é desenhada para os **dois** tipos.

### 2.2 O registro local — `notas_fiscais` (JÁ EXISTE — migration 0012)

A tabela `public.notas_fiscais` está escrita e segue o **mesmo padrão** das demais (auto `oficina_id` pelo JWT via
`set_oficina_id_from_jwt()`, `set_atualizado_em()`, RLS por `oficina_id`). Colunas reais (de
`supabase/migrations/20260601001200_notas_fiscais.sql`):

| Coluna | Papel |
|---|---|
| `id`, `oficina_id` | PK + tenant (auto pelo JWT; RLS isola por oficina) |
| `os_comercial_id` | a nota nasce da OS; **`ON DELETE SET NULL`** → o registro fiscal **sobrevive** se a OS sumir (guarda fiscal) |
| `tipo` | `nfse` \| `nfe` |
| `status` | `rascunho` \| `processando` \| `autorizada` \| `rejeitada` \| `cancelada` |
| `agregador` | provedor usado (`focus` \| `nuvemfiscal` \| `plugnotas`) — espelha qual implementação produziu o resultado |
| `agregador_ref` | id/ref **idempotente** no agregador (correlação para consultar/cancelar) |
| `numero`, `serie`, `chave_acesso` | identificadores oficiais que **voltam** do agregador (chave é de NF-e) |
| `valor`, `xml_url`, `pdf_url`, `mensagem` | valor da nota; links do documento; motivo de rejeição/erro |
| `emitida_em`, `cancelada_em`, `criado_em`, `atualizado_em` | datas do ciclo |

**Índice de idempotência (já criado):** `uq_notas_agregador_ref` único em `(oficina_id, agregador, agregador_ref)`
**quando `agregador_ref` não é nulo** — garante que a mesma emissão não vira duas linhas, sem travar rascunhos.

### 2.3 A camada agnóstica — `src/lib/fiscal` (JÁ EXISTE)

O resto do sistema fala com uma **interface**, nunca com um provedor concreto. Trocar de agregador é trocar a
**implementação**, não o código que emite. Estado real do código:

- **`types.ts`** — define a porta de saída `AgregadorFiscal` com **três** métodos:
  `emitir(input) → NotaResultado`, `consultar(agregadorRef) → NotaResultado`, `cancelar(agregadorRef, motivo) →
  NotaResultado`. Tipos normalizados (`TipoNota`, `StatusNota`, `NotaInput`, `NotaResultado`) são o **denominador comum**
  entre agregadores; campos opcionais cobrem o que só existe em parte deles (ex.: `chaveAcesso` é de NF-e; NFS-e
  municipal geralmente não tem). Os `StatusNota` batem 1:1 com o `check` da coluna `status` da tabela.
- **`focus-nfe.ts`** — `FocusNfeAgregador` (`nome = 'focus'`): **stub intencional**. Sem token configurado
  (`FISCAL_FOCUS_TOKEN`), os três métodos **lançam** uma mensagem clara ("não configurado"). Os comentários já documentam
  o shape real da Focus (auth HTTP Basic com token:'' ; `POST /v2/nfse?ref=` e `/v2/nfe?ref=` assíncronos; consulta
  `GET /v2/{tipo}/{ref}`; cancelamento `DELETE` com justificativa ≥ 15 caracteres; mapa de status Focus → `StatusNota`).
  Os `TODO(fiscal)` marcam exatamente onde entra o `fetch`.
- **`index.ts`** — `getAgregador()` resolve o provedor por env (`FISCAL_AGREGADOR`). Sem configuração, devolve um
  **`NullAgregador` (Null Object)** que satisfaz a interface mas **sempre lança** — *fail-fast, não fail-silent*: o
  sistema nunca "deixa de emitir em silêncio".

**O que falta nesta camada (o trabalho do Marco):** trocar os `throw` por chamadas `fetch` reais (gated em ter token +
agregador escolhido), e adicionar implementações irmãs (`nuvem-fiscal.ts`, `plugnotas.ts`) quando/se a homologação
indicar. A **forma** já está fechada e validada por tipos.

### 2.4 O que ainda NÃO existe (a ser desenhado/escrito)

1. **Camada de dados de `notas_fiscais`** (ex.: `src/lib/supabase/notas-fiscais.ts`) no mesmo padrão de
   `os-comercial.ts` (`FetchState` + `withTimeout` + `traduzirErro`): criar a linha em `rascunho`, atualizar status a
   partir do retorno do agregador, listar/buscar por OS.
2. **Endpoint server-side de emissão** (ex.: Route Handler `POST /api/fiscal/emitir`): orquestra "cria linha local →
   chama `getAgregador().emitir()` → grava `agregador_ref` + `status='processando'`". **Server-side obrigatório** — é
   onde vivem a chave de API e o certificado (§7). O browser **nunca** fala com o agregador.
3. **Recebimento do resultado assíncrono:** endpoint de **callback/webhook** (preferido) e/ou job de **poll** para o
   estado final (`autorizada`/`rejeitada`) → atualiza `numero/chave/xml_url/pdf_url`.
4. **Tela** de emissão/acompanhamento a partir da OS (botão "Emitir NFS-e", status, link do PDF).

---

## 3. Comparação dos agregadores

Critérios que importam para o GDelta (poucas oficinas premium, foco em **NFS-e de serviço** + NF-e de peças, fundador
solo que precisa de boa DX e baixo passivo de suporte). Valores são **ordens de grandeza públicas (jun/2026), a
confirmar no site de cada provedor na hora da contratação** — preço de plano e por nota mudam.

| Critério | **Focus NFe** *(recomendado)* | **Nuvem Fiscal** | **PlugNotas / Tecnospeed** |
|---|---|---|---|
| **Cobertura municipal NFS-e** | **Ampla** — integração ativa com 3.000+ municípios; compromisso de integrar município novo por taxa fixa (~R$199) em ~15 dias | Boa e crescente; DX moderna sobre o padrão nacional | Boa; forte em volume/ERP |
| **NF-e (peças)** | Sim | Sim | Sim (origem é NF-e) |
| **DX / documentação** | Madura, estável; auth simples (Basic) | **Moderna**, enxuta | Boa; voltada a desenvolvedores/ERPs |
| **Suporte** | Bom para o perfil solo | Bom | **Forte** suporte técnico a devs |
| **Custo (ordem de grandeza)** | ~R$89–129/mês + ~R$0,60–0,75/nota | competitivo, faixa equivalente | faixa equivalente; modelos por volume |
| **Prontidão IBS/CBS** | abstrai os campos da reforma | abstrai os campos da reforma | abstrai os campos da reforma |

**Recomendação: Focus NFe** como padrão (cobertura municipal ampla — relevante porque oficinas premium podem estar em
municípios variados — documentação madura e auth simples; o adapter stub já está escrito para ela). **Mas a decisão é
por teste, não por catálogo** (Doc 4 §3, Doc 6 "Riscos"): **colocar 2 agregadores em homologação** (Focus + 1
alternativa — Nuvem Fiscal pela DX moderna **ou** PlugNotas pelo suporte) e **emitir uma NFS-e real ponta a ponta a
partir de uma OS**, comparando na prática: **cobertura dos municípios dos clientes-alvo**, suporte a NF-e, prontidão
IBS/CBS e custo por nota. Decidir com base no que de fato autorizou.

> Por que a camada agnóstica importa aqui: testar 2 provedores custa **um adapter a mais** que honra a mesma
> `AgregadorFiscal` — zero mudança no resto do código. A aposta de arquitetura (interface agnóstica) é o que torna o
> "teste 2 e escolha" barato.

---

## 4. Fluxo de emissão (estados e operações)

O `StatusNota` da camada agnóstica **é** o `status` persistido em `notas_fiscais` (mesmos 5 valores). A emissão é
**assíncrona** (a prefeitura/SEFAZ não autoriza na hora) e **idempotente por OS** (a `ref` enviada ao agregador é o
`osComercialId`).

```
        emitir() POST idempotente (ref = osComercialId)
rascunho ─────────────────────────────────────────► processando
   │  (linha local criada do snapshot da OS)              │
   │                                                      │  callback (webhook)  ── preferido
   │                                                      │      ── ou ──
   │                                                      │  consultar() GET (poll)  ── fallback
   │                                                      ▼
   │                              ┌──────────────► autorizada  (numero / chave / xml_url / pdf_url)
   │                              │                        │
   │                              │                        │  cancelar(motivo ≥ 15 chars)
   │                              └──────────────► rejeitada │
   │                                 (mensagem do agregador) ▼
   └────────────────────────────────────────────────► cancelada
```

| Passo | O que acontece | Onde |
|---|---|---|
| **1. rascunho** | Cria a linha em `notas_fiscais` a partir do snapshot da OS (`os_comercial_id`, `tipo`, `valor`, tomador derivado de `cliente_id`). | camada de dados local |
| **2. emitir** | `getAgregador().emitir(input)` faz **POST idempotente** com `ref = osComercialId`. Grava `agregador`, `agregador_ref`, `status='processando'`. Reenviar a mesma `ref` **não duplica** (idempotência no agregador + índice local). | endpoint server-side |
| **3a. callback** *(preferido)* | O agregador faz POST na nossa URL ao mudar de estado → atualiza a linha. | webhook server-side |
| **3b. poll** *(fallback)* | `getAgregador().consultar(agregador_ref)` busca o estado final. | job/sob demanda |
| **4a. autorizada** | Grava `numero`, `serie`, `chave_acesso` (NF-e), `xml_url`, `pdf_url`, `emitida_em`. | camada de dados local |
| **4b. rejeitada** | Grava `mensagem` (motivo da SEFAZ/prefeitura) para o usuário corrigir e reemitir. | camada de dados local |
| **5. cancelamento** | `getAgregador().cancelar(agregador_ref, motivo)` (justificativa **≥ 15 caracteres** — regra SEFAZ); grava `status='cancelada'`, `cancelada_em`. | endpoint server-side |

**Princípios do fluxo:**
- **Idempotência por OS:** `ref = osComercialId`; clique duplo / retry de rede não emite duas notas.
- **Assíncrono tolerante:** a linha existe em `processando` enquanto a autorização não volta; nada bloqueia a tela.
- **Fail-fast:** sem agregador/credencial, `getAgregador()` devolve o `NullAgregador` que lança — nunca "emite em silêncio".
- **Guarda fiscal:** registro preservado (`os_comercial_id ON DELETE SET NULL`) mesmo se a OS for removida.

---

## 5. Decisões / insumos do fundador (GATED — não inventar)

Estes itens **não podem ser inferidos nem inventados** pelo agente: são dados de negócio, segredos e contas que **só o
fundador** fornece. O código fica pronto para recebê-los; a emissão real **não avança** sem eles. (Alinha com CLAUDE.md
§3 e §4: o agente não cria conta/projeto nem manuseia segredo além de colocar no `.env` o que o fundador entregar.)

| # | Insumo do fundador | Por que é dele / não dá para inventar |
|---|---|---|
| 1 | **Escolher o agregador** (após homologar 2) | Decisão comercial/contratual; depende do teste real de cobertura/custo |
| 2 | **Criar conta no agregador + chave de API** | Conta paga em nome da empresa; a chave é **segredo** (entra só no `.env` server-side) |
| 3 | **Certificado digital A1** (arquivo + senha) | Documento jurídico da empresa; **segredo**; o agregador o usa para assinar — nunca vai ao browser nem ao git |
| 4 | **Regime tributário** (Simples Nacional) | Define alíquotas/regras na nota; é um fato fiscal da empresa |
| 5 | **Dados do emitente:** CNPJ, **inscrição municipal**, razão social, endereço fiscal | Identidade fiscal da oficina na NFS-e; vem do cadastro real |
| 6 | **Itens de serviço:** CNAE, **código de serviço municipal**, descrição padrão, alíquota ISS | Específico do município e da atividade; errar = nota rejeitada |

> **Regra de ouro:** enquanto 1–6 não chegam, o sistema permanece na **fundação** (modelo + camada agnóstica). Tentar
> emitir sem eles → `NullAgregador` / stub **lança** com mensagem clara. Isto é proposital: melhor falhar visível do que
> emitir errado.

---

## 6. LGPD / segurança

A nota cruza **dois tipos sensíveis**: **segredos** (chave de API, certificado A1) e **dados pessoais** (tomador =
cliente: nome, CPF/CNPJ). Os controles seguem o CLAUDE.md §2.1 e a comment-header da migration 0012.

**Segredos (chave de API + certificado A1):**
- **Server-side only.** Vivem em variáveis de ambiente lidas **apenas no servidor** (`FISCAL_AGREGADOR`,
  `FISCAL_FOCUS_TOKEN`, etc.). **Nunca** com prefixo público (`NEXT_PUBLIC_*`); **nunca** no browser, no chat ou no git.
- **`.env*` gitignored** (CLAUDE.md §3); o fundador entrega os valores, o agente só os coloca no `.env.local`.
- O **browser nunca fala com o agregador** — toda emissão passa por endpoint server-side. O `getAgregador()` lê o token
  só no **uso** (não no construtor), reforçando que credencial vive no servidor.
- O **certificado A1** é gerenciado **pelo agregador** (upload no painel/API do provedor, sob a conta da oficina) — o
  GDelta não armazena o `.pfx`; idealmente só referencia que existe.

**Dados pessoais (tomador):**
- `notas_fiscais` é isolada por **`oficina_id` via RLS + claim do JWT** (igual às demais tabelas) — nenhuma query confia
  no cliente para isolar; quem isola é o banco.
- **Minimização:** enviar ao agregador só o necessário para a nota (tomador, valor, descrição do serviço) — `NotaInput`
  já é enxuto (`tomador: { nome, documento }`, `valor`, `descricao?`).
- **Guarda fiscal × direito ao esquecimento:** documento fiscal tem prazo legal de guarda; por isso `os_comercial_id` é
  `ON DELETE SET NULL` (a nota sobrevive à OS). A deleção de dados de uma pessoa (CLAUDE.md §2.1.7) precisa **conciliar**
  com a obrigação de retenção fiscal — *decisão para `@legal-chief`* (§9, item 7).
- **Residência no Brasil** (CLAUDE.md §2.1.4): preferir agregador com processamento/dados no país; confirmar na contratação.

---

## 7. Plano faseado

Ordem que respeita **camada agnóstica antes do provedor concreto**, **homologação antes de PROD** e **OK do fundador
antes de produção**. Espelha o `06_Roadmap.md` (Marco "Onda fiscal").

| Fase | Entrega | Estado | Quem | Gate |
|---|---|---|---|---|
| **1 — Fundação (modelo + camada agnóstica)** | Tabela `notas_fiscais` (0012); interface `AgregadorFiscal` + stub Focus + `getAgregador()` (`src/lib/fiscal/*`) | **FEITO (como código)** — aplicado em TESTE; PROD pendente | agente | tipos compilam; `NullAgregador` falha claro; migration validada em TESTE |
| **2 — Escolher agregador + homologação** | Fundador cria contas (Focus + 1 alternativa), entrega chaves de homologação e certificado A1; ligar o `fetch` real nos adapters (ambiente de homologação) | **pendente (insumos do fundador, §5)** | fundador + agente | 2 agregadores conectados em homologação |
| **3 — Emitir NFS-e real em homologação** | Endpoint server-side de emissão + callback/poll + camada de dados `notas-fiscais.ts` + tela mínima; **emitir 1 NFS-e ponta a ponta a partir de uma OS** | **pendente** | agente | NFS-e **autorizada** em homologação, com numero/PDF, a partir de uma `os_comercial` real |
| **4 — Produção (com OK do fundador)** | Decidir agregador pelo teste; configurar credenciais de produção; aplicar `notas_fiscais` em PROD (backup → validar TESTE → PROD); habilitar emissão real | **pendente (gate do fundador + PROD)** | fundador (decide) + agente | **uma oficina emite a NFS-e nacional obrigatória pelo GDelta, em produção, sem dor — ANTES de 01/09/2026** |

**Marcos de disciplina (não pular):**
- **TESTE antes de PROD** em toda migration; aplicar `notas_fiscais` em PROD só após validar em TESTE + **OK explícito do
  fundador** (CLAUDE.md §3).
- **Homologação antes de produção fiscal:** nenhuma nota real até uma NFS-e autorizar em homologação (Fase 3).
- **Deadline duro:** Fase 4 concluída **antes de 01/09/2026**; se o calendário apertar, esta frente tem **prioridade**
  sobre aprofundar a cunha premium (Doc 6).

---

## 8. Decisões para o fundador (perguntas abertas)

> Recomendação em itálico. Nenhuma é bloqueante para a **fundação** (já feita); todas são para destravar a **emissão real**.

0. **Numeração dos marcos** — unificar "Marco 2 (este doc)" vs "Marco 3 (roadmap)". *Recomendação: roadmap é a fonte —
   tratar como "Marco 3 — Onda fiscal"; "Marco 2" fica como apelido deste arquivo.*
1. **Qual agregador testar como alternativa à Focus** — Nuvem Fiscal (DX) ou PlugNotas (suporte)? *Recomendação: Focus +
   Nuvem Fiscal em homologação.*
2. **Modelo de custo ao cliente** — embutir o custo do agregador no plano ou repassar medido por nota? (Doc 4 §6.)
   *Recomendação: embutir no plano premium para simplicidade; revisar quando houver volume.*
3. **Callback vs poll** — habilitar webhook do agregador (precisa de URL pública estável) ou só poll no MVP?
   *Recomendação: webhook quando o deploy na Vercel estiver estável; poll como fallback sempre.*
4. **NF-e de peças agora ou só no Marco 4** — a camada já suporta `nfe`. *Recomendação: focar NFS-e (a janela de 09/2026
   é de serviço); NF-e entra com o estoque (Marco 4).*
5. **Número humano da nota** — exibir o `numero` oficial do agregador, e/ou um número interno? *Recomendação: exibir o
   oficial; vincular ao `numero` da OS para o usuário.*
6. **Reemissão após rejeição** — corrigir e reusar a mesma `ref` (idempotente) ou gerar nova? *Recomendação: corrigir e
   reusar a `ref` da OS enquanto não autorizada; nova ref só se a OS mudar de identidade.*
7. **Guarda fiscal × direito ao esquecimento (LGPD)** — como conciliar retenção legal da nota com deleção de dados de uma
   pessoa? *Decisão de `@legal-chief`; recomendação preliminar: anonimizar dados pessoais do tomador após o prazo legal,
   preservando o documento fiscal.*

---

## Apêndice — fontes consultadas (grounding)

- **Código já existente (a fundação):**
  - `supabase/migrations/20260601001200_notas_fiscais.sql` — tabela `notas_fiscais` real (colunas, índice de
    idempotência `uq_notas_agregador_ref`, triggers reusados, RLS por `oficina_id`).
  - `supabase/migrations/20260601000900_os_comercial.sql` — `os_comercial` (origem da nota: cliente/veículo/valor/numero).
  - `src/lib/fiscal/types.ts` — interface `AgregadorFiscal` (emitir/consultar/cancelar), `StatusNota`, `NotaInput`,
    `NotaResultado`.
  - `src/lib/fiscal/focus-nfe.ts` — `FocusNfeAgregador` (stub; shape real da API Focus documentado nos comentários).
  - `src/lib/fiscal/index.ts` — `getAgregador()` + `NullAgregador` (fail-fast).
  - `src/lib/supabase/os-comercial.ts` — padrão de camada de dados a replicar para `notas_fiscais`.
- **Regras e estratégia (docs):**
  - `CLAUDE.md` §2.1, §2.8, §3, §4 — LGPD/segurança, fiscal via agregador, TESTE antes de PROD, tarefas do fundador.
  - `docs/GDelta-Sistema_05_Requisitos-por-Modulo.md` §7 — módulo "Emissão de nota (NFS-e/NF-e via agregador)".
  - `docs/GDelta-Sistema_04_Posicionamento-e-Estrategia.md` §3 — gancho 01/09/2026, recomendação de agregador, homologar 2.
  - `docs/GDelta-Sistema_02_PRD.md` §4.7 — emissão embutida no fluxo, sem passivo de conformidade.
  - `docs/GDelta-Sistema_06_Roadmap.md` — Marco "Onda fiscal" (NFS-e antes de 01/09/2026; prioridade sobre a cunha premium).
  - `docs/design/orcamento-para-os-comercial.md` — costura Orçamento→OS que alimenta a nota.

> **Regra fiscal (fonte oficial):** Resolução CGSN nº 189/2026 — NFS-e de padrão nacional obrigatória para ME/EPP do
> Simples Nacional a partir de 01/09/2026 (Receita Federal / Ministério da Fazenda, abr/2026; links no Doc 4 §"Fontes").
