---
name: reasoning-toolkit
description: Raciocínio rigoroso e calibração de confiança para qualquer análise. Use quando precisar auditar um argumento, decidir sob incerteza, diagnosticar um sistema, avaliar evidência, ou declarar quão confiante você está numa conclusão. Triggers - "reason rigorously", "audit argument", "calibrate confidence", "trace deduction", "is this claim sound", "how sure are we".
---

# Reasoning Toolkit

Sete lentes de raciocínio + um sistema de calibração de confiança. Não é teoria: é um conjunto de testes operacionais que transformam "parece certo" em "é verdadeiro com confiança X porque Y". É consumido pelos pilares P1 (compreensão), P2 (escopo), P3 (gaps) e pelo `awwwards-judge`.

## Princípio central

Uma conclusão vale tanto quanto seu elo mais fraco. Toda afirmação carrega uma cadeia: evidência → premissa → dedução → confiança → implicação. Se você não consegue reconstruir essa cadeia, você não sabe — você acha.

## Triage: qual rota usar

Classifique o input e siga a rota. **Nous está sempre ativo** (audita o próprio raciocínio em todas as rotas).

| Input parece... | Rota | Pilares na ordem | Reference |
|---|---|---|---|
| Um argumento ("X porque Y") | Argument Audit | Dialektikos → Logos → Nous | `seven-pillars.md`, `gap-discovery/toulmin-decomposition.md` |
| Uma afirmação empírica ("X causa Y") | Evidence | Empiricus → Bayesiano → Nous | `seven-pillars.md` |
| Uma decisão sob incerteza | Decision | Bayesiano → Systema → Nous | `seven-pillars.md`, `confidence-calibration.md` |
| Um sistema/comportamento ("por que X acontece") | System Diagnosis | Systema → Empiricus → Nous | `seven-pillars.md` |
| Uma cadeia causal a validar | Causal | Empiricus (DAG) → Logos → Nous | `gap-discovery/dependency-tracing.md` |
| Confiança a declarar | Calibration | Bayesiano → Nous | `confidence-calibration.md` |

## Os sete pilares (resumo; detalhe em `references/seven-pillars.md`)

1. **Logos** — validade lógica. A conclusão segue das premissas? Detecta fallacies formais e informais.
2. **Episteme** — justificação. Como sabemos? Distingue o que é sabido do que é inferido; aplica falsificabilidade.
3. **Bayesiano** — probabilidade e calibração. prior → likelihood ratio → posterior; teste de base-rate.
4. **Dialektikos** — estrutura do argumento. Decomposição Toulmin; steel-man antes de criticar.
5. **Empiricus** — evidência e causalidade. Hierarquia de evidência; escada causal de Pearl; confounders.
6. **Systema** — sistemas e dinâmica. Cynefin; stocks/flows; loops; efeitos de 2ª a 5ª ordem.
7. **Nous** — metacognição. Os 9 padrões intelectuais; catálogo de vieses; auditoria do próprio raciocínio.

## Output obrigatório

Toda análise deste toolkit termina com:

1. **Chain of custody** (formato em `references/chain-of-custody.md`): evidência → premissa → dedução → confiança → implicação.
2. **Confiança calibrada** com label textual (`High`/`Moderate`/`Low`/`Speculative`) e a razão.
3. **Elo mais fraco** identificado: se ele cair, o que cai junto.

Antes de entregar, passe o output pelo `scripts/confidence-lint.ts` para flagar linguagem de overconfidence.

## Regra de ouro

Se você corrigir a mesma conclusão duas vezes e ainda não bater, não force — declare a incerteza e o que falta para resolvê-la. Confiança fabricada é o pior defeito que este toolkit existe para prevenir.
