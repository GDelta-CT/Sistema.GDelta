# Escolhendo o padrão (decisão, não reflexo)

## As forças (pergunte antes de escolher)

1. **Escala** — volume hoje e em 12 meses? A maioria dos sistemas nunca precisa de microserviço.
2. **Equipe** — quantas pessoas/times tocam isto em paralelo? Fronteira de deploy segue fronteira de time.
3. **Frequência de mudança** — o que muda toda semana merece fronteira própria; o estável não.
4. **Consistência / latência** — precisa de consistência forte? Tolera eventual? Qual o orçamento de latência?
5. **Integrações** — quantos sistemas externos? Muitos adapters favorecem hexagonal.
6. **Restrições do stack atual** — em brownfield, o stack já decidiu metade; respeite, salvo custo declarado.

## A régua (Cynefin + simplicidade)

- **Clear / complicated** → padrão conhecido e simples (monólito modular em camadas). Não invente.
- **Complex** → comece simples e reversível; deixe a arquitetura emergir com evidência, não com aposta.
- Regra de ouro: **cada camada de indireção precisa pagar o próprio custo.** Se você não nomeia a força que a indireção absorve, remova-a.

## SOLID e a regra de dependência (guiam as fronteiras)

- **S** — uma razão para mudar por módulo.
- **O** — aberto a extensão (strategy/adapter), fechado a modificação.
- **L** — substituível sem surpresa.
- **I** — interfaces estreitas e específicas do cliente.
- **D** — dependa de abstrações. Regra de dependência: **o código de fora aponta para dentro**; a regra de negócio nunca importa framework/IO.

## YAGNI (a trava)

Não construa para o requisito imaginado. Abstração para um caso só é dívida disfarçada de maturidade. Suba a complexidade no dia em que a força aparecer — e ela aparece com evidência, não com "pode ser que".

## A saída da decisão

Sempre: 2-3 candidatos comparados, a escolha, o trade-off (ganha X / paga Y), a confiança e o elo mais fraco. Um candidato único não é decisão, é palpite.
