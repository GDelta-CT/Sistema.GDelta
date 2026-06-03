> **DESIGN — nada aplicado; requer revisão do fundador.**
> Este documento é um **esboço de arquitetura**. Nenhuma migration, código ou política
> aqui descrita foi aplicada. Todo SQL é **ilustrativo** (rascunho), não é migration a rodar.
> Disciplina herdada das migrations 0001–0005: **TESTE antes de PROD**, **auth + claim
> (`oficina_id` no JWT) + RLS antes de qualquer tabela de negócio**, schema compatível com o Totem.

# Orçamento aprovado → OS comercial (seam do Marco 1/2)

**Autor:** Especialista de Arquitetura de Sistemas · **Data:** 2026-06-02 · **Status:** rascunho para decisão

---

## 1. Contexto e objetivo

O GDelta tem uma **arquitetura de duas OS**, deliberadamente separadas por responsabilidade:

| | Onde vive | Responsabilidade | Fonte da verdade |
|---|---|---|---|
| **OS comercial** | **este** projeto ("Sistema") | o lado de **negócio**: cliente, veículo, valor aprovado, ciclo comercial (aberta → entregue) | Sistema |
| **OS operacional** | projeto **Totem** (repo separado) | o **chão de fábrica**: kanban de 8 etapas, ponto, apontamento, tempo real de produção | Totem |

As duas se ligam por um **`os_ref`** — um identificador trocado **via API** entre os projetos. O Totem é **externo a este repositório**: aqui definimos apenas **a costura (a interface)**, nunca o seu interior. Esta separação é uma mudança consciente em relação ao desenho antigo de "schema único compartilhado" (ver §9 — decisão para o fundador).

**Objetivo do Marco 1/2 (a costura):** quando um **orçamento é aprovado**, ele **vira automaticamente uma OS comercial**, carregando os dados que já existem (cliente, veículo, valor) **sem redigitação**. Isso também **inicia a consolidação do Pátio/OS**: é a primeira vez que a OS comercial passa a existir de verdade no Sistema. (Doc 3, Fase 1: *"o orçamento aprovado promove a OS"*; Doc 5 §5; Doc 6 Marco 2, item 4.)

**Anti-escopo deste documento:**
- Não desenhamos o interior do Totem (kanban, apontamento, estados do operário).
- Não aplicamos nada (sem migration, sem código).
- Não definimos a emissão de NFS-e (Marco 3) — apenas deixamos a OS comercial pronta para alimentá-la.

---

## 2. Gatilho: orçamento `aprovado` → linha em `os_comercial`

### 2.1 Regra de negócio

Quando um orçamento muda para `status = 'aprovado'`, o Sistema **cria ou atualiza** (upsert idempotente) **uma** linha em `os_comercial`, carregando, sem redigitação:

- `orcamento_id` — origem (1 orçamento aprovado → no máximo 1 OS comercial);
- `cliente_id`, `veiculo_id` — copiados do orçamento;
- `valor_orcamento` — **somado dos itens** (ver 2.3);
- `status = 'aberta'` (estado inicial da OS comercial);
- `oficina_id` — **não** é digitado; vem do JWT pelo trigger `set_oficina_id_from_jwt()` (mesma regra das outras tabelas).

Reaprovar/editar um orçamento já aprovado **atualiza** a mesma OS comercial (não duplica) — daí o upsert por `orcamento_id` único.

### 2.2 Mapeamento no schema/código ATUAL (o que existe hoje)

Grounding nas fontes reais deste repo:

**`supabase/migrations/20260601000500_orcamentos.sql`** — a tabela `orcamentos` aplicada tem exatamente:
`id, oficina_id (NOT NULL, FK oficinas), cliente_id (FK clientes, ON DELETE SET NULL), veiculo_id (FK veiculos, ON DELETE SET NULL), status varchar(20) check ('rascunho'|'enviado'|'aprovado'|'recusado') default 'rascunho', desconto numeric(12,2), observacoes, criado_em, atualizado_em`.
- **Não existe** `valor_total`, `lucro`, `aprovado_em` nem `os_id` em `orcamentos`. Os números de dinheiro vivem só em `orcamento_itens` como **colunas geradas** (`total_custo`, `total_venda`, `margem` = `quantidade * (venda_unitaria − custo_unitario)`).
- **Não existe** tabela `ordens_servico` neste repositório (ela é a OS **operacional**, do Totem).
- Triggers já disponíveis para reusar: `set_oficina_id_from_jwt()` (migration 0003) e `set_atualizado_em()` (migration 0001). Hook de claim que injeta `oficina_id`/`user_role` no JWT: migration 0001 (`custom_access_token_hook`).

**`src/lib/supabase/orcamentos.ts`** — pontos de enganche reais:
- `export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';` e a lista `STATUS_ORCAMENTO`.
- `atualizarStatus(id, status)` (linha ~184) faz `update({ status }).eq('id', id)` — **é exatamente aqui que a transição para `'aprovado'` acontece hoje.** É o ponto natural para disparar a criação da OS comercial (ver §8 sobre *onde* disparar — trigger no banco vs. RPC).
- `calcularTotais(itens, desconto)` (linha 63) já calcula `totalVenda = max(0, Σ(qtd·venda_unitaria) − desconto)`. **Essa mesma fórmula** é a que o `valor_orcamento` da OS deve usar — assim o número da OS bate com o que o orçamentista viu na tela.

### 2.3 De onde sai o `valor_orcamento`

Como `orcamentos` **não** persiste total, o valor da OS é derivado na hora da aprovação:

```
valor_orcamento = max(0, Σ(orcamento_itens.total_venda do orçamento) − orcamentos.desconto)
```

Isto é idêntico ao `calcularTotais()` do front e usa a coluna gerada `total_venda` (fonte da verdade do banco). **Decisão em aberto** (§9): copiar este valor para `os_comercial.valor_orcamento` (snapshot no momento da aprovação — recomendado, porque a OS é um contrato fechado) **ou** mantê-lo sempre derivado por view. Recomendação: **snapshot** + um campo `valor_recalculado` opcional por view para conferência.

---

## 3. Esboço de `os_comercial` (RASCUNHO SQL — não é migration)

> **ATENÇÃO — ESBOÇO ILUSTRATIVO.** Não aplicar. Quando aprovado, vira a migration `…_os_comercial.sql`
> seguindo o padrão idempotente das anteriores (IF NOT EXISTS / DROP POLICY IF EXISTS), com
> rollback em `supabase/rollbacks/`. Mantém o **mesmo padrão de tenant + RLS** das migrations 0003/0004/0005.

```sql
-- RASCUNHO — OS comercial (lado "Sistema" da arquitetura de duas OS).
-- Liga-se à OS operacional do Totem por os_ref (string trocada via API).
create table if not exists public.os_comercial (
  id              uuid primary key default gen_random_uuid(),
  oficina_id      uuid not null references public.oficinas(id) on delete cascade,

  -- origem (sem redigitação): 1 orçamento aprovado -> no máx. 1 OS comercial
  orcamento_id    uuid not null references public.orcamentos(id) on delete restrict,
  cliente_id      uuid references public.clientes(id) on delete set null,
  veiculo_id      uuid references public.veiculos(id) on delete set null,

  -- número da OS legível para humanos (sequencial por oficina) — ver §9
  numero          bigint,

  -- contrato comercial (snapshot no momento da aprovação)
  valor_orcamento numeric(14,2) not null default 0,

  -- ciclo de vida COMERCIAL (≠ etapa do kanban do Totem)
  status          varchar(20) not null default 'aberta'
                    check (status in ('aberta','em_producao','concluida','entregue','cancelada')),

  -- costura com o Totem (OS operacional) — preenchido quando o Totem confirma
  os_ref          varchar(40),   -- id/handle da OS operacional no Totem
  totem_sync_status varchar(20) not null default 'pendente'
                    check (totem_sync_status in ('pendente','enviada','confirmada','erro')),
  totem_sync_em   timestamptz,

  -- datas do ciclo comercial
  data_aprovacao  timestamptz not null default now(),
  prazo_entrega   date,
  data_entrega_real timestamptz,

  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- 1 OS comercial por orçamento (garante o upsert idempotente da aprovação)
create unique index if not exists uq_os_comercial_orcamento on public.os_comercial(orcamento_id);
create index if not exists idx_os_comercial_oficina on public.os_comercial(oficina_id);
create index if not exists idx_os_comercial_cliente on public.os_comercial(cliente_id);
create index if not exists idx_os_comercial_veiculo on public.os_comercial(veiculo_id);
-- busca por os_ref na volta do Totem (callback) — único por oficina quando preenchido
create unique index if not exists uq_os_comercial_osref
  on public.os_comercial(oficina_id, os_ref) where os_ref is not null;

-- oficina_id automático pelo JWT (reusa função da migration 0003)
drop trigger if exists trg_os_comercial_oficina on public.os_comercial;
create trigger trg_os_comercial_oficina before insert on public.os_comercial
  for each row execute function public.set_oficina_id_from_jwt();

-- atualizado_em automático (reusa função da migration 0001)
drop trigger if exists trg_os_comercial_atualizado on public.os_comercial;
create trigger trg_os_comercial_atualizado before update on public.os_comercial
  for each row execute function public.set_atualizado_em();

-- RLS por oficina_id — MESMO padrão de clientes/veiculos/orcamentos
alter table public.os_comercial enable row level security;
drop policy if exists "os_comercial_isolation" on public.os_comercial;
create policy "os_comercial_isolation" on public.os_comercial for all to authenticated
  using      (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check  (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);
```

**Notas de schema:**
- `orcamento_id` é `ON DELETE RESTRICT` (uma OS comercial não deve ficar órfã do seu orçamento — diferente do `SET NULL` de cliente/veículo).
- `os_ref` é **nullable**: a OS comercial nasce **antes** de o Totem confirmar a OS operacional; o `os_ref` chega depois (assíncrono — ver §5/§8).
- `numero` (sequencial humano por oficina) é opcional no MVP — ver decisão §9.

---

## 4. Máquinas de estado

### 4.1 Orçamento (já existe no código — `StatusOrcamento`)

Estados atuais: `rascunho` · `enviado` · `aprovado` · `recusado`.

```
rascunho ──► enviado ──► aprovado ──► (dispara OS comercial)
   │            │
   └────────────┴────► recusado
```

- `aprovado` é **terminal-feliz** e o **único** gatilho da OS comercial.
- **Decisão §9:** travar edição de itens após `aprovado` (orçamento aprovado é contrato). Hoje nada impede editar — recomenda-se bloquear ou versionar.
- `recusado` não cria OS. Reverter `aprovado → recusado` deve **cancelar** a OS comercial associada (ver 4.2), não apagá-la.

### 4.2 OS comercial (nova — proposta)

```
              ┌─────────────────────────────► cancelada
              │                 ▲      ▲
aberta ──► em_producao ──► concluida ──► entregue
   │            ▲
   └── (cria na aprovação do orçamento)
```

| Estado | Significado | Quem transiciona |
|---|---|---|
| `aberta` | criada pela aprovação; ainda não foi para o chão | automático (gatilho) |
| `em_producao` | Totem confirmou OS operacional / produção começou | callback do Totem **ou** dono |
| `concluida` | produção terminou (todas as etapas do Totem) | callback do Totem |
| `entregue` | carro entregue ao cliente; fecha o ciclo comercial | dono/gerente |
| `cancelada` | cancelada (inclui reversão do orçamento) | dono/gerente |

**Transições válidas (proposta):**
`aberta → em_producao | cancelada` · `em_producao → concluida | cancelada` · `concluida → entregue | cancelada` · `entregue` é terminal · `cancelada` é terminal.

**Acoplamento com o Totem (frouxo):** o `status` comercial é **derivado/atualizado por eventos** do Totem (a etapa do kanban operacional é do Totem; aqui guardamos só o estado comercial agregado). `status` comercial **≠** `etapa_atual` do kanban (Doc 5 §5: *"`status_geral` ≠ `etapa_atual`"*).

---

## 5. Contrato `os_ref` para o Totem (apenas o shape — sem implementar)

A costura é **assíncrona** e **idempotente** (rede entre dois projetos pode repetir). O Sistema é a fonte do dado comercial; o Totem devolve o `os_ref` (e depois o progresso).

### 5.1 Ida — Sistema → Totem (criar OS operacional a partir da comercial)

`POST /api/v1/os` (no Totem)

```jsonc
// payload que o Totem PRECISA receber (shape proposto)
{
  "oficina_id": "uuid",              // tenant (o Totem valida o mesmo claim)
  "os_comercial_id": "uuid",         // chave de correlação (idempotência)
  "placa": "ABC1D23",                // do veiculo (UPPER) — o Totem busca-ou-cria por placa
  "cliente": { "nome": "string", "documento": "string|null" },
  "veiculo": { "marca": "string|null", "modelo": "string|null", "ano": "string|null" },
  "valor": 1234.56,                  // valor_orcamento (snapshot)
  "prazo": "2026-06-20",             // prazo_entrega (date, opcional)
  "observacoes": "string|null"
}
```

Resposta:

```jsonc
{ "os_ref": "totem-os-000123", "status": "aberta", "recebido_em": "2026-06-02T12:00:00Z" }
```

→ Sistema grava `os_comercial.os_ref` e `totem_sync_status = 'confirmada'`.

### 5.2 Volta — Totem → Sistema (progresso/entrega)

`POST /api/v1/os/callback` (no Sistema) ou consulta `GET /api/v1/os/by-ref/{os_ref}`:

```jsonc
{
  "os_ref": "totem-os-000123",
  "os_comercial_id": "uuid",         // eco para correlação
  "status_operacional": "em_producao", // mapeia → status comercial
  "etapa_atual": "pintura",          // informativo (não vira coluna comercial)
  "atualizado_em": "2026-06-02T15:30:00Z"
}
```

### 5.3 Princípios do contrato

- **Idempotência:** `os_comercial_id` correlaciona; reenvio não duplica OS no Totem.
- **Auth:** mesma base de claim (`oficina_id` no JWT) dos dois lados; chamada server-to-server autenticada (segredo/serviço), **nunca** do browser.
- **Tolerante a atraso:** OS comercial existe mesmo com `os_ref` ainda nulo (`totem_sync_status='pendente'`); um job reenfileira os pendentes.
- **Versão:** prefixo `/v1` para evoluir sem quebrar o Totem.
- **Contrato é dono compartilhado:** este shape deve virar um documento de contrato único (sugestão: `docs/GDelta-Sistema_Contrato-API-Totem-Sistema.md`) revisado pelos dois lados antes de codar.

---

## 6. Métrica "dias-na-oficina × R$"

Doc 5 §5: *"dias na oficina × R$ do orçamento (revela barato-lento × caro-rápido)"*. Quando a OS comercial existir, os dados saem **toda da própria `os_comercial`** (lado Sistema), sem depender do interior do Totem:

```
dias_na_oficina = (coalesce(data_entrega_real, now()) - data_aprovacao)   -- em dias
eixo_R$         = valor_orcamento
```

- **Eixo R$:** `os_comercial.valor_orcamento` (snapshot do contrato).
- **Eixo dias:** de `data_aprovacao` até `data_entrega_real` (ou "hoje" se ainda aberta).
- **Refino futuro (Totem):** quando quiser tempo **produtivo** real (vs. calendário), o Totem fornece, via callback, datas operacionais (início real de produção, conclusão) — entram como colunas informativas e geram uma segunda métrica "dias **produtivos** × R$". O MVP usa só datas comerciais (honestidade de medição: não prometer número que ainda não medimos).
- Exposição: uma **view** `v_os_dias_rs` (oficina_id, os_id, valor_orcamento, dias) alimenta o gráfico do Pátio. (View, não tabela — derivada.)

---

## 7. Decisões em aberto para o fundador

1. **Duas OS de fato?** Confirmar a separação `os_comercial` (Sistema) ↔ `ordens_servico` operacional (Totem, via `os_ref`/API) — **substituindo** o desenho antigo do `GDelta-Sistema_Marco2_Build-Orcamento.md`, que promovia o orçamento direto em `ordens_servico` no **mesmo** banco (função `aprovar_orcamento()`). Hoje os dois textos se contradizem; precisamos de uma decisão única. *(Recomendação: duas OS, conforme este brief.)*
2. **`valor_orcamento`: snapshot ou derivado?** Recomendo **snapshot** na aprovação + view de conferência. Confirmar.
3. **Travar orçamento após `aprovado`?** Bloquear edição de itens (contrato fechado) ou permitir e re-sincronizar a OS? *(Recomendação: travar ou exigir nova versão.)*
4. **Onde disparar a criação da OS?** (a) trigger no banco em `update orcamentos … status='aprovado'`; (b) RPC `security definer` (estilo `aprovar_orcamento`); (c) server action no app chamando a RPC. *(Recomendação: RPC explícita chamada pelo app — testável, sem efeito colateral escondido em trigger; alinhado ao `atualizarStatus` que já existe.)*
5. **`numero` humano da OS?** Sequencial por oficina já no MVP, ou só `id` UUID por enquanto?
6. **Reversão `aprovado → recusado`** deve cancelar a OS comercial automaticamente? *(Recomendação: sim, `status='cancelada'`.)*
7. **Direção da chamada ao Totem:** Sistema empurra (push) na aprovação, ou Totem puxa (pull/poll) OS aprovadas? *(Recomendação: push com fila de retry para os pendentes.)*
8. **Onde mora o contrato da API?** Confirmar um único documento de contrato versionado, revisado pelos dois repositórios.

---

## 8. Passos de implementação faseados

Ordem que respeita **auth+claim+RLS antes de tudo**, **TESTE antes de PROD** e **schema compatível com o Totem**:

**Fase 0 — Pré-requisitos (já existentes; só verificar)**
- Confirmar que o claim `oficina_id` está no JWT (migration 0001 `custom_access_token_hook`) e que RLS por oficina está ativa (migrations 0002–0005). *Nenhuma fechadura sem porta.*

**Fase 1 — Decisão de arquitetura (bloqueante)**
- Fechar as decisões §7 (principalmente #1: duas OS). Sem isso, não se escreve migration. Atualizar/depreciar a §4 do `Marco2_Build-Orcamento.md` para não contradizer.

**Fase 2 — Tabela `os_comercial` em TESTE**
- Escrever a migration `…_os_comercial.sql` a partir do esboço §3 (idempotente + rollback), reusando `set_oficina_id_from_jwt` e `set_atualizado_em`.
- Aplicar **só no projeto de TESTE**; validar RLS (uma oficina não enxerga OS de outra) e o trigger de `oficina_id`. Passar pelo `supabase-guardian`.

**Fase 3 — Gatilho de promoção (TESTE)**
- Implementar a RPC `aprovar_orcamento(orcamento_id)` (recomendação §7.4): valida tenant, soma `total_venda − desconto`, faz **upsert** em `os_comercial` por `orcamento_id`, seta `status='aprovado'` no orçamento.
- Ligar no app: `atualizarStatus(id,'aprovado')` (em `src/lib/supabase/orcamentos.ts`) passa a chamar a RPC. Testar idempotência (aprovar 2× não duplica).

**Fase 4 — Métrica do Pátio (TESTE)**
- Criar a view `v_os_dias_rs` (§6) e o gráfico "dias × R$".

**Fase 5 — Costura com o Totem (contrato primeiro)**
- Acordar o shape §5 num contrato único com o time do Totem (sem implementar interior do Totem).
- Implementar o **cliente** server-to-server no Sistema: push na aprovação + fila/retry para `totem_sync_status='pendente'`; endpoint de callback para gravar progresso/`os_ref`. Testar com o Totem em ambiente de teste.

**Fase 6 — Promoção a PROD**
- Só após validação em TESTE e **OK explícito do fundador**: backup → aplicar migration em PROD → verificar RLS/idempotência em PROD → habilitar a costura.

---

## Apêndice — fontes consultadas (grounding)

- `supabase/migrations/20260601000500_orcamentos.sql` — schema real de `orcamentos`/`orcamento_itens` (totais como colunas geradas; sem `valor_total`/`os_id`).
- `supabase/migrations/20260601000300_clientes.sql` — `set_oficina_id_from_jwt()` (reusada).
- `supabase/migrations/20260601000400_veiculos.sql` — padrão RLS + índice único por oficina (`placa`).
- `supabase/migrations/20260601000100_tenant_base_e_claim_hook.sql` — `custom_access_token_hook` (claim `oficina_id`), `set_atualizado_em()`.
- `src/lib/supabase/orcamentos.ts` — `StatusOrcamento`, `atualizarStatus()`, `calcularTotais()` (fórmula do `valor_orcamento`).
- `docs/GDelta-Sistema_03_Mapa-de-Modulos-por-Fase.md` (Fase 1), `…_05_Requisitos-por-Modulo.md` (§4 Orçamento, §5 Pátio/OS, métrica dias×R$), `…_06_Roadmap.md` (Marco 2, item 4).
- `docs/GDelta-Sistema_Marco2_Build-Orcamento.md` — desenho **anterior** (`aprovar_orcamento` em `ordens_servico` no mesmo banco) que este documento **propõe substituir** pela arquitetura de duas OS (decisão §7.1).
