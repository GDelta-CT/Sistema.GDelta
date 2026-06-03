---
name: code-design-patterns
description: Como identificar necessidades técnicas e escolher os padrões de desenho de código e a arquitetura certos - não o mais sofisticado, o mais adequado ao problema. Use ao desenhar um backend/serviço/API, ao decidir como estruturar uma feature, ou ao avaliar se uma arquitetura existente cabe no problema. Triggers - "choose architecture", "which design pattern", "how to structure this", "API design", "data model", "is this over-engineered".
---

# Code Design Patterns

Escolher o padrão é uma decisão sob incerteza, não um reflexo. O melhor padrão é o mais simples que ainda absorve a mudança esperada. Consumido pelo `backend-architect` e pelo `backend-forge`.

## Princípio central

Padrão serve ao problema, não o contrário. Sob Simplicity First: comece no mais simples que funciona (monólito modular, camada de serviço direta) e só suba a complexidade quando uma força concreta (escala, número de times, taxa de mudança, consistência) exigir — com a força nomeada, não suposta. Microserviço sem necessidade é dívida, não maturidade.

## O fluxo

1. **Necessidades** — extraia as forças do brief e do território (do `brownfield-cartographer`): escala esperada, equipe, frequência de mudança, requisitos de consistência/latência, integrações, restrições do stack atual. Detalhe em `choosing-patterns.md`.
2. **Candidatos** — liste 2-3 padrões plausíveis do `pattern-catalog.md`, não um só.
3. **Decisão** — escolha pelo que as forças pedem; declare o trade-off (o que ganha, o que paga) e a confiança.
4. **Fronteiras** — defina os limites (módulos, camadas, contratos) e a direção das dependências (de fora para dentro; regra de negócio não importa framework/IO).
5. **Plano** — traduza em passos implementáveis com critérios de verificação (entrega para o `verification-loop`).

## Catálogo (resumo; detalhe em `pattern-catalog.md`)

Arquiteturais: monólito modular, camadas, hexagonal (ports & adapters), clean, event-driven, CQRS, microserviços. Táticos: repository, service/use-case layer, factory, strategy, adapter, decorator. Dados: unit of work, outbox, saga, read models. API: REST / RPC / GraphQL, versionamento, paginação, idempotência.

## Escolha e anti-over-engineering (resumo; detalhe em `choosing-patterns.md`)

Decida pelas forças (régua Cynefin + perguntas de escala/time/mudança). Regra de ouro: cada camada de indireção precisa pagar o próprio custo. SOLID e a regra de dependência guiam as fronteiras; YAGNI trava a abstração especulativa.

## Anti-padrões

- Padrão da moda sem força que o justifique (microserviço / CQRS prematuro).
- Abstração para um único caso (viola Simplicity First).
- Acoplar regra de negócio a framework / ORM / HTTP (inverta a dependência).
- Fechar a decisão com um candidato só, sem comparar trade-offs.
