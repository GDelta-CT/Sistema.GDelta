# Orquestração de IA para acelerar o GDelta — Recomendação Decisiva

> Síntese de 3 análises read-only (Ruflo/claude-flow, Nirvana-OS, Baseline atual).
> Autor: Sintetizador · Data: 2026-06-29 · Para: Eliel (fundador solo, não-técnico)

---

## 1. Veredito em 1 frase

**Fique no setup nativo que você JÁ usa (Claude Code + Workflow + AIOX/SYNAPSE + agentes de oficina + Squads-Genius) — ele é a base mais rápida; o único movimento que acelera é ATIVAR o que já está instalado e dorme (popular o `.synapse/`), não trocar de framework.**

---

## 2. Tabela comparativa

| Critério | Ruflo / claude-flow | Nirvana-OS | **Atual (AIOX + SYNAPSE + Squads-Genius)** |
|---|---|---|---|
| **Ganho real p/ o GDelta** | **Baixo** — paralelismo que você já tem; "roteamento 89%" é regex de ~30 linhas com `confidence: 0.8` chumbado; ~10 de 314 MCP tools funcionam (auditoria abr/2026). | **Baixo** — é orquestração de *negócio* (gerar empresas/squads/mind-clones), não acelera código do app; o `software-forge` é genérico, não conhece Supabase/oficina. | **Alto** — entregou a suíte financeira inteira qa-verde nesta sessão; tem fases + gates + memória + auto-correção + domínio de oficina. |
| **Custo / complexidade** | **Alto** — CLAUDE.md de 1279 linhas, daemon de 10 workers, 367 SKILL.md duplicados estourando contexto, versões despadronizadas (3.14.4/3.10.2/3.6.10/3.6.11), `model: claude-opus-4-7` pinado (quebra silencioso). | **Médio-Alto** — exige runtime Bun (não Node), engine fora do npm baixado por release, runtime headless, vocabulário novo (harness/dispatch/pilares). | **Baixo** — já instalado e rodando; custo marginal de cada feature. Risco real é *excesso de config* não-podada, não falta de capacidade. |
| **Fit p/ solo não-técnico** | **Baixo** — o próprio README abre com "você não precisa aprender 314 MCP tools"; issue #1196 documenta "paradoxo da escolha"; processos pendurados pra gerenciar. | **Baixo** — beta 0.x de autor solo, runtime headless onde o não-técnico *perde* a visibilidade que tem hoje no Claude Code interativo. | **Alto** — interativo, em PT-BR, com agentes que falam a língua do domínio (funileiro, colorista, orçamentista-seguradora). |
| **Manutenção** | **Alto** — daemon com workers a cada 30min-4h = processos pendurados, tokens queimando, ruído (caso real: "100+ hanging processes"). | **Médio-Alto** — refém de repo externo que se auto-atualiza a cada `npx`; 2º runtime pra manter. | **Baixo** — reativo dentro da story; nada roda sozinho consumindo recurso sem você pedir. |
| **Lock-in** | **Alto** — ecossistema próprio (ruv.io, AgentDB, ruvector); install CLI reescreve seu `.claude/`. | **Alto** — engine é **SUL** (não-OSI; usos comerciais exigem licença) + funil pro squads.sh pago. Risco real p/ um SaaS. | **Baixo** — arquivos `.md`/hooks que são seus; Squads-Genius é local e em formato aberto AIOS/OpenSquad. |

**Padrão claro:** os dois candidatos externos são **da mesma categoria** do que você já tem (Ruflo ≈ seu harness AIOX; Nirvana ≈ sua Squads-Genius). Não somam — **competem e substituem**, com mais peso, mais risco e mais lock-in.

---

## 3. Recomendação + porquê

**Decisão: NÃO adotar Ruflo nem Nirvana. Ficar na base e ativar o que já existe.**

Honestidade sobre o brilho dos frameworks: o Ruflo é tecnicamente ambicioso (swarms, memória vetorial, workers de fundo) e o Nirvana tem abstrações elegantes (Empresa/Mind-clone/router paralelo). Mas brilho de arquitetura ≠ velocidade pra *você*. Seu gargalo não é "rodar 15 agentes ao mesmo tempo" — é **clareza de spec + qa-verde**, e isso a base já entrega (foi ela que fez a suíte financeira inteira nesta sessão). Adotar qualquer um dos dois é **trocar a base** (o install CLI do Ruflo reescreve `.claude/`/`CLAUDE.md`/settings; o Nirvana traz 2º runtime + SUL) — exatamente o que sua memória "não reconstruir" veta.

**O que vale a pena pegar emprestado — SEM trocar a base (cirúrgico):**

- **Do Ruflo — só a IDEIA, não o código:** o padrão de **ADR (decisão de arquitetura) como contrato entre agentes paralelos** (visto em `.claude/agents/core/coder.md` do Ruflo). Adote copiando o *padrão* pra um agente/skill da sua Squads-Genius — zero install. Se (e só se) uma lacuna doer de verdade no futuro, o único vetor seguro é **um plugin isolado via Path A** (marketplace de plugins do Claude Code = só slash-commands, zero arquivos no workspace, não mexe no `.claude/`), candidato único `ruflo-cost-tracker`, testado num projeto-sandbox antes. **Nunca o install CLI completo.**
- **Do Nirvana — nada para adotar.** O que ele agrega de útil (construir squads por prosa, com gates e rastreabilidade) você **já tem** na Squads-Genius, em formato compatível (mesma família AIOS/OpenSquad: `squad.yaml`/`agents/`/`tasks/`/`workflows/`) e sem SUL. Gatilho objetivo pra reabrir: só se um dia o objetivo virar "fabricar e *vender* squads/mind-clones como produto" — não é o caso agora.

A maior aceleração disponível hoje é **interna**: o motor SYNAPSE está instalado e o hook roda a cada prompt, mas o diretório `.synapse/` **não existe** no GDelta (confirmado: não está no projeto) — então ele sai em silêncio e o reuso de contexto persistente mais forte da sua base está **dormente**. Ativá-lo é custo ~zero e ganho direto.

---

## 4. Fazer já (2-3 ações pequenas)

1. **Ativar o SYNAPSE** — criar o diretório `.synapse/` no GDelta e popular 1 domínio inicial de oficina (ex.: `financeiro` com as regras do "modelo sem encargos": Custo RH = salário-base, Resultado = Fat − Despesas − Fornecedores). Use a skill `synapse:tasks:create-domain`. Custo ~zero, hook já roda.
2. **Consolidar/podar o `.claude/`** — listar os frameworks/personas sobrepostos e desligar o que nunca é usado, reduzindo a carga cognitiva (a lacuna nº1 da base é *excesso de config*, não falta de capacidade).
3. **Copiar 1 padrão emprestado (sem install)** — adicionar à Squads-Genius a regra de **"ADR como contrato antes de despachar agentes em paralelo"**, para os workstreams paralelos não colidirem em decisões de arquitetura.

---

## 5. O que NÃO fazer

- **NÃO rodar `npx ruflo init`** no GDelta — reescreve seu `.claude/`, injeta CLAUDE.md de 1279 linhas, liga daemon de 10 workers e MCP, e pina `claude-opus-4-7` (quebra silencioso no Windows). É trocar a base por uma com versões despadronizadas e stubs que mentem (security scan fabricado) — perigoso pra um SaaS com dados de oficina (LGPD).
- **NÃO instalar o Nirvana-OS** — 2º runtime (Bun), engine fora do npm que se auto-atualiza, licença SUL (lock-in comercial) e runtime headless onde você perde a visibilidade que tem hoje. É redundante com a Squads-Genius.
- **NÃO cair na armadilha do "framework brilhante"** — adotar peso de orquestração feito pra times de 5+ engenheiros vira manutenção pendurada pra um solo. Mais agentes (125 do Ruflo) onde 8-10 customizados bastam é dispersão, não aceleração.
- **NÃO adicionar antes de consolidar** — cada plugin/ecossistema novo aumenta justamente a sua maior lacuna real (superfície cognitiva). Só puxe peça externa contra uma dor *concreta e medida*, em sandbox, via Path A.
