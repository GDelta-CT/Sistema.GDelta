# GDelta — Mapa de Módulos por Fase
**Documento 3 de 6 · Versão 1.0 · Maio/2026**

> **Premissas herdadas (Doc 1):** sem digitação dupla · substituição módulo a módulo · honestidade de medição · **cada fase construível e vendável sozinha** · premium, não paridade · fiscal via agregador · banco único multi-tenant · **Totem é o módulo nº 1; nada em paralelo**.

---

## Como li o sequenciamento

Três critérios ordenam as fases, nesta prioridade:

1. **Prova de adoção antes de escala de escopo.** Não adianta construir 8 módulos se o dono não abre o sistema. O Totem prova adoção barato; tudo vem depois disso.
2. **Menor dependência do Cília primeiro.** Começar pelos módulos *greenfield* (que nascem dentro do GDelta sem precisar puxar dado de ninguém) evita o gargalo da integração com o Cília logo de cara.
3. **Surfar a janela datada.** A NFS-e nacional (01/09/2026) é evento fixo no calendário — a fase fiscal é posicionada para chegar pronta a tempo de ser gatilho de venda, não depois da onda passar.

Cada fase abaixo é uma **unidade de negócio completa**: dá para construir sozinho, vender sozinho e parar ali sem o produto ficar quebrado.

---

## FASE 0 — MVP · GDelta Totem *(o módulo nº 1)*

**Escopo:** ponto + apontamento + kanban de 8 etapas + painel por papel (os 4 estados do operário; prazo e gargalo). É o roteiro que já existe em código.

**Por que é o MVP (e por que tão estreito):**
- É a frente **já em construção** — respeita o foco solo (não abrir segunda frente).
- Gera o **dado que ninguém tem** (tempo real de produção), que abastece todos os módulos futuros.
- **Critério de sucesso claro e barato:** o dono abre o painel sozinho ≥1×/dia por 2 semanas e diz que pagaria. Isso valida o GDelta **antes** de qualquer outro investimento.

**Vendável sozinho?** Sim — "veja sua produção em tempo real", roda ao lado do Cília.
**Fonte da verdade:** produção, ponto e apontamento nascem no GDelta.
**Gate para avançar:** piloto aprovado no critério de sucesso. *Sem isso, não se inicia a Fase 1.*

---

## FASE 1 — A cunha premium · Orçamento ao vivo + Clientes + Placa/FIPE

**Escopo:** orçamento com peças + mão de obra + insumos e **margem ao vivo**; cadastro de clientes (particular × seguradora); cadastro de veículo por **placa com enriquecimento FIPE**. O orçamento aprovado **promove** a OS mínima do Totem a uma OS completa (Pátio/OS começa a existir de verdade aqui).

**Por que vem agora:**
- É um dos **3 pontos que doem** e o mais "premium" de demonstrar — vende ticket alto sozinho.
- **Greenfield:** orçamento e clientes nascem dentro do GDelta, sem depender de puxar dado do Cília.
- Liga-se naturalmente ao Totem: o carro orçado vira o carro que o operário aponta.

**Vendável sozinho?** Sim — "orce vendo seu lucro, em vez de descobrir depois". Pode ser vendido a quem nem usa o Totem.
**Fonte da verdade:** orçamento, clientes e veículo no GDelta (veículo enriquecido por API de placa/FIPE — consulta, não digitação dupla).
**Gate:** orçamentista monta orçamento mais rápido que no método atual e fecha vendo a margem.

---

## FASE 2 — A onda fiscal · NFS-e via agregador + consolidação do Pátio/OS

**Escopo:** emissão de **NFS-e** (serviço) **via agregador fiscal**, saindo direto da OS — sem redigitar. Consolidação do Pátio/OS como espinha que liga orçamento → produção → nota.

**Por que vem agora (timing é tudo):**
- **01/09/2026** torna a NFS-e nacional obrigatória para ME/EPP do Simples. Esta fase precisa estar pronta **antes** dessa data para ser **gatilho de adoção**, não corrida atrás do prejuízo.
- Quem **registra a nota** controla o dado fiscal — a partir daqui a inteligência financeira para de depender de exportar do Cília.
- **Risco terceirizado:** o agregador (PlugNotas/Tecnospeed, Focus NFe, Nuvem Fiscal ou eNotas) carrega conformidade, certificado A1, layouts municipais e IBS/CBS. O GDelta só faz a chamada.

**Vendável sozinho?** Fortíssimo — "fique em dia com a nota obrigatória de setembro, sem dor de cabeça". É a fase de maior tração potencial.
**Fonte da verdade:** GDelta registra; agregador transmite.
**Gate:** emitir uma NFS-e real de ponta a ponta a partir de uma OS, em homologação do agregador.

---

## FASE 3 — Fechar o ciclo · Financeiro completo + Estoque inteligente + NF-e (peças)

**Escopo:** trazer toda a inteligência da planilha para dentro, agora **alimentada por dado real** (DRE, ponto de equilíbrio, aging, fluxo, **markup real por peça**, semáforo, ranking de clientes, funil); estoque de peças + matéria-prima + escritório com **baixa vinculada à OS**; **NF-e** de peças via agregador.

**Por que por último:**
- O Financeiro completo só é honesto **depois** que orçamento, produção (Totem) e nota já alimentam o sistema — antes disso seria estimativa, e a honestidade de medição proíbe prometer número não medido.
- O estoque fecha o cálculo de **markup real** (consumo de tinta de um serviço entra na margem daquele serviço).
- **É o ponto de virada estratégico:** com financeiro + nota + produção + orçamento dentro do GDelta, o Cília vira **opcional**. A substituição se completa por consequência, não por pitch.

**Vendável sozinho?** Sim — é a realização plena da promessa de marca ("te mostro se valeu a pena"). Maior ticket e maior retenção.
**Fonte da verdade:** GDelta, derivado automaticamente dos módulos anteriores. Zero digitação manual.
**Gate:** o dono toma uma decisão de preço/prazo olhando o financeiro do GDelta — não a planilha antiga.

---

## Visão de uma olhada

| Fase | Módulos | Papel estratégico | Vendável sozinho | Dependência do Cília |
|------|---------|-------------------|------------------|----------------------|
| **0 — MVP** | Totem (ponto, apontamento, kanban, painel) | Provar adoção barato | "Produção em tempo real" | Roda ao lado |
| **1** | Orçamento ao vivo · Clientes · Placa/FIPE | Cunha premium | "Orce vendo o lucro" | Nenhuma (greenfield) |
| **2** | NFS-e via agregador · Pátio/OS consolidado | Surfar a onda fiscal 01/09/2026 | "Nota obrigatória sem dor" | Começa a substituir o fiscal |
| **3** | Financeiro completo · Estoque · NF-e | Fechar o ciclo → Cília opcional | "Saiba se valeu a pena" | Cília vira opcional |

---

## O que fica de fora de propósito (anti-escopo)

- **Folha / espelho de ponto / CLT** — nunca; o ponto é produtividade, não folha (é do contador).
- **Paridade de features com o Cília** — não se persegue; ganhamos por profundidade nos 3 pontos que doem.
- **Conformidade fiscal própria** — sempre via agregador.
- **Multi-frente** — não se inicia uma fase antes do gate da anterior; o fundador solo constrói em série, não em paralelo.

> O **Doc 5 (Requisitos por módulo)** detalha campos/regras/integrações de cada módulo, e o **Doc 6 (Roadmap)** dá a sequência de construção dentro de cada fase, conversando com o roteiro do Totem que já existe.
