# A forma de um bom plano

Um plano é uma lista de passos verificáveis, não uma redação.

## Cada passo tem

- **O quê** — a ação concreta (arquivo/módulo, mudança).
- **Verificação** — o teste/checagem binária que prova o passo pronto ("`tsc` limpo", "rota /x responde 200 com payload Y", "teste Z verde").
- **Dependência** — de qual passo anterior depende, se houver.

## O plano inteiro tem

- Ordem que respeita dependências (não planeje o passo 5 antes do 2 que o habilita).
- Critério de pronto global (quando o conjunto está completo).
- Riscos + elo mais fraco (o passo que, se falhar, derruba o resto).

## Exemplo

1. Modelar a entidade Order (domínio puro). Verificação: `tsc --noEmit` limpo; teste de invariante verde.
2. Repositório + migração. Verificação: a migração roda; teste de integração de save/load verde.
3. Endpoint POST /orders. Verificação: smoke 201 + payload; 400 em input inválido.

Pronto quando: 1-3 verdes + a suíte completa verde.

## Tamanho

Passo grande demais não é verificável; quebre. O alvo é o passo do tamanho de "um diff que dá para revisar".
