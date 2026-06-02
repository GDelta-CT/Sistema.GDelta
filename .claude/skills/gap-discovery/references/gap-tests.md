# Testes de gap

Cinco testes operacionais. Cada um que uma afirmação falha é um gap a reportar (com severidade e fechamento). Rode os que a natureza da afirmação pede.

---

## Teste 1 — Base-rate (calibração)

Detecta overconfidence: a confiança declarada destoa da frequência real.

```
CLAIM: "Minha startup será lucrável em 6 meses"   CONFIANÇA DECLARADA: 85%
Q: De todas as startups, que fração chega à lucratividade em 6 meses?  → ~5-10%
DELTA: 85% - 7% = 78 pontos  → OVERCONFIDENCE MASSIVA
GAP: a estimativa ignora a base-rate.
```

**Marcador:** delta entre confiança declarada e base-rate > 20 pontos → gap de calibração.

---

## Teste 2 — Falsificabilidade

Detecta afirmações que não podem ser testadas (logo, não são conhecimento empírico).

```
Q1: Que observação específica CONTRADIRIA isto?
Q2: Isso já foi testado?
Q3: A afirmação se atualizou com o resultado, ou explicou-o para longe?
```

Se nenhuma observação contradiz, ou se toda falha é "explicada para longe" (immunization), há gap de testabilidade. Predições vagas o bastante para nunca errar (efeito Barnum) = gap.

---

## Teste 3 — Hierarquia de evidência (overclaim)

Detecta força de afirmação maior que a força da evidência.

```
CLAIM: "Café CAUSA câncer de pâncreas"   (palavra "causa" = escada causal nível 2+)
EVIDÊNCIA: "um estudo observacional mostrou associação"  (nível 1, só associação)
ALINHAMENTO: OVERCLAIM → GAP
O que falta para fechar: RCT (inviável aqui) OU modelo causal controlando confounders (ex.: fumo).
```

Mapeie a força da claim (associação / intervenção / contrafactual) contra o nível da evidência (meta-análise → RCT → coorte → caso-controle → série → anedota → opinião → especulação). Desalinhamento = gap. (Detalhe da hierarquia em `reasoning-toolkit/seven-pillars.md`.)

---

## Teste 4 — Loops sistêmicos ausentes

Detecta gaps estruturais em sistemas (o que falta para o sistema se auto-corrigir).

```
SITUAÇÃO: "Crescemos 20% ao mês mas o suporte está afogado"
Q: A carga do suporte é visível para o time de crescimento?  → Não  → falta FLUXO DE INFORMAÇÃO
Q: Existe regra acoplando crescimento à capacidade de suporte?  → Não  → falta REGRA DO SISTEMA
Q: Sucesso é "taxa de crescimento" ou "crescimento × qualidade"?  → só taxa  → META DESALINHADA
GAPS: fluxo de informação, regra de acoplamento, alinhamento de meta.
```

Procure: fluxos de informação ausentes, regras de acoplamento ausentes, metas que otimizam a coisa errada. São pontos de alavancagem (Meadows).

---

## Teste 5 — Os 9 padrões de Nous

Passe o raciocínio pelos 9 filtros (ver `reasoning-toolkit/seven-pillars.md`): clarity, precision, accuracy, relevance, depth, breadth, logic, significance, fairness. Cada falha = gap.

```
RACIOCÍNIO: "Devo aceitar a vaga porque investi 2 anos procurando"
4. RELEVANCE: investimento passado é relevante para a decisão? NÃO — sunk cost. → GAP
5. DEPTH: discutiu qualidade da vaga, salário, fit? NÃO. → GAP
6. BREADTH: considerou alternativas? NÃO. → GAP
7. LOGIC: "tempo investido → devo aceitar" segue? NÃO — non sequitur. → GAP
9. FAIRNESS: racionalizando o que já quero? SIM. → GAP
SCORE: 4/9 → FAILED.  Fix prioritário: padrão 4 (relevância) — avalie a vaga por mérito próprio.
```

---

## Saída

Para cada gap encontrado:

```
GAP #n  [Critical|Major|Minor]
  Onde:      <file:line ou componente>
  Teste:     <qual teste o revelou>
  Evidência: <o fato que prova o gap>
  Fechamento: <exatamente o que falta para fechá-lo>
  Confiança: <High|Moderate|Low|Speculative> — <razão>
```
