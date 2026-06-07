# Diretriz V3 — Arquitetura de Banco: Pátio, IEO, ROI e Gargalos

> Plano apresentado **antes** de qualquer migration (exigência do PDF "Diretrizes V3 §4.3").
> Decisões do fundador: (1) começar pelo schema do pátio; (2) **banco único compartilhado** Totem+Sistema.
> Princípio do PDF: só `ALTER`/novas tabelas, **nunca `DROP`** em produção. Apresentar o modelo antes de mexer em rotas.

## 0. Escopo e fronteira
- Eu construo o **Sistema** (inteligência). Eu **não edito o código do Totem**.
- A V3 é capturada no Totem e **exibida pelo Sistema**. As adições aqui são o schema que o Sistema precisa para IEO/ROI/Gargalos.

## 1. O nó do "banco único" (resolver 1ª)
Os dois apps hoje criam, no mesmo `public`, objetos de mesmo nome com corpo diferente:

| Objeto | Totem | Sistema | Conflito |
|---|---|---|---|
| `oficinas` | "gorda" (~35 colunas operacionais) | "magra" (11 colunas) | última migration vence; a outra app quebra |
| `custom_access_token_hook` | claim `oficina_role` | claim `user_role` | **só 1 hook ativo por projeto** |
| `user_oficinas`, `set_oficina_id_from_jwt()`, `set_atualizado_em()` | iguais (corpo compatível) | iguais | dupla propriedade → risco de drift |

**Isolamento RLS:** ✅ idêntico nos dois (`oficina_id = (auth.jwt()->>'oficina_id')::uuid`, `FOR ALL TO authenticated`, FORCE RLS). Coexistem sem problema.

### Resolução recomendada (sem tocar no Totem)
1. **Totem é o dono do núcleo tenant**: `oficinas` (superset gordo), `user_oficinas`, helpers. As migrations do Sistema passam a usar `CREATE TABLE IF NOT EXISTS` e `ADD COLUMN IF NOT EXISTS` para o núcleo — nunca recriam.
2. **Hook unificado**: o único hook registrado passa a emitir **ambos** os claims (`oficina_role` *e* `user_role`) — assim nem o Totem nem o Sistema quebram. (É a única mudança que afeta os dois apps → precisa de aprovação + teste explícito.)
3. **DB canônica**: escolher qual Supabase vira o compartilhado (recomendo a do Totem, que já tem o núcleo gordo + chão de fábrica). Como ainda **não há cliente/dado real**, fundir agora é o momento de menor risco.

## 2. A ponte: OS comercial ↔ OS de pátio
- Totem: `ordens_servico` (placa, etapa_atual, oficina_id, apontamentos com hora_inicio/hora_fim/tempo_pausado_seg).
- Sistema: `os_comercial` (orcamento_id, veiculo_id→`veiculos.placa`, numero, status). Já tem scaffold `os_ref` + `totem_sync_status` (não usado).
- **Sem FK hoje.** Chaves naturais comuns: `oficina_id` + **placa** (cuidado: `varchar(7)` Totem vs `varchar(8)` Sistema, normalizar `upper(trim())`).

**Plano (aditivo, zero código Totem):**
```sql
-- elo explícito no lado do Sistema (nullable; Totem intocado)
alter table public.os_comercial
  add column if not exists ordens_servico_id uuid references public.ordens_servico(id);
```
+ view-ponte `v_os_bridge` (security_invoker) casando `os_comercial`↔`ordens_servico` por `(oficina_id, upper(placa))` para resolver/backfill o FK.

## 3. Adições V3 (todas greenfield — confirmado por grep)

### Fase A — lado Sistema (aplica no TEST do Sistema agora; risco zero p/ Totem)
```sql
-- A1. campos comerciais/IEO/future-proof na OS comercial
alter table public.os_comercial
  add column if not exists meta_horas numeric(10,2),     -- tempo ORÇADO pela seguradora (base do IEO)
  add column if not exists integracao_payload jsonb;     -- future-proof Audatex/Cília (XML/JSON)

-- A2. consumo real de insumos (espelha o padrão estoque_movimentos)
create table if not exists public.os_insumos_consumidos (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  os_comercial_id uuid not null references public.os_comercial(id) on delete cascade,
  estoque_item_id uuid references public.estoque_itens(id) on delete set null,
  descricao varchar(200),
  nome_funcionario text,                    -- preparador/pintor (identidade denormalizada, igual Totem)
  quantidade numeric(14,3) not null check (quantidade > 0),
  custo_unitario numeric(14,2) not null default 0,
  custo_total numeric(16,2) generated always as (quantidade * custo_unitario) stored,
  criado_em timestamptz not null default now()
);

-- A3. auditoria da cabine/estufa (aplicação vs ciclo de cura)
create table if not exists public.os_auditoria_cabine (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  os_comercial_id uuid not null references public.os_comercial(id) on delete cascade,
  aplicacao_inicio timestamptz,
  cura_inicio timestamptz,
  cura_fim timestamptz,
  cura_minutos_padrao integer,              -- padrão esperado de cura
  observacao text,
  criado_em timestamptz not null default now()
);
```
+ para cada tabela nova: `before insert` → `set_oficina_id_from_jwt()`; `enable`+`force` RLS; policy `oficina_id = (auth.jwt()->>'oficina_id')::uuid`.
+ views (security_invoker): `v_insumo_estouro` (custo estimado do orçamento × consumido → alerta), `v_cabine_desperdicio` (cura real × padrão).

### Fase B — precisa da DB compartilhada (tabelas do Totem presentes)
```sql
-- B1. causa-raiz do retrabalho (coluna nova em apontamentos; Totem só escreve retrabalho/complexidade → segue funcionando)
alter table public.apontamentos
  add column if not exists motivo_retrabalho text
  check (motivo_retrabalho is null or motivo_retrabalho in ('Escorrido','Cisco','Tonalidade','Massa Mapeando'));
```
+ B2. `v_ieo_os` — IEO por OS: tempo REAL (`sum(hora_fim - hora_inicio) - tempo_pausado_seg` dos apontamentos da OS, via FK/ponte) × `meta_horas`.
+ B3. `v_retrabalho_causas` — gráfico de causa-raiz por equipe (agrupa apontamentos por `motivo_retrabalho`).
+ B4. flag "Orçamento Complementar Urgente" (origem desmontagem no Totem) → inbox no painel.

> Convenção: categóricos sempre `text/varchar + CHECK` (zero `enum` nativo, como todo o resto do código). PK `gen_random_uuid()`.

## 4. IEO e ROI (lógica)
- **IEO (por OS)** = `meta_horas` (orçado) − horas reais. >0 lucrativo (ganhou horas), <0 prejuízo. Surfar como medidor lucro/prejuízo.
- **ROI (card do gestor)** = `((Horas Salvas × R$85) − Custo Licença) / Custo Licença`. Horas Salvas = soma dos IEO positivos do período. (Card pode começar com entrada manual de horas salvas até o IEO fluir.)

## 5. Sequência e segurança
1. `0017` (Fase A) no **TEST do Sistema** → smoke test → rollback escrito.
2. Reconciliar núcleo tenant + hook unificado (aprovação explícita).
3. `0018` (Fase B) na **DB compartilhada** TEST → smoke.
4. Só PROD com OK explícito. Cada migration tem rollback em `supabase/rollbacks/`.

## 6. Maior risco
Objetos duplicados (`oficinas` + hook) na fusão. Mitigação: Totem dono do núcleo, Sistema aditivo `IF NOT EXISTS`, hook emite ambos os claims. **Nunca** `DROP` em PROD.
