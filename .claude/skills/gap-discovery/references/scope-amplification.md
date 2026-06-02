# Ampliação de escopo e mapeamento de necessidades

Como pegar um brief raso e revelar o que o usuário realmente precisa — incluindo o que ele não pediu porque não sabia que precisava. Quatro técnicas.

---

## Técnica 1 — Classificação Cynefin (escolher a abordagem certa)

Antes de ampliar, descubra que tipo de problema é. A abordagem errada falha mesmo bem executada.

```
PROBLEMA: "Retenção de clientes está caindo"
CLEAR?       Todos os especialistas concordam no que fazer?  → Não
COMPLICATED? Dá para analisar até a causa?  → Em parte (dados de churn revelam parte)
COMPLEX?     O padrão se repete igual?  → Não, muda mês a mês  → é COMPLEX
ABORDAGEM: probe → sense → respond (experimentos safe-to-fail), não análise pura.
PROBES: melhorar onboarding de novas cohorts; survey de churn; criar tier "pro".
AMPLIAÇÃO DE ESCOPO: começou como "problema de feature" → virou "alinhamento de modelo de
  negócio" (usuários free não valorizam features pagas). Escopo agora inclui pricing,
  mercado-alvo, feature-market fit.
```

Regra: problema complex tratado como complicated (só análise) sempre falha. Reclassifique antes de prometer solução.

---

## Técnica 2 — Efeitos de 2ª a 5ª ordem (necessidades ocultas)

Para cada intervenção/feature, pergunte "e depois disso, o quê?" repetidamente. Necessidades ocultas vivem nas ordens superiores.

```
INTERVENÇÃO: "Implementar chatbot de IA no suporte"
1ª ORDEM (imediato): resolve 40% das perguntas simples; tempo de resposta 6h → 5min.
2ª ORDEM (loops, semanas): melhor resposta → mais confiança → retenção sobe (R);
  custos caem → pressão pra usar IA em mais áreas (R); erros do bot → mais escalações (B).
3ª ORDEM (resposta dos agentes, meses): suporte vê trabalho menos interessante → moral cai
  → turnover; clientes frustrados com escalação → alguns churnam.
4ª ORDEM (efeitos atrasados): turnover → conhecimento sai → qualidade da escalação piora;
  LTV assumido era maior que o real.
5ª ORDEM (fragilidade): sistema vira dependente do uptime da IA (ponto único de falha);
  suporte esvaziado não consegue absorver picos.
NECESSIDADES OCULTAS DESCOBERTAS: retenção de conhecimento, plano de escalonamento humano,
  monitoramento de uptime, métrica de qualidade (não só tempo de resposta).
```

O brief pedia "chatbot". A necessidade real inclui as ordens superiores.

---

## Técnica 3 — Análise de sensibilidade de assumptions

Descubra qual assumption mais move o resultado — é o que validar primeiro.

```
DECISÃO: aceitar equity de uma startup?
ASSUMPTION 1: base-rate de sucesso = 10%.  Se for 5% ou 20%, o valor muda 4x.
ASSUMPTION 2: TAM = $10B.  Se for $2B ou $50B, muda 5x.
ASSUMPTION 3: qualidade do time.  Track record forte +30%; primeiro time −40%.
REGRA: assumption errada por 2x → resultado muda 4x → priorizar VALIDAR essa assumption.
AMPLIAÇÃO: o escopo "devo aceitar?" vira "quais são as assumptions críticas e como
  valido cada uma antes de decidir?".
```

Liste as assumptions, estime quanto cada uma move o resultado, ordene por sensibilidade. As perguntas de validação saem daqui.

---

## Técnica 4 — Gaps de corroboração

Para qualquer afirmação que vira requisito, cheque se a evidência cobre as cinco dimensões. Cada ausência amplia o escopo do que precisa ser validado.

```
HIPÓTESE: "Remote work aumenta produtividade"
DURAÇÃO:    estudos < 1 ano; efeito novidade some em ~6 meses        → gap
PAPEL:      "produtividade" significa coisas diferentes por função    → gap
CONFOUNDING: quem ESCOLHE remoto não foi controlado (seleção)         → gap
OUTCOME:    mede quantidade de output, não inovação/qualidade         → gap
CONTEXTO:   remoto de emergência (COVID) ≠ remoto permanente escolhido → gap
ESCOPO AMPLIADO: a claim genérica vira "para funções de IC com entregáveis claros, remoto
  aumenta taxa de conclusão de tarefas nos primeiros 6-12 meses" — e NÃO cobre inovação,
  colaboração, mentoria.
```

---

## Saída

```
SCOPE AMPLIFICATION
  Domínio Cynefin: <clear|complicated|complex|chaotic> + abordagem
  Necessidades explícitas (pedidas): <lista>
  Necessidades ocultas (efeitos 2ª-5ª ordem): <lista>
  Assumptions ranqueadas por sensibilidade: <1º a que mais move o resultado>
  Perguntas de validação: <derivadas das assumptions críticas>
  Confiança: <label> — <razão>
```
