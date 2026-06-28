# BRIEF DE INTEGRAÇÃO — Módulo Peças do GDelta (Marketplace Unificado)

> **Síntese** de três análises (Arquiteto + Mapa de Dados + Negócio) num plano único, realista para **fundador SOLO**, MVP primeiro.
> READ-ONLY respeitado: nenhum código de app escrito, nada rodado, nenhum `.env` lido. Tudo aqui é **planejamento/arquitetura**.
> **FATO** = verificável no repo/schema citado. **INFERÊNCIA** = decisão de arquitetura/leitura interpretativa.
> Data: 2026-06-27.

---

## 1. Tese

O **Módulo Peças** é um **marketplace unificado dentro da OS**: a oficina (lado-demanda) compara e compra peça **sem sair do orçamento**, escolhendo entre **usada** (desmanche, blueprint JAE: listagem avulsa + % conservação + foto) e **nova** (loja, catálogo/SKU + marca/qualidade + estoque), por **preço × prazo de chegada × garantia × origem**. Isso **mata o "aguardando peça"** — o gargalo nº1 de prazo — ao transformar a linha de peça da OS num **pedido com previsão de chegada** que alimenta o painel ("carro parado até dia X", não "bloqueado há N dias"). O lado-suprimento (desmanches + lojas) é a **resposta de OFERTA ao euBati** (que é de demanda), criando um **moat de rede de 2 lados** — defensável não por "ter cotação" (o Sigma já tem leilão reverso vinculado ao orçamento — **não é oceano azul**), mas por **usado × novo lado a lado + margem ao vivo no mesmo ato de compra**.

---

## 2. Abordagem recomendada: **A — Módulo NATIVO no GDelta** (Next/Supabase), schema `market` cross-tenant

As três análises **convergem em A** com confiança ALTA. As alternativas:

| | **A — Nativo no GDelta** | **B — JAE como serviço separado** | **C — Híbrido** |
|---|---|---|---|
| Stack p/ SOLO manter | **1** (Next/Supabase) | **2** (Nest/Prisma + Next/Supabase) | **2** |
| Auth | reusa hook JWT existente | ponte Supabase↔Nest (2 identidades) | ponte + nativo |
| Premissa 7 ("um único modelo de dados") | respeita | viola (2 bancos) | viola |
| Comparação usado×novo na OS | JOIN local, 1 formato | agregador de 2 fontes heterogêneas | pior: 2 formatos a unificar |
| Reuso do código JAE | só blueprint | reuso real (usado) | reuso parcial |
| Dívida de segurança JAE (CORS `*`, sem testes) | **não herda** | herda | herda parcial |

**Justificativa (o eixo que decide):** o conflito-mestre é **"RLS single-tenant fechada do GDelta" × "marketplace é cross-tenant por natureza"**. B e C "resolvem" isolando num 2º stack — mas isso **falha na restrição não-negociável SOLO**: 2 stacks + ponte de auth + 2 bancos é **custo recorrente** de manutenção. O reuso de código do JAE é uma **economia única** de construção; a economia única **não paga** o custo recorrente para um fundador só. A é a **única** que entrega a "comparação usado×novo" simples (mesmo banco, mesmo formato) e fecha o loop com a **margem ao vivo** sem chamada de rede no caminho crítico.

**Trade-offs aceitos conscientemente (o que se paga ao escolher A):**
1. **Desenhar um 2º padrão de RLS** (visibilidade pública-por-status, não por tenant) convivendo com o `oficina_id` existente. É o **elo mais fraco** do módulo → teste de vazamento vira gate obrigatório (F1).
2. **Moderação/qualidade do catálogo** vira trabalho do fundador SOLO (curadoria manual no MVP pequeno).
3. **JAE é blueprint, não código** — entidades, máquina de estados de oferta, geo e comprovante manual transplantados para Supabase; **nada de Nest/Prisma operado**.

---

## 3. Mapa de dados (esboço conceitual — NÃO é migration)

### 3.1 Os 3 papéis no multi-tenant (o ponto mais delicado)

`auth.users` (Supabase Auth, existente) sustenta dois eixos de tenancy:

- **OFICINA = comprador** = tenant **existente**. `user_oficinas` → hook carimba `oficina_id`+`user_role` no JWT (**FATO**, migration `0001:78-82`). Vira compradora **sem fricção**: não recadastra, não troca de app/login — ganha uma capability.
- **FORNECEDOR = suprimento** = tenant **novo** (`market.fornecedores`), com discriminador `tipo IN ('desmanche','loja')`. **NÃO** é uma `oficina` (semântica/billing/RLS diferentes). `market.user_fornecedores` espelha `user_oficinas`.
- **Claim estendido**: o `custom_access_token_hook` passa a carimbar também `fornecedor_id` + `market_papel` quando o user for fornecedor — **server-side, o cliente nunca escolhe** (mesma garantia do `oficina_id` hoje). É a "porta antes da fechadura": **claim ANTES de RLS**.

### 3.2 Tabelas novas (schema `market` isolado)

| Tabela | Papel | Origem |
|---|---|---|
| `market.fornecedores` | tenant de suprimento (tipo desmanche/loja, geo lat/lng/raio, status) | geo = blueprint `ScrapDealerUser` JAE |
| `market.user_fornecedores` | vínculo user→fornecedor + papel | espelha `user_oficinas` |
| `market.peca_categorias` + `market.peca_tipos` | **taxonomia GLOBAL de painel** (LANTERNAGEM→Capô, Para-lama, Porta DD/TE, Painel Traseiro…) | **reuso 1:1** de `CategoryTemplate`/`PartTemplate` + **o seed inteiro** do JAE |
| `market.produto_oferta` | **oferta unificada** `condicao IN ('usada','nova')` (discriminador) | usada=`ScrapPartListing`; nova=greenfield |
| `market.produto_oferta_fotos` | fotos (Supabase Storage, **não** Cloudinary) | espelha `ScrapPartPhoto` |
| `market.pedido_peca` | **a compra** (ponte oficina↔oferta↔OS) | espelha `ScrapPartOffer`+`receiptUrl` |
| `market.v_ofertas_comparaveis` | view UNION usado∪novo normalizada p/ a tela da OS | desenho novo (coração da visão) |

**Oferta unificada `produto_oferta`** — campos comuns: `fornecedor_id`, `condicao`, `peca_tipo_id`, compatibilidade de veículo (`veiculo_marca/modelo/ano`, `anos_compativeis[]`, `modelos_compativeis[]`, **`fipe_codigo`** como chave forte — o GDelta já tem FIPE em `veiculos`), `preco`, `prazo_entrega_dias`, `garantia_dias`, `status`. Bloco **USADA**: `conservacao_pct`, `conservacao_grau` (PERFECT/REASONABLE/DAMAGED), qtd sempre 1. Bloco **NOVA** (greenfield, não existe no JAE): `sku`, `marca_peca`, `qualidade IN ('genuina','original','paralela')`, `estoque_qtd`. CHECK condicional por `condicao`.

> **Dado sensível fica fechado**: `custo_aquisicao`/`preco_minimo` (do JAE `acquisitionCost`/`minimumSalePrice`) **nunca** entram na leitura pública — só o fornecedor-dono vê. O comprador vê preço/prazo/garantia/condição, **nunca a margem do fornecedor**.

### 3.3 Os 3 padrões de RLS que convivem (resolve a tensão central)

| Tabela | Visibilidade | Política (em prosa) |
|---|---|---|
| Tabelas `public.*` (oficina) | single-tenant **fechada** (já é) | `oficina_id = claim` — inalterado |
| `market.fornecedores` / `user_fornecedores` | self-tenant de suprimento | dono só vê/edita a própria empresa (`= claim.fornecedor_id`) |
| `market.peca_categorias` / `peca_tipos` | **catálogo de plataforma** | SELECT liberado a todo `authenticated`; escrita só admin/service-role (faz oficina e loja falarem a **mesma língua de peça**) |
| `market.produto_oferta` (+ fotos) | **leitura PÚBLICA-por-status** | **SELECT:** `status='disponivel'` p/ qualquer `authenticated` (é o que torna cross-tenant). **INSERT/UPDATE/DELETE:** só `fornecedor_id = claim` |
| `market.pedido_peca` | **dupla-ponta** (objeto mais delicado) | visível ao comprador (`oficina_id=claim`) **E** ao fornecedor-dono (`fornecedor_id=claim`); comprador cria, fornecedor muda status |

**A inversão crucial:** nas tabelas de suprimento a RLS de leitura é o **oposto** do padrão GDelta — por isso vivem num **schema `market` separado**: deixa óbvio que ali a regra é por **status de publicação** + **propriedade de escrita**, não por tenant, impedindo cópia errada do padrão `oficina_id`.

### 3.4 Link OS → peça (o valor real, evolução ADITIVA)

**FATO do estado atual:** a demanda é texto solto — `orcamento_itens(tipo='peca', descricao varchar(200))` com `margem` como **coluna gerada** (a "margem ao vivo", `0005:42`); orçamento liga a `cliente_id`+`veiculo_id`, e o veículo já carrega `placa`/`fipe_codigo`/`marca`/`modelo`/`ano` (`0004`). **A matéria-prima de compatibilidade já existe — só não está conectada à linha de peça.**

Aditivo (não quebra o existente):
```
alter orcamento_itens
  add peca_tipo_id      uuid → market.peca_tipos       -- estrutura a "descricao"
  add origem_peca       text  check (estoque|comprar_usada|comprar_nova|definir)
  add produto_oferta_id uuid → market.produto_oferta   -- a oferta ESCOLHIDA
```
A compra cria `market.pedido_peca` (oficina_id, fornecedor_id, produto_oferta_id, **os_comercial_id**, **orcamento_item_id**, preco_acordado, status `solicitado→aceito→pago→separado→enviado→entregue`, comprovante_url, **prazo_previsto**) e injeta/atualiza o item do orçamento com `custo_unitario` real → **a margem ao vivo recalcula sozinha** (fecha o loop com o diferencial nº1).

> **Conflito a resolver no desenho (FATO):** itens de orçamento **aprovado** estão TRAVADOS por trigger (`1000:143-176` — "aprovado é contrato"). Gravar o custo real da peça comprada **não pode ser UPDATE na linha congelada** → usar coluna/tabela satélite (ex.: o próprio `pedido_peca` como fonte do custo realizado).

### 3.5 Taxonomia de dano/peça por painel (uma taxonomia, três consumidores)

**FATO decisivo:** o seed do JAE é literalmente vocabulário de funilaria (LANTERNAGEM → Capô, Para-lama D/E, Porta DD/TE, Porta-malas, Painel Traseiro, Fundão; TETO; MECÂNICA; PNEUS; RODAS). O GDelta só precisa do **template global** (2 tabelas), não da instância `Car→Category→Part` (descartada). Serve aos 3 usos: (a) dano por painel na OS → `orcamento_itens.peca_tipo_id`; (b) listagem usada → `produto_oferta.peca_tipo_id`; (c) catálogo novo → `produto_oferta.peca_tipo_id`. **É a chave de junção que casa demanda com oferta.**

---

## 4. Plano por fases (com critério de pronto)

**Posição no roadmap (INFERÊNCIA forte):** **DEPOIS do Marco 3 (NFS-e, deadline fiscal 01/09/2026)** — o módulo não compete com a "única data inegociável".
**Qual lado de suprimento começar (síntese da divergência):** começar pelo **lado-DEMANDA registrada** (oficina registra a compra que já faz por WhatsApp — captura o dado, mata o "aguardando peça cego", monta o lado-demanda do moat **sem depender de fornecedor cadastrado**). Quando popular **oferta de terceiro, começar pelo USADO/desmanche** (tem blueprint JAE pronto), mas **só com os fornecedores de confiança do próprio piloto** — nunca rede aberta. O lado NOVO/loja é o último (100% greenfield, mais escala de complexidade).

### F0 — MVP: matar o "aguardando peça cego" (lado-comprador puro)
*O menor pedaço que já dá valor — NÃO promete marketplace de comparação no dia 1.*
- **Passo 0 (antes de codar):** validar demanda — ≥1 oficina-piloto usaria comprar-da-OS E ≥2 fornecedores topam listar/responder. Sem liquidez dos 2 lados não há marketplace, só catálogo morto.
- **Taxonomia global** (`peca_categorias`+`peca_tipos`+seed JAE): barata, sem RLS complexa, destrava tudo.
- **Estruturar a demanda** (aditivo em `orcamento_itens`: `peca_tipo_id`, `origem_peca`) + a linha de peça vira **pedido com origem (nacional/importada/paralela/usada), fornecedor (texto livre), preço e PREVISÃO DE CHEGADA** que alimenta o bloqueio/painel.
- **Critério de PRONTO:** o painel mostra "carro X parado até dia 04/07 esperando para-choque" (data, não "bloqueado há N dias"); o tempo de "aguardando peça" **não penaliza o operário** (espera externa, fora da conta de produtividade); previsão é **editável com histórico** (importada/alfândega escorrega).

### F1 — 1º lado de suprimento real: USADO (desmanche, blueprint JAE)
- **Claim do fornecedor** (`fornecedores`+`user_fornecedores`+ hook injeta `fornecedor_id`/`market_papel`) — a porta antes da fechadura.
- **RLS de suprimento (passo de MAIOR risco):** schema `market`, `produto_oferta` com leitura pública-por-status + escrita por dono.
- **Lado usado:** `produto_oferta` (bloco USADA) + fotos (Supabase Storage) + máquina de estados; geo calcula distância.
- **Critério de PRONTO (gate de vazamento OBRIGATÓRIO):** fornecedor A não vê/edita oferta de B; oferta não-disponível some p/ todos menos o dono; **oficina NÃO vê custo/piso do fornecedor**; oficina vê todas as ofertas `disponivel`; desmanche publica peça com foto e %conservação que some quando vendida.

### F2 — 2º lado + pedido/pagamento: NOVO (loja) + compra completa
- **Lado novo (greenfield):** `produto_oferta` (bloco NOVA) com `sku`/`marca_peca`/`qualidade`/`estoque_qtd` (loja cadastra 1 produto com 2 qualidades → 2 ofertas distintas).
- **View de comparação + tela na OS** (`v_ofertas_comparaveis`): usado×novo lado a lado, ordenável por **preço/prazo/garantia**, filtrado por `fipe_codigo`/modelo/ano do carro da OS.
- **Compra (`pedido_peca` + RPC `comprar_peca`):** cria pedido, injeta `orcamento_itens` (respeitando a trava "aprovado é contrato"), **comprovante/registro manual** (sem gateway). Amarrar **origem ↔ aceitação da seguradora**. Tratar **peça recebida-mas-rejeitada** como evento que **re-abre o bloqueio com nova previsão**.
- **Critério de PRONTO:** comprar adiciona item ao orçamento com `custo_unitario` da oferta e a **margem ao vivo recalcula**; RPC idempotente; RLS dupla do `pedido_peca` passa no teste de vazamento; pedido errado re-abre bloqueio.

### F3 — Rede / escala
- **Hardening + PROD:** `force row level security` em todas as tabelas `market` (padrão `1500`), rollbacks, **smoke de vazamento multi-tenant em PROD**, OK explícito do fundador.
- **Escala de catálogo:** quando houver loja com >1k SKUs, separar `catalogo_produto` (SKU) de `catalogo_estoque` (saldo/preço) — **não** antes.
- **Cotação/RFQ + negociação** (a oficina pede, o fornecedor oferta — inversão do `Offer` JAE); gateway/escrow só na fase de monetização.
- **Critério de PRONTO:** liquidez real nos 2 lados na região do piloto; nenhuma oferta vaza custo; nenhuma oficina vê dado de outra.

---

## 5. Riscos e decisões do fundador

| # | Risco / Decisão | Recomendação da síntese |
|---|---|---|
| **R1** | **RLS cross-tenant mal escrita vaza dados** (maior risco técnico; é o elo mais fraco) | Schema `market` isolado; política explícita por papel; **teste de vazamento como gate** em F1 e F3; tratar a migration de RLS de suprimento como o artefato **mais revisado** do módulo (contra-review adversarial). |
| **R2** | **Marketplace vazio** (sem liquidez nenhum lado vê valor) | F0 valida 2 lados antes de codar; começar pela **rede regional do piloto** (beachhead), nunca rede aberta. |
| **R3** | **Distração do roadmap fiscal** (01/09/2026 inegociável) | Agendar o módulo **após o Marco 3**. |
| **R4** | **Não é oceano azul** (Sigma já faz cotação vinculada ao orçamento) | Vender o diferencial real: **usado×novo + prazo-de-chegada no painel + margem ao vivo + tempo que não penaliza o operário** — NÃO "ter cotação". |
| **R5** | **Qual fornecedor primeiro** | **Demanda registrada primeiro**; oferta real começa pelo **USADO/desmanche** (blueprint pronto) com fornecedores de confiança do piloto; **loja/novo por último**. |
| **R6** | **Pagamento** | NÃO transplantar o comprovante-a-comprovante do JAE direto: oficina compra **a prazo, com NF, em volume**. No MVP: pagamento é só **registro** (status pago/a-pagar + nº NF), **sem gateway**. Comprovante vira dívida explícita se houver volume. |
| **R7** | **Seguradora × peça usada/paralela** (decisão de negócio crítica) | A seguradora **escolhe a origem** (nega genuína em reparo econômico; exige paralela/usada). Amarrar `origem_peca` ↔ "origem aprovada pela seguradora" **desde cedo** — sem isso o "comparar livre" induz compra **glosada** (não reembolsada). Ligação direta com oficina-orcamentista-seguradora. |
| **R8** | **Peça errada/incompleta → re-pedido** | Modelo deve tratar "recebida mas rejeitada" como evento que **re-abre o bloqueio com nova previsão**, não fechar só porque "chegou". |
| **R9** | **Segurança do JAE a NÃO herdar** | NÃO trazer: CORS `*`, ValidationPipe sem whitelist, zero testes/hardening, gateway ausente como padrão definitivo. Herdar **só o modelo de dados** (entidades, estados, geo, taxonomia/seed). |

---

**Confiança global: ALTA** na decisão (A) e na estrutura dos 3 papéis; **MÉDIA** no detalhe fino da RLS leitura-pública-por-status (design novo no projeto → vira FATO só após o teste de vazamento de F1).

**Fontes-chave (grounding):** `supabase/migrations/0001` (claim hook, `:78-82`), `0002`/`0003` (RLS + `set_oficina_id_from_jwt`), `0005` (`orcamento_itens` tipo='peca' + margem gerada `:42`, ponto de injeção), `0004` (FIPE em veiculos), `1000:143-176` (trava "aprovado é contrato"), `1400` (estoque/livro-razão), `1500` (force RLS), `1700:44-56` (consumo por OS); `docs/design/orcamento-para-os-comercial.md` (RPC + costura assíncrona); `docs/GDelta-Sistema_01` premissas 4/7; `docs/GDelta-Sistema_05_Requisitos-por-Modulo.md` (bloqueios `aguardando_peca`); `docs/GDelta-Sistema_06_Roadmap.md` (deadline fiscal); `docs/research/sigma/sigma-pesquisa-mercado.md` (cotação já existe no Sigma); `jae-sucatas-ANALISE.md` + `jae.sucatas-main/prisma/schema.prisma` (ScrapPartListing `:351`, taxonomia `:123-167`, ScrapPartOffer/receiptUrl `:418-430`, geo `:333-349`, acquisitionCost/minimumSalePrice `:365-366`) + `seed-admin.ts:49-100` (taxonomia de painel).
