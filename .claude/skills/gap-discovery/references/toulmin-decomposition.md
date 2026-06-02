# Decomposição Toulmin

O modelo de Toulmin quebra qualquer argumento em seis componentes. Componentes implícitos ou ausentes são gaps. É a ferramenta mais rápida para ver onde uma afirmação está exposta.

## Os seis componentes

| Componente | Pergunta | Exemplo (claim: "remote work aumenta produtividade") |
|---|---|---|
| **CLAIM** | O que se afirma? | "Remote work aumenta produtividade" |
| **DATA** | Que fato sustenta? | "Estudos 2020-2021 mostraram métricas de produtividade subindo" |
| **WARRANT** | Por que o data sustenta a claim? (a ponte) | "Métricas de produtividade são proxies confiáveis de produtividade holística" |
| **BACKING** | Por que confiar no warrant? | (frequentemente AUSENTE) |
| **QUALIFIER** | Com que grau de certeza? | "definitivamente / provavelmente / possivelmente" |
| **REBUTTAL** | Sob que condições NÃO vale? | "a menos que... que exceções existem?" |

## Protocolo

1. Extraia a CLAIM literal.
2. Encontre o DATA citado. Presente?
3. Torne explícito o WARRANT (quase sempre implícito). É a ponte oculta — e o ponto mais frágil.
4. Procure o BACKING do warrant. Ausência aqui é comum e crítica.
5. Cheque o QUALIFIER. Afirmação absoluta ("aumenta") sem hedge é um gap.
6. Cheque o REBUTTAL. Nenhuma condição de exceção reconhecida = um gap.

## Regra de vulnerabilidade

**Menos de 4 dos 6 componentes presentes → argumento VULNERABLE.** Reporte cada componente ausente como um gap numerado:

```
CLAIM:    "Remote work aumenta produtividade"
DATA:     presente (estudos 2020-2021)
WARRANT:  IMPLÍCITO — não declarado          → GAP #1: warrant oculto
BACKING:  AUSENTE                              → GAP #2: warrant sem sustentação
QUALIFIER: AUSENTE (afirmado como absoluto)    → GAP #3: sem hedge de certeza
REBUTTAL: AUSENTE                              → GAP #4: sem condições de exceção
VEREDITO: 2/6 presentes → VULNERABLE
```

## Aplicação a features (não só a argumentos)

Para um requisito de produto, mapeie:
- CLAIM → o que a feature promete.
- DATA → a evidência de que o usuário precisa dela.
- WARRANT → por que essa feature resolve essa necessidade.
- BACKING → validação (pesquisa, dado de uso) do warrant.
- QUALIFIER → para quais usuários / em que contexto.
- REBUTTAL → quando a feature não serve / pode prejudicar.

Uma feature com warrant oculto e sem backing é exatamente uma feature construída por suposição — o gap mais caro de fechar tarde.
