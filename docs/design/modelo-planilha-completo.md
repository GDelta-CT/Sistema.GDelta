# GDelta — Modelo de Gestão Completo (extraído da Planilha-Sistema v2.0)

> Fonte: `Dashboard_Gestao_GDelta_AutoRisco.xlsx` — a **própria Planilha-Sistema GDelta v2.0** (Maio/2026, produto comercial, 18 módulos, `contato@gdelta.com.br`, licença por estabelecimento + 12 meses de updates + nota LGPD). "AutoRisco" é a oficina-exemplo dos dados.
> **Por que importa:** é o modelo de gestão **já validado e empacotado pelo fundador** → o **alvo canônico de "GDelta Completo"** que o app web deve alcançar — e superar (a planilha NÃO faz margem ao vivo nem tempo medido; o app faz).

## Os 18 módulos (aba ℹ️ Sobre)
| Módulo | O que faz |
|---|---|
| 📊 Dashboard | Visão consolidada em tempo real, semáforo estratégico, funil de produção |
| 📑 DRE | Demonstrativo de Resultado contábil-padrão (linguagem do contador) |
| 📅 Aging | Idade de recebíveis e pagáveis; provisão de risco por faixa |
| 💵 Fluxo de Caixa | Projeção semanal 60 dias; previne saldo negativo antes de acontecer |
| 🚗 Pátio | Gestão visual de OS por etapa, com alertas de prazo |
| 💰 Receitas | Faturamento, adiantamentos e saldos por OS |
| 🎯 Orçamentos | Pipeline comercial — conversão e ticket médio por canal |
| 🧾 Fornecedores | Contas a pagar com status e prazos |
| 💸 Despesas | Variáveis (caixa) e fixas mensais |
| 👥 RH | Folha (INSS, FGTS, férias, 13º) + metas Bronze/Prata/Ouro |
| 📈 KPIs | Indicadores estratégicos vs. metas configuráveis |
| 📞 Clientes | Cadastro de clientes/seguradoras com histórico |
| 📅 Histórico · ⚙️ Configurações · ⚙️ Listas · 📋 Instruções | Suporte/config |

## KPIs estratégicos com metas + semáforo (aba 📈 KPIs)
| KPI | Meta | O que mede |
|---|---|---|
| Tempo Médio de Permanência (dias) | **< 25** | quanto cada carro fica na oficina |
| % OS no Prazo | **> 90%** | OS dentro do prazo contratado |
| Taxa de Retrabalho | **< 5%** | carros que voltaram |
| Faturamento por Funcionário (mês) | **> R$ 8.000** | receita ÷ funcionários |
| Ocupação do Pátio | **70–85%** | boxes ocupados ÷ total |
| % Faturamento de Particulares | **> 20%** | diversificação além de seguradoras |
| Concentração do Maior Cliente | **< 40%** | risco de dependência |
| Margem Líquida | **> 20%** | resultado ÷ receita |
| Custo RH / Faturamento | **< 40%** | quanto da receita vai pra folha |

Status: ✅ atingida · ⚠️ atenção · 🔴 abaixo (por % de atingimento vs. meta).

## DRE (estrutura contábil — aba 📑 DRE)
```
RECEITA OPERACIONAL BRUTA
  Faturamento de Serviços
  Receita de Peças Aplicadas
(-) Deduções (ISS s/ serviços ~5%; cancelamentos)
(=) RECEITA OPERACIONAL LÍQUIDA
(-) Custo dos Serviços Prestados (CSP)
      Mão-de-obra direta (folha) · Custo de Peças Aplicadas · Tintas e insumos
(=) LUCRO BRUTO + Margem Bruta %
(-) Despesas Operacionais (admin fixas · variáveis · comerciais)
(=) EBITDA + Margem EBITDA %
(-) Depreciação · Desp. financeiras (+) Receitas financeiras
(=) Resultado antes dos impostos
(-) IRPJ + CSLL (Simples Nacional)
(=) RESULTADO LÍQUIDO + Margem Líquida %
```
Derivados: **Markup geral** · **Ponto de Equilíbrio (R$/mês)** · indicadores de peças.

## Pátio (kanban — aba 🚗 Pátio)
Colunas: `OS · Status · Cliente/Cia · Tipo (Seguradora/Particular) · Marca · Modelo · Cor · Placa · Box · Data Entrada · Prazo · Dias na Oficina · Dias até Prazo · Orçamento (R$)`.
Status (etapas): `Orçamento → Funilaria → Pintura → Polimento → Entrega ao Cliente`, com o bloqueio transversal `Aguardando Peça`.

---

## Gap: Planilha (completo) × App web (atual)
- **App web JÁ TEM:** orçamento com margem ao vivo, OS, clientes/veículos, ROI card, painéis de KPI/gargalo (fail-soft), estoque + tinta por fórmula, schema de pátio V3 (escrito).
- **App web FALTA (pra paridade):** KPIs estratégicos com **metas + semáforo**, **DRE contábil**, **Aging**, **Fluxo de Caixa** previsto×realizado, **Contas a pagar (Fornecedores) + a receber**, **Despesas** (fixas+variáveis), **RH/folha + metas**, **pipeline de Orçamentos** (conversão/ticket por canal), **Curva ABC**.

## Plano de paridade (build)
- **F-A — desbloqueado (fail-soft, deriva do que já existe):** KPIs com metas+semáforo · pipeline de Orçamentos (conversão/ticket). *Em construção.*
- **F-B — precisa tabelas novas (🔑 token TEST):** Despesas · Fornecedores (a pagar) / recebíveis · Fluxo de Caixa · Aging · RH/folha → **então a DRE completa**.
- **F-C — precisa banco único (Totem):** KPIs de produção reais (permanência, retrabalho, ocupação) com **tempo medido**.

> A planilha é o **piso** (paridade). O app **supera** com o que a planilha não faz: **margem ao vivo no orçamento** e **tempo medido** no chão de fábrica.
