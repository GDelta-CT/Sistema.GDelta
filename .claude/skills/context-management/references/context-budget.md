# Orçamento de contexto

A janela é um orçamento finito. Gaste no que move a tarefa, não em ruído.

## Para onde o contexto vai (e como cortar)

| Consumidor | Corte |
|---|---|
| Histórico longo de uma sessão | compacte preservando decisões; ou limpe entre tarefas |
| Arquivos colados inteiros | referencie por path; leia só o trecho necessário |
| Saída verbosa de comando | filtre (`grep`/`head`); não despeje logs inteiros |
| Schemas de muitas ferramentas MCP | conecte só as do projeto; tool-search sob demanda |
| Investigação exploratória | delegue a subagente; traga só o resumo |

## A heurística dos 70%

- 0-60%: trabalhe normal.
- 60-70%: compacte ou planeje limpar antes da próxima fase.
- acima de 80%: não inicie tarefa multi-arquivo complexa; risco de degradação.

## Delegação como compressão

Um subagente é contexto descartável: ele consome a janela DELE lendo 50 arquivos e devolve um parágrafo. Use para qualquer tarefa cujo processo é grande mas a conclusão é pequena (mapear, buscar, auditar, comparar).

## Recomeço deliberado

Quando o contexto azedou (esquecimento, loops, regras ignoradas), recomeçar com um prompt melhor é mais barato que insistir. Leve o aprendizado, deixe o lixo.
