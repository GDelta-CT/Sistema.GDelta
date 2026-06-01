# GDelta — PRD (Product Requirements Document)
**Documento 2 de 6 · Versão 1.0 · Maio/2026**

> **Premissas herdadas do Doc 1 (valem aqui integralmente):** sem digitação dupla · substituição parcial e progressiva (não complemento puro) · honestidade de medição · escopo de fundador solo · premium, não paridade · fiscal sempre via agregador · um único modelo de dados multi-tenant (`oficina_id` + RLS) · **Totem é o módulo nº 1**.

---

## 1. Visão

O GDelta é o **sistema de gestão que entende de dinheiro** para oficinas de funilaria e pintura de pequeno e médio porte. Ele inverte a lógica do setor: em vez de ser um cadastro que guarda OS e emite nota, parte da **inteligência financeira** (que já é vendida hoje como o Dashboard Gestão GDelta) e constrói o operacional ao redor dela. Cada módulo entregue torna o GDelta a **fonte da verdade** daquele pedaço da operação — uma substituição módulo a módulo do sistema incumbente (Cília), apresentada ao mercado como uma camada que "funciona ao lado do que você já tem".

**Norte de produto:** o dono deve conseguir responder, a qualquer momento e sem planilha, "este carro está dando lucro ou prejuízo?" — e descobrir isso **enquanto ainda dá pra agir**, não no fechamento do mês.

---

## 2. O problema

A oficina de funilaria e pintura pequena/média opera no escuro financeiro e fiscal:

- **Orça no olho.** Sem cálculo de margem real, o orçamento sai por hábito ou por pressão da seguradora. O dono não sabe quais serviços dão lucro e quais drenam caixa.
- **Descobre tarde.** A saúde do mês só aparece quando o caixa aperta. Não há leitura de ponto de equilíbrio, aging de recebíveis ou fluxo projetado.
- **Chão de fábrica invisível.** Ninguém sabe, em tempo real, quem está produzindo, qual carro travou e há quanto tempo. Retrabalho e gargalo não são medidos.
- **Sistema que registra, não decide.** O Cília (incumbente, ~5000 oficinas) é um sistema de registro: guarda dados, mas não transforma em decisão.
- **Choque fiscal datado.** A partir de **1º/09/2026**, toda ME/EPP do Simples Nacional precisa emitir **NFS-e de padrão nacional** (Resolução CGSN nº 189/2026). Milhares de oficinas terão de mudar o fluxo fiscal — uma janela de troca.

---

## 3. Quem usa (personas)

**Dono / Gestor — "preciso saber se estou ganhando dinheiro".**
Decide preço, prazo e prioridade. Quer abrir uma tela e ver margem por carro, saúde de prazos e caixa. É o comprador. No piloto (Auto Risco), é a dona da oficina.
*Dor central:* falta de visibilidade financeira em tempo de agir.

**Orçamentista / Atendente — "preciso fechar rápido e sem errar a conta".**
Monta o orçamento, negocia com cliente/seguradora, abre a OS. Quer montar peça+mão de obra+insumo vendo a margem ao vivo, sem calculadora paralela.
*Dor central:* orçamento lento, manual e sem noção de lucro.

**Operário — "só quero apontar minha tarefa sem burocracia".**
Bate ponto e aponta produção no Totem (tablet no chão de fábrica). Identifica-se tocando no nome (sem PIN no piloto).
*Dor central:* qualquer fricção tira ele da produção.

**Financeiro / Administrativo — "preciso faturar e cobrar sem retrabalho".**
Emite nota, controla contas a pagar/receber, concilia. Quer que a nota saia do que já foi orçado/produzido, sem redigitar.
*Dor central:* digitação dupla e nota como processo separado.

> No piloto, esses papéis se concentram em uma ou duas pessoas (a dona + Eliel + 1). O sistema é desenhado para papéis, mas tolera acúmulo.

---

## 4. Os módulos

Para **cada módulo**, declaro: o que faz · por que importa · como difere do que existe · **fonte da verdade** (regra de ouro: sem digitação dupla).

### 4.1 GDelta Totem — chão de fábrica *(MÓDULO Nº 1)*
**O que faz:** tablet no chão de fábrica onde o operário bate ponto (2 batidas) e aponta tarefas por carro + etapa; painel web mostra produção em tempo real (4 estados do operário, kanban de 8 etapas, prazo e gargalo).
**Por que importa:** é o dado que **ninguém mais tem** — tempo trabalhado real, retrabalho, bloqueio. Sem ele, a inteligência financeira opera com estimativa; com ele, opera com fato. É também a prova de adoção mais barata de construir e a que mais encanta numa demo.
**Como difere:** o Cília não tem módulo de chão de fábrica. O Totem mostra produção **ao vivo**, não relatório no fim do dia.
**Fonte da verdade:** **GDelta.** Apontamento, ponto (como produtividade, não folha), tempos (ancorados no relógio do servidor) e estados do operário nascem aqui. Nada vem do Cília.

### 4.2 Clientes — seguradoras e particulares
**O que faz:** cadastro de clientes pessoa física e jurídica, com distinção entre **particular** e **seguradora** (que tem regras de aprovação, prazo e tabela próprias).
**Por que importa:** é a base de orçamento, OS, nota e do ranking de clientes do financeiro. Seguradora x particular muda margem e fluxo de caixa.
**Como difere:** tratar seguradora como entidade de primeira classe (com seu fluxo de aprovação) em vez de "mais um cliente".
**Fonte da verdade:** **GDelta.**

### 4.3 Veículo por placa + FIPE
**O que faz:** ao digitar a placa, o sistema busca dados do veículo (marca, modelo, ano, versão) e o valor **FIPE**, pré-preenchendo o cadastro e ancorando a busca de peças.
**Por que importa:** elimina digitação manual, reduz erro e acelera o orçamento. FIPE dá contexto de valor para decisão (carro de R$ 200 mil ≠ popular).
**Como difere:** cadastro por placa com enriquecimento automático, integrado ao orçamento e à busca de peças — não um campo de texto solto.
**Fonte da verdade:** **GDelta** (o cadastro do veículo), **enriquecido por API externa** de placa/FIPE (consulta, não digitação dupla).

### 4.4 Orçamento ao vivo
**O que faz:** monta orçamento com **peças + mão de obra + insumos**, exibindo **lucro e margem em tempo real** enquanto se adiciona cada item. Gera o documento para o cliente/seguradora e, aprovado, vira OS.
**Por que importa:** é o **coração premium** do produto e um dos 3 pontos que doem. Orçar vendo a margem muda o comportamento do dono na hora — ele para de vender no prejuízo.
**Como difere:** "melhor que a plataforma WM" — onde o WM monta orçamento, o GDelta monta **com o lucro aparecendo ao vivo**. A margem não é um relatório posterior; é parte da decisão de orçar.
**Fonte da verdade:** **GDelta.** O orçamento nasce aqui e alimenta OS, nota e financeiro — sem redigitação.

### 4.5 Pátio / Ordem de Serviço
**O que faz:** transforma o orçamento aprovado em OS e acompanha o carro do recebimento à entrega, integrando-se ao kanban do Totem. Uma OS **ativa** por placa (placa normalizada em maiúsculas, busca-antes-de-criar).
**Por que importa:** é a espinha que liga orçamento → produção → faturamento. Sem OS unificada, cada módulo vira ilha.
**Como difere:** a OS conversa com o chão de fábrica em tempo real (via Totem) — `etapa_atual` (kanban) ≠ `status_geral` (ciclo de vida).
**Fonte da verdade:** **GDelta.**

### 4.6 Estoque inteligente
**O que faz:** controla **peças de reposição + matéria-prima operacional** (tintas, verniz, primer, lixa, fita, thinner) **+ material de escritório**, com **baixa vinculada à OS** (consumiu na OS, baixou do estoque).
**Por que importa:** matéria-prima é custo invisível que corrói margem. Vincular baixa à OS fecha o cálculo de markup real por peça e serviço.
**Como difere:** estoque não como inventário isolado, mas **acoplado à OS e ao custo real** — o consumo de tinta de um serviço entra na margem daquele serviço.
**Fonte da verdade:** **GDelta.**

### 4.7 Emissão de nota — NFS-e e NF-e (via agregador)
**O que faz:** emite **NFS-e** (serviço) e **NF-e** (peças) a partir do que já foi orçado/produzido, **através de um agregador fiscal** (PlugNotas/Tecnospeed, Focus NFe, Nuvem Fiscal ou eNotas).
**Por que importa:** é o **gancho de adoção** da janela 01/09/2026 e o que fecha o ciclo do dado fiscal dentro do GDelta (libertando a inteligência financeira da dependência de exportar do Cília).
**Como difere:** nota **embutida no fluxo** (sai da OS, sem redigitar), não um sistema fiscal à parte. E **sem passivo de conformidade** para o fundador: o agregador abstrai layouts municipais, certificado A1 e os campos da reforma tributária (IBS/CBS).
**Fonte da verdade:** **GDelta registra** os dados da nota; o **agregador transmite e mantém conformidade**. O GDelta nunca implementa conformidade fiscal própria.

### 4.8 Financeiro (herda a inteligência da planilha)
**O que faz:** traz para dentro do sistema a inteligência que já vendo: **DRE, ponto de equilíbrio, aging de recebíveis, fluxo de caixa, markup real por peça, semáforo estratégico, ranking de clientes, funil de produção**.
**Por que importa:** é o **diferencial-mãe** do GDelta — o motivo de a marca existir. Quando alimentado por dados reais (orçamento + produção do Totem + nota + estoque), deixa de ser planilha estimada e vira leitura viva do negócio.
**Como difere:** nenhum concorrente do setor entrega inteligência financeira nesse nível; o Cília registra, não interpreta. Aqui mora a promessa "te mostro se valeu a pena enquanto dá pra mudar".
**Fonte da verdade:** **GDelta** — derivado automaticamente de orçamento, OS, Totem, estoque e nota. Zero digitação manual; é cálculo sobre dado que já existe.

---

## 5. Como o Totem se encaixa (e por que é o nº 1)

O Totem é a **camada de produção** do GDelta e o **primeiro módulo a ser provado**. Três razões:

1. **Já está em código** — é a frente mais madura; capitalizar nela respeita o foco solo (não construir duas frentes em paralelo).
2. **Gera o dado que mais vale e que ninguém tem** — tempo real de produção, retrabalho e gargalo, que depois abastece Pátio/OS e Financeiro.
3. **Prova adoção barato** — o critério de sucesso do piloto (o dono abre o painel sozinho ≥1×/dia por 2 semanas e diz que pagaria) valida o GDelta **antes** de qualquer investimento nos demais módulos.

Tecnicamente, Totem e sistema **não são dois bancos**: compartilham o mesmo schema multi-tenant no Supabase (`oficina_id` + RLS). Quando os módulos de gestão chegarem, eles leem e escrevem no **mesmo** modelo de dados — o apontamento do operário e o cálculo de margem do dono vivem na mesma fonte da verdade.

---

## 6. Não-objetivos (o que o GDelta NÃO é, por ora)

- Não é um ERP de paridade com o Cília — não persegue feature-a-feature.
- Não implementa conformidade fiscal própria — isso é do agregador.
- Não faz folha/CLT — o ponto é produtividade, não espelho de ponto (isso é do contador do cliente).
- Não promete ganho "antes × depois" não medido — só mede depois de instalado.
- Não constrói dois produtos em paralelo — Totem primeiro, resto sequenciado.

---

## 7. Riscos e premissas a validar

- **Integração com o Cília (a validar):** a estratégia "lê do Cília o que ainda não cobrimos" pressupõe que o Cília exponha API/exportação. Se não expuser, a transição de dados de módulos ainda não cobertos será por importação manual pontual (CSV/planilha) — **nunca** digitação dupla recorrente. *Ação: confirmar o que o Cília permite exportar.*
- **Escolha do agregador fiscal (a decidir no Doc 4):** custo por nota, cobertura municipal de NFS-e, suporte a NF-e e prontidão para IBS/CBS variam entre PlugNotas/Tecnospeed, Focus NFe, Nuvem Fiscal e eNotas.
- **API de placa/FIPE:** definir fornecedor (FIPE tem fontes públicas e pagas; placa costuma ser serviço pago).
- **Concentração de papéis no piloto** pode mascarar necessidades de permissão que aparecem só com equipe maior.

---

### Fonte (regra fiscal)
- [Receita Federal — NFS-e de padrão nacional obrigatória para o Simples Nacional (abr/2026)](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/nfs-e-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional)
