# Chain of custody do raciocínio

Toda conclusão deste projeto carrega sua cadeia de custódia: de onde a evidência veio até a implicação que ela sustenta. É o que separa uma análise auditável de uma asserção.

## Formato

```
EVIDENCE   — o fato bruto observado (cite a fonte: file:line, comando+saída, doc+data)
  ↓
PREMISE    — o que esse fato nos permite afirmar
  ↓
DEDUCTION  — o passo lógico (rotule o tipo: dedutivo / indutivo / abdutivo / causal)
  ↓
CONFIDENCE — label (High/Moderate/Low/Speculative) + razão de uma linha
  ↓
IMPLICATION — o que isto significa para a decisão/escopo/build
```

## Exemplo (compreensão de brownfield)

```
EVIDENCE   — package.json:12 lista "next": "14.2.0" e "app/" existe na raiz
PREMISE    — o projeto usa Next.js 14 com App Router
DEDUCTION  — dedutivo (a presença de app/ + versão 14 implica App Router por convenção)
CONFIDENCE — High — verificado em dois sinais independentes (dependência + estrutura)
IMPLICATION — builds de produto devem usar Server Components por padrão; rotas em app/
```

## Regras

1. **Sem evidência, sem premissa.** Se você não consegue apontar a fonte (linha, comando, doc), a afirmação é `ASSUMED` — rotule como tal e rebaixe a confiança.
2. **Rotule o tipo de dedução.** Abdutivo ("a melhor explicação") é mais fraco que dedutivo; declare.
3. **Aninhe quando necessário.** Uma premissa pode ser a conclusão de outra cadeia. A confiança da cadeia composta decai ao elo mais fraco (ver `confidence-calibration.md`).
4. **Identifique o elo mais fraco explicitamente.** No fim da cadeia, diga: "se [premissa X] cair, toda a conclusão cai". Isso direciona a validação.

## Quando usar a versão completa vs a curta

- **Completa** (todos os 5 estágios): para qualquer conclusão que vire decisão de arquitetura, fechamento de gap, ou item BLOCKING de review.
- **Curta** (EVIDENCE → CONFIDENCE): para observações de inventário e fatos diretos. Não infle fatos triviais com cadeias de 5 linhas.
