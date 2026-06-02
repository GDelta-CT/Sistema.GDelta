# Os sete pilares do raciocínio

Cada pilar é uma lente. Cada lente tem testes operacionais — não conceitos para admirar, mas perguntas que produzem um veredito. Aplique a lente que a triage indicou; Nous roda sempre por cima.

---

## 1. Logos — validade lógica

Pergunta central: a conclusão **segue** das premissas?

**Testes:**
- Reconstrua o argumento em forma de premissas numeradas + conclusão.
- Cheque a forma: modus ponens (P→Q, P ⊢ Q) é válido; afirmar o consequente (P→Q, Q ⊢ P) é fallacy.
- Separe validade (a forma) de soundness (forma válida + premissas verdadeiras). Um argumento pode ser válido e falso.

**Fallacies formais comuns:** afirmar o consequente, negar o antecedente, silogismo de termo médio não distribuído.

**Fallacies informais comuns:** ad hominem, espantalho, falso dilema, apelo à autoridade não-qualificada, equivocação (o termo muda de sentido no meio), petição de princípio (a conclusão está embutida na premissa).

**Veredito:** VÁLIDO / INVÁLIDO + (se válido) SOUND / UNSOUND.

---

## 2. Episteme — justificação e conhecimento

Pergunta central: **como** sabemos isto, e quão justificada é a crença?

**Testes:**
- Para cada afirmação, classifique a via de justificação: percepção direta, testemunho, inferência, autoridade, memória.
- Distinga `KNOWN` (verificável agora) de `INFERRED` (deduzido, pode falhar) de `ASSUMED` (tomado como dado sem checar).
- Falsificabilidade (Popper): que observação contradiria isto? Se nenhuma, não é conhecimento empírico — é dogma ou tautologia.
- Degradação por hierarquia de fonte: a cada salto de transmissão (fonte original → paper → notícia → rede social → boca a boca), a confiabilidade cai. Rastreie a cadeia (ver `gap-discovery/dependency-tracing.md`).

**Veredito:** por afirmação, o rótulo `KNOWN`/`INFERRED`/`ASSUMED` e o nível de justificação.

---

## 3. Bayesiano — probabilidade e calibração

Pergunta central: dada a evidência, qual a probabilidade calibrada?

**Protocolo:**
1. Estime a probabilidade intuitiva (gut feeling).
2. Teste de base-rate: de todos os casos deste tipo, que fração resulta verdadeira? Ancore aqui, não na narrativa.
3. Teste de reference class: casos similares no passado, quantos deram certo?
4. Corrija availability (você está sobrepesando exemplos vívidos?) e anchoring (preso à primeira estimativa?).
5. Atualize: posterior ∝ prior × likelihood ratio. LR = P(evidência | hipótese) / P(evidência | ¬hipótese).
6. Diagnóstico: CALIBRATED / OVERCONFIDENT / UNDERCONFIDENT.

**Heurística forte:** se a confiança declarada menos a base-rate excede 20 pontos percentuais, sinalize overconfidence. (Ex.: "85% que minha startup é lucrável em 6 meses" vs base-rate ~5-10% = overconfidence massiva.)

---

## 4. Dialektikos — estrutura do argumento

Pergunta central: o argumento está **completo** ou tem componentes ocultos/ausentes?

**Decomposição Toulmin** (detalhe em `gap-discovery/toulmin-decomposition.md`): todo argumento tem CLAIM, DATA, WARRANT, BACKING, QUALIFIER, REBUTTAL. Componentes implícitos ou ausentes são gaps. Menos de 4 dos 6 presentes = argumento vulnerável.

**Steel-man antes de criticar:** reconstrua a versão mais forte do argumento do outro lado antes de atacá-lo. Derrubar um espantalho não prova nada.

**Esquemas de argumento (Walton):** argumento por autoridade, por analogia, por consequência, por sinal — cada um tem perguntas críticas que o testam.

---

## 5. Empiricus — evidência e causalidade

Pergunta central: a evidência **sustenta** a força da afirmação?

**Hierarquia de evidência** (forte → fraca):
1. Meta-análise / revisão sistemática
2. RCT (experimento controlado randomizado)
3. Coorte
4. Caso-controle
5. Série de casos
6. Observação / anedota
7. Opinião de especialista
8. Especulação

**Regra de overclaim:** se a afirmação usa "causa" (escada causal nível 2+) mas a evidência é observacional (nível 1, só associação), há um gap de força. Ex.: "café causa câncer" sustentado por um estudo observacional = overclaim.

**Escada causal de Pearl:** (1) associação — ver; (2) intervenção — fazer; (3) contrafactual — imaginar. Só suba de degrau com a evidência apropriada (RCT ou modelo causal com confounders identificados).

**DAG e confounders:** desenhe o grafo. Um confounder causa tanto a suposta causa quanto o efeito (smoking → coffee, smoking → heart disease torna coffee↔heart disease espúrio). Cheque mediadores (a causa age através de X?) e colliders (controlar um efeito comum cria associação falsa). Detalhe em `gap-discovery/dependency-tracing.md`.

**Bradford Hill (quando RCT é impossível):** força, consistência, especificidade, gradiente dose-resposta, plausibilidade, coerência, experimento, analogia.

---

## 6. Systema — sistemas e dinâmica complexa

Pergunta central: que **estrutura** produz este comportamento, e o que muda se eu intervir?

**Classificação Cynefin** (escolhe a abordagem):
- **Clear** — causa óbvia, aplique best practice. (Todos os especialistas concordam?)
- **Complicated** — causa descobrível por análise. (Dá para analisar até a resposta?)
- **Complex** — causa emergente, só visível em retrospecto. Abordagem: **probe → sense → respond** (experimentos safe-to-fail). (O padrão se repete igual? Se não, é complex.)
- **Chaotic** — sem relação causa-efeito estável; aja para estabilizar primeiro.

Classificar errado é o erro caro: tratar um problema complex com análise (abordagem complicated) falha sempre.

**Stocks e flows:** stocks são acumulações (usuários, dívida, moral); flows são taxas que os mudam. Mapeie ambos.

**Loops de feedback:** reinforcing (R, amplifica) e balancing (B, estabiliza). Procure o loop **ausente**: falta um fluxo de informação? falta uma regra acoplando duas variáveis? falta alinhamento de meta? (Esses são pontos de alavancagem de Meadows.)

**Efeitos de 2ª a 5ª ordem:** "e depois disso, o quê?" repetido. A 1ª ordem é o efeito imediato; a partir da 2ª aparecem loops, respostas de agentes e fragilidades. É aqui que necessidades ocultas surgem (ver `gap-discovery/scope-amplification.md`).

---

## 7. Nous — metacognição (sempre ativo)

Pergunta central: meu **próprio** raciocínio tem buracos?

**Os 9 padrões intelectuais** (Paul & Elder) — cada falha é um gap:
1. **Clarity** — consigo reafirmar em outras palavras? (vagueza = gap)
2. **Precision** — consigo ser mais específico? (hand-waving = gap)
3. **Accuracy** — como verifico? é mesmo verdade? (não-verificado = gap)
4. **Relevance** — conecta com a questão? (tangentes = gap)
5. **Depth** — qual a complexidade real? (superficialidade = gap)
6. **Breadth** — há outra perspectiva? (visão de túnel = gap)
7. **Logic** — a conclusão segue? (non sequitur = gap)
8. **Significance** — este é o issue mais importante? (busywork = gap)
9. **Fairness** — estou enviesado a favor do que quero? (self-serving = gap)

**Catálogo de vieses (e o contra-movimento):**
- Anchoring → gere a estimativa antes de ver a âncora.
- Availability → pergunte "vívido ou comum?".
- Confirmation → busque ativamente o desconfirmador.
- Sunk cost → "eu começaria isto agora?".
- Framing → reformule em múltiplos enquadramentos.
- Hindsight → registre predições antes do resultado.
- Dunning-Kruger / illusion of depth → tente explicar passo a passo; busque feedback.
- Bias blind spot → assuma que VOCÊ está enviesado, não que está imune.

Nous é o último filtro antes de declarar confiança. Se um dos 9 padrões falha, o gap entra no relatório.
