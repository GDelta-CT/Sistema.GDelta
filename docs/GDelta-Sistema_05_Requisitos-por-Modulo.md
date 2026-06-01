# GDelta — Requisitos por Módulo
**Documento 5 de 6 · Versão 1.0 · Maio/2026**

> **Premissas (Doc 1):** sem digitação dupla · fonte da verdade declarada por módulo · banco único multi-tenant `oficina_id` + RLS no Supabase · fiscal via agregador · Totem é o nº 1 e compartilha o mesmo schema.
> Nível: o suficiente para orientar a construção em código (entidades, campos-chave, regras, integrações). Não é DDL final — é o contrato do módulo.

---

## 0. Fundação multi-tenant (transversal a todos os módulos)

**Entidades:**
- `oficinas` — `id`, `nome`, `cnpj`, `regime_tributario` (default `simples`), `municipio`, `uf`, `certificado_status`, `criada_em`.
- `usuarios` — `id`, `oficina_id`, `nome`, `email`, `role` (`dono` | `gerente`), `auth_uid` (Supabase Auth).
- `funcionarios` — `id`, `oficina_id`, `nome`, `ativo`. (Operário: identificação por toque, **sem login** no piloto — não é usuário do banco.)

**Regras:**
- **Toda** tabela de negócio tem `oficina_id NOT NULL`. RLS filtra por `auth.jwt() ->> 'oficina_id'`.
- `oficina_id` entra no JWT via custom claim / access token hook (pré-requisito de qualquer RLS — Doc do Totem).
- Device do Totem autentica a **oficina** (sessão persistente); operário só se identifica.
- Migrations versionadas/idempotentes; nunca aplicar direto na produção (teste → backup → produção → verificar).

**Integrações:** Supabase Auth.
**Fonte da verdade:** GDelta.

---

## 1. GDelta Totem — chão de fábrica *(nº 1)*

**Entidades:**
- `ordens_servico` (OS) — `id`, `oficina_id`, `placa` (UPPER, normalizada), `cliente_id` (nullable no MVP), `veiculo_id` (nullable no MVP), `etapa_atual` (enum kanban), `status_geral` (`em_producao` | `entregue` | `cancelada` | ...), `valor_orcamento` (nullable até Fase 1), `data_entrada`, `prazo_entrega`, `criada_em`.
- `pontos` — `id`, `oficina_id`, `funcionario_id`, `tipo` (`entrada` | `saida`), `timestamp_servidor`.
- `apontamentos` — `id`, `oficina_id`, `funcionario_id`, `os_id`, `etapa`, `iniciado_em`, `encerrado_em` (null = ativo), `retrabalho` (bool), `complexidade` (`simples` default | `media` | `alta`), `duracao_trabalhada` (derivada).
- `bloqueios` — `id`, `oficina_id`, `os_id`, `motivo` (`aguardando_peca` | `aguardando_aprovacao` | `em_outro_setor` | `aguardando_cura`), `tipo` (`problema` | `fluxo`), `aberto_em`, `resolvido_em`.

**Regras:**
- Kanban 8 etapas: Desmontagem · Funilaria · Preparação · Pintura · Polimento · Montagem · Qualidade · Entrega. ("Orçamento" fica fora — pré-produção.)
- **Um apontamento ativo por operário** (iniciar outro encerra/pausa o atual).
- `etapa_atual` setada quando o operário **inicia** tarefa naquela etapa. `etapa_atual` ≠ `status_geral`.
- Tempos ancorados no **relógio do servidor**, nunca do tablet. **Teto anti-fantasma ~10,5h** → vira anomalia para o gerente corrigir.
- Ponto = produtividade (2 batidas), **não folha**. Presença libera apontamento.
- Uma OS **ativa** por placa (índice único parcial); buscar-antes-de-criar.
- **4 estados do operário** (derivados): produzindo · em pausa (com motivo) · presente sem tarefa · ausente.
- Admin/gerente corrige anomalias (editar tempo, fechar fantasma, mover card).

**Integrações:** Supabase Realtime (kanban + estados ao vivo).
**Fonte da verdade:** GDelta.

---

## 2. Clientes

**Entidades:**
- `clientes` — `id`, `oficina_id`, `tipo` (`particular` | `seguradora`), `nome_razao`, `cpf_cnpj`, `email`, `telefone`, `endereco` (json), `criado_em`.
- `seguradora_perfil` (1:1 quando `tipo=seguradora`) — `cliente_id`, `tabela_mao_obra` (ref), `prazo_aprovacao_dias`, `regras_franquia` (json), `contato_regulador`.

**Regras:**
- Seguradora é entidade de 1ª classe (fluxo de aprovação, prazo e tabela próprios).
- `cpf_cnpj` único por oficina; validar dígito.
- Cliente alimenta orçamento, OS, nota e ranking do financeiro.

**Integrações:** (opcional) consulta CNPJ pública para pré-preencher PJ.
**Fonte da verdade:** GDelta.

---

## 3. Veículo por placa + FIPE

**Entidades:**
- `veiculos` — `id`, `oficina_id`, `placa` (UPPER, única por oficina), `marca`, `modelo`, `versao`, `ano`, `cor`, `chassi`, `fipe_codigo`, `fipe_valor`, `fipe_consultado_em`, `cliente_id`.

**Regras:**
- Ao digitar placa → consulta API enriquece marca/modelo/ano/versão + FIPE (consulta, **não digitação dupla**).
- Placa normalizada em maiúsculas; aceitar formatos antigo e Mercosul.
- FIPE armazenado com data de consulta (valor é referência, não verdade eterna).

**Integrações:** API de placa (serviço pago) + API/base FIPE. *A escolher (ver riscos do PRD).*
**Fonte da verdade:** GDelta (cadastro), enriquecido por API externa.

---

## 4. Orçamento ao vivo

**Entidades:**
- `orcamentos` — `id`, `oficina_id`, `cliente_id`, `veiculo_id`, `status` (`rascunho` | `enviado` | `aprovado` | `recusado`), `valor_total`, `custo_total`, `lucro`, `margem_pct` (derivados), `criado_em`, `aprovado_em`.
- `orcamento_itens` — `id`, `orcamento_id`, `tipo` (`peca` | `mao_de_obra` | `insumo`), `descricao`, `qtd`, `custo_unit`, `preco_unit`, `produto_id` (link estoque, nullable), `subtotal`, `margem_item` (derivada).

**Regras (o coração premium):**
- **Margem e lucro recalculados ao vivo** a cada item adicionado/editado: `lucro = Σ(preco) − Σ(custo)`; `margem_pct = lucro / Σ(preco)`.
- Markup configurável por tipo de item; insumo pode puxar custo do estoque (Fase 3).
- Orçamento **aprovado promove a OS** (gera/atualiza `ordens_servico` com `valor_orcamento`, `cliente_id`, `veiculo_id`) — sem redigitar.
- Versionamento do orçamento (histórico de alterações antes da aprovação).

**Integrações:** Estoque (custo de peça/insumo, Fase 3); Pátio/OS.
**Fonte da verdade:** GDelta.

---

## 5. Pátio / Ordem de Serviço

**Entidades:** estende `ordens_servico` (seção 1) com `orcamento_id`, `valor_aprovado`, `data_aprovacao`, `data_entrega_real`.

**Regras:**
- OS é a espinha: orçamento aprovado → OS → produção (Totem) → nota → financeiro.
- `status_geral` (ciclo de vida) ≠ `etapa_atual` (kanban do Totem).
- Métrica de pátio: **dias na oficina × R$ do orçamento** (revela barato-lento × caro-rápido).
- Uma OS ativa por placa (regra herdada do Totem).

**Integrações:** Totem (etapa/tempo), Orçamento, Nota, Financeiro.
**Fonte da verdade:** GDelta.

---

## 6. Estoque inteligente

**Entidades:**
- `produtos` — `id`, `oficina_id`, `categoria` (`peca` | `materia_prima` | `escritorio`), `nome`, `unidade`, `custo_medio`, `saldo`, `estoque_minimo`.
- `estoque_movimentos` — `id`, `oficina_id`, `produto_id`, `tipo` (`entrada` | `saida` | `ajuste`), `qtd`, `os_id` (quando saída vinculada à OS), `custo_unit`, `data`.

**Regras:**
- **Baixa vinculada à OS:** consumo lançado na OS baixa do estoque e entra no **custo real** daquela OS → alimenta markup real.
- Custo médio recalculado a cada entrada.
- Alerta de `estoque_minimo`.
- Matéria-prima (tinta, verniz, primer, lixa, fita, thinner) tratada como custo de serviço, não só inventário.

**Integrações:** OS, Orçamento (custo de insumo), Financeiro (markup real).
**Fonte da verdade:** GDelta.

---

## 7. Emissão de nota — NFS-e e NF-e (via agregador)

**Entidades:**
- `notas_fiscais` — `id`, `oficina_id`, `os_id`, `tipo` (`nfse` | `nfe`), `agregador_id` (id externo), `status` (`pendente` | `autorizada` | `rejeitada` | `cancelada`), `numero`, `chave`, `xml_url`, `pdf_url`, `valor`, `emitida_em`, `retorno` (json).

**Regras:**
- Emitir nota = **chamada ao agregador** a partir da OS (sem redigitar dados de cliente/itens).
- GDelta **registra**; agregador **transmite e mantém conformidade** (layouts municipais, certificado A1, IBS/CBS).
- Tratar callbacks/assíncrono do agregador (autorização não é instantânea).
- Nunca implementar conformidade fiscal própria.
- NFS-e = serviço (mão de obra); NF-e = peças.

**Integrações:** **agregador fiscal** (Focus NFe recomendado; alternativas Nuvem Fiscal / PlugNotas — validar 2 em homologação, ver Doc 4). Certificado A1 da oficina gerenciado pelo agregador.
**Fonte da verdade:** GDelta registra; agregador é a autoridade fiscal.

---

## 8. Financeiro (herda a inteligência da planilha)

**Natureza:** módulo majoritariamente **derivado** — calcula sobre orçamento + OS + Totem + estoque + nota. **Zero digitação manual** (exceto lançamentos avulsos de despesa/receita não ligados a OS).

**Entidades de apoio:**
- `lancamentos_financeiros` — `id`, `oficina_id`, `tipo` (`receita` | `despesa`), `origem` (`nota` | `os` | `manual`), `os_id` (nullable), `valor`, `vencimento`, `pago_em`, `categoria`.

**Indicadores (derivados — herdados do Dashboard):**
- **DRE** (receita − custos diretos − despesas).
- **Ponto de equilíbrio** (custos fixos / margem de contribuição).
- **Aging de recebíveis** (faixas de vencimento).
- **Fluxo de caixa** (realizado + projetado por vencimentos).
- **Markup real por peça/serviço** (preço vs custo real do estoque baixado na OS).
- **Semáforo estratégico** (regras de cor sobre margem/prazo/caixa).
- **Ranking de clientes** (rentabilidade por cliente/seguradora).
- **Funil de produção** (OS por etapa × valor).

**Regras:**
- Honestidade: só mede **depois de instalado**; retrabalho auto-reportado é **piso**, não exato. Nada de "antes × depois" não medido.
- Recebíveis nascem da nota/OS; despesas de estoque nascem dos movimentos — sem redigitar.

**Integrações:** todos os módulos anteriores.
**Fonte da verdade:** GDelta (derivado).

---

## Matriz fonte da verdade × digitação dupla (resumo)

| Módulo | Fonte da verdade | Entrada externa permitida |
|--------|------------------|---------------------------|
| Fundação / Totem / Clientes / Orçamento / OS / Estoque / Financeiro | **GDelta** | Nenhuma digitação dupla |
| Veículo | GDelta | **Consulta** API placa/FIPE (enriquece) |
| Nota fiscal | GDelta registra | **Agregador** transmite/conforma |

> O **Doc 6 (Roadmap)** dá a ordem de construção destes módulos dentro das fases, encaixando no roteiro do Totem que já existe.
