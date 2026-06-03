---
name: planning
description: Como transformar um pedido em um plano executável antes de codar - explorar 2-3 abordagens, escolher pela razão, e escrever os passos com critério de sucesso e risco. Use ao iniciar qualquer tarefa não-trivial (mais de um arquivo, ou que você não descreveria o diff em uma frase). Triggers - "make a plan", "how should I approach", "explore options", "break this down", "what's the approach".
---

# Planning

Pular pro código produz solução para o problema errado. Este é o "Plan" do loop Explore → Plan → Implement → Verify. Consumido por qualquer papel antes de uma tarefa não-trivial.

## Quando planejar (e quando não)

Planeje quando a tarefa toca mais de um arquivo, tem mais de uma abordagem plausível, ou você não consegue descrever o diff em uma frase. Pule o plano no trivial (typo, rename, log) — plano cerimonial é desperdício.

## O fluxo

1. **Explore** — entenda o território primeiro (leia o código/contexto relevante). Não planeje no escuro.
2. **Opções** — levante 2-3 abordagens, não uma. Para cada: o que ganha, o que paga.
3. **Escolha** — a mais simples que resolve, com a razão declarada. Simplicity First.
4. **Plano** — escreva os passos; para cada passo, o que fazer + como verificar (o critério de sucesso). Ver `plan-shape.md`.
5. **Risco** — nomeie o que pode dar errado e o elo mais fraco do plano.

## O formato do plano (resumo; detalhe em `plan-shape.md`)

Passos numerados, cada um com critério de verificação binário. O plano entra no `verification-loop` como a lista de critérios. Salve em `.agents-guru/plan.md` quando a tarefa for grande ou multi-sessão.

## Anti-padrões

- Plano sem critério de verificação por passo (não dá para saber quando terminou).
- Uma única opção (não é decisão, é palpite).
- Planejar sem explorar (plano que ignora o que já existe no código).
