---
name: gap-discovery
description: Descobre gaps, rastreia dependências e amplia escopo de um projeto ou argumento. Use quando precisar achar o que está faltando, validar a solidez de uma afirmação, mapear cadeias de dependência até o elo mais fraco, ou expandir um brief raso em necessidades reais. Triggers - "find gaps", "what's missing", "amplify scope", "trace dependencies", "is this complete", "hidden requirements".
---

# Gap Discovery

O método para responder três perguntas que afundam projetos brownfield: **o que está faltando?**, **do que isso depende?**, **o que o usuário precisa mas não pediu?**. Trabalha junto com `reasoning-toolkit` (os pilares + calibração).

## Os três modos

| Modo | Pergunta | Reference |
|---|---|---|
| Gap-finding | O que está faltando ou frágil? | `toulmin-decomposition.md`, `gap-tests.md` |
| Dependency tracing | Do que depende; qual o elo mais fraco? | `dependency-tracing.md` |
| Scope amplification | O que é necessário mas não foi pedido? | `scope-amplification.md` |

## Protocolo de gap-finding

1. **Decomponha** a afirmação/feature/escopo em componentes (Toulmin para argumentos; requisitos para features). Ver `toulmin-decomposition.md`.
2. **Rode os testes de gap** (`gap-tests.md`): base-rate, falsificabilidade, hierarquia de evidência, loops sistêmicos, os 9 padrões de Nous. Cada teste que falha é um gap.
3. **Classifique cada gap por severidade:** `Critical` (bloqueia / quebra), `Major` (compromete qualidade), `Minor` (polimento). Use as mesmas regras de evidência da chain of custody.
4. **Proponha o fechamento.** Um gap sem proposta de fechamento é uma reclamação, não uma análise. Diga exatamente o que falta para fechá-lo.

## Protocolo de dependency tracing

1. Construa a cadeia/grafo (código: imports e build graph; lógica: premissas e decisões).
2. Marque o tipo de cada aresta (dedutiva, causal, de dados, de build).
3. Encontre o **elo mais fraco**: a confiança final = a do elo mais fraco. Se ele cair, o que cai junto?
4. Derive a **ordem de resolução**: resolva primeiro o que destrava mais.

## Protocolo de scope amplification

1. Classifique o domínio (Cynefin): clear / complicated / complex / chaotic. Escolha a abordagem.
2. Mapeie efeitos de 2ª a 5ª ordem ("e depois disso?") — necessidades ocultas vivem aqui.
3. Liste as assumptions e rode análise de sensibilidade — priorize validar a que mais move o resultado.
4. Procure gaps de corroboração (duração, contexto, papel, confounding, outcome).

## Regra anti-suavização

Verdicts categóricos. Um gap `Critical` chamado de "ponto de atenção" mente para o usuário. Severidade honesta + fechamento concreto. E sempre confiança calibrada — um gap que você só suspeita é `Speculative`, e diga isso.
