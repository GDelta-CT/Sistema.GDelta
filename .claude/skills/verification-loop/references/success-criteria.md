# Critérios de sucesso

A tradução de uma tarefa vaga em um teste binário que você consegue rodar. É o que separa "Goal-Driven Execution" de "faça funcionar".

## A regra

Para toda tarefa, complete a frase: **"Está pronto quando ___, verificável por ___."**

- O primeiro espaço é o estado observável.
- O segundo é o comando ou a observação que prova.

## Bom vs ruim

| Vago (ruim) | Binário (bom) |
|---|---|
| "o dashboard funciona" | "`next build` sai 0; /dashboard renderiza a tabela com ≥1 linha; zero erro no console" |
| "responsivo" | "em 360px e 1440px não há overflow horizontal; a nav vira drawer abaixo de 768px" |
| "acessível" | "axe não acusa violação crítica; contraste ≥ APCA Lc 60 no texto-corpo" |
| "rápido / leve" | "`perf-audit.ts` passa o budget; nenhuma dependência proibida" |
| "bonito" | (isto não é critério de verify — é `/design-review`) |

## De onde vêm

1. Do brief — o que foi pedido explicitamente.
2. Dos gaps fechados — cada gap `Critical`/`Major` vira um critério de "está fechado quando...".
3. Das proibições do projeto — cada hard reject (Lenis, lorem ipsum, stock photo, toggleActions/once, fonte genérica) é um critério negativo.
4. Da stack — compila, typecheck limpo, lint limpo.

## Teste do teste

Se você não sabe qual comando ou observação prova o critério, ele não está pronto para ser critério. Reescreva até saber. Critério que você não consegue falsificar não protege nada.

## Onde registrar

Em `.agents-guru/plan.md` (junto do plano de implementação), para o `build-verifier` carregar. Se não houver plano, o verifier deriva os critérios do brief e os declara no relatório.
