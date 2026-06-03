# Catálogo de padrões

Padrões por categoria, com QUANDO cada um cabe e o CUSTO que cobra. Escolher é casar a força do problema com o padrão mais simples que a absorve.

## Arquiteturais (estrutura macro)

| Padrão | Quando cabe | Custo que cobra |
|---|---|---|
| Monólito modular | Default. Time pequeno/médio, domínio em descoberta, deploy único aceitável | Disciplina de fronteira interna; sem ela vira bola de lama |
| Camadas (layered) | Linha-de-negócio/CRUD, fluxo previsível requisição → serviço → dados | Acopla tudo ao redor do DB se as camadas vazarem |
| Hexagonal (ports & adapters) | Regra de negócio precisa ser isolada de IO/framework; vários adapters (DB, fila, API) | Indireção extra; só paga se há mesmo múltiplos adapters |
| Clean architecture | Regra de negócio de vida longa, testável isolada de framework | Boilerplate de fronteira; over-kill para CRUD simples |
| Event-driven | Desacoplar produtores/consumidores, picos assíncronos, integração entre serviços | Entrega, ordem, idempotência e observabilidade ficam por sua conta |
| CQRS | Leitura e escrita com modelos/escala muito diferentes | Dois modelos para manter; quase sempre prematuro |
| Microserviços | Times independentes em escala, domínios com ciclos de deploy distintos | Rede, consistência distribuída, ops — dívida enorme sem necessidade |

## Táticos (estrutura micro)

- **Repository** — abstrai persistência atrás de uma interface de domínio. Cabe quando a regra não deve conhecer o ORM. Não cabe como wrapper 1:1 anêmico do ORM.
- **Service / use-case layer** — orquestra um caso de uso e mantém os controllers finos.
- **Factory** — criação complexa ou condicional de objetos.
- **Strategy** — variantes de algoritmo intercambiáveis (ex.: política de preço).
- **Adapter** — encaixa uma API externa numa porta do domínio.
- **Decorator** — adiciona comportamento (cache, log, retry) sem tocar o núcleo.

## Dados

- **Unit of Work** — agrupa escritas numa transação coesa.
- **Outbox** — publica eventos de forma confiável junto da transação (evita dual-write).
- **Saga** — consistência eventual em transações distribuídas (orquestrada ou coreografada).
- **Read models / projeções** — leitura otimizada separada da escrita (par do CQRS).

## API

- **REST** — recursos; default para CRUD e integração ampla. Versione (`/v1`), pagine coleções, torne idempotente o que repete.
- **RPC / gRPC** — contrato forte, baixa latência, comunicação serviço-a-serviço.
- **GraphQL** — clientes com necessidades de dados muito variáveis; cobra complexidade de cache e o problema N+1.
- Sempre: contrato explícito, erros tipados, idempotência em operações repetíveis, paginação em coleções, autenticação/autorização na borda.
