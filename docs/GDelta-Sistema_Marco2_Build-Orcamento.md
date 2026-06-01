# GDelta — Marco 2 · Especificação de Construção
## Orçamento ao vivo + Clientes + Placa/FIPE
**Build spec · Versão 1.0 · Maio/2026**

> **Stack (mesma do Totem):** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + RLS) · Vercel.
> **Premissas que valem aqui:** banco único multi-tenant (`oficina_id` + RLS) — **mesmo schema do Totem** · sem digitação dupla · orçamento aprovado **promove** a OS do Totem · margem ao vivo é o coração premium.
> **Disciplina:** banco passa pelo `supabase-guardian` (teste → backup → produção); telas pelo `painel-builder`; entrega valida no `qa`.

---

## 1. Pré-requisitos (já existem do Totem)

- `oficinas`, `usuarios` (role `dono`/`gerente`), `funcionarios`.
- `ordens_servico` com `placa`, `etapa_atual`, `status_geral`, `valor_orcamento` (nullable).
- Auth com `oficina_id` no JWT (custom claim) — **pré-requisito de toda RLS abaixo**.

> Se `oficina_id` ainda não estiver no JWT, **pare** e resolva isso primeiro (é a Fase 1 do roteiro do Totem). RLS sem o claim não funciona.

---

## 2. Migration — schema do Marco 2

> Aplicar **no banco de teste primeiro** via `supabase-guardian`. Idempotente onde possível.

```sql
-- ========= CLIENTES =========
create table if not exists clientes (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references oficinas(id),
  tipo          text not null check (tipo in ('particular','seguradora')),
  nome_razao    text not null,
  cpf_cnpj      text,
  email         text,
  telefone      text,
  endereco      jsonb,
  criado_em     timestamptz not null default now(),
  unique (oficina_id, cpf_cnpj)
);

create table if not exists seguradora_perfil (
  cliente_id           uuid primary key references clientes(id) on delete cascade,
  oficina_id           uuid not null references oficinas(id),
  prazo_aprovacao_dias int,
  regras_franquia      jsonb,
  contato_regulador    text
);

-- ========= VEÍCULOS =========
create table if not exists veiculos (
  id               uuid primary key default gen_random_uuid(),
  oficina_id       uuid not null references oficinas(id),
  placa            text not null,
  marca            text, modelo text, versao text, ano int, cor text, chassi text,
  fipe_codigo      text,
  fipe_valor       numeric(12,2),
  fipe_consultado_em timestamptz,
  cliente_id       uuid references clientes(id),
  criado_em        timestamptz not null default now(),
  unique (oficina_id, placa)
);

-- ========= ORÇAMENTOS =========
create table if not exists orcamentos (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references oficinas(id),
  cliente_id    uuid references clientes(id),
  veiculo_id    uuid references veiculos(id),
  status        text not null default 'rascunho'
                check (status in ('rascunho','enviado','aprovado','recusado')),
  -- totais persistidos no save (fonte da verdade dos números do orçamento):
  valor_total   numeric(12,2) not null default 0,
  custo_total   numeric(12,2) not null default 0,
  lucro         numeric(12,2) not null default 0,
  margem_pct    numeric(5,2)  not null default 0,
  os_id         uuid references ordens_servico(id),  -- preenchido na aprovação
  criado_em     timestamptz not null default now(),
  aprovado_em   timestamptz
);

create table if not exists orcamento_itens (
  id            uuid primary key default gen_random_uuid(),
  oficina_id    uuid not null references oficinas(id),
  orcamento_id  uuid not null references orcamentos(id) on delete cascade,
  tipo          text not null check (tipo in ('peca','mao_de_obra','insumo')),
  descricao     text not null,
  qtd           numeric(12,3) not null default 1,
  custo_unit    numeric(12,2) not null default 0,
  preco_unit    numeric(12,2) not null default 0,
  produto_id    uuid,  -- link futuro ao estoque (Marco 4)
  -- subtotais derivados, calculados pelo banco:
  subtotal      numeric(12,2) generated always as (qtd * preco_unit) stored,
  custo_subtotal numeric(12,2) generated always as (qtd * custo_unit) stored
);

create index if not exists idx_itens_orcamento on orcamento_itens(orcamento_id);
create index if not exists idx_orcamentos_oficina on orcamentos(oficina_id);
```

### RLS (multi-tenant) — aplicar a TODAS as tabelas acima

```sql
alter table clientes           enable row level security;
alter table seguradora_perfil  enable row level security;
alter table veiculos           enable row level security;
alter table orcamentos         enable row level security;
alter table orcamento_itens    enable row level security;

-- padrão repetido por tabela (exemplo: clientes)
create policy tenant_select on clientes for select
  using (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);
create policy tenant_insert on clientes for insert
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);
create policy tenant_update on clientes for update
  using (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid)
  with check (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);
create policy tenant_delete on clientes for delete
  using (oficina_id = (auth.jwt() ->> 'oficina_id')::uuid);
-- repetir o mesmo bloco para seguradora_perfil, veiculos, orcamentos, orcamento_itens
```

---

## 3. Lógica da margem ao vivo (o coração)

**Fórmulas:**
```
subtotal_item   = qtd * preco_unit
custo_item      = qtd * custo_unit
valor_total     = Σ subtotal_item
custo_total     = Σ custo_item
lucro           = valor_total - custo_total
margem_pct      = lucro / valor_total * 100   (0 se valor_total = 0)
markup_pct      = lucro / custo_total * 100    (opcional, p/ exibir)
```

**Onde calcular (regra clara para evitar divergência):**
- **No cliente (React), ao vivo:** a cada add/edit/remove de item, recalcular tudo em memória e atualizar a UI instantaneamente. É o efeito "margem aparecendo enquanto monto". *Não depende do banco.*
- **No banco, na verdade final:** `subtotal`/`custo_subtotal` por item são **generated columns** (não confiar na soma do cliente para persistir). Ao salvar o orçamento, recalcular os totais e gravar em `orcamentos` (via RPC/Edge Function ou recálculo no server action) — esses campos são a fonte da verdade dos números.
- **Para relatórios/financeiro:** view de conferência:

```sql
create or replace view v_orcamento_totais as
select o.id as orcamento_id, o.oficina_id,
       coalesce(sum(i.subtotal),0)        as valor_total,
       coalesce(sum(i.custo_subtotal),0)  as custo_total,
       coalesce(sum(i.subtotal),0) - coalesce(sum(i.custo_subtotal),0) as lucro
from orcamentos o left join orcamento_itens i on i.orcamento_id = o.id
group by o.id, o.oficina_id;
```

**Markup configurável:** guardar markup-padrão por tipo de item (em `oficinas.config` jsonb ou tabela `config_markup`) e usar para **sugerir** `preco_unit` a partir do `custo_unit` — o orçamentista ajusta e vê a margem reagir.

---

## 4. Promoção Orçamento → OS (sem digitação dupla)

Ao aprovar (`status = 'aprovado'`):

```sql
create or replace function aprovar_orcamento(p_orcamento uuid)
returns uuid language plpgsql security definer as $$
declare v_os uuid; v_of uuid; v_placa text;
begin
  select oficina_id into v_of from orcamentos where id = p_orcamento;
  if v_of <> (auth.jwt() ->> 'oficina_id')::uuid then
    raise exception 'cross-tenant';
  end if;

  select v.placa into v_placa
  from orcamentos o join veiculos v on v.id = o.veiculo_id
  where o.id = p_orcamento;

  -- reusa OS ativa da placa, ou cria
  select id into v_os from ordens_servico
   where oficina_id = v_of and placa = upper(v_placa)
     and status_geral = 'em_producao' limit 1;

  if v_os is null then
    insert into ordens_servico (oficina_id, placa, status_geral, etapa_atual, data_entrada)
    values (v_of, upper(v_placa), 'em_producao', 'desmontagem', now())
    returning id into v_os;
  end if;

  update ordens_servico set
     valor_orcamento = (select valor_total from orcamentos where id = p_orcamento),
     cliente_id = (select cliente_id from orcamentos where id = p_orcamento),
     veiculo_id = (select veiculo_id from orcamentos where id = p_orcamento)
   where id = v_os;

  update orcamentos set status='aprovado', aprovado_em=now(), os_id=v_os
   where id = p_orcamento;

  return v_os;
end $$;
```

> Resultado: o carro orçado aparece no **kanban do Totem** sem ninguém redigitar nada. Regra "uma OS ativa por placa" respeitada.

---

## 5. Integração Placa/FIPE

- **Server-side apenas** (a chave da API nunca no cliente). Criar uma **Edge Function / route handler** `GET /api/veiculo?placa=XXX`.
- Fluxo: digita placa → debounce → chama o endpoint → preenche marca/modelo/ano/versão + `fipe_valor` + `fipe_consultado_em`.
- Tratar: placa não encontrada, timeout, e **cache** (não consultar a mesma placa repetidamente — gravar em `veiculos`).
- Fornecedor a decidir (placa = serviço pago; FIPE = base pública/paga). Abstrair atrás de uma interface `VeiculoProvider` para poder trocar.

---

## 6. Telas (spec para o `painel-builder`)

**Tela A — Orçamento ao vivo** *(a estrela)*
- Layout 2 colunas: à esquerda, itens (tabela editável por tipo: peça / mão de obra / insumo); à direita, **painel de margem fixo (sticky)** com: Valor total · Custo total · **Lucro (R$)** · **Margem (%)** com cor (semáforo).
- Cada linha: descrição, qtd, custo unit, preço unit, subtotal, margem do item.
- Tudo recalcula **instantaneamente** ao digitar (sem salvar). Indicador visual quando margem cai abaixo de um piso configurável.
- Topo: cliente + veículo (busca por placa com auto-preenchimento FIPE).
- Ações: salvar rascunho · enviar · **aprovar** (chama `aprovar_orcamento`).

**Tela B — Clientes**
- Lista com filtro particular × seguradora; form de cadastro/edição; ao escolher "seguradora", revela campos do `seguradora_perfil`.

**Tela C — Veículo (embutida no orçamento)**
- Campo placa com estado: digitando → consultando → preenchido (mostra origem FIPE + data). Permite edição manual se a API falhar.

> Padrões: componentes tipados; reaproveitar o design system do Totem; desktop-first (orçamento é no balcão/PC, diferente do Totem que é tablet).

---

## 7. Definition of Done (gate do Marco 2)

- [ ] Migration aplicada em teste, RLS verificada (dois logins de oficinas distintas não se enxergam).
- [ ] Cadastro de cliente (particular e seguradora) e veículo por placa com FIPE funcionando.
- [ ] Orçamento com margem **recalculando ao vivo** ao adicionar/editar itens.
- [ ] Totais persistidos batem com a view `v_orcamento_totais`.
- [ ] Aprovar orçamento cria/atualiza a OS e ela **aparece no kanban do Totem** sem redigitação.
- [ ] `tsc` + build verdes (`qa`).
- [ ] **Gate de valor:** orçamentista monta um orçamento real mais rápido que no método atual e fecha vendo a margem.

> Só depois deste gate inicia-se o **Marco 3 (NFS-e via agregador)** — lembrando a data dura: pronto antes de **01/09/2026**.
