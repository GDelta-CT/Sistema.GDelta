# Rastreamento de dependências

Quatro técnicas para mapear de que algo depende e onde está o ponto de ruptura. Vale para dependências de código (imports, build) e lógicas (premissas, decisões).

## Princípio: a confiança final = o elo mais fraco

Uma conclusão sustentada por uma cadeia não é mais forte que seu elo mais frágil. Rastrear dependências é, antes de tudo, achar esse elo.

---

## Técnica 1 — Cadeia dedutiva numerada + grafo

Construa a cadeia em linhas numeradas; cada passo aponta de quais linhas depende.

```
1. P1: Todos os empreendedores são tomadores de risco        [premissa]
2. P2: Sarah é empreendedora                                  [premissa]
3. Sarah é tomadora de risco                                  [modus ponens: 1,2]
4. P3: Tomadores de risco têm alta tolerância a fracasso      [premissa]
5. Sarah tem alta tolerância a fracasso                       [modus ponens: 3,4]

GRAFO:   P1 ─┐
             ├→ L3 ─┐
        P2 ─┘       ├→ L5 (conclusão)
        P3 ─────────┘

ELO MAIS FRACO: P1 (generalização universal "todos"). Se P1 cai, L3 e L5 caem.
```

Para código: monte o mesmo grafo com módulos/arquivos. `module A → B → C`; se C é instável, tudo a montante herda o risco.

---

## Técnica 2 — Degradação por hierarquia de fonte

Para afirmações transmitidas, a confiabilidade cai a cada salto.

```
L0 estudo original (T2-T3) → L1 paper (−0) → L2 notícia (−0.10, sensacionaliza)
→ L3 influencer (−0.30, remove nuance) → L4 "um amigo disse" (−0.10)
RESULTADO: T2-T3 vira T6 (praticamente sem valor)
RUPTURAS: L2→L3 dropou "raro" e "subgrupo"; L3→L4 virou afirmação absoluta.
```

Rastreie até a fonte original. A dependência crítica é o primeiro salto que perde qualificadores.

---

## Técnica 3 — DAG causal (confounder / mediator / collider)

Para afirmações causais, desenhe o grafo dirigido e classifique cada nó.

```
CLAIM: "Quem bebe café tem mais doença cardíaca, logo café causa"
            Fumo
            /   \
           v     v
       Café ··· DoençaCardíaca

CONFOUNDER: Fumo causa AMBOS → a correlação café↔doença é espúria.
  Dependência: sem controlar Fumo, a inferência é inválida.
MEDIATOR check: café → estresse → doença? (se sim, controlar estresse bloqueia o efeito)
COLLIDER check: controlar um efeito comum (ex.: ansiedade causada por café E estresse)
  CRIA associação falsa — não controle colliders.
POSIÇÃO NA ESCADA: observado = nível 1 (associação); a claim quer nível 2 (causa) sem suporte.
```

---

## Técnica 4 — Breadcrumbs bayesianos

Rastreie como cada evidência moveu a probabilidade.

```
HIPÓTESE: "a startup vai dar certo"
PRIOR: base-rate 10%
E1: "50 beta users entusiasmados"  LR = P(E1|sucesso)/P(E1|¬sucesso) = 0.70/0.20 = 3.5
POSTERIOR após E1: odds 0.11 × 3.5 ≈ 0.39 → ~28%
E2: ...
```

A dependência aqui é o LR de cada evidência. Uma evidência com LR perto de 1 não move nada — é decorativa. Identifique de qual evidência a posterior realmente depende.

---

## Saída

```
DEPENDENCY MAP
  Nós: <lista>
  Arestas: <A → B (tipo: dedutiva|causal|dados|build)>
  ELO MAIS FRACO: <qual> — se cair, derruba: <o que>
  ORDEM DE RESOLUÇÃO: <1º o que destrava mais, ...>
  Confiança do mapa: <label> — <razão>
```
