# GDelta — Pricing e Validação (GTM)

> **Documento de Go-To-Market · jun/2026.** Síntese de dois rascunhos (pricing value-based + roteiro de entrevista de campo).
> **Fundador solo (Eliel) · PRÉ-RECEITA** (ainda sem cliente pagante). Objetivo deste doc: ancorar o pricing no valor gerado **e** validar o problema em campo.
>
> **Nota de reconciliação (jun/2026):** o pricing deste doc foi **reconciliado com o Kit de Campo real** do produto. A escada antiga (R$ 199 / R$ 449 / R$ 899) está **DESATUALIZADA** e foi substituída pela **escada modular decidida** que reflete os módulos efetivamente entregues: **DELTA** (bot WhatsApp 24h, porta de entrada) · **DELTA + TOTEM** (+ chão de fábrica/pátio em tempo real) · **COMPLETO** (+ Painel e inteligência financeira ao vivo). O fundador delegou e bateu o martelo nos números abaixo.
>
> **Regra de honestidade (vale para o doc inteiro):**
> - O **preço real do Sigma e do Cília é INDETERMINADO** (não publicado na pesquisa). Nenhum número de concorrente é citado nem inventado. Ancoragem 100% em **VALOR**.
> - Os preços do GDelta abaixo estão **DECIDIDOS** (martelo batido). Marcamos `[ajustável]` onde o número pode ser recalibrado com dado de campo (horas salvas reais + custo de servir), mas a escada e os valores de tabela são os de referência atuais.
> - **Recomendação** (o que eu sugiro) está separada de **Decisão** (o que só o Eliel pode bater o martelo) — ver seções 1 e 2.

---

## 1. Recomendação de Pricing

### 1.1 A lógica — preço como fração do valor gerado (o card "o software se paga")

O preço **não** sai de "quanto os outros cobram". Sai de **quanto dinheiro o GDelta devolve por mês**, cobrando uma **fração clara** disso. É exatamente o card de assinatura do produto (ROI ao vivo).

O valor gerado tem 2 componentes:

**Componente A — Horas salvas (mensurável, conservador)**
O GDelta automatiza o que hoje é digitado/refeito à mão: apontamento de tempo (cronômetro vs. digitação manual — o gap do Sigma), DRE/fluxo montado sozinho, orçamento com margem na hora, NFS-e em dia.

```
Valor_A = horas_salvas_por_mês × R$ 85/h
```

| Cenário de horas salvas/mês | Valor_A (× R$ 85) |
|---|---|
| 5 h/mês (conservador — só financeiro/fiscal) | R$ 425 |
| 10 h/mês (financeiro + apontamento automático) | R$ 850 |
| 20 h/mês (oficina média, dono + 1 admin) | R$ 1.700 |
| 30 h/mês (Completo rodando: bot + pátio + financeiro ao vivo) | R$ 2.550 |

> **`[ajustável]`** A faixa 5–30 h/mês precisa ser medida na oficina-piloto (ver §2 e §4). R$ 85/h é o número do próprio card — **`[ajustável]`**: validar se é custo-hora do produtivo, do admin ou do dono (muda a conta).

**Componente B — Prejuízo evitado por carro (o golpe maior, porém mais difícil de provar)**
É o "vendo no prejuízo sem saber". Margem ao vivo (D1) + DRE por carro (D2) impedem o orçamento abaixo do custo e o retrabalho não medido.

```
Valor_B = carros/mês × % de carros subprecificados × prejuízo médio por carro
```

Exemplo ilustrativo **`[ajustável, validar em campo]`**: 40 carros/mês × 10% subprecificados × R$ 300 de margem perdida ≈ **R$ 1.200/mês** recuperados. Usar como **história ao vivo dentro do produto** ("este carro ia sair com margem negativa") — é prova, não promessa de venda.

### 1.2 A regra de bolso de preço (coração da recomendação)

> **Preço mensal ≈ 30%–50% do valor total gerado (A + B), mantendo ROI ≥ 2x.**

A mensalidade tem que caber dentro do valor que o GDelta devolve por mês, com folga visível na própria tela (o card "o software se paga"). A leitura prática: o **valor gerado A + B precisa ser ~2x a ~3x a mensalidade** — é a faixa em que o dono olha o card e fala "isso se paga sozinho". Abaixo de ~1,5x o ROI some e o preço vira despesa; o teto elástico fica no prejuízo evitado (Componente B), que escala com o nº de carros.

Comparando o que cada degrau da escada devolve com o que ele custa:

| Plano | Mensalidade | Valor gerado/mês que sustenta | Como fecha a conta |
|---|---|---|---|
| **DELTA** R$ 997 | R$ 997 | A ≈ R$ 850–1.700 (10–20h salvas pelo bot 24h: triagem, agenda, follow-up que hoje some) | ROI ~1,5–2x só em horas; é a cunha de entrada |
| **DELTA + TOTEM** R$ 1.497 | R$ 1.497 | A ≈ R$ 1.700–2.550 (horas + pátio em tempo real: para de descobrir carro encalhado tarde) | ROI ~1,5–2x; pátio medido começa a destravar o B |
| **COMPLETO** R$ 1.997 | R$ 1.997 | A ≈ R$ 2.550 + B ≈ R$ 1.200 = **~R$ 3.750** (financeiro ao vivo + margem no orçamento + DRE/carro) | ROI **~1,9x e crescente** — é o plano onde o card "o software se paga" fala sozinho |

**Leitura:** o **Completo (R$ 1.997)** é justamente o degrau onde os dois componentes de valor (horas salvas **e** prejuízo evitado) entram juntos — por isso é o plano total e o mais caro: ele devolve ~R$ 3.700+/mês quando o financeiro ao vivo está rodando. O **Delta (R$ 997)** ancora a entrada no valor real do **Kit de Campo** (o bot WhatsApp 24h que já trabalha sozinho). Cada degrau **tem conta de ROI**, não "feeling de premium" — e o B (prejuízo evitado) é o teto elástico que faz o Completo ficar cada vez mais barato à medida que a oficina roda mais carros.

### 1.3 A escada modular — DECIDIDA (martelo batido; `[ajustável]` onde indicado)

Escada de 3 degraus modulares, alinhada ao **Kit de Campo real** do produto. O cliente entra pelo **DELTA** (porta de entrada de baixo atrito) e sobe agregando módulos. Cada degrau acende a inteligência do anterior + a sua.

| Plano | Para quem | Módulos que entram (valor liberado) | R$/mês |
|---|---|---|---|
| **DELTA** (porta de entrada) | Oficina que quer parar de perder cliente no WhatsApp e atender 24h | **Bot WhatsApp 24h**: triagem, agenda, follow-up automático, primeira resposta na hora — a recepção que nunca dorme. *Libera Valor_A pelo tempo que o bot devolve.* | **R$ 997** `[ajustável]` |
| **DELTA + TOTEM** | Oficina que também quer enxergar o pátio/chão de fábrica em tempo real | Tudo do Delta + **chão de fábrica / pátio em tempo real**: onde cada carro está, etapa por etapa, tempo medido (não digitado), carro encalhado aparece na hora. *Libera Valor_A alto + começa o Valor_B.* | **R$ 1.497** `[ajustável]` |
| **COMPLETO** (plano total) | Oficina que quer parar de vender no prejuízo e gerir pelo lucro | Tudo + **Painel** + **inteligência financeira**: **margem ao vivo no orçamento**, **DRE/margem por carro**, **ROI ao vivo** ("o software se paga"). *Libera Valor_A máximo + Valor_B completo.* | **R$ 1.997** `[ajustável]` |

**Setup único:** **R$ 1.500** `[ajustável]` (instalação + onboarding + configuração do Kit de Campo). *Co-fundador: setup **GRÁTIS** — ver §1.6.*

**Por que cada degrau (ancorado na conta da §1.2):**
- **DELTA R$ 997:** ancora a entrada no valor real do **Kit de Campo** — o bot WhatsApp 24h que já trabalha sozinho (a recepção que não dorme). Devolve horas e clientes que hoje escapam; ROI ~1,5–2x só em tempo salvo. É a cunha; o ROI gordo está nos upgrades.
- **DELTA + TOTEM R$ 1.497:** acende o pátio em tempo real — tempo **medido**, carro encalhado visível na hora. Começa a destravar o prejuízo evitado (B).
- **COMPLETO R$ 1.997:** o **plano total e o mais caro**, porque é onde os dois componentes de valor entram juntos (horas salvas **+** prejuízo evitado via margem ao vivo, DRE por carro e ROI ao vivo). Devolve ~R$ 3.700+/mês quando o financeiro ao vivo roda → o card "o software se paga" sustenta o número sozinho. O valor escala com o nº de carros — teto elástico.

### 1.4 Modelo de cobrança — recomendação

> **Por OFICINA (unidade), assinatura mensal, SEM cobrança por usuário.** Escada modular: o cliente paga pelo degrau (Delta / Delta+Totem / Completo), não por assento.

- **Não por usuário:** cobrar por cabeça pune exatamente o uso que gera o dado de chão de fábrica (cada produtivo aponta tempo no Totem). Você quer TODOS no pátio medido — preço por assento sabota o diferencial.
- **Não por OS:** cria métrica de consumo que o cliente fica vigiando e gera fricção no volume — contraproducente.
- **Por oficina, por degrau:** simples, previsível, "tudo incluso premium" dentro do degrau; o upsell natural é **subir o degrau** (Delta → Totem → Completo), não cobrar a mais por uso.
- **Setup único por oficina:** R$ 1.500 `[ajustável]` na entrada (grátis para co-fundador).
- **Custo variável de nota fiscal:** quando aplicável (módulo fiscal), franquia embutida + excedente medido (manter o que já está no doc de pricing existente).

### 1.5 Posicionamento de preço (sem inventar preço de concorrente)

**vs SIGMA — premium, e o ROI justifica o prêmio.** Não ancorar em "mais barato/caro que o Sigma" (preço indeterminado). Ancorar em ROI demonstrável **ao vivo**. Frase: *"O Sigma te mostra o resultado depois. O GDelta te mostra o lucro na hora e quanto ele te devolve por mês — na própria tela."* O prêmio se paga por **medido vs. digitado** e **ao vivo vs. pós-fato** — nunca dizer que o Sigma "não tem financeiro/produção" (ele tem). Não competir no euBati (moat de leads, fora de escopo solo).

**vs CÍLIA — complemento, preço aditivo e indolor.** O GDelta não substitui o Cília — convive (precedente: Ultracar integra com Cília). O preço é percebido como **camada adicional**, não troca de sistema. A entrada (**Delta**, o bot 24h) é de baixo atrito justamente pra não disputar orçamento na cabeça do dono — entra resolvendo o WhatsApp, não trocando o orçamentador. Frase: *"Você já paga pra orçar e falar com a seguradora. O GDelta é a camada que atende seu cliente 24h e te diz se cada carro deu lucro — e se paga sozinho."*

### 1.6 Oferta CO-FUNDADOR — primeiras oficinas (vagas limitadas)

Regra de ouro: **desconto no TEMPO e em CONDIÇÃO, com o preço cheio sempre RISCADO** (efeito âncora) — nunca apagar o preço de tabela.

**A oferta decidida (martelo batido):** para as primeiras oficinas, vagas limitadas:

- **7 dias grátis** (trial real, sem cartão na barreira de entrada).
- **Setup GRÁTIS** (economia de R$ 1.500 `[ajustável]`).
- **-30% travado por 12 meses** no plano escolhido.
- O **preço cheio aparece RISCADO** ao lado do preço de co-fundador — eles veem o privilégio, o mercado vê a âncora real.

**O preço de co-fundador (-30%, travado 12 meses), com o cheio riscado:**

| Plano | Preço cheio (riscado) | Co-fundador (12 meses) |
|---|---|---|
| **DELTA** | ~~R$ 997~~ | **R$ 698/mês** `[ajustável]` |
| **DELTA + TOTEM** | ~~R$ 1.497~~ | **R$ 1.048/mês** `[ajustável]` |
| **COMPLETO** | ~~R$ 1.997~~ | **R$ 1.398/mês** `[ajustável]` |
| **Setup** | ~~R$ 1.500~~ | **GRÁTIS** |

**Por que assim:**
1. **Trial + setup grátis derruba o atrito de entrada** sem queimar o preço de tabela — o cheio fica riscado, visível, intacto.
2. **-30% travado por 12 meses** dá segurança ao pioneiro e cria urgência (vagas limitadas), mas tem prazo: não vira preço permanente.
3. **Contrapartida explícita:** condição de co-fundador trocada por (a) caso de referência/depoimento, (b) acesso ao dado real de horas salvas e prejuízo evitado pra calibrar o card ROI, (c) feedback de produto.
4. **Clientes atuais do Dashboard (pago único):** crédito do valor pago vira meses grátis + condição de co-fundador (manter Opção 1 do doc existente). São os co-fundadores naturais.
5. **Escassez real (vagas limitadas)** protege o preço cheio dos próximos e qualifica quem entra.

---

## 2. Decisões que dependem do Eliel

A **escada de preço já está DECIDIDA** (§1.3: Delta R$ 997 / Delta+Totem R$ 1.497 / Completo R$ 1.997 + setup R$ 1.500 + co-fundador). O que segue abaixo **não** reabre os números — são ajustes finos e dados que **só o fundador tem** e que servem para **calibrar** (`[ajustável]`) e operacionalizar a escada, não para refazê-la.

### 2.1 Ajustes finos (julgamento do fundador)

1. **Segmento-alvo:** oficina **premium** (ticket alto, ROI por carro grande) **vs. oficina média** (volume, ROI vem mais de horas salvas). Define qual componente (A ou B) você vende primeiro e por qual degrau você puxa o cliente.
2. **Tamanho da turma de co-fundadores** (nº de vagas limitadas) e a fórmula de conversão do Dashboard pago-único em meses grátis / crédito.
3. **Empacotamento do Totem como módulo isolado?** Hoje a escada é cumulativa (Delta → +Totem → Completo). Decidir se algum cliente entra direto no Totem sem o Delta (recomendação: não — Delta é a porta).
4. **Cobrança multi-oficina:** preço por conta vs. por unidade no Completo (teto elástico).

### 2.2 Inputs que ainda calibram os `[ajustável]` (medir, não decidir)

1. **Horas salvas reais/mês** — o input que confirma o ROI de cada degrau no card. Medir na oficina-piloto.
2. **Definição de R$ 85/h** — produtivo, admin ou dono? Muda o tamanho de Valor_A.
3. **% de carros subprecificados e prejuízo médio por carro** (Valor_B) — só sai de oficina real rodando margem ao vivo; é o que sustenta o ROI do Completo.
4. **Custo de servir** (CAC + custo operacional por cliente: infra do bot/WhatsApp, agregador de NF quando aplicável, tempo de suporte/onboarding do fundador solo). **O preço nunca pode ficar abaixo de [custo de servir + margem].** Os números da escada têm folga generosa, mas o custo de servir confirma a margem real.
5. **Preço real de Sigma e Cília** — INDETERMINADO; obter via demo comercial antes de afirmar qualquer posição relativa. Até lá, 100% valor.

---

## 3. Roteiro de Entrevista de Validação

**Objetivo:** descobrir se o problema é real e dói, o que usam hoje, e se pagariam por ver lucro ao vivo + tempo medido + ROI.
**Quem entrevistar:** DONO ou sócio que decide preço, prazo e dinheiro (não atendente, não funileiro).
**Tempo:** 25–35 min. **Anotar:** grave (com permissão) ou anote frases exatas — a frase do cliente vale mais que sua interpretação.

### Regra de ouro (ler antes de cada entrevista)
- **Escutar, não vender.** Não mostre o GDelta. Investigue a vida dele.
- **Não fale do produto até o fim.** Se perguntar "o que você vende?": *"Te conto no final, primeiro quero entender como funciona aí na sua oficina."*
- **Pergunte sobre o passado, não o futuro.** "O último carro que deu prejuízo" vale ouro. "Você usaria um app que…" é mentira educada.
- **Silêncio é arma.** Fez a pergunta, cala a boca.
- **Nunca corrija nem ensine.** O erro de gestão dele é o seu mercado.
- **Cave o número.** "perdi uma grana" → *"quanto, mais ou menos?"*

### 3.1 Abertura (1–2 min) — sem enviesar
> "Fulano, valeu demais o tempo. Sou o Eliel, tô estudando como oficina de funilaria e pintura toca a parte de **dinheiro e pátio** no dia a dia — o que funciona, o que dá dor de cabeça. **Não vim vender nada.** Só quero entender a realidade de quem está no chão da oficina. Pode ser papo reto, sem resposta certa ou errada. Posso gravar só pra não perder nada? Fica entre a gente."

### 3.2 Aquecimento / contexto (3–5 min)
- **P1.** Me conta da oficina — **há quanto tempo, quantas pessoas, quantos carros/mês** mais ou menos?
- **P2.** Num dia normal, **o que mais consome a sua cabeça** — cliente, seguradora, funcionário, dinheiro? O que te tira o sono?

### 3.3 Núcleo — problema (12–18 min)
> Depois de cada resposta, emende: **"Me dá um exemplo do último carro/da última vez que isso aconteceu?"**

- **P3. (lucro por carro)** Quando um carro sai pronto — **como você sabe se deu lucro ou não?**
- **P4. (cava o anterior)** Esse número você vê **na hora, no fim do mês, ou no sentimento**? Como chega nele hoje?
- **P5. (ferramenta atual)** O que usa hoje pra controlar orçamento e dinheiro — **sistema, planilha, caderno, ou na cabeça?** (Se citar Cília/Sigma/outro: *"o que ele te mostra de dinheiro? O que falta?"*)
- **P6. (a brecha do concorrente)** Esse controle te diz **quanto sobrou de margem em cada serviço**, ou é mais **orçamento e seguradora**? Onde te deixa na mão?
- **P7. (tempo de pátio)** Tem carro que **encalha no pátio**? Você descobre **na hora ou só quando o cliente liga cobrando?** Me conta o último.
- **P8. (retrabalho)** Quando um serviço **volta pra refazer** — **quem paga essa conta?** Sabe quanto retrabalho te custou mês passado?
- **P9. (descoberta de prejuízo — PERGUNTA-CHAVE)** Me conta do **último carro que deu prejuízo** ou zero a zero. **Como e QUANDO você descobriu** — durante, no fim, ou lá na frente quando o caixa não fechou?
- **P10. (custo da dor — cava o número)** Esse prejuízo **deu quanto**? E quantas vezes/mês isso acontece sem você perceber a tempo?
- **P11. (quem decide)** Quando chega carro pra orçar — **quem bate o martelo do preço/prazo?** O que usa pra ter certeza que cobre o custo e sobra?
- **P12. (sangria invisível)** Fora prejuízo de carro, **onde você sangra dinheiro e não enxerga** — material, hora parada, funcionário ocioso, peça?

### 3.4 Disposição a pagar (5–8 min)
> Transição: *"Agora deixa eu te fazer umas perguntas mais de cabeça…"*
> Descrição **neutra** do conceito (não pitchar): *"Imagina uma ferramenta onde, na hora de montar o orçamento, você já vê a margem ao vivo — quanto vai sobrar naquele carro, antes de fechar o preço. E que mede sozinha o tempo que cada carro fica no pátio e em cada etapa, e te mostra no fim quanto cada carro deu de lucro de verdade e quanto a ferramenta te economizou."*

- **P13. (reação crua)** Sendo honesto — **isso resolveria uma dor real ou seria só mais um sistema?** Que parte chamou atenção, qual você não usaria?
- **P14. (valor antes do preço)** Se isso te mostrasse **um único carro de prejuízo por mês que hoje passa batido** — quanto valeria pra você?
- **P15. (disposição — deixe ELE dar o número)** Por uma ferramenta que entrega isso — margem ao vivo, tempo medido, lucro real por carro — **quanto por mês faria sentido pagar, na sua cabeça?** *(Cale a boca. Espere. Não sugira faixa.)*
- **P16. (o que justifica)** O que faria você falar **"isso vale o que custa"** — ver lucro por carro, achar prejuízo escondido, parar de discutir com cliente, ou cobrar produtividade com número na mão?
- **P17. (teto / quebra)** Qual valor que, se passar disso, você acha **caro demais** e nem testaria — mesmo gostando?
- **P18. (prova do bolso)** Hoje você paga **algum sistema/mensalidade** da oficina? Quanto, e o que te faz continuar (ou cancelar)?

> ⚠️ **`[ASSUMPTION a marcar na anotação]`:** o número que ele der NÃO é o preço final do GDelta — é **âncora de valor**. Anote cru, sem reagir, e siga.

### 3.5 Leitura: quente vs frio (preencher DEPOIS, sozinho)

**🔥 QUENTE (provável comprador/piloto):** deu exemplo concreto e recente de prejuízo com número; não sabe o lucro por carro e isso o incomodou; reclamou que o sistema atual não mostra margem; já paga algo hoje; deu número de mensalidade na hora; pediu pra ver / ofereceu indicação sem você pedir; falou de pátio/retrabalho com raiva.

**❄️ FRIO (não force, agradeça e siga):** "tá tudo na minha cabeça" e parece satisfeito; não lembra de nenhum carro no prejuízo; acha que planilha/caderno resolve; travou/riu nervoso no número; delegou tudo ("quem cuida de dinheiro é meu contador") e não se envolve; curiosidade educada, zero dor.

### 3.6 Encerramento + próximo passo (2–3 min)
- **Agradecer:** *"Cara, me ajudou demais. Isso vale mais que pesquisa de escritório."*
- **Pedir indicação (sempre):** *"Conhece outro dono de oficina que pega firme nessa parte de dinheiro/pátio e toparia um papo desses?"*
- **Convite a piloto (só se QUENTE):** *"Tô construindo exatamente isso. Escolhendo umas poucas oficinas pra testar antes de todo mundo. Posso te chamar quando estiver pronto pra você ser um dos primeiros?"*
- **Fechar o loop:** *"Te mando mensagem semana que vem. Qual o melhor WhatsApp?"*

### 3.7 Ficha de campo (preencher ao sair — 2 min)
- Oficina / dono / data: __________
- Carros/mês e tamanho: __________
- Como sabe o lucro hoje: ⬜ na hora ⬜ fim do mês ⬜ sentimento ⬜ não sabe
- Ferramenta atual: ⬜ Cília ⬜ Sigma ⬜ planilha ⬜ papel ⬜ cabeça ⬜ outro: ____
- Já paga software? Quanto: R$ __________
- Último prejuízo (R$ e quando descobriu): __________
- Número de mensalidade que ELE disse: R$ __________
- Teto que achou caro: R$ __________
- Frase mais forte (literal): "__________"
- Temperatura: 🔥 quente / 🟡 morno / ❄️ frio
- Indicação que deu: __________ · Próximo passo combinado: __________

> **Critério de leitura:** 5–10 entrevistas revelam o padrão. Se **3+ donos quentes** descreverem a mesma dor (não saber o lucro do carro a tempo) **e** derem número de mensalidade sem travar → **problema validado + âncora de preço**. Se ninguém lembrar de prejuízo e todos acharem a cabeça suficiente, **escute isso** — é o dado mais valioso que existe.

---

## 4. Próximo passo prático (esta semana)

**Meta da semana:** sair do `[ASSUMPTION]` em pelo menos um ponto, fazendo campo — sem escrever mais nada.

1. **Montar lista de 8–10 donos de oficina** de funilaria/pintura para abordar (rede pessoal, indicações, oficinas locais). O alvo é o **dono que decide dinheiro**, não o atendente.
2. **Agendar e rodar as 3 primeiras entrevistas** com o roteiro da §3 (gravando, com permissão). Não vender — escutar. Anotar a frase literal e o número cru de P15.
3. **Após cada entrevista, preencher a ficha de campo (§3.7) na hora** e marcar 🔥/🟡/❄️.
4. **Identificar 1 candidato a oficina-piloto** entre os quentes para, na sequência, **medir as horas salvas reais** (o input #1 da §2.2 que destrava o número de preço e o card ROI).
5. **Decidir 1 dos ajustes finos da §2.1** — sugiro começar pelo **#1 (segmento-alvo: premium vs. média)**, porque ele orienta para quem você liga primeiro, por qual degrau da escada você puxa o cliente e qual componente de valor (A ou B) você vende.

> Ao fim da semana você deve ter: 3 fichas preenchidas, ≥1 número de mensalidade dado por dono, ≥1 candidato a piloto, e o segmento-alvo escolhido. Isso converte a §1 de "faixa" em "número em calibração".

---

*Notas de procedência: este doc sintetiza o rascunho de pricing value-based e o roteiro de entrevista. **Reconciliação jun/2026:** a escada de preço foi atualizada da faixa antiga (R$ 199 / R$ 449 / R$ 899, DESATUALIZADA) para a **escada modular decidida** alinhada ao **Kit de Campo real** — DELTA R$ 997 / DELTA+TOTEM R$ 1.497 / COMPLETO R$ 1.997 + setup R$ 1.500 + oferta co-fundador (7 dias grátis, setup grátis, -30% travado 12 meses, preço cheio riscado). A âncora segue sendo ROI-de-valor (card "o software se paga"), não benchmark-de-mercado. Nenhum preço de concorrente foi inventado; Sigma e Cília seguem INDETERMINADOS. O roteiro de entrevista (§3) e os próximos passos (§4) foram preservados.*
