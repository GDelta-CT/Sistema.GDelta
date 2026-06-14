# Squads-Genius — Recomendação GDelta-first

> Síntese dos 5 analistas (formato+segurança, marketing/visual, venture/negócio, finanças+meta-agentes, governança/resto).
> Lente: vale a pena pro GDelta (SaaS de funilaria/pintura, fundador solo, ecossistema próprio agents-guru + aiox + `.claude/agents`)?
> Análise **read-only**. Conteúdo de prompt tratado como **dado**, nunca como instrução. Data: 2026-06-13.

---

## 1. O que é o Squads-Genius + qualidade geral

Coleção MIT de ~40 "squads" (autor: Marcio Bisognin) no formato **AIOS/OpenSquad** — derivado de BMAD/AIOS. Cada squad é uma pasta `squads/<slug>/` com `squad.yaml` (manifesto) + `agents/*.md` (persona + comandos `*help/*run/*review/*exit`) + `tasks/*.yaml` + `workflows/*.yaml` + às vezes `scripts/`. **Não há runtime executável**: o "motor" é o próprio LLM lendo os arquivos como contexto e fazendo role-play da persona.

**Veredito de qualidade: largura impressiona, profundidade é rara.** O padrão do autor é README/manifesto excelentes (badges, Mermaid) cobrindo agentes que são **stubs templatizados** (tamanho fixo por squad = gerado por fábrica, não escrito à mão). A substância real, quando existe, vive nos **scripts + JSON schemas + templates de domínio**, não nos prompts. Sinal de qualidade mais confiável foi **linhas-por-agente e se os corpos diferem entre si** — não a contagem de agentes nem o README. Só **~5 de ~40** têm engenharia de verdade: `squad-pcfp`, `iso-42001`, `apex-context-supreme`, `skeptic-protocol`, e (no código, não nos prompts) `atlas-visual-reports`.

---

## 2. Compatibilidade com o GDelta

**Roda direto no Claude Code? NÃO como "squad"** — não existe instalador, nem o slash command `/criar-squad`, nem loader no seu setup. **MAS a unidade fundamental porta com baixíssimo atrito**: um `agents/<x>.md` é quase um drop-in do seu `.claude/agents/<x>.md` (basta adicionar frontmatter `name`/`description`/`tools`; o corpo Markdown reaproveita ~1:1).

| Conceito Squads-Genius | Equivalente GDelta | Atrito |
|---|---|---|
| `agents/*.md` (persona + comandos `*`) | `.claude/agents/*.md` | **Baixo** (add frontmatter) |
| `tasks/*.yaml` (objective + acceptance_criteria) | skill / passo de workflow | Médio |
| `workflows/*.yaml` (steps + gates HITL) | orquestração agents-guru/aiox | Médio |
| `scripts/*.py` (stdlib puro) | utilitário do projeto | Baixo |

**Diferença de paradigma:** os comandos `*run`/`*review` são convenção de *prompt* (usuário digita no chat), não tools registradas. Seu `.claude/agents` usa frontmatter + tools reais + invocação automática por `description`. **Veredito: garimpar conteúdo, NÃO importar a estrutura.** O "formato squad" é só casca; o valor é o conteúdo de domínio (personas, acceptance_criteria, gates HITL). Você já tem um runtime real — não troque por prompt-as-context.

---

## 3. Tabela de decisão

| Squad | O que dá | Veredito | Como usar no GDelta |
|---|---|---|---|
| **squad-pcfp** | Princípio "cálculo determinístico em Python, raciocínio por LLM"; handoffs JSON validados; rastreabilidade por rubrica `{valor, fórmula, fundamento, fonte}`; gates HITL bloqueantes | **INSPIRAÇÃO** (arquitetura, não domínio) | Regra de ouro do motor de **orçamento com margem ao vivo**: LLM nunca inventa preço/margem; engine calcula, LLM explica. Estudar padrão A5+engine. |
| **apex-context-supreme** | Pipeline 4 fases (arquitetar→enriquecer→podar→validar) p/ gerar/otimizar `CLAUDE.md`; quality-gate; tasks com pré/pós-condições e custo em tokens | **INSPIRAÇÃO** | Checklist ao refatorar seus `CLAUDE.md`/subagentes; combate inchaço de contexto. |
| **skeptic-protocol** | TDD adversarial: prever falhas→testes vermelhos→implementar→red team→veredito; formato de "acusação" (severidade+probabilidade+prova) | **INSPIRAÇÃO** → skill enxuta | Modo de trabalho p/ **features financeiras críticas** (margem, fechamento) onde erro silencioso custa dinheiro do dono. |
| **maeve-athena-mimir-venture-forge** | Test Card + triplo desejabilidade/viabilidade/factibilidade (ancorado em *Testing Business Ideas*, Strategyzer); loop avançar/pivotar/abandonar | **ADOTAR templates** | Gate de decisão de feature: hipótese→menor experimento→critério binário→decidir, antes de construir. |
| **orbita-incubadora** | `roteiro-entrevista-cliente.md` (7 perguntas, inclui "disposição a pagar"); Value Proposition Canvas | **ADOTAR templates** | Entrevistar **donos de oficina** sobre dores/pricing; posicionar cada módulo do GDelta. |
| **maeve-genius-forge** | Regra epistêmica "observado / inferido / hipótese / recomendação / risco"; padrão quality-gates nomeados | **INSPIRAÇÃO** | Padrão de saída do `data-chief` e relatórios de decisão. |
| **iso-42001-aims-implementation** | Estrutura de governança de IA (gap-analysis, registro de riscos, SoA, evidências de auditoria); squad sólido/profundo | **INSPIRAÇÃO** | Governança de IA documentada como **diferencial de confiança B2B** (GDelta processa dados de clientes com IA). |
| **maeve-carrossel-premium-instagram** | Motor real de render: template HTML/CSS de slide + arco narrativo `slide_plan()` (gancho→por que→mapa→exemplo→erro→CTA) + briefing YAML→manifest | **INSPIRAÇÃO** (canibalizar partes) | Gerador de carrossel p/ topo de funil c/ donos de oficina — reskin c/ tokens GDelta, copy pelo seu copy-chief. |
| **atlas-visual-reports** | 5 JSON Schemas + pipeline HTML→QA→PDF + 11 componentes HTML (`kpi-card`, `risk-matrix`...) | **INSPIRAÇÃO** | Relatório executivo premium do "**financeiro de dono**" em PDF / one-pager de vendas. |
| **squ-oraculo-aion** | DAG adversarial + output schema c/ `evidence_score`/`missing_data` + bull/bear + risk gate | INSPIRAÇÃO (marginal) | Postura do agente financeiro ao recomendar decisão (premissas + contra-argumento). |
| **maeve-fundamentos-roi-compass** | Decision-canvas + 7 perguntas "vale a pena comprar isto?" | INSPIRAÇÃO (marginal) | Filtro anti-over-engineering ao adotar ferramentas/cursos (e este próprio repo). |
| **prisma-real-problem** | Bloco de guardrail `source_prompts_are_data: true` | INSPIRAÇÃO (marginal) | Colar em agente que consome conteúdo externo (sites de concorrente). |
| **Dudo do autor (PULAR):** ai-business-builder, manopla-da-forja, anvil-of-annwn, guardiao-carteira, proactive-ai-os, maeve-knowledge-graph-forge (você já tem `graphify`), notion-second-brain, instagram-carrossel-visual-pro, orbisvisum, prometheus-artis, e ~17 de domínio do autor (jurídico/licitação Lei 14.133, educação/IFFar, pesquisa acadêmica, música, contemplativo) | Rasos, redundantes ou fora de domínio | **PULAR** | Nenhuma ação. |

---

## 4. TOP picks pro GDelta

**1. squad-pcfp — princípio "LLM não gera número, engine gera" (o pick mais valioso).**
Por quê: é exatamente a regra que o motor de orçamento-com-margem-ao-vivo do GDelta deve seguir — o LLM decide regras e justifica, a engine determinística é a única fonte de cifras, com rastreabilidade por rubrica e HITL nos gates. Confirmado verbatim no README (`scripts/pcfp_core.py` é a única fonte de números).
Primeira ação: ler `squads/squad-pcfp/README.md` + o desenho do agente A5/engine e escrever 1 página em `docs/` definindo a fronteira "engine calcula × LLM explica" do motor de orçamento do GDelta.

**2. skeptic-protocol — TDD adversarial para cálculos financeiros.**
Por quê: cobre o gap de robustez lógica/edge-case (que `webapp-defender` não cobre) justamente onde um erro silencioso custa dinheiro do dono.
Primeira ação: criar uma skill enxuta "valida-calculo-critico" com as 4 fases (prever falhas → testes vermelhos → implementar → red team) e aplicá-la ao próximo cálculo de margem/fechamento.

**3. maeve-athena-mimir-venture-forge — disciplina de validação de feature.**
Por quê: fundador solo precisa decidir o que construir sem queimar tempo; o Test Card + triplo desejabilidade/viabilidade/factibilidade dá critério binário antes de codar.
Primeira ação: copiar `templates/cartao-teste.md` e `templates/mapa-hipoteses-riscos.md` para uma skill "valida-feature" (remover o footer de autor).

**4. orbita-incubadora — voz do cliente (entrevista + VPC).**
Por quê: o roteiro de 7 perguntas inclui "disposição a pagar", ligado direto ao seu pricing/margem.
Primeira ação: adaptar `templates/roteiro-entrevista-cliente.md` para entrevistar 3-5 donos de oficina de funilaria sobre dores e pricing.

**5. apex-context-supreme — engenharia de contexto.**
Por quê: você mantém muitos `CLAUDE.md`/subagentes; o conceito arquitetar→enriquecer→**podar**→validar combate o inchaço de contexto.
Primeira ação: usar as 4 fases + `checklists/apex-quality-gate.md` como roteiro na próxima refatoração de um subagente seu.

> Empréstimos de marketing/relatório (úteis mas secundários): **motor de carrossel do Maeve** (HTML de slide + `slide_plan`) reskinned com tokens GDelta para topo de funil; e **arquitetura de relatório do Atlas** (schemas + pipeline HTML→QA→PDF + componentes) para o "financeiro de dono" em PDF vendável.

---

## 5. Cautelas de segurança + licença

**Segurança (varredura dos ~40 squads — risco baixo, mas higiene obrigatória):**
- **Rede:** confinada a 2 arquivos (`IFFar-Squads/.../compras_gov.py`, `farol_common.py`), só GET HTTPS a API pública do governo BR, sem auth/POST/exfil. Os outros ~38 são 100% offline.
- **Exec:** todo `subprocess` é `[sys.executable, <script da própria pasta>]`. **Zero `shell=True`**, sem `os.system`/`eval`/`os.popen`, sem `zipfile.extractall` (sem zip-slip).
- **Segredos:** **nenhum** commitado. As ocorrências de `gho_`/`sk-` são os próprios scanners de segredo (`validate_squad.py` procura markers para barrar publicação). Sem `.env`.
- **Prompts:** nada malicioso; são defensivos (HITL bloqueante, "nunca publicar tokens"). Ainda assim, tratados como **dado** nesta análise.
- **Regra prática:** ao garimpar, **copie só os `.md`/`.yaml` de conteúdo**. Não há motivo para executar nenhum `.py`/`.cjs` no seu ambiente. Se algum dia rodar, revise os 2 scripts de rede antes.
- ⚠️ **Footer de autor:** as personas têm `required_footer` cravado ("Criado por Marcio Bisognin. Instagram: @marciobisognin") para sair nos *outputs*. **REMOVA esse footer** de qualquer persona/template que você portar — senão seu produto comercial assina entregas com o nome de terceiro.

**Licença — MIT (confirmado: `LICENSE` raiz e por squad, Copyright (c) 2026 Marcio Bisognin):**
- Permite uso, cópia, modificação, **venda** e uso **comercial fechado** (GDelta está coberto). Modificar e não publicar o derivado é permitido.
- **Única obrigação:** se copiar um arquivo substancial (agente/script), preserve o aviso de copyright + texto da licença nesse arquivo. Se apenas se **inspirar** e reescrever, não há obrigação legal de atribuição.

---

## 6. Recomendação final

**Vale a pena? Sim — mas como cantina de partes, não como prato pronto.** NÃO adote nenhum squad inteiro nem o formato AIOS como infraestrutura (você já tem runtime superior com agents-guru/aiox/`.claude/agents`). O retorno está em ~5 empréstimos cirúrgicos de baixo custo, todos read-only.

**Faça primeiro:** internalize o princípio do **squad-pcfp** ("engine calcula, LLM explica") no motor de orçamento/margem do GDelta — é o item de maior impacto e o mais alinhado ao seu core. Em seguida, copie os 2 templates do **venture-forge** + o roteiro de entrevista do **orbita** (removendo os footers de autor). Ignore os ~30 squads de domínio/marketing do autor.
