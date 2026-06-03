> **CONTRATO — v1 proposta; nada implementado ainda.**
> Este documento descreve a **interface (a costura) entre dois repositórios** — `sistema-gdelta`
> (OS comercial) e `totem-gdelta` (OS operacional). Nenhum endpoint, cliente HTTP, fila de retry
> ou tabela aqui descrita foi implementado. Todo payload é **ilustrativo** (rascunho de contrato).
> Este arquivo é o **dono compartilhado** do contrato: qualquer mudança exige revisão dos **dois**
> repos antes de codar (ver §8).

# Contrato de API — Totem ↔ Sistema (costura `os_ref`)

**Versão:** v1 (proposta, não implementada)
**Status:** rascunho para revisão conjunta dos dois repositórios
**Data:** 2026-06-03
**Repos envolvidos:** `sistema-gdelta` (OS comercial) · `totem-gdelta` (OS operacional)
**Origem / grounding:** `docs/design/orcamento-para-os-comercial.md` (§5 "Contrato `os_ref`", §7 decisões aprovadas — decisões 1, 7 e 8).

---

## 1. Visão geral

O GDelta tem uma **arquitetura de duas OS**, deliberadamente separadas por responsabilidade (decisão aprovada **§7.1** do doc de design):

| | Onde vive | Responsabilidade | Fonte da verdade |
|---|---|---|---|
| **OS comercial** | `sistema-gdelta` ("Sistema") | lado de **negócio**: cliente, veículo, valor aprovado, ciclo comercial (`aberta → entregue`) | **Sistema** |
| **OS operacional** | `totem-gdelta` ("Totem") | **chão de fábrica**: kanban de 8 etapas, ponto, apontamento, tempo real de produção | **Totem** |

As duas se ligam por um **`os_ref`** — um identificador (handle) da OS operacional **gerado pelo Totem** e trocado **via API** entre os projetos. Cada lado é dono do seu pedaço:

- **O Sistema é a fonte do dado comercial** (quem é o cliente, qual o veículo, qual o valor congelado, qual o prazo). Ele **empurra** esse dado para o Totem.
- **O Totem é a fonte do progresso operacional** (em que etapa do kanban está, quando começou/terminou a produção). Ele **devolve** esse progresso ao Sistema.
- **O `os_ref` é gerado pelo Totem** e devolvido ao Sistema, que o persiste em `os_comercial.os_ref` para correlacionar as duas pontas dali em diante.

### Propriedades da costura

- **Assíncrona.** A OS comercial nasce no Sistema **antes** de o Totem confirmar a OS operacional. O `os_ref` **nasce nulo** e chega depois. Nada no fluxo comercial bloqueia esperando o Totem.
- **Idempotente.** Rede entre dois projetos pode repetir (retry, timeout, reentrega). A chave de idempotência é **`os_comercial_id`**: reenviar a mesma OS **não** cria uma OS duplicada no Totem nem uma atualização duplicada no Sistema.
- **Push com retry (decisão §7.7).** O **Sistema empurra** para o Totem no momento da aprovação do orçamento. Se falhar, a OS fica com `totem_sync_status='pendente'` e uma **fila de retry** reenvia depois. O Totem **não** faz pull/poll de OS aprovadas.
- **Versionada.** Todos os caminhos têm prefixo **`/api/v1`** para evoluir sem quebrar o outro lado (ver §6).
- **Server-to-server.** Toda chamada é autenticada **serviço a serviço** (segredo/token de serviço), carregando o claim `oficina_id`. **Nunca** é disparada a partir do browser (ver §5).

### Diagrama de sequência (feliz)

```
Sistema (sistema-gdelta)                          Totem (totem-gdelta)
        │                                                 │
  orçamento aprovado                                       │
        │  cria os_comercial (os_ref=null,                 │
        │   totem_sync_status='pendente')                  │
        │                                                  │
        │  ── IDA: POST /api/v1/os ──────────────────────► │  cria OS operacional
        │     (os_comercial_id = idempotência)             │  (busca-ou-cria por placa)
        │                                                  │
        │  ◄── 201 { os_ref, status, recebido_em } ─────── │
        │  grava os_ref; totem_sync_status='confirmada'    │
        │                                                  │
        │                                       produção avança no kanban
        │                                                  │
        │  ◄── VOLTA: POST /api/v1/os/callback ─────────── │  notifica progresso
        │     { os_ref, status_operacional, etapa_atual }  │
        │  mapeia → status comercial; 200 OK ───────────►  │
        │                                                  │
   (fallback) GET /api/v1/os/by-ref/{os_ref} ───────────► │  consulta sob demanda
        │  ◄── 200 { ...estado atual... } ─────────────── │
```

---

## 2. Ida — Sistema → Totem (criar OS operacional)

**Direção:** `sistema-gdelta` → `totem-gdelta`
**Endpoint (no Totem):** `POST /api/v1/os`
**Quando:** na aprovação do orçamento (push, decisão §7.7) e em cada retry de OS `pendente`.
**Idempotência:** por **`os_comercial_id`** — ver §2.3.

### 2.1 Payload da requisição (Sistema envia)

```jsonc
{
  "oficina_id": "uuid",              // tenant; o Totem valida o MESMO claim oficina_id
  "os_comercial_id": "uuid",         // CHAVE DE IDEMPOTÊNCIA (correlação entre as duas OS)
  "placa": "ABC1D23",                // do veículo, UPPER; o Totem faz busca-ou-cria por placa
  "cliente": {
    "nome": "string",
    "documento": "string|null"       // CPF/CNPJ; opcional
  },
  "veiculo": {
    "marca":  "string|null",
    "modelo": "string|null",
    "ano":    "string|null"
  },
  "valor": 1234.56,                  // valor_orcamento (snapshot congelado na aprovação)
  "prazo": "2026-06-20",             // prazo_entrega (date ISO-8601, opcional)
  "observacoes": "string|null"
}
```

**Notas de campo:**

- `oficina_id` — **não** vem do corpo por confiança cega: o Totem deve **validar** que o `oficina_id` do payload bate com o claim `oficina_id` do token de serviço autenticado (§5). Tenant nunca é confiado do browser nem assumido sem checagem.
- `os_comercial_id` — é o `id` da linha em `os_comercial` no Sistema. É a **chave de idempotência** da ida: o Totem usa este valor para decidir entre criar uma OS operacional nova ou reconhecer uma já criada.
- `placa` — sempre em maiúsculas. O Totem **busca-ou-cria** o veículo por placa do seu lado (a placa é a chave natural do veículo no chão de fábrica).
- `valor` — é o **snapshot** congelado na aprovação (`os_comercial.valor_orcamento`, decisão §7.2), não um valor recalculado em tempo real.
- `prazo` / `observacoes` — opcionais; podem ser `null`.

### 2.2 Resposta de sucesso (Totem devolve) — `201 Created`

```jsonc
{
  "os_ref": "totem-os-000123",       // handle da OS operacional GERADO pelo Totem
  "status": "aberta",                // status operacional inicial no Totem
  "recebido_em": "2026-06-02T12:00:00Z"  // timestamp ISO-8601 (UTC) do recebimento
}
```

**O que o Sistema faz com a resposta:**

- grava `os_comercial.os_ref = <os_ref>`;
- seta `os_comercial.totem_sync_status = 'confirmada'` e `totem_sync_em = now()`;
- a partir daqui, `os_ref` é a chave de correlação para a volta (§3).

### 2.3 Idempotência da ida

- O Totem **deve** tratar `os_comercial_id` como chave única da OS operacional originada no Sistema.
- Reenvio (retry após timeout, reentrega) com o **mesmo `os_comercial_id`** **não** cria uma segunda OS operacional. O Totem **retorna o mesmo `os_ref`** já associado (idealmente `200 OK` no reenvio reconhecido, ou `201` na primeira criação — ambos com o `os_ref` no corpo; o Sistema trata os dois como sucesso).
- Como o `os_ref` só é persistido no Sistema **após** a resposta, um retry é seguro: se a primeira resposta se perdeu na rede, o segundo POST devolve o mesmo `os_ref`.

---

## 3. Volta — Totem → Sistema (progresso / entrega)

Há **dois caminhos** para o Sistema obter o estado operacional. Ambos carregam a mesma informação; o **callback é o caminho preferencial** (push do Totem) e o **GET é o fallback** (pull do Sistema, para reconciliação quando um callback se perde).

### 3.1 Callback (preferencial) — `POST /api/v1/os/callback`

**Direção:** `totem-gdelta` → `sistema-gdelta`
**Endpoint (no Sistema):** `POST /api/v1/os/callback`
**Quando:** o Totem notifica o Sistema a cada mudança relevante de estado operacional.

```jsonc
{
  "os_ref": "totem-os-000123",       // correlação (chave devolvida na ida)
  "os_comercial_id": "uuid",         // eco para correlação redundante/validação
  "status_operacional": "em_producao", // mapeia → status comercial (ver §3.3)
  "etapa_atual": "pintura",          // INFORMATIVO: etapa do kanban; NÃO vira coluna comercial
  "atualizado_em": "2026-06-02T15:30:00Z"  // timestamp ISO-8601 (UTC) da mudança no Totem
}
```

**O que o Sistema faz:**

- localiza a `os_comercial` por `os_ref` (e valida o eco `os_comercial_id`);
- mapeia `status_operacional` → `status` comercial (§3.3) e aplica **se** a transição for válida (§4);
- `etapa_atual` é **apenas informativo** — não vira coluna comercial (a etapa do kanban é do Totem; ver §3.4);
- responde `200 OK` (ou `202 Accepted`) em caso de sucesso.

### 3.2 Consulta (fallback) — `GET /api/v1/os/by-ref/{os_ref}`

**Direção:** `sistema-gdelta` → `totem-gdelta`
**Endpoint (no Totem):** `GET /api/v1/os/by-ref/{os_ref}`
**Quando:** reconciliação — quando o Sistema suspeita ter perdido um callback, ou para auditoria sob demanda.

Resposta (`200 OK`) — mesmo conteúdo lógico do callback:

```jsonc
{
  "os_ref": "totem-os-000123",
  "os_comercial_id": "uuid",
  "status_operacional": "em_producao",
  "etapa_atual": "pintura",
  "atualizado_em": "2026-06-02T15:30:00Z"
}
```

Se o `os_ref` não existir no Totem: `404 Not Found`.

### 3.3 Mapeamento `status_operacional` → `status` comercial

O Totem informa o estado operacional; o Sistema o traduz para o seu ciclo de vida comercial. Os valores comerciais são exatamente os do `check` de `os_comercial.status`: `'aberta' | 'em_producao' | 'concluida' | 'entregue' | 'cancelada'`.

| `status_operacional` (Totem) | → `status` comercial (Sistema) | Observação |
|---|---|---|
| `aberta` | `aberta` | OS operacional criada, ainda não foi para o chão |
| `em_producao` | `em_producao` | produção começou (alguma etapa do kanban ativa) |
| `concluida` | `concluida` | todas as etapas do kanban terminaram |
| `entregue` | `entregue` | **ver nota** — quem fecha o ciclo comercial é o dono/gerente |
| `cancelada` | `cancelada` | cancelamento operacional |

**Notas do mapeamento:**

- O mapeamento é **1:1 por nome** neste v1 (os vocabulários foram alinhados de propósito). Se um lado divergir no futuro, **este documento** é onde a tabela de tradução passa a valer — não se inventa mapeamento em código.
- **`entregue`:** a entrega ao cliente é um ato **comercial**. A recomendação (alinhada à máquina de estado §4) é que `entregue` seja transicionado pelo **dono/gerente no Sistema**, não imposto pelo Totem. Se o Totem enviar `entregue`, o Sistema pode tratá-lo como sinal informativo, mas a transição comercial canônica para `entregue` permanece manual no Sistema. **(Ponto a confirmar na revisão conjunta — ver §8.)**
- O Sistema **só aplica** a transição se ela for válida pela máquina de estado (§4). Um callback que proponha uma transição inválida é **ignorado** (idempotente) e logado, não causa erro fatal.

### 3.4 `etapa_atual` é informativo (não acopla)

`status` comercial **≠** `etapa_atual` do kanban. A etapa (`pintura`, `funilaria`, etc.) é interior do Totem. O Sistema pode **exibir** `etapa_atual` como rótulo, mas **não** cria coluna comercial a partir dela nem deriva regras de negócio dela. Isso mantém o acoplamento frouxo: o kanban do Totem pode mudar de 8 para N etapas sem quebrar o contrato.

---

## 4. Máquina de estado comercial (referência para o mapeamento)

O Sistema só aceita transições válidas vindas do callback. Transições (proposta, espelha §4.2 do doc de design):

```
              ┌─────────────────────────────► cancelada
              │                 ▲      ▲
aberta ──► em_producao ──► concluida ──► entregue
   │            ▲
   └── (cria na aprovação do orçamento)
```

`aberta → em_producao | cancelada` · `em_producao → concluida | cancelada` · `concluida → entregue | cancelada` · `entregue` é **terminal** · `cancelada` é **terminal**.

Um callback que tente, por exemplo, `entregue → em_producao` é **rejeitado silenciosamente** (logado, sem efeito) — o estado terminal vence. Isso protege a fonte da verdade comercial de regressões vindas da rede.

---

## 5. Autenticação (server-to-server)

- **Modelo:** chamada **serviço a serviço**, autenticada por **segredo/token de serviço** (não por sessão de usuário). Vale para as duas direções (ida e callback).
- **Claim de tenant:** o token de serviço carrega o mesmo claim **`oficina_id`** usado em todo o GDelta (no Sistema, origem em `custom_access_token_hook`, migration 0001). Ambos os lados **validam** o `oficina_id` do payload contra o claim do token.
- **NUNCA do browser.** Estas rotas **não** são chamadas a partir do navegador do usuário. O browser fala com o seu próprio backend; o backend (server-side) é quem faz a chamada cruzada autenticada. O segredo de serviço **nunca** é exposto ao cliente.
- **Tenant nunca confiado cegamente:** o `oficina_id` no corpo é um dado a **validar**, não a aceitar. Se `oficina_id` do payload ≠ claim do token → `403 Forbidden`. (Mesma disciplina de "auth + claim + RLS antes de qualquer tabela de negócio" herdada das migrations 0001–0005.)
- **RLS no lado Sistema:** mesmo recebendo via API, a escrita em `os_comercial` respeita a RLS por `oficina_id` (política `os_comercial_isolation`). A API é uma porta a mais sobre as mesmas fechaduras, não um bypass.

---

## 6. Versionamento

- Prefixo **`/api/v1`** em **todos** os caminhos (`/api/v1/os`, `/api/v1/os/callback`, `/api/v1/os/by-ref/{os_ref}`).
- Mudança **retrocompatível** (campo novo opcional, valor de enum novo aditivo): permanece em `v1`, **mas** exige atualização deste documento e revisão dos dois repos (§8).
- Mudança **quebrável** (renomear/remover campo, mudar tipo, mudar semântica de um enum existente): exige **`/api/v2`** convivendo com `v1` durante a transição. O lado que introduz `v2` mantém `v1` no ar até o outro lado migrar.
- O número de versão do **contrato** (este documento, hoje `v1`) anda junto com o prefixo de rota. Divergência entre eles é um bug de processo.

---

## 7. Erros e retry

A costura é **tolerante a atraso**: a OS comercial existe mesmo sem `os_ref` (`totem_sync_status='pendente'`), e um job de retry reenfileira os pendentes (decisão §7.7). A tabela abaixo define como cada classe de falha é tratada.

### 7.1 Tabela de erros / retry (ida — Sistema → Totem)

| Situação | Código / sintoma | Lado que age | Ação | Retry? | Backoff |
|---|---|---|---|---|---|
| Sucesso (criou) | `201 Created` + `os_ref` | Sistema | grava `os_ref`; `totem_sync_status='confirmada'` | não | — |
| Sucesso (reconhecido) | `200 OK` + `os_ref` (reenvio idempotente) | Sistema | grava/confirma `os_ref`; `confirmada` | não | — |
| Payload inválido | `400 Bad Request` | Sistema | **não reenviar** (erro de contrato); `totem_sync_status='erro'`; alertar/log | **não** | — |
| Não autenticado | `401 Unauthorized` | Sistema | falha de credencial de serviço; `erro`; alertar (não é transitório) | **não** | — |
| Tenant divergente | `403 Forbidden` | Sistema | `oficina_id` ≠ claim; `erro`; alertar (bug de configuração) | **não** | — |
| Conflito de idempotência | `409 Conflict` | Sistema | tratar como já-criada se vier `os_ref`; senão `erro` + log | **não** | — |
| Limite de taxa | `429 Too Many Requests` | Sistema | respeitar `Retry-After`; manter `pendente` | **sim** | honrar `Retry-After`, senão backoff exponencial |
| Erro do Totem | `5xx` (500/502/503/504) | Sistema | manter `totem_sync_status='pendente'`; reenfileirar | **sim** | exponencial + jitter |
| Timeout de conexão/leitura | sem resposta | Sistema | tratar como transitório; manter `pendente`; reenfileirar | **sim** | exponencial + jitter |
| Rede indisponível | DNS/conn refused | Sistema | manter `pendente`; reenfileirar | **sim** | exponencial + jitter |

### 7.2 Tabela de erros / retry (volta — Totem → Sistema, callback)

| Situação | Código / sintoma | Lado que age | Ação | Retry? | Backoff |
|---|---|---|---|---|---|
| Sucesso | `200 OK` / `202 Accepted` | Totem | nada (entregue) | não | — |
| `os_ref` desconhecido | `404 Not Found` | Totem | logar; **não** martelar (provável dessincronia); abrir reconciliação | **não** (ou poucos) | — |
| Transição inválida | `200 OK` mas ignorada | Sistema | aplica idempotência (ignora), loga; responde `200` mesmo assim | não | — |
| Payload inválido | `400 Bad Request` | Totem | erro de contrato; logar; não martelar | **não** | — |
| Não autenticado / tenant | `401` / `403` | Totem | falha de credencial/tenant; alertar | **não** | — |
| Erro do Sistema | `5xx` | Totem | reentregar o callback | **sim** | exponencial + jitter |
| Timeout | sem resposta | Totem | reentregar o callback | **sim** | exponencial + jitter |

### 7.3 Princípios de retry

- **4xx não se reenvia** (exceto `429`): é erro de contrato/credencial/tenant — reenviar só repete o erro. Marca `erro` e **alerta um humano**.
- **5xx, timeout e rede se reenviam**: são transitórios. Backoff **exponencial com jitter** (ex.: 1s, 2s, 4s, 8s…, com teto), até um número máximo de tentativas; depois disso fica `erro` para inspeção manual, mas a OS comercial **continua existindo e válida** (a costura nunca derruba o fluxo comercial).
- **Idempotência cobre o reenvio**: como a chave é `os_comercial_id` (ida) / `os_ref` (volta), reenviar é seguro mesmo que a resposta anterior tenha se perdido.
- **Fallback de reconciliação:** se callbacks se perderem, o Sistema usa `GET /api/v1/os/by-ref/{os_ref}` para reconciliar o estado sob demanda, sem depender exclusivamente do push do Totem.
- **`429` honra `Retry-After`** quando presente; senão cai no backoff exponencial.

---

## 8. Governança — dono compartilhado do contrato

> Este documento é o **dono compartilhado** do contrato entre `sistema-gdelta` e `totem-gdelta`
> (decisão aprovada **§7.8** do doc de design). Ele é a **única fonte da verdade** da costura.

**Regras de mudança:**

1. **Toda mudança neste contrato exige revisão dos DOIS repos** (`sistema-gdelta` e `totem-gdelta`) **antes** de qualquer implementação. Nenhum lado altera payload, enum, código de erro ou semântica unilateralmente.
2. **Implementação segue o contrato, nunca o contrário.** Se a implementação precisar divergir, primeiro muda-se este documento (com revisão dos dois lados), depois o código.
3. **Versionar junto:** mudança quebrável → novo `/api/vN` + nova versão deste doc (§6). Mudança aditiva → atualiza este doc mantendo `v1`.
4. **Pontos em aberto** marcados ao longo do doc (ex.: semântica de `entregue` em §3.3) devem ser **fechados na revisão conjunta** antes de implementar a fase de costura (Fase 5 do doc de design).
5. **Disciplina herdada:** validar em **TESTE antes de PROD**; **auth + claim (`oficina_id`) + RLS** antes de expor qualquer rota; schema compatível entre os dois lados.

**Estado atual:** **v1 — proposta, não implementada.** Aguardando revisão conjunta dos dois repositórios.

---

## Apêndice — rastreabilidade ao doc de design

- Visão de duas OS / fonte da verdade — `docs/design/orcamento-para-os-comercial.md` §1 e decisão **§7.1**.
- Shape da ida/volta e princípios — §5 (5.1 ida, 5.2 volta, 5.3 princípios) do mesmo doc.
- Push com fila de retry — decisão **§7.7**.
- Contrato único versionado, dono compartilhado — decisão **§7.8** (que nomeia este próprio arquivo).
- Snapshot do `valor_orcamento` — decisão **§7.2** (campo `valor` da ida).
- `os_ref` nullable / `totem_sync_status='pendente'` — §3 (esboço de `os_comercial`) e §5.3 do mesmo doc.
- Máquina de estado comercial — §4.2.
