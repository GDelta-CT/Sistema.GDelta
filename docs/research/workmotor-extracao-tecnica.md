# WorkMotor — Extração Técnica para o GDelta

**Documento de pesquisa competitiva · Síntese das 4 frentes · 2026-06-27**
**Alvo:** WorkMotor / "OS Digital" (Work Inovação — workg.com.br) · 30+ anos · oficina mecânica + funilaria/pintura + autopeças/lojas de peças.
**Objetivo:** extrair o melhor do WM (features, UX, fluxos, integrações) e mapear cada extração para um módulo do GDelta; marcar onde o GDelta já ganha; tirar lições para o módulo PEÇAS; usar fraquezas do WM como brechas.

> **Convenção:** **[FATO]** = afirmação com fonte pública · **[INFERÊNCIA]** = leitura/dedução nossa.
> **Honestidade sobre limites:** o miolo do produto WM (telas reais de orçamento, OS, financeiro, comissão, se existe qualquer cronômetro) está **atrás de login** em `gestao.workmotor.com.br` / `app.workmotor.app`. A [DEMO pública](https://demo.workmotor.com.br/) **não é o sistema rodando** — é uma landing com mini-demos guiadas (cadastro por placa, venda/orçamento, similaridade de peça, PDV de autopeças), sem pátio/checklist/comissão/financeiro/tempo. Logo, detalhes finos de UX vêm de **marketing/blog do próprio WM**, tratados como [FATO sobre o que o WM declara ter], não como verificação de funcionamento.

---

## 1. O que é o WorkMotor (+ veredito)

O WorkMotor (produto "OS Digital", da Work Inovação) é um **ERP brasileiro de 30+ anos para oficina mecânica, funilaria/pintura e autopeças**, que migrou de desktop para web e cobre o ciclo inteiro: orçamento → OS → nota fiscal (NFS-e/NF-e/NFC-e) → estoque → financeiro/DRE, com um braço forte de **autopeças** (PDV, catálogo Fraga, cotação online multi-fornecedor por placa). É completo e fiscalmente sólido, mas mostra **lucro de forma retrospectiva** (relatório/DRE pós-fechamento), não em tempo real durante o orçamento.

**Veredito de maturidade/força:** **maduro e amplo, porém legado.** Forte em cobertura funcional, fiscal e no fluxo de autopeças; fraco em UX moderna, confiabilidade/billing e em inteligência em tempo real. Reputação pública **"RUIM" no Reclame Aqui (~5,8/10, nota do consumidor 2,3, 41 reclamações em 6 meses)** [FATO — [Reclame Aqui](https://www.reclameaqui.com.br/empresa/workmotor-workgroup/)]. É o piso de paridade que o GDelta precisa alcançar em fiscal/pipeline, e o teto que o GDelta supera em lucro ao vivo, tempo medido e marketplace de usado.

---

## 2. TABELA de extração por módulo do GDelta

**Legenda "quão forte":** ★ fraco · ★★ médio · ★★★ forte (referência de mercado).
**Veredito:** **ADOTAR** (copiar/igualar) · **SUPERAR** (fazer melhor com nosso diferencial) · **IGNORAR** (já vencemos ou não vale).

### 2.1 Administrativo (Orçamento · OS · Fiscal · Estoque · Financeiro)

| Feature do WM | Quão forte | GDelta tem? | Veredito | Como aplicar no GDelta |
|---|---|---|---|---|
| **Pipeline Orçamento → OS → Nota sem redigitar** [FATO — [blog NF](https://workmotor.com.br/2025/09/10/nota-fiscal-oficina-mecanica/)] | ★★★ | Parcial (contrato prevê: orçamento aprovado promove OS; OS → nota via agregador) | **ADOTAR** | Garantir que `orcamentos.status=aprovado` gere/atualize `ordens_servico` herdando cliente/veículo/itens, e que a OS dispare a nota no agregador sem retrabalho. É a espinha esperada (Doc 5, §4, §5, §7). |
| **NFS-e (serviço) + NF-e (peça) híbrida na mesma OS, imposto automático por regime** [FATO — [blog NF](https://workmotor.com.br/2025/09/10/nota-fiscal-oficina-mecanica/)] | ★★★ | Previsto (§7), provável gap atual | **ADOTAR** | Caso exato de funilaria (mão de obra + peças). Terceirizar ao agregador (Focus NFe / Nuvem Fiscal / PlugNotas). É pré-requisito de mercado, não diferencial. **Maior gap de paridade.** |
| **Fechamento da OS dispara baixa de estoque + comissão + caixa + DRE (atômico, tempo real)** [FATO — [blog 6 relatórios](https://workmotor.com.br/2026/05/18/patio-cheio-caixa-vazio-relatorios-financeiros-oficina/)] | ★★★ | Parcial (baixa por OS prevista §6; financeiro derivado §8) | **SUPERAR** | Trigger no fechamento da OS: 1 transação grava baixa de insumo **custeada por fórmula/grama**, comissão, lançamento de caixa e linha de DRE. A margem ao vivo do orçamento vira o **realizado**. |
| **6 relatórios financeiros** (DRE · fluxo previsto×realizado · ticket médio · produtividade/comissão · Curva ABC de insumos · plano de contas/centro de custo) [FATO — [blog 6 relatórios](https://workmotor.com.br/2026/05/18/patio-cheio-caixa-vazio-relatorios-financeiros-oficina/)] | ★★★ | Parcial (DRE, fluxo, aging, ranking já no §8) | **ADOTAR + SUPERAR** | É a tabela mínima de BI que a oficina-piloto já espera. Acrescentar o que é nativo nosso: margem realizada vs orçada por OS e custo real de MO via **tempo medido**. |
| **Importação de XML de NF-e de compra → entrada de estoque + custo médio** [FATO — [osdig.com.br](https://osdig.com.br/), Essencial+] | ★★ | Não no contrato | **ADOTAR** | Importar XML da NF-e de compra para dar entrada de peça/insumo e atualizar `custo_medio` automaticamente. Mantém o custo honesto — pré-requisito de margem ao vivo confiável. Tira digitação. |
| **Curva ABC + alerta de estoque mínimo + giro** [FATO — [gestao](https://gestao.workmotor.com.br/)] | ★★ | Alerta mínimo previsto (§6) | **ADOTAR + SUPERAR** | Para tinta, mínimo em **gramas/ml**, não em unidades. ABC para evitar "capital prisioneiro". Ganho rápido com granularidade diferenciada. |
| **Contas a pagar/receber + agrupamento de títulos + regime caixa×competência** [FATO — [blog fluxo](https://workmotor.com.br/2026/05/06/como-montar-fluxo-de-caixa-confiavel/)] | ★★ | `lancamentos_financeiros` previsto (§8) | **ADOTAR** | Agrupar títulos por fornecedor/vencimento; recebível de cartão ≠ caixa imediato. Conciliação bancária é gap provável do WM — possível ponto de superação. |
| **Ticket médio separado Vendas vs O.S. + dashboards prontos** [FATO — [gestao](https://gestao.workmotor.com.br/)] | ★★ | Parcial | **ADOTAR** | Métrica simples de alto valor percebido; somar ticket médio e margem média por OS/mecânico ao painel. Esforço baixo. |
| **"Calculadora de preços" (markup no cadastro do produto)** [FATO — [os-digital](https://workmotor.com.br/os-digital/)] | ★★ | Sim, e melhor (margem ao vivo §4) | **IGNORAR** | É precificação **estática** no cadastro. GDelta recalcula margem ao vivo no orçamento — já superamos. |
| **Custeio de tinta por fórmula/grama/máquina tintométrica** | — (WM **não tem**) [INFERÊNCIA alta — ausência em todas as fontes; quem tem são concorrentes de funilaria como [Hammer](https://hammersystem.com.br/) e Ultracar] | Previsto (§6: tinta como custo de serviço) | **IGNORAR (já ganhamos)** | Não copiar — é buraco do WM. É onde o GDelta passa à frente de todo o mercado de funilaria genérico. |

### 2.2 Operacional (Totem / chão de fábrica · pátio · checklist)

| Feature do WM | Quão forte | GDelta tem? | Veredito | Como aplicar no GDelta |
|---|---|---|---|---|
| **Checklist digital de ENTRADA com fotos pelo celular** (km, combustível, avarias, fotos de todos os ângulos, segurança jurídica) [FATO — [checklist funilaria](https://workmotor.com.br/2026/04/29/checklist-funilaria-e-pintura-guia-pratico/)] | ★★★ | **Não** (gap real) | **ADOTAR** | Nova tabela `os_checklists` (`os_id`, `tipo` entrada\|saida, `km`, `combustivel`, `avarias` json, `fotos[]` no Storage, `assinatura_cliente`). Captura mobile no Totem; amarra em `veiculos` (histórico por placa) e `seguradora_perfil`. |
| **Envio do checklist por WhatsApp ao cliente/seguradora** (acelera autorização) [FATO — [checklist funilaria](https://workmotor.com.br/2026/04/29/checklist-funilaria-e-pintura-guia-pratico/)] | ★★★ | Não, mas temos o canal (Delta) | **SUPERAR** | Disparar checklist/laudo pelo **Delta** com 1 toque. Onde o WM "envia link", nós temos bot nativo. |
| **Checklist de SAÍDA / qualidade na entrega** (textura de pintura, limpeza, alinhamento) [FATO — [checklist funilaria](https://workmotor.com.br/2026/04/29/checklist-funilaria-e-pintura-guia-pratico/)] | ★★ | Não, mas temos a etapa Qualidade | **SUPERAR** | Encaixar na etapa **Qualidade** (que o WM nem tem): checklist de saída obrigatório antes de Entrega, com foto comparativa entrada×saída. |
| **Assinatura digital da OS na tela + aprovação digital do orçamento** [FATO — [os-digital](https://workmotor.com.br/os-digital/)] | ★★★ | Não | **ADOTAR** | Aprovação remota (link/WhatsApp) com registro = blindagem jurídica. Combinar com margem ao vivo: cliente aprova, já sabemos que fechou no lucro. |
| **Painel/status do veículo "em tempo real" (na lanternagem/pintura/polimento) — 3 estágios manuais** [FATO — [funilaria](https://workmotor.com.br/2026/05/15/como-montar-administrar-oficina-funilaria-pintura/)] | ★★ | Sim, e muito mais rico (kanban 8 etapas, 4 estados, Realtime) | **SUPERAR (empacotar)** | Não copiar os 3 status manuais. Empacotar o que o Totem já mede num "status público do veículo" para dono/cliente (sem expor o chão de fábrica). Custo baixo, percepção alta. |
| **Comissionamento automático "transparente" por etapa/valor de serviço** [FATO — [gestão de pessoas](https://workmotor.com.br/2026/04/27/gestao-de-pessoas-lideranca-oficina-mecanica/)] | ★★ | Não (mas temos `apontamentos`) | **SUPERAR** | Nova entidade `comissoes` derivada de `apontamentos`. Comissão sobre trabalho **MEDIDO**, não estimado — "justa de verdade". |
| **Desempenho por mecânico** (quem é mais produtivo em cada serviço) [FATO — [gestão de pessoas](https://workmotor.com.br/2026/04/27/gestao-de-pessoas-lideranca-oficina-mecanica/)] | ★★ | Sim, e melhor (tempo medido) | **SUPERAR** | Produtividade real por tempo cronometrado, não por status. Já temos o insumo (`apontamentos`). |
| **Cronômetro / tempo MEDIDO de execução** | — (WM **não tem**) [INFERÊNCIA alta — nenhuma fonte cita timer/cronômetro; só "status em tempo real" e "horas trabalhadas" = apontamento abre/fecha OS] | Sim — núcleo do Totem | **IGNORAR (já ganhamos)** | Relógio do servidor, 2 batidas, teto anti-fantasma ~10,5h. É o fosso. |

### 2.3 Delta (bot WhatsApp)

| Feature do WM | Quão forte | GDelta tem? | Veredito | Como aplicar no GDelta |
|---|---|---|---|---|
| **Entrega de orçamento, OS, nota e checklist por WhatsApp** num clique [FATO — [blog NF](https://workmotor.com.br/2025/09/10/nota-fiscal-oficina-mecanica/), [blog motos](https://workmotor.com.br/2025/07/28/sistema-de-gestao-veja-como-um-software-completo-pode-transformar-sua-oficina-para-motos/)] | ★★★ | Sim (Delta é nativo) | **SUPERAR** | Aprovação, nota, fotos e status fluindo pelo Delta — não "enviar link". Bot embarcado é vantagem nativa. |
| **Link público de acompanhamento da OS por etapa no WhatsApp** [FATO — [blog funilaria](https://workmotor.com.br/2025/08/06/oficina-funilaria-e-pintura-gestao/)] | ★★★ | Não exposto ainda | **ADOTAR** | Expor status público do veículo (do kanban Realtime) via Delta a cada etapa. |
| **Aviso automático "veículo pronto para retirada" + lembrete de no-show/agendamento** [FATO — [agendamento](https://workmotor.com.br/2025/08/11/agendamento-online-oficina-mecanica/)] | ★★ | Não (mas temos a etapa Entrega) | **ADOTAR** | Gatilho na etapa **Entrega** (já existe `prazo_entrega`/`data_entrega_real`) → Delta avisa "seu carro está pronto". Quase de graça. |
| **CRM: lembrete automático de revisão/troca de óleo por WhatsApp (recompra)** [FATO — [demo](https://demo.workmotor.com.br/)] | ★★ | Não | **ADOTAR** | Lembretes de recompra pelo Delta (retenção). Usa histórico por veículo/placa. |
| **Agente de IA no WhatsApp (produto "WorkMotor Marketing" / SMKTY Engage)** [FATO — [lp-workmotor](https://lp-workmotor.vercel.app/)] | ★★ | Sim (Delta) | **IGNORAR (já ganhamos)** | No WM é **produto separado e pago**. No GDelta é embarcado — vantagem estrutural. |

### 2.4 Peças (marketplace usado + novo)

| Feature do WM | Quão forte | GDelta tem? | Veredito | Como aplicar no GDelta |
|---|---|---|---|---|
| **Busca de peça por placa → Aplicação + Similaridade** (peça que serve no carro + equivalente) [FATO — [demo](https://demo.workmotor.com.br/), [cotacao-online](https://workmotor.com.br/cotacao-online/)] | ★★★ | Não | **ADOTAR** | Coração de UX de marketplace. Indexar compatibilidade por `veiculos.fipe_codigo`/marca/modelo/ano. Ao adicionar peça no orçamento, mostrar compatíveis + margem de cada opção (novo vs usado) ao vivo. |
| **Catálogo Fraga integrado** (aplicação por veículo, imagens, specs, similares; atualiza custo/preço no estoque) [FATO — [gestao](https://gestao.workmotor.com.br/), [workg](https://workg.com.br/workmotor/)] | ★★★ | Não | **ADOTAR (lado novo)** | Para o lado NOVO, integrar catálogo de aplicação (Fraga ou equivalente). É o padrão que o cliente já espera. |
| **Cotação Online: RFQ multi-fornecedor por placa, +600 mil peças, respostas consolidadas no app** [FATO — [cotacao-online](https://workmotor.com.br/cotacao-online/)] | ★★★ | Não | **SUPERAR** | WM só cota NOVO com fornecedores. GDelta cota **novo E usado entre oficinas** no mesmo fluxo e joga o melhor preço (com margem ao vivo) direto no orçamento. |
| **PDV de balcão dedicado + código de barras + bifurcação Oficina vs Autopeças** [FATO — [demo](https://demo.workmotor.com.br/), [gestao](https://gestao.workmotor.com.br/)] | ★★ | Não | **ADOTAR (parcial)** | Bifurcação por placa como entrada universal. PDV de balcão se/quando atender lojista de peças. |
| **Integração e-commerce via Tray** (sincroniza para marketplaces) [FATO — [app na Tray](https://aplicativos.tray.com.br/aplicativo/os-digital-workmotor)] | ★★ | Não | **IGNORAR (por ora)** | Integração "fina" via ponte Tray. Ponto de paridade futuro, não prioridade de fundador solo. |
| **Peça USADA / desmonte / sucata** | — (WM **não tem**) [INFERÊNCIA — Fraga e RFQ só cobrem novo] | É o conceito do nosso módulo | **IGNORAR (espaço livre)** | Não há nada a copiar — é o espaço em branco que o GDelta ocupa. |

---

## 3. Top extrações priorizadas (realista para fundador solo)

Ordem por **valor ÷ esforço**, com a 1ª ação de cada.

1. **Checklist digital de ENTRADA com fotos + envio pelo Delta** *(Operacional/Totem — gap real, alto valor jurídico e comercial)*
   **1ª ação:** criar tabela `os_checklists` (`os_id`, `tipo`, `km`, `combustivel`, `avarias` json, `fotos[]` no Supabase Storage, `assinatura_cliente`) e tela de captura mobile no Totem.

2. **Aviso "veículo pronto" + status público da OS pelo Delta** *(Delta — gatilho já existe, quase de graça)*
   **1ª ação:** ao card entrar na etapa **Entrega**, disparar mensagem do Delta ao `cliente.telefone`; reaproveitar o Realtime do kanban para um link de status público.

3. **Pipeline Orçamento → OS → Nota sem redigitar (E2E)** *(Administrativo — espinha dorsal de paridade)*
   **1ª ação:** implementar a promoção `orcamento aprovado → ordens_servico` herdando cliente/veículo/itens (Doc 5, §4) e o stub da chamada ao agregador a partir da OS.

4. **NFS-e (serviço) + NF-e (peça) híbrida com imposto por regime** *(Administrativo/Fiscal — maior gap de paridade; terceirizável)*
   **1ª ação:** abrir homologação em 1 agregador (Focus NFe recomendado) e emitir uma NFS-e + uma NF-e de teste a partir de uma OS.

5. **Fechamento da OS atômico (baixa estoque custeada por fórmula + comissão + caixa + DRE)** *(Administrativo — casa margem ao vivo com realizado; nosso custeio supera o WM)*
   **1ª ação:** escrever a transação Supabase de fechamento que baixa insumo por grama, grava `comissoes`, `lancamentos_financeiros` e linha de DRE numa só operação.

6. **Busca de peça por placa → Aplicação/Similaridade no orçamento** *(Peças — coração de UX do marketplace)*
   **1ª ação:** indexar compatibilidade por `veiculos` (marca/modelo/ano) e, ao adicionar item peça no orçamento, listar compatíveis com margem ao vivo de cada (novo vs usado).

7. **Importação de XML de NF-e de compra → entrada de estoque + custo médio** *(Administrativo — tira digitação, mantém custo honesto)*
   **1ª ação:** parser de XML NF-e que cria `estoque_movimentos` de entrada e recalcula `custo_medio`.

8. **Comissão automática sobre tempo MEDIDO + checklist de SAÍDA na etapa Qualidade** *(Operacional — diferencia por dado que só nós temos)*
   **1ª ação:** derivar `comissoes` de `apontamentos`; adicionar checklist de saída obrigatório antes de marcar Entrega.

---

## 4. Onde o GDelta JÁ GANHA do WM (não copiar)

1. **Margem / lucro AO VIVO no orçamento.** [FATO confirmado nas 4 frentes] O WM mostra lucro **depois** — em relatório/DRE pós-fechamento ([blog motos](https://workmotor.com.br/2025/07/28/sistema-de-gestao-veja-como-um-software-completo-pode-transformar-sua-oficina-para-motos/): "isso acontece na seção de acompanhamento financeiro, não durante a criação da O.S."). Tem só "calculadora de preços" estática no cadastro. Decidir o desconto **vendo a margem despencar em tempo real** é diferencial real e defensável (Doc 5, §4). **Diferencial nº 1 — preservar.**

2. **Tempo MEDIDO (cronômetro / Totem).** [INFERÊNCIA de altíssima confiança — nenhuma fonte pública do WM cita cronômetro/timer; só "status em tempo real" manual e "horas trabalhadas" = apontamento abre/fecha OS] O WM acompanha status à mão e comissiona por valor/etapa. O GDelta cronometra com relógio do servidor, 2 batidas, teto anti-fantasma (~10,5h), retrabalho/complexidade. **É o fosso** — torna comissão e custo de mão de obra **exatos**, não estimados.

3. **ROI ao vivo.** [INFERÊNCIA] Inexistente no WM — eles têm IA descritiva/retrospectiva, não simulação prospectiva.

4. **Custeio de tinta por fórmula/grama (estoque fracionado).** [INFERÊNCIA alta — ausente em todas as fontes do WM; concorrentes de funilaria como [Hammer](https://hammersystem.com.br/) e Ultracar têm] O WM trata insumo como item de estoque genérico. O GDelta amarra consumo de tinta/primer/lixa ao **custo real** daquela OS (Doc 5, §6) — passando à frente de todo o mercado de funilaria genérico.

5. **Kanban 8 etapas + 4 estados do operário ao vivo** vs **3 status manuais** do WM (na lanternagem/pintura/polimento).

6. **Métrica "dias na oficina × R$ do orçamento"** (barato-lento × caro-rápido) — só possível porque o GDelta mede tempo; o WM não tem o insumo (Doc 5, §5).

7. **Bot WhatsApp nativo (Delta)** vs WM por **links/lembretes**; o agente de IA real do WM é **produto separado e pago** (WorkMotor Marketing).

8. **Stack cloud-native sem legado.** O WM arrasta migração desktop→web mal-resolvida e dívida técnica de 30 anos; o GDelta nasce Next.js + Supabase, multi-tenant limpo.

9. **Confiabilidade / billing como vetor de ataque** (ver §6).

---

## 5. Tie-in com o módulo PEÇAS

O que o lado autopeças/fornecedores do WM ensina para o marketplace usado+novo do GDelta:

- **[FATO] A entrada universal é a PLACA.** Todo o fluxo de peças do WM começa na placa → veículo → peças aplicáveis ([demo](https://demo.workmotor.com.br/), [cotacao-online](https://workmotor.com.br/cotacao-online/)). **Lição:** reaproveitar o cadastro `veiculos` (placa/FIPE) como porta única do marketplace.

- **[FATO] Aplicação + Similaridade é o coração, não opcional.** "Esta peça serve neste carro" + "equivalente mais barata" é o que transforma uma lista numa ferramenta ([gestao](https://gestao.workmotor.com.br/), catálogo Fraga). **Lição:** sem matching por aplicação/compatibilidade, um marketplace de peças é só um classificados. Indexar por marca/modelo/ano/FIPE.

- **[FATO] Cotação B2B multi-fornecedor consolidada no app é o padrão de UX.** Placa → dispara RFQ a vários fornecedores → respostas comparáveis numa tela, base de +600 mil peças ([cotacao-online](https://workmotor.com.br/cotacao-online/)). **Lição:** igualar esse fluxo no lado NOVO; é o que o lojista/oficina já espera.

- **[FATO] Entrada por XML de NF-e é higiene obrigatória.** Sem importar XML de compra, lojista não migra (entrada de estoque + custo automático). **Lição:** implementar cedo — também alimenta o custo honesto da margem ao vivo.

- **[INFERÊNCIA] O espaço livre é o USADO/desmonte.** A "Cotação Online" do WM é RFQ de **novo** com fornecedores; Fraga é catálogo de novo. **Não há nada sobre peça usada entre oficinas.** É exatamente onde o GDelta planta bandeira: marketplace **usado + novo**, com cotação que cruza as duas pontas e devolve o melhor preço **já com margem ao vivo** no orçamento — algo que o WM estruturalmente não faz (ele cota, mas não mostra impacto na margem em tempo real).

- **[INFERÊNCIA] A integração e-commerce do WM é "fina" (ponte Tray).** Paridade futura, não prioridade de solo.

**Resumo PEÇAS:** copiar o padrão **placa → aplicação → similaridade → cotação consolidada** (lado novo) e **superar** estendendo ao **usado entre oficinas** + **margem ao vivo na cotação**.

---

## 6. Fraquezas do WM (brechas para o GDelta)

Fonte central: [Reclame Aqui — WorkMotor/WorkGroup](https://www.reclameaqui.com.br/empresa/workmotor-workgroup/) — nota **~5,8/10** ("RUIM"), **nota do consumidor 2,3**, **41 reclamações** em 6 meses, 100% respondidas mas só **70% resolvidas**, tempo médio de resposta ~9 dias. (Há também elogios — clientes de 9 anos satisfeitos — então é polarizado, não unânime.)

| Fraqueza do WM [FATO] | Brecha / postura do GDelta [INFERÊNCIA] |
|---|---|
| **Bloqueio abrupto do sistema** — inclusive em fim de semana e **com pagamento em dia** ([reclamação](https://www.reclameaqui.com.br/workmotor-workgroup/sistema-workmotor-bloqueado_16180094/)) | Disputa de cobrança → **degradar para read-only + export self-service**, **nunca trancar** dado financeiro do tenant. |
| **Tela de cobrança reaparece mesmo após pagamento, bloqueando o uso** ([reclamação](https://www.reclameaqui.com.br/workmotor-workgroup/wkm-bloqueia-sistema-do-cliente-e-mesmo-depois-de-avisada-do-erro-nao-des_KjzsYtzjbGNR44A-/)) | **Billing à prova de bug**: nunca impedir o uso por erro de cobrança; degradar suave. |
| **Bugs recorrentes; updates "pioram a cada atualização"** ([reclamação](https://www.reclameaqui.com.br/workmotor-workgroup/software-com-dezenas-de-erros-e-descaso-no-atendimento-nao-assinem_PETl9VxeggqbONTf/)) | **Estabilidade > features.** Cloud-native, deploy contínuo, releases que não quebram. Maior vantagem barata: não ter os bugs deles. |
| **Suporte ruim — "CHAT NÃO ATENDE", fila de 40+ min** ([reclamação](https://www.reclameaqui.com.br/WorkMotor%20-%20WorkGroup/chat-nao-atende_VoHw-ann7ZC0Jbw6/)) | **Suporte assíncrono pelo próprio Delta** (bot): resposta em segundos onde o WM falha em horas. |
| **Cancelamento difícil + fidelidade 12 meses + retenção de dados** ([reclamação](https://www.reclameaqui.com.br/workmotor-workgroup/impossibilidade-de-cancelamento-e-pessimo-atendimento-work-motor_1k7VZow_rNPvELdi/)) | **Cancelamento self-service + exportação de dados em 1 clique (LGPD)**, sem fidelidade-armadilha. Bandeira anti-WM. |
| **Propaganda enganosa** — "aumente 30% do faturamento em 1 ano ou dinheiro de volta" ([reclamação](https://www.reclameaqui.com.br/workmotor-workgroup/propaganda-enganosa_13973020/)) | **Honestidade no marketing**: prometer clareza/margem/controle (que entregamos), não número garantido. |
| **Dor da migração Desktop → Web** (perda de função, recobrança) | Nascer web limpo; nunca a dívida de portar legado. |
| **App mobile só no plano Completo (R$449); DRE só no Prime** [FATO — [osdig.com.br](https://osdig.com.br/), [gestao](https://gestao.workmotor.com.br/)] | **Não prender no topo o que é diferencial.** Colocar mobile/Totem e margem ao vivo em planos baixos — empacotamento agressivo mata a adoção do WM. |

---

## 7. Fontes

**Site / produto WM**
- [workmotor.com.br](https://workmotor.com.br/) · [Quem Somos](https://workmotor.com.br/quem-somos/) · [OS Digital](https://workmotor.com.br/os-digital/) · [gestao.workmotor.com.br](https://gestao.workmotor.com.br/) · [app.workmotor.app](https://app.workmotor.app/)
- [workg.com.br/workmotor](https://workg.com.br/workmotor/) (Work Inovação) · [osdig.com.br](https://osdig.com.br/) (instância/clone, pricing) · [DEMO](https://demo.workmotor.com.br/)
- [Cotação Online](https://workmotor.com.br/cotacao-online/) · [App na loja Tray](https://aplicativos.tray.com.br/aplicativo/os-digital-workmotor) · [WorkMotor Marketing (produto separado)](https://lp-workmotor.vercel.app/)

**Blog WM**
- [Nota fiscal oficina](https://workmotor.com.br/2025/09/10/nota-fiscal-oficina-mecanica/) · [Sistema p/ motos](https://workmotor.com.br/2025/07/28/sistema-de-gestao-veja-como-um-software-completo-pode-transformar-sua-oficina-para-motos/) · [Funilaria e pintura (montar/administrar)](https://workmotor.com.br/2026/05/15/como-montar-administrar-oficina-funilaria-pintura/) · [Oficina funilaria e pintura (gestão)](https://workmotor.com.br/2025/08/06/oficina-funilaria-e-pintura-gestao/)
- [Checklist funilaria/pintura](https://workmotor.com.br/2026/04/29/checklist-funilaria-e-pintura-guia-pratico/) · [Checklist organização](https://workmotor.com.br/2025/02/17/checklist-essencial-para-manter-as-oficinas-organizadas-e-em-dia/) · [Gestão de pessoas/comissão](https://workmotor.com.br/2026/04/27/gestao-de-pessoas-lideranca-oficina-mecanica/) · [Produtividade da equipe](https://workmotor.com.br/2026/01/12/como-aumentar-produtividade-equipe-oficina/)
- [Agendamento online](https://workmotor.com.br/2025/08/11/agendamento-online-oficina-mecanica/) · [6 relatórios financeiros](https://workmotor.com.br/2026/05/18/patio-cheio-caixa-vazio-relatorios-financeiros-oficina/) · [Fluxo de caixa](https://workmotor.com.br/2026/05/06/como-montar-fluxo-de-caixa-confiavel/) · [Gestão de estoque](https://workmotor.com.br/2025/02/03/conheca-as-melhores-praticas-para-gestao-de-estoque-em-oficinas/) · [Como escolher software](https://workmotor.com.br/2026/01/22/como-escolher-software-para-oficina-mecanica/)

**Reclame Aqui (fraquezas)**
- [Empresa WorkMotor/WorkGroup](https://www.reclameaqui.com.br/empresa/workmotor-workgroup/) · [Lista de reclamações](https://www.reclameaqui.com.br/empresa/workmotor-workgroup/lista-reclamacoes/)
- [Sistema bloqueado](https://www.reclameaqui.com.br/workmotor-workgroup/sistema-workmotor-bloqueado_16180094/) · [WKM bloqueia sistema](https://www.reclameaqui.com.br/workmotor-workgroup/wkm-bloqueia-sistema-do-cliente-e-mesmo-depois-de-avisada-do-erro-nao-des_KjzsYtzjbGNR44A-/) · [Software com erros](https://www.reclameaqui.com.br/workmotor-workgroup/software-com-dezenas-de-erros-e-descaso-no-atendimento-nao-assinem_PETl9VxeggqbONTf/) · [Chat não atende](https://www.reclameaqui.com.br/WorkMotor%20-%20WorkGroup/chat-nao-atende_VoHw-ann7ZC0Jbw6/) · [Impossibilidade de cancelamento](https://www.reclameaqui.com.br/workmotor-workgroup/impossibilidade-de-cancelamento-e-pessimo-atendimento-work-motor_1k7VZow_rNPvELdi/) · [Propaganda enganosa](https://www.reclameaqui.com.br/workmotor-workgroup/propaganda-enganosa_13973020/)

**Concorrentes de funilaria (referência de custeio de tinta)**
- [Hammer System](https://hammersystem.com.br/) · [Partsfy — comparativo 4 sistemas funilaria/pintura](https://partsfy.com.br/veja-4-sistemas-de-gestao-para-funilaria-e-pintura-e-escolha-o-melhor/)

**Contrato interno GDelta consultado:** `docs/GDelta-Sistema_05_Requisitos-por-Modulo.md`

---

### Notas de honestidade
- Pricing público encontrado: **Free (R$0) · Start+ R$97 · Essencial R$189,90 · Prime R$297 · Completo R$449** [FATO — osdig/gestao]. O brief mencionava "~R$60/mês" e "4 planos"; o que é público diverge (5 níveis, a partir de R$97/R$189,90). Pode haver promoção sazonal ou empacotamento diferente entre marcas (osdig vs gestao). **Dado a confirmar.**
- As descrições de pátio/checklist/comissão/financeiro vêm do **blog e páginas de produto do próprio WM** (marketing), não de uso real atrás de login. A **ausência de qualquer menção a cronômetro/tempo medido** em todas as fontes é o sinal mais forte de que o WM **não mede tempo** — base da inferência central de §4.
