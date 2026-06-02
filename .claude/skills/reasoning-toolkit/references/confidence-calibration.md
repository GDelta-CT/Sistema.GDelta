# Calibração de confiança

Confiança não é um sentimento — é uma estimativa que deve bater com a frequência real de acerto. Este documento define como declarar confiança neste projeto.

## Os quatro níveis (labels textuais; sem emojis)

| Label | Faixa de probabilidade | Significa | Quando usar |
|---|---|---|---|
| `High` | 85-99% | Forte evidência convergente; múltiplas vias confirmam | Verificado no código/dados, ou dedução sólida de premissas verificadas |
| `Moderate` | 60-84% | Evidência razoável, mas com lacunas ou dependência de assumptions | Inferência bem fundamentada com 1-2 elos não confirmados |
| `Low` | 35-59% | Indícios fracos; muito depende de assumptions não validadas | Hipótese plausível, pouca evidência direta |
| `Speculative` | <35% | Palpite informado | Não há base sólida; declarado para ser honesto sobre a incerteza |

Nunca declare confiança sem o label E a razão de uma linha.

## Regra de Cromwell

Nunca use 0% nem 100%. Certeza absoluta não é atualizável por nova evidência — e quase nada empírico merece isso. Mesmo o que parece óbvio fica em `High`, não em "certo".

## Decaimento composto

A confiança de uma conjunção é no máximo a do elo mais fraco, e geralmente menor:

```
conf(A ∧ B) <= min(conf(A), conf(B))
```

Uma cadeia de 5 deduções `Moderate` (cada uma ~0.75) resulta em algo perto de `Low` no fim (0.75^5 ≈ 0.24). Declare a confiança da conclusão final, não a do passo mais confiante.

## Disclosure de sensibilidade

Quando a conclusão depende de uma assumption, diga **quanto** ela depende. Se mudar a assumption por 2x muda o resultado por 4x, essa assumption é o que importa validar primeiro (ver `gap-discovery/scope-amplification.md`).

## Linguagem proibida

Estas palavras afirmam certeza que evidência empírica raramente sustenta. O `scripts/confidence-lint.ts` as flagra:

- `certainly`, `certamente`, `with certainty`
- `proven`, `provado`, `proves that`
- `guaranteed`, `garantido`
- `definitely`, `definitivamente`
- `always` / `never` em contexto empírico (em lógica formal é ok)
- `obviously`, `obviamente`, `clearly` (quando substituem a justificativa)
- `100%`, `zero chance`, `impossible` (sobre eventos empíricos)

Substitua por: "a evidência sugere com confiança `High` que...", "é provável (Moderate) que...", "não encontrei contra-exemplo, mas não testei exaustivamente".

## Diagnóstico de calibração

Depois de declarar, pergunte: se eu fizesse 100 afirmações com este label, quantas acertaria? Se o número honesto é menor que a faixa do label, você está `OVERCONFIDENT` — desça um nível. Esse auto-teste é a parte de Nous na calibração.
