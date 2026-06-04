# GDelta — Visão do Produto & Decisão Estratégica
**Documento 1 de 6 · Versão 1.1 · Maio/2026**
*Premissas do briefing: produto premium (dezenas de oficinas, ticket alto), construção solo + IA em ritmo agressivo, público-alvo Simples Nacional (MEI/ME/EPP), Dashboard vendido hoje como pagamento único.*

---

## PREMISSAS DE PRODUTO (válidas para os Docs 1–6)

Estas regras valem para **todo** o sistema e todos os documentos. Não são detalhe — são lei de projeto.

1. **Sem digitação dupla.** Nenhum dado é digitado duas vezes. Para **cada módulo**, fica declarado: ou o GDelta é a **fonte da verdade** (system of record), ou ele **lê do Cília** — nunca os dois com entrada manual repetida.
2. **Substituição parcial e progressiva — não complemento puro.** O GDelta é fonte da verdade *dos módulos que entrega*. Internamente, chamamos pelo nome: **substituição precoce vestida de complemento**. O marketing externo continua "funciona ao lado do Cília".
3. **Honestidade de medição.** O GDelta só mede **depois de instalado**. Nenhum documento promete "antes × depois" que não foi medido. Métricas auto-reportadas (ex.: retrabalho) são tratadas como piso, não número exato.
4. **Escopo de fundador solo.** Cada fase precisa ser **construível e vendável sozinha**. MVP *ruthlessly narrow*. Nada de roadmap que assume construção simultânea de duas frentes.
5. **Premium, não paridade.** Não perseguir paridade de features com o Cília. Ser **inegavelmente melhor nos 3 pontos que doem**: orçamento com margem ao vivo, inteligência financeira de verdade, chão de fábrica em tempo real.
6. **Fiscal sempre via agregador.** O GDelta **nunca** implementa conformidade fiscal própria nem integra o Emissor Nacional cru. Usa um **agregador fiscal** (PlugNotas/Tecnospeed, Focus NFe, Nuvem Fiscal ou eNotas) que abstrai layouts municipais, certificado digital A1 e os campos da reforma tributária (IBS/CBS). Emitir nota = uma chamada ao agregador.
7. **Um único modelo de dados.** Totem e sistema compartilham o **mesmo banco multi-tenant** (`oficina_id` + RLS no Supabase). Não são dois bancos separados — o Totem é um módulo do mesmo schema.
8. **Foco declarado de roadmap:** o **Totem é o módulo nº 1**. O piloto prova adoção **primeiro**; orçamento, placa/FIPE, NFS-e, estoque e financeiro completo são **sequenciados atrás** dessa validação — nunca em paralelo.

---

## PARTE 1 — A VISÃO EM UMA PÁGINA

### O que é o GDelta
O GDelta é o **sistema de gestão que entende de dinheiro** para oficinas de funilaria e pintura de pequeno e médio porte. Onde os sistemas atuais do setor são cadastros glorificados — guardam OS, emitem nota, controlam estoque — o GDelta nasce da direção oposta: começa pela **inteligência financeira que já vendo hoje** (DRE, ponto de equilíbrio, markup real por peça, aging, fluxo de caixa, semáforo estratégico) e constrói o operacional **ao redor dela**. O dono não compra um arquivador; compra um copiloto que mostra, em tempo real, se cada carro no pátio está dando lucro ou prejuízo disfarçado.

### O problema
O dono de oficina vive no escuro. Ele orça no olho ou numa planilha solta, não sabe a margem real de cada serviço, descobre que o mês foi ruim só quando o caixa aperta, e usa um sistema (tipicamente o **Cília**) que registra a operação mas **não o ajuda a decidir**. Some-se a isso uma obrigação fiscal nova e inescapável: a partir de **1º de setembro de 2026**, toda ME e EPP do Simples Nacional terá de emitir **NFS-e de padrão nacional**. Milhares de oficinas vão precisar mudar seu fluxo fiscal — uma janela rara em que trocar de ferramenta deixa de ser luxo e vira necessidade.

### Quem usa
O **dono/gestor** (decide com base em margem e prazo), o **orçamentista/atendente** (monta orçamento e fecha com cliente/seguradora), o **operário** (aponta produção no chão de fábrica via Totem) e o **financeiro/administrativo** (nota, contas, recebíveis). No piloto, esses papéis muitas vezes se concentram em uma ou duas pessoas.

### Os módulos (o sistema completo)
- **Orçamento ao vivo** — peças + mão de obra + insumos, com **lucro e margem aparecendo enquanto se monta** (melhor que a plataforma WM).
- **Dados de veículo por placa + FIPE** — cadastro e busca de peças sem digitação manual.
- **Pátio / Ordem de Serviço** — o carro do orçamento aprovado até a entrega.
- **GDelta Totem** — o **módulo de chão de fábrica**: tablet de apontamento + painel de produção em tempo real (já em construção).
- **Estoque inteligente** — peças de reposição + matéria-prima (tintas, verniz, primer, lixa, fita, thinner) + escritório, com **baixa vinculada à OS**.
- **Emissão de nota embutida** — **NFS-e** (serviço) e **NF-e** (peças), sempre **via agregador fiscal** (nunca conformidade própria).
- **Financeiro** — herda a inteligência da planilha: DRE, equilíbrio, aging, fluxo, markup, semáforo, ranking de clientes, funil.
- **Clientes** — seguradoras e particulares.

### Como o Totem se encaixa
O Totem é a **camada de produção** do GDelta. Hoje ele é autônomo e posicionado para rodar ao lado do Cília; no sistema completo, ele vira o módulo que alimenta o Pátio/OS e o Financeiro com **dados reais de tempo trabalhado, retrabalho e gargalo** — fechando o ciclo "orçei → produzi → faturei → deu lucro?". A mesma honestidade que rege o Totem ("só mede depois de instalado") rege o sistema todo.

### A promessa de marca
**"O GDelta não te conta o que aconteceu. Ele te mostra se valeu a pena — enquanto ainda dá pra mudar."**

---

## PARTE 2 — A DECISÃO ESTRATÉGICA: AO LADO DO CÍLIA × SUBSTITUIR

Você pediu para eu resolver isto antes de fixar o roadmap. Abaixo, as duas rotas puras com prós e contras, e em seguida a minha recomendação — que é uma terceira via deliberada.

### Rota A — Complemento puro (rodar para sempre ao lado do Cília)
O GDelta entrega só o que o Cília não faz (inteligência financeira + chão de fábrica) e nunca tenta substituí-lo.

**Prós:** venda fácil (não pede para trocar de sistema, baixa fricção); ciclo de vendas curto; menos superfície para construir; o Totem já nasceu assim.
**Contras:** você fica **refém** do Cília (se ele copia sua inteligência ou bloqueia integração, acabou); teto de receita baixo (complemento vale menos que plataforma); difícil ser "disruptivo" sendo apêndice de outro; sem dado fiscal e de orçamento, sua própria inteligência financeira fica capenga (depende de exportar do Cília).

### Rota B — Substituto frontal (ERP completo que mata o Cília no dia 1)
O GDelta entra dizendo "troque o Cília inteiro por mim".

**Prós:** captura todo o valor; produto-plataforma com teto de receita alto; controle total do dado (orçamento → produção → nota → financeiro num lugar só); narrativa disruptiva limpa.
**Contras:** **brutal para um fundador solo bootstrapped.** Substituir um ERP exige paridade de funcionalidades, **conformidade fiscal robusta (NF-e/NFS-e em múltiplos municípios), migração de dados, suporte de missão crítica e confiança** que leva anos. Cliente não troca o sistema que roda o faturamento por um produto novo sem histórico. Ciclo de vendas longo, risco de operação parada do cliente, e você compete de frente com quem tem 5000 oficinas de base instalada e relacionamento contábil enraizado.

### Recomendação — Rota C: **"Cavalo de Troia" (complemento agora, arquitetado para substituir)**

**Entre como camada premium ao lado do Cília, mas construa cada módulo como peça de uma plataforma que pode, quando o cliente quiser, assumir o todo.** Não é meio-termo morável — é uma sequência com intenção.

**Por que esta é a certa para o *seu* perfil (premium, dezenas, solo + IA):**
1. **Seu diferencial não é "fazer tudo", é "fazer o que importa, lindamente".** Com ambição de dezenas premium, você não precisa — nem deve — travar uma guerra de paridade de features com o Cília. Você precisa ser **inegavelmente melhor nos 3 pontos que doem**: orçamento com margem ao vivo, inteligência financeira de verdade, e chão de fábrica em tempo real. Isso vende sozinho num nicho de ticket alto.
2. **A janela da NFS-e nacional (01/09/2026) é o seu cavalo de Troia.** Toda ME/EPP do Simples vai *ter* que mudar o fluxo fiscal. Se o GDelta embute a emissão de forma elegante — **via agregador fiscal** (PlugNotas/Tecnospeed, Focus NFe, Nuvem Fiscal ou eNotas), que tira de você o passivo de conformidade, certificado A1 e layouts municipais —, você entra resolvendo uma **dor obrigatória e datada**, não vendendo "mais um sistema". Quem **registra** a emissão da nota controla o dado fiscal — e aí sua inteligência financeira para de depender de exportar do Cília. O fiscal é o módulo de maior suporte e risco; o agregador mantém esse risco fora das suas mãos.
3. **Land and expand é a única estratégia sustentável solo.** Cada módulo que você adiciona (orçamento → nota → estoque → financeiro completo) torna o Cília **progressivamente redundante** para aquele cliente. O cliente migra por vontade própria, quando perceber que abre o GDelta o dia todo e o Cília só pra uma coisa. Substituição vira **consequência**, não **pitch**.
4. **Risco controlado.** Você nunca está com o faturamento do cliente refém de um produto imaturo — ele mantém o Cília como rede de segurança enquanto o GDelta amadurece. Bootstrapped, isso é vital: você não precisa estar "completo" para vender.

**O que isso significa na prática (e prepara o roadmap):**
- **Posicionamento de mercado:** "A inteligência que falta na sua oficina" / "Funciona com o que você já tem — e cresce até você não precisar de mais nada." Nunca "substitua o Cília" no marketing inicial.
- **Arquitetura — fonte da verdade por módulo:** cada módulo que o GDelta entrega nasce como **system of record dentro do GDelta** (não importado, não digitado duas vezes). O que o GDelta ainda não cobre, ele **lê do Cília** (até onde houver integração viável) — nunca duplica entrada. Isso resolve a contradição "complemento × dado próprio": não é complemento puro, é **substituição módulo a módulo**, e o cliente nunca redigita nada.
- **Sequência de módulos (detalhada nos Docs 3 e 6) — respeitando o foco solo:** o **Totem é o módulo nº 1** e o piloto prova adoção **antes** de qualquer outro módulo. Só depois dessa validação entram, em sequência (nunca em paralelo): **Orçamento ao vivo + Clientes + placa/FIPE**, depois **NFS-e via agregador** surfando o gatilho de 01/09/2026, e por fim **Financeiro completo + Estoque** — ponto em que o Cília vira opcional.

**O trade-off que você aceita conscientemente:** abre mão da narrativa "matador de Cília" no curto prazo em troca de **sobrevivência, foco e um caminho de substituição sem risco existencial**. Para um fundador solo mirando o topo premium, isso não é recuo — é como Davi escolhe o terreno antes de encarar Golias.

---

### Fontes (regra da NFS-e)
- [Receita Federal — NFS-e de padrão nacional será obrigatória para optantes do Simples Nacional (abr/2026)](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/nfs-e-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional)
- [Ministério da Fazenda — Nota Fiscal de Serviço Eletrônica de padrão nacional será obrigatória para optantes do Simples Nacional](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/abril/nota-fiscal-de-servico-eletronica-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional)
- [Contábeis — NFS-e nacional será obrigatória para ME e EPP do Simples](https://www.contabeis.com.br/noticias/76438/nfs-e-nacional-sera-obrigatoria-para-me-e-epp-do-simples/)

*Regra confirmada: Resolução CGSN nº 189, de 23/04/2026; obrigatoriedade a partir de 1º/09/2026 para ME e EPP optantes do Simples; emissão exclusiva pelo Emissor Nacional (web ou API); MEI já obrigado desde set/2023.*
