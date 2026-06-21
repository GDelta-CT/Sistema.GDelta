# GDelta — Battlecard competitivo · vs **Sigma** · vs **Cília**

> Base: [pesquisa Sigma](sigma/sigma-pesquisa-mercado.md) + [pesquisa Cília](cilia/cilia-pesquisa-mercado.md) (jun/2026, fontes citadas + verificação adversarial).
> ⚠️ Preço e base instalada dos **concorrentes** = **INDETERMINADO** — validar em demo/comercial. Não usar números não confirmados (ex.: "4.000 oficinas" do Sigma não confirmado; havia fonte de 2017 com ~400). **Nunca citar nem inventar preço de concorrente.**
> 💲 **Nosso preço está DECIDIDO** (escada modular — ver seção "Nosso pricing" abaixo). Ancoragem 100% em VALOR/ROI; jamais em "mais barato/caro que o Sigma/Cília".

## O mapa em uma frase

- **Cília** = orçamentação/**sinistro** (ponte seguradora). **Não** faz chão de fábrica. Sem API pública. → **conviver / complementar**.
- **Sigma** = gestão **vertical** da oficina (Reparo+), financeiro forte, apontamento **manual**, moat **euBati**. **Não** faz margem ao vivo. → **concorrer no ao-vivo/automático**.
- **GDelta** = **lucro ao vivo no orçamento + chão de fábrica medido (automático) + financeiro de dono com ROI ao vivo**.

---

## ⚔️ vs SIGMA (concorrente direto)

**O que é:** software de funilaria desde 1994. Reparo+ tem "oficina virtual" drag-and-drop COM medição de tempo/produtividade/gargalo; financeiro forte (DRE, margem/carro, fluxo, ponto de equilíbrio); app **euBati** (leads p/ consumidor via GPS + avaliação).

**Moats (respeitar):** euBati (rede de 2 lados — o mais difícil de copiar); 30 anos + pedigree 3M/PPG; base instalada.

**Fraquezas (atacar):** orçamento **importado de fora** → zero margem ao vivo; apontamento **manual** (tempo *digitado* pelo produtivo, sem cronômetro/ponto); cadência de produto baixa; euBati com reclamações ("falha na própria promessa").

**Como o GDelta ganha:**
- **D1 margem ao vivo** → vitória limpa (o Sigma nem é o orçamentador).
- **D3 tempo MEDIDO** (cronômetro + ponto eletrônico) vs **DIGITADO** à mão.
- **D2 ROI / ao vivo** → o Sigma mostra **depois** (relatório pós-fato).

**Não minta (o erro que queima credibilidade):** o Sigma **tem** financeiro forte, **tem** produção (manual) e **tem** euBati. Nunca diga "o Sigma não tem financeiro/produção". Diga: **"o Sigma mostra DEPOIS e à mão; o GDelta mostra NA HORA e sozinho."**

**Resposta ao euBati:** não disputar lead-gen de consumidor (fora de escopo solo). Contra-jogo barato: **"acompanhe seu reparo" via link WhatsApp** — usamos o dado que já temos e entregamos uma fatia do valor do euBati sem precisar da rede.

---

## 🤝 vs CÍLIA (incumbente — conviver)

**O que é:** maior plataforma de orçamentação/sinistro (ponte seguradora), IA de orçamento por foto, ~28 mil oficinas, aporte R$110 mi (2023, Cloud9 + Mercado Livre). O "Kanban" é de **sinistro/atendimento** (status), **não** de produção.

**Não tem:** chão de fábrica (apontamento/ponto/produtividade/gargalo); API pública / programa de parceiros documentado.

**Jogo do GDelta:** **não concorrer** — ser a camada de **chão de fábrica + lucro ao vivo** que lê/integra com o Cília (planilha hoje, API quando houver). Precedente público: o ERP Ultracar já integra com o Cília como complemento.

**Cuidado:** validar via comercial se o Cília realmente não cobre + se há via de integração **antes** de criar dependência arquitetural.

---

## 💲 Nosso pricing (DECIDIDO) — escada modular, ancorada em valor

> Use **estes** números. O preço dos concorrentes é **INDETERMINADO** — nunca compare em R$, compare em **valor/ROI**.

| Plano | O que entrega | R$/mês |
|---|---|---|
| **DELTA** (porta de entrada) | Bot WhatsApp 24h: triagem, agenda, follow-up, primeira resposta na hora | **R$ 997** `[ajustável]` |
| **DELTA + TOTEM** | + chão de fábrica / pátio em tempo real (tempo medido, carro encalhado na hora) | **R$ 1.497** `[ajustável]` |
| **COMPLETO** (plano total) | + Painel + inteligência financeira: margem ao vivo no orçamento, DRE/margem por carro, ROI ao vivo | **R$ 1.997** `[ajustável]` |

- **Setup único:** R$ 1.500 `[ajustável]`.
- **Oferta CO-FUNDADOR** (primeiras oficinas, vagas limitadas): **7 dias grátis + setup GRÁTIS + -30% travado por 12 meses** no plano escolhido. O **preço cheio aparece RISCADO** (efeito âncora): ~~R$ 997~~ · ~~R$ 1.497~~ · ~~R$ 1.997~~.
- **Justificativa de preço = ROI**, não tabela de concorrente: horas salvas (× R$ 85/h) + prejuízo evitado por carro cobrem a mensalidade — é o card "o software se paga", ao vivo na própria tela. Detalhe em [pricing-e-validação](../gtm/pricing-e-validacao.md).

## 🎯 Discovery questions (expõem o gap em campo)

1. "Você vê o **lucro do carro enquanto monta o orçamento**, ou só descobre no fim do mês?"
2. "O tempo de cada etapa é **cronometrado automático** ou alguém **digita** no fim do dia?"
3. "Você tem **ponto eletrônico** dos produtivos ligado à OS?"
4. "Seu sistema te diz **quanto ele te devolve por mês** (ROI)?"

## 🛡️ Objeções

- **"Já uso o Sigma."** → "Ótimo, o Sigma é forte no financeiro **pós-fato**. O GDelta mostra o lucro **na hora** do orçamento e mede o chão de fábrica **sozinho** — você para de digitar tempo e para de descobrir prejuízo tarde demais."
- **"O Sigma tem o euBati pra trazer cliente."** → "E é bom nisso. O GDelta não disputa lead — ele garante que **cada carro que entra dê lucro e saia no prazo**. Lead sem margem é volume sem lucro."
- **"Já tenho o Cília."** → "Perfeito — o GDelta **não substitui** o Cília; mostra o que ele não mostra: **chão de fábrica e lucro ao vivo**. Convivem."
- **"Tá caro / quanto custa?"** → Nunca ancorar em concorrente (preço deles é INDETERMINADO). Ancorar em ROI: "A **entrada é o Delta, R$ 997/mês** — o bot que atende seu WhatsApp 24h e para de perder cliente. O **Completo, R$ 1.997**, te mostra a margem ao vivo no orçamento e o lucro por carro. A conta que importa: se ele te poupa as horas que você hoje gasta na mão e te mostra **um carro de prejuízo por mês que hoje passa batido**, ele já se pagou — está na própria tela, ao vivo." (+ se for dos primeiros: "Como **co-fundador** você entra com **7 dias grátis, setup grátis e -30% travado por 12 meses** — vagas limitadas.")
- **"Vou pensar / depois eu vejo o preço."** → "Tranquilo. Só pra você não perder: a condição de **co-fundador (-30% travado 12 meses + setup grátis)** é pras primeiras oficinas, com vaga limitada. O preço cheio fica ~~R$ 1.997~~ no Completo; quem entra agora trava a condição."

## ✍️ Copy p/ landing/marketing (a aprovar)

- Reforço de assinatura: **"Lucro ao vivo. Tempo medido, não digitado."**
- Bloco "Por que não é mais um sistema de oficina": [lucro na hora do orçamento] · [tempo cronometrado automático] · [ROI ao vivo].

---
_Última atualização: jun/2026. Revisar quando obtivermos preço/cobertura reais via demo dos concorrentes._
