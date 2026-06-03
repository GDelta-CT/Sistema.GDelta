# Depuração sistemática

Quando o verify dá RED. O objetivo é a menor correção que torna o critério verde sem quebrar outro. Anti-shotgun.

## O método (5 passos)

1. **Reproduza** — rode a checagem que falhou e capture o erro literal. Sem repro estável não há conserto, há chute.
2. **Isole** — onde exatamente quebra? file:line, stack trace, ou bisect (comente metade, veja se some). Reduza ao menor caso que ainda falha.
3. **Hipótese** — uma causa provável, declarada com confiança (`reasoning-toolkit`): "é X porque a evidência Y".
4. **Correção mínima** — mude só o que a hipótese exige. Surgical Changes. Um diff pequeno é falsificável; um diff grande esconde a causa.
5. **Re-teste** — rode a MESMA checagem. Verde? Rode também as que já passavam (não regrediu?). Vermelho? A hipótese estava errada — volte ao passo 3 com o que aprendeu, não com um chute novo.

## Anti-padrões

- **Shotgun**: mudar várias coisas de uma vez. Se colar, você não sabe o que consertou; se não, piorou o estado.
- **Consertar o sintoma**: silenciar o erro ou relaxar o critério em vez de tratar a causa.
- **Thrash**: ciclar correções sem nova evidência.

## Quando escalar

Você isolou a falha, formulou hipótese e tentou a correção mínima duas vezes, e o critério segue vermelho sem nova informação. Reporte: o erro literal, o que isolou, as hipóteses já descartadas e o que precisaria para destravar. Isso é progresso honesto, não fracasso.
