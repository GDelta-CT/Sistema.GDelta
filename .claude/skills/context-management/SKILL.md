---
name: context-management
description: Como gerir a janela de contexto - a restrição central de todo agente. Use para decidir quando limpar/compactar o contexto, quando delegar a um subagente, e como manter a tarefa pequena o suficiente para caber com folga. Triggers - "context is getting full", "should I clear", "compact", "delegate to subagent", "the agent is forgetting", "long task".
---

# Context Management

A premissa de todo sistema agêntico: a janela de contexto enche rápido e a performance degrada conforme enche. Quase toda decisão de orquestração é, no fundo, gestão de contexto. Consumido por qualquer papel em tarefa longa.

## As regras

- **Tarefa pequena é a melhor tática.** O que cabe com folga não precisa de truque.
- **Limpe entre tarefas não relacionadas.** Misturar assuntos polui o contexto (no Claude Code: `/clear`).
- **Compacte ao passar de ~60-70% da janela**, preservando código e decisões (`/compact`). Nunca use os últimos ~20% para trabalho multi-arquivo complexo.
- **Delegue investigação pesada a um subagente.** A pesquisa fica no contexto dele; só o resumo volta. Vale para mapear codebase, varrer logs, explorar opções.
- **Referencie arquivos, não cole.** `@arquivo` (ou deixe o agente ler sob demanda) em vez de despejar conteúdo.
- **Ferramentas/MCP sob demanda.** Conecte só o necessário; tool-search carrega os nomes e busca o schema quando preciso.

## O sinal de alerta

Se o agente começa a "esquecer" instruções, ignorar regras que antes seguia, ou repetir trabalho — o contexto está cheio. Compacte ou limpe e recomece com um prompt mais específico (`context-budget.md`).

## A regra de recomeço

Corrigiu o mesmo problema mais de duas vezes? O contexto está poluído com tentativas falhas. Limpe e recomece incorporando o que aprendeu num prompt melhor — não empilhe correção sobre correção.
