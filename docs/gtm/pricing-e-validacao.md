# GDelta — Pricing e Validação (GTM)

> **Documento de Go-To-Market · jun/2026.** Síntese de dois rascunhos (pricing value-based + roteiro de entrevista de campo).
> **Fundador solo (Eliel) · PRÉ-RECEITA** (ainda sem cliente pagante). Objetivo deste doc: chegar num número de preço defensável **e** validar o problema em campo antes de cravá-lo.
>
> **Regra de honestidade (vale para o doc inteiro):**
> - O **preço real do Sigma e do Cília é INDETERMINADO** (não publicado na pesquisa). Nenhum número de concorrente é citado nem inventado. Ancoragem 100% em **VALOR**.
> - Todo preço do GDelta abaixo é **`[ASSUMPTION]`** até ser calibrado com dado de campo (horas salvas reais + custo de servir).
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

> **`[ASSUMPTION]`** A faixa 5–20 h/mês precisa ser medida na oficina-piloto (ver §2 e §4). R$ 85/h é o número do próprio card — **`[ASSUMPTION herdada]`**: validar se é custo-hora do produtivo, do admin ou do dono (muda a conta).

**Componente B — Prejuízo evitado por carro (o golpe maior, porém mais difícil de provar)**
É o "vendo no prejuízo sem saber". Margem ao vivo (D1) + DRE por carro (D2) impedem o orçamento abaixo do custo e o retrabalho não medido.

```
Valor_B = carros/mês × % de carros subprecificados × prejuízo médio por carro
```

Exemplo ilustrativo **`[ASSUMPTION, validar em campo]`**: 40 carros/mês × 10% subprecificados × R$ 300 de margem perdida ≈ **R$ 1.200/mês** recuperados. Usar como **história ao vivo dentro do produto** ("este carro ia sair com margem negativa") — é prova, não promessa de venda.

### 1.2 A regra de bolso de preço (coração da recomendação)

> **Preço mensal = 10%–20% do valor total gerado (A + B).**

É a faixa em que o cliente sente que o software "se paga sozinho" (ROI de 5x a 10x). Acima de ~25% o ROI fica magro pra vender sozinho; abaixo de ~8% você deixa valor na mesa e desvaloriza o produto.

Aplicando **só ao Componente A** (conservador, ignorando o prejuízo evitado):

| Valor_A/mês | Preço a 15% | Preço a 20% | ROI que o card mostra |
|---|---|---|---|
| R$ 850 (10h) | ~R$ 128 | ~R$ 170 | ~5–6,5x |
| R$ 1.700 (20h) | ~R$ 255 | ~R$ 340 | ~5–6,5x |
| R$ 850 + R$ 1.200 (B) = R$ 2.050 | ~R$ 308 | ~R$ 410 | ~5–6,5x |

**Leitura:** mesmo ignorando o prejuízo evitado, uma oficina que salva 20h/mês justifica **~R$ 250–340/mês** só em horas. Somando o prejuízo evitado, o **plano núcleo na faixa de R$ 400–700/mês** fica **matematicamente coberto por ROI**, não por "feeling de premium". O número agora **tem conta**.

### 1.3 Os 3 planos recomendados — cada número é `[ASSUMPTION]`

| Plano | Para quem | O que entra (valor liberado) | Faixa R$/mês |
|---|---|---|---|
| **Essencial** (porta de entrada) | Oficina que entra pela urgência NFS-e ou pelo chão de fábrica | Apontamento automático (cronômetro) + NFS-e em dia + financeiro que interpreta (DRE/fluxo/aging básico). *Libera Valor_A baixo (~5–8h/mês).* | **R$ 199 – R$ 299** `[ASSUMPTION]` |
| **Pro / Inteligência** (núcleo — onde mora a promessa) | Oficina que quer parar de vender no prejuízo | Tudo do Essencial + **margem ao vivo no orçamento (D1)** + DRE/margem por carro (D2) + chão de fábrica completo (produtividade/gargalo) + **card ROI ao vivo**. *Libera Valor_A alto + Valor_B.* | **R$ 449 – R$ 699** `[ASSUMPTION]` |
| **Multi-oficina / Lucro** (topo, âncora) | Dono de 2+ unidades, ou que trata gestão como vantagem | Tudo + consolidação multi-unidade, ranking/benchmark interno, ponto de equilíbrio, prioridade de suporte/evolução. | **R$ 899 – R$ 1.290** (1 unidade) ou **por unidade** `[ASSUMPTION]` |

**Por que cada faixa (ancorada na conta da §1.2):**
- **Essencial R$ 199–299:** cobre ROI de quem salva ~5–8h/mês (Valor_A ≈ R$ 425–680); preço a ~30–45% do valor — propositalmente apertado porque é cunha de entrada; o ROI gordo está no upgrade.
- **Pro R$ 449–699:** onde a margem ao vivo + prejuízo evitado entram. Valor total estimado R$ 1.700–3.500/mês → preço a **~15–25%** → ROI de 4x–6x. **É o número que o card "o software se paga" sustenta sozinho.**
- **Multi-oficina R$ 899–1.290:** serve o cliente multi-unidade **e** ancora o Pro como "a escolha sensata" (efeito âncora). O valor escala com nº de carros/unidades — teto elástico.

### 1.4 Modelo de cobrança — recomendação

> **Por OFICINA (unidade), assinatura mensal, SEM cobrança por usuário.** `[ASSUMPTION recomendada]`

- **Não por usuário:** cobrar por cabeça pune exatamente o uso que gera o dado de chão de fábrica (cada produtivo aponta tempo). Você quer TODOS no cronômetro — preço por assento sabota o diferencial D3.
- **Não por OS:** cria métrica de consumo que o cliente fica vigiando e gera fricção no volume — contraproducente.
- **Por oficina:** simples, previsível, "tudo incluso premium"; upsell natural é multi-unidade.
- **Custo variável de nota fiscal:** franquia embutida + excedente medido (manter o que já está no doc de pricing existente, §4).

### 1.5 Posicionamento de preço (sem inventar preço de concorrente)

**vs SIGMA — premium, e o ROI justifica o prêmio.** Não ancorar em "mais barato/caro que o Sigma" (preço indeterminado). Ancorar em ROI demonstrável **ao vivo**. Frase: *"O Sigma te mostra o resultado depois. O GDelta te mostra o lucro na hora e quanto ele te devolve por mês — na própria tela."* O prêmio se paga por **medido vs. digitado** e **ao vivo vs. pós-fato** — nunca dizer que o Sigma "não tem financeiro/produção" (ele tem). Não competir no euBati (moat de leads, fora de escopo solo).

**vs CÍLIA — complemento, preço aditivo e indolor.** O GDelta não substitui o Cília — convive (precedente: Ultracar integra com Cília). O preço é percebido como **camada adicional**, não troca de sistema. A entrada (Essencial) precisa ser de baixo atrito pra não disputar orçamento na cabeça do dono. Frase: *"Você já paga pra orçar e falar com a seguradora. O GDelta é a camada que te diz se cada carro deu lucro — e se paga sozinho."*

### 1.6 Primeiros clientes — Founding Members (sem queimar o preço de referência)

Regra de ouro: **desconto no TEMPO ou em CONDIÇÃO, nunca no preço de tabela publicado.**

1. **Founder lock:** primeiros ~5–10 entram numa faixa reduzida do Pro (ex.: **-30% a -40%, travado por 12–24 meses ou enquanto ativos**), mas **o preço cheio aparece riscado** — eles veem o privilégio, o mercado vê a âncora real. `[ASSUMPTION nos números]`
2. **Piloto pago, nunca de graça:** cobra um valor real reduzido. Grátis queima caixa do fundador solo E desvaloriza o produto. "Barato e exclusivo", não "grátis".
3. **Contrapartida explícita:** desconto trocado por (a) caso de referência/depoimento, (b) acesso ao dado real de horas salvas pra calibrar o card ROI, (c) feedback de produto.
4. **Clientes atuais do Dashboard (pago único):** crédito do valor pago vira meses grátis + founder pricing nos âncora (manter Opção 1 do doc existente). São os founding members naturais.
5. **Early-bird com prazo/vagas:** "primeiras 10 oficinas". Escassez real protege o preço cheio dos próximos.

---

## 2. Decisões que dependem do Eliel

Estas **não são recomendações** — são escolhas e dados que **só o fundador tem**. Sem elas, a conta da §1 fica em faixa, não em número fechado.

### 2.1 Decisões (julgamento do fundador)

1. **Apetite de ancoragem:** **ancorar alto** (Pro a R$ 549–699, premium puro, poucos clientes de ticket alto) **vs. penetrar barato** (Pro a R$ 449, mais volume). A conta sustenta os dois — é estratégia de GTM, não planilha.
2. **Segmento-alvo:** oficina **premium** (ticket alto, ROI por carro grande) **vs. oficina média** (volume, sensível a preço, ROI vem mais de horas salvas). Define qual componente (A ou B) você vende primeiro.
3. **% de desconto e duração do founder pricing**, e a fórmula de conversão do Dashboard pago-único em meses grátis.
4. **2 faixas vs. 3 faixas** — recomendação: 3 faixas (já no doc existente).
5. **Cobrança multi-oficina:** preço fixo por conta vs. por unidade no plano topo.

### 2.2 Inputs que FALTAM pra fechar o número (medir, não decidir)

1. **Horas salvas reais/mês** — o input mais crítico. Sem ele, card ROI e preço seguem `[ASSUMPTION]`. Medir na oficina-piloto.
2. **Definição de R$ 85/h** — produtivo, admin ou dono? Muda o tamanho de Valor_A.
3. **% de carros subprecificados e prejuízo médio por carro** (Valor_B) — só sai de oficina real rodando margem ao vivo.
4. **Custo de servir** (CAC + custo operacional por cliente: agregador de NF ~R$ 89–129/mês + ~R$ 0,60–0,75/nota a validar, infra, tempo de suporte/onboarding do fundador solo). **O preço nunca pode ficar abaixo de [custo de servir + margem de sobrevivência].** Número exclusivo do Eliel.
5. **Ticket-alvo do plano núcleo** — a decisão que fecha a escada inteira.
6. **Preço real de Sigma e Cília** — INDETERMINADO; obter via demo comercial antes de afirmar qualquer posição relativa. Até lá, 100% valor.

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
5. **Decidir 1 das 5 decisões da §2.1** — sugiro começar pela **#2 (segmento-alvo: premium vs. média)**, porque ela orienta para quem você liga primeiro e qual componente de valor (A ou B) você vende.

> Ao fim da semana você deve ter: 3 fichas preenchidas, ≥1 número de mensalidade dado por dono, ≥1 candidato a piloto, e o segmento-alvo escolhido. Isso converte a §1 de "faixa" em "número em calibração".

---

*Notas de procedência: este doc sintetiza o rascunho de pricing value-based e o roteiro de entrevista. O doc de pricing existente (`C:/Users/Eliel/OneDrive/Documentos/Sistema GDelta/GDelta-Sistema_Pricing.md`) permanece válido na estrutura — esta síntese substitui a âncora dele (de benchmark-de-mercado para ROI-de-valor). Nenhum preço de concorrente foi inventado; Sigma e Cília seguem INDETERMINADOS. Footer de autoria de terceiros do template original do roteiro foi removido; conteúdo 100% reescrito para o GDelta.*
