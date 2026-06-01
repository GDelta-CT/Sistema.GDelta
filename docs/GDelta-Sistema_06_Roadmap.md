# GDelta — Roadmap de Construção
**Documento 6 de 6 · Versão 1.0 · Maio/2026**

> **Premissas (Doc 1):** construção **em série, nunca em paralelo** · cada fase construível e vendável sozinha · Totem é o nº 1 · banco único multi-tenant · fiscal via agregador · sem digitação dupla.
> Este roadmap **conversa com** o `ROTEIRO-CONSTRUCAO-MVP.md` do Totem (que detalha as fases internas 0–7 daquele módulo). Aqui é a visão de produto inteiro.

---

## Princípio do roadmap solo

Um fundador só constrói uma coisa de cada vez. Então cada marco abaixo tem um **gate de saída** — não se começa o próximo sem fechar o anterior. O gate não é "código pronto"; é **valor provado** (alguém usa / alguém pagaria).

A ordem segue a lógica dos Docs 3 e 4: **provar adoção → cunha premium greenfield → surfar a onda fiscal → fechar o ciclo**.

---

## MARCO 1 — Totem no ar e adotado *(é o módulo nº 1)*
**Constrói:** todo o Totem (segue as fases 0–7 do `ROTEIRO-CONSTRUCAO-MVP.md`: fundação → auth+`oficina_id` no JWT → RLS → ponto/apontamento → painel das 2 perguntas → painel admin → endurecimento → piloto).
**Por quê primeiro:** já está em código; gera o dado que ninguém tem; prova adoção barato.
**🚪 Gate de saída:** dona da Auto Risco abre o painel sozinha ≥1×/dia por 2 semanas e diz que pagaria. **Sem esse gate, nada abaixo começa.**

---

## MARCO 2 — Cunha premium *(Orçamento + Clientes + Placa/FIPE)*
**Constrói, nesta ordem:**
1. **Clientes** (particular × seguradora) — base de tudo.
2. **Veículo por placa + FIPE** — integra a API de enriquecimento; valida custo/fornecedor.
3. **Orçamento ao vivo** — margem/lucro recalculados a cada item; é o coração premium.
4. **Promoção Orçamento → OS** — o orçamento aprovado vira/atualiza a OS do Totem (Pátio/OS começa de verdade).
**Por quê agora:** greenfield (zero dependência do Cília); é o diferencial premium mais vendável.
**🚪 Gate:** orçamentista monta orçamento mais rápido que hoje e fecha vendo a margem; orçamento aprovado aparece como OS no kanban do Totem sem redigitação.

---

## MARCO 3 — Onda fiscal *(NFS-e via agregador + Pátio/OS consolidado)*
**Constrói:**
1. **Seleção do agregador** — colocar 2 em homologação (Focus NFe + 1 alternativa), emitir NFS-e real ponta a ponta, decidir por cobertura municipal/custo/IBS-CBS.
2. **Emissão NFS-e a partir da OS** — registro local + chamada ao agregador + tratamento de callback assíncrono.
3. **Consolidação Pátio/OS** — ciclo de vida completo orçamento → produção → nota.
**Por quê agora (timing crítico):** precisa estar **pronto antes de 01/09/2026** para ser gatilho de adoção da obrigatoriedade da NFS-e nacional.
**🚪 Gate:** uma oficina emite a NFS-e nacional obrigatória pelo GDelta, em produção, sem dor.

---

## MARCO 4 — Fechar o ciclo *(Financeiro completo + Estoque + NF-e)*
**Constrói:**
1. **Estoque inteligente** — produtos/movimentos + **baixa vinculada à OS** (habilita custo/markup real).
2. **NF-e de peças** via o mesmo agregador.
3. **Financeiro completo** — DRE, equilíbrio, aging, fluxo, markup real, semáforo, ranking, funil, todos **derivados** do dado já existente.
**Por quê por último:** o financeiro só é honesto quando orçamento + produção + nota + estoque já o alimentam (premissa de honestidade de medição).
**🚪 Gate:** o dono decide preço/prazo olhando o financeiro do GDelta — não a planilha antiga. **Aqui o Cília vira opcional.**

---

## Linha do tempo (relativa, sem datas fixas exceto a fiscal)

```
[ Hoje ] ─ MARCO 1: Totem + piloto Auto Risco  (gate de adoção)
                     │
                     ▼
            MARCO 2: Orçamento + Clientes + Placa/FIPE  (cunha premium)
                     │
                     ▼
            MARCO 3: NFS-e via agregador  ──►  DEADLINE DURA: pronto antes de 01/09/2026
                     │
                     ▼
            MARCO 4: Financeiro + Estoque + NF-e  ──►  Cília vira opcional
```

**Única data inegociável:** Marco 3 pronto **antes de 01/09/2026**. Tudo o mais é relativo ao fechamento de cada gate. Se o calendário apertar, o Marco 3 tem prioridade sobre o aprofundamento do Marco 2 — a janela fiscal não espera.

---

## Riscos de execução e mitigação

- **Gate do Marco 1 falhar (baixa adoção):** é o melhor cenário para falhar — barato e cedo. Itera-se no Totem antes de gastar nos demais módulos.
- **Integração com o Cília indisponível:** não bloqueia — cada módulo é fonte da verdade própria; transição de dado legado é importação pontual, nunca digitação dupla.
- **Agregador fiscal:** decidir por teste em homologação, não catálogo; manter o módulo de nota desacoplado para poder trocar de agregador.
- **Sobreposição de frentes:** proibida. O gate de cada marco é o freio que impede o fundador solo de se espalhar.

---

## Como os 6 documentos se encaixam

1. **Visão & Estratégia** — por que e a decisão Cília.
2. **PRD** — o quê (módulos, personas, fonte da verdade).
3. **Mapa por fase** — em que ordem e por quê.
4. **Posicionamento** — como vender e o gancho fiscal.
5. **Requisitos por módulo** — como construir (campos, regras, integrações).
6. **Roadmap** *(este)* — a sequência com gates de valor.

Mais o **`ROTEIRO-CONSTRUCAO-MVP.md`** do Totem, que detalha o Marco 1 por dentro.
