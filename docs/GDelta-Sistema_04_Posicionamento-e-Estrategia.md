# GDelta — Posicionamento & Estratégia de Mercado
**Documento 4 de 6 · Versão 1.0 · Maio/2026**

> **Premissas herdadas (Doc 1):** sem digitação dupla · substituição módulo a módulo · honestidade de medição · escopo solo · premium, não paridade · fiscal via agregador · banco único multi-tenant · Totem é o nº 1.

---

## 1. A decisão "ao lado do Cília × substituir" — consolidada

**Decisão fixada: Rota C — "Cavalo de Troia".** Entrar como camada premium que **funciona ao lado do Cília** no discurso de mercado, sendo internamente uma **substituição módulo a módulo**: cada módulo entregue torna o GDelta a fonte da verdade daquele pedaço, e o Cília vai virando redundante até ser opcional.

Por que não as rotas puras:
- **Complemento eterno (A)** deixa o GDelta refém do Cília e com teto de receita baixo — incompatível com "disruptivo".
- **Substituto frontal (B)** é inviável para fundador solo bootstrapped: exige paridade de ERP, conformidade fiscal robusta, migração e confiança que levam anos.

A Rota C é a única que cabe no perfil **premium / dezenas de oficinas / solo + IA / bootstrapped**: ganha por profundidade, não por amplitude, e cresce sem nunca colocar o faturamento do cliente refém de um produto imaturo.

**Regra de comunicação:** externamente, nunca "substitua o Cília". Internamente e na arquitetura, **substituição precoce vestida de complemento** — com a regra de ouro "sem digitação dupla" garantindo que o cliente nunca redigite nada.

---

## 2. Diferenciais — onde o GDelta é inegavelmente melhor

A estratégia premium proíbe perseguir paridade. O GDelta vence em **três pontos que doem**, e só neles:

**1. Orçamento com margem ao vivo.**
Onde a plataforma WM e o Cília montam orçamento, o GDelta mostra **lucro e margem aparecendo enquanto se monta**. O orçamentista para de vender no prejuízo *na hora da venda* — não no fechamento do mês. É tangível em 10 segundos de demo.

**2. Inteligência financeira de verdade.**
DRE, ponto de equilíbrio, aging, fluxo, **markup real por peça**, semáforo estratégico, ranking de clientes, funil. Nenhum sistema do setor entrega isso; o Cília **registra, não interpreta**. Este é o diferencial-mãe — o motivo de a marca existir.

**3. Chão de fábrica em tempo real (Totem).**
O dado que ninguém tem: quem está produzindo agora, qual carro travou e há quanto tempo, retrabalho e gargalo — ao vivo. Fecha o ciclo "orçei → produzi → faturei → **deu lucro?**".

**Promessa de marca que amarra os três:**
> *"O GDelta não te conta o que aconteceu. Ele te mostra se valeu a pena — enquanto ainda dá pra mudar."*

**Fosso competitivo (por que é difícil de copiar):** o valor não está em nenhuma feature isolada, e sim na **integração honesta** entre orçamento, produção real e financeiro sobre **um único dado** (sem digitação dupla). Um incumbente de registro teria que reescrever a espinha para chegar lá.

---

## 3. O gancho da NFS-e nacional (01/09/2026)

**A regra (confirmada):** a Resolução **CGSN nº 189, de 23/04/2026** torna obrigatória a emissão de **NFS-e de padrão nacional** por **ME e EPP optantes do Simples Nacional a partir de 1º/09/2026**, exclusivamente pelo **Emissor Nacional** (web ou API). O **MEI já está obrigado desde set/2023**.

**Por que é um gancho de ouro:**
- **Dor obrigatória e datada.** Não é "talvez no futuro" — é uma mudança que *toda* ME/EPP do Simples terá de fazer, com prazo fixo. Cria uma janela rara em que trocar/adotar ferramenta vira necessidade, não luxo.
- **Entrada sem fricção de venda.** O pitch deixa de ser "mais um sistema" e passa a ser "fique em dia com a nota obrigatória de setembro, sem dor".
- **Captura do dado fiscal.** Quem registra a nota controla o dado — a partir daí a inteligência financeira do GDelta para de depender de exportar do Cília.

**Como o GDelta entrega isso (sem virar empresa fiscal):** **via agregador fiscal** — nunca conformidade própria. O agregador abstrai layouts municipais de NFS-e, o **certificado digital A1** e os campos da **reforma tributária (IBS/CBS)**. Emitir nota, para o GDelta, é uma chamada de API ao agregador a partir da OS.

### Recomendação de agregador
Para o perfil do GDelta (poucas oficinas premium, foco em NFS-e de serviço + NF-e de peças, fundador solo que precisa de boa DX e baixo passivo de suporte):

- **Padrão recomendado: Focus NFe.** Cobertura ampla de NFS-e (integração ativa com 3.000+ municípios e compromisso de integrar município novo por taxa fixa, ~R$199, em até 15 dias) — relevante porque oficinas premium podem estar em municípios variados. Documentação madura.
- **Alternativa enxuta/moderna: Nuvem Fiscal** (DX moderna, preço competitivo) ou **PlugNotas/Tecnospeed** (suporte técnico forte a desenvolvedores).
- **Faixa de custo de referência:** planos mensais ~R$89–R$129 com franquia de 100–250 notas/mês e adicional ~R$0,60–R$0,75 por nota extra. Validar no fechamento.

**Ação (a executar na Fase 2):** colocar **dois** agregadores em homologação e emitir uma NFS-e real ponta a ponta a partir de uma OS, comparando: cobertura dos municípios dos clientes-alvo, suporte a NF-e, prontidão IBS/CBS e custo por nota. Decidir com base no teste, não no catálogo.

---

## 4. Posicionamento de mercado

**Categoria:** não "ERP de oficina" (categoria do Cília, onde se perde por amplitude), e sim **"inteligência de gestão para oficina de funilaria e pintura"** — uma categoria nova que o GDelta define e lidera.

**Frase de posicionamento:**
> *"A inteligência que falta na sua oficina. Funciona com o que você já tem — e cresce até você não precisar de mais nada."*

**Mensagens por persona:**
- **Dono:** "Saiba se cada carro está dando lucro — enquanto ainda dá pra mudar o preço."
- **Orçamentista:** "Orce vendo o lucro, não descobrindo depois."
- **Operário/chão de fábrica:** "Aponte sua tarefa em dois toques."
- **Gancho de entrada (2026):** "Pronto para a NFS-e nacional obrigatória de setembro — sem dor de cabeça."

**O que NÃO dizer:** "substitua o Cília", "fazemos tudo que o Cília faz", ou qualquer promessa de ganho "antes × depois" não medido (a honestidade de medição vale também no marketing).

---

## 5. Estratégia de entrada e crescimento (go-to-market)

**Beachhead:** a oficina-piloto **Auto Risco** e o círculo imediato de oficinas premium da mesma rede/região. Provar o Totem ali, transformar a dona em **caso de referência** e crescer por **boca a boca premium** — coerente com a ambição de dezenas de oficinas de ticket alto.

**Motor de expansão (land & expand):** entra-se pelo módulo de maior dor do cliente (Totem, ou orçamento, ou a NFS-e em 2026) e expande-se módulo a módulo. Cada novo módulo aumenta o ticket e a retenção, e empurra o Cília para a margem.

**Sinais de timing favoráveis:** a obrigatoriedade fiscal de set/2026 concentra a atenção do mercado exatamente quando a Fase 2 deve chegar — usar isso como campanha de aquisição.

---

## 6. Modelo de preço (direção, a fechar com você)

Hoje o Dashboard é vendido como **pagamento único**. O sistema SaaS pede **recorrência** (sustenta a evolução contínua e o custo do agregador/infra). Direção recomendada, a validar:

- **Assinatura mensal por oficina**, com **ticket premium** coerente com o posicionamento (não competir por preço com o Cília — competir por valor).
- **Preço por valor entregue, não por features.** A inteligência financeira e a margem ao vivo justificam ticket alto.
- **Repasse transparente do custo fiscal** (notas via agregador) — embutido no plano ou medido, a decidir conforme o agregador escolhido.
- **Migração dos clientes atuais do Dashboard** (pagamento único) para o SaaS como upgrade natural — eles já compraram a tese da inteligência financeira.

> *Decisões abertas que dependem de você: valor do ticket-alvo da assinatura, e se o custo das notas entra no plano ou é medido à parte. Trato isso quando você definir.*

---

## Fontes

**Regra da NFS-e nacional:**
- [Receita Federal — NFS-e de padrão nacional obrigatória para optantes do Simples Nacional (abr/2026)](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/nfs-e-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional)
- [Ministério da Fazenda — NFS-e de padrão nacional obrigatória para o Simples Nacional](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/abril/nota-fiscal-de-servico-eletronica-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional)
- [Contábeis — NFS-e nacional obrigatória para ME e EPP do Simples](https://www.contabeis.com.br/noticias/76438/nfs-e-nacional-sera-obrigatoria-para-me-e-epp-do-simples/)

**Agregadores fiscais (comparação e preços):**
- [Focus NFe — planos e preços](https://focusnfe.com.br/precos/)
- [PlugNotas / TecnoSpeed — API de NF-e](https://plugnotas.com.br/nfe/)
- [Notaas — Comparativo de APIs para emissão de NFS-e nacional em 2026](https://www.notaas.com.br/blog/post/api-nfse-nacional-melhor-provedor-emissao-nota-fiscal-de-servico-eletronica-nacional)

*Regra confirmada: Resolução CGSN nº 189, de 23/04/2026; obrigatoriedade a partir de 1º/09/2026 para ME e EPP optantes do Simples; emissão pelo Emissor Nacional (web ou API); MEI obrigado desde set/2023.*
