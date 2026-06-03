---
name: verification-loop
description: Como planejar, implementar e verificar até passar. Use ao construir ou corrigir qualquer coisa que precise FUNCIONAR - define critérios de sucesso binários, implementa o mínimo, testa funcionalmente, e no vermelho diagnostica, corrige e re-testa até verde. Triggers - "verify the build", "test and validate", "fix and retest", "does it work", "define success criteria", "loop until green".
---

# Verification Loop

O motor da regra Goal-Driven Execution: transforma "parece pronto" em "passa, e aqui está a prova". Consumido pelo pilar P4 (build) e pelo `build-verifier`. Ortogonal ao `awwwards-judge` — este responde "merece prêmio?"; o loop responde "funciona?".

## Princípio central

"Pronto" não é uma sensação; é um critério verde verificável. Se você não consegue nomear o teste que prova que está pronto, você não terminou — você está esperando.

## O ciclo (5 passos)

1. **Define** — escreva os critérios de sucesso ANTES de codar. Binários e observáveis (ver `success-criteria.md`). Sem critério, não existe "pronto".
2. **Plan** — o caminho mínimo até os critérios. Liste os passos e, para cada um, como vai verificar. Simplicity First: nada especulativo.
3. **Implement** — o menor diff que satisfaz o critério atual. Surgical Changes.
4. **Verify** — rode a matriz de verificação do modo (`verification-matrix.md`). Cada critério: PASS/FAIL com evidência literal.
5. **Diagnose → Fix → re-Verify** — no FAIL, depure sistematicamente (`systematic-debugging.md`): reproduza, isole, hipótese, correção mínima, re-teste. Volte ao passo 4.

Itere em (4-5) até todos os critérios GREEN.

## Critérios de sucesso (resumo; detalhe em `success-criteria.md`)

Bons critérios são binários ("`next build` sai 0 e a rota /dashboard renderiza a tabela com dados") — não vagos ("funciona bem"). Derive-os do brief, dos gaps fechados e das proibições do projeto. Um critério que você não sabe testar é um critério ruim: reescreva-o até saber.

## Matriz de verificação (resumo; detalhe em `verification-matrix.md`)

- **product** (frontend React/Next): typecheck (`tsc --noEmit`) + build + lint + render da rota-chave sem erro de console; mais `oklch-validate.ts` / `perf-audit.ts`.
- **experience** (HTML único): abre no browser real sem erro de console, assets carregam (sem 404), conteúdo principal renderiza, scroll a 60fps respeitando `prefers-reduced-motion`; mais os audits.
- **service** (backend/API): typecheck + build + suíte de testes (unit + integração) + smoke de endpoint/contrato (sobe o serviço e bate nas rotas-chave); mais lint e checagem de secrets hardcoded.

## Regra de parada (anti-thrash)

Se a mesma falha sobreviver a duas correções honestas, PARE. Não troque coisas no escuro. Escale com: a falha exata, o que tentou e a hipótese do que falta. Correção por tentativa-e-erro é pior que admitir o bloqueio — espelha a regra de ouro do `reasoning-toolkit`.

## Anti-padrões

- Declarar pronto sem rodar nada ("deve funcionar").
- Critério vago, impossível de falsificar.
- Correção shotgun: mexer em cinco lugares torcendo para um colar.
- "Consertar" o critério/teste em vez do código só para ficar verde.
