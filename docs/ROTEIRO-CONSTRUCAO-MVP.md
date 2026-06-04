# GDelta Totem — Roteiro de Construção do MVP

> Guia passo a passo para sair do zero ao piloto, respeitando as premissas travadas no `CLAUDE.md`.
> **Critério de sucesso do piloto:** o dono abre o painel sozinho, ≥1×/dia, por 2 semanas seguidas, e afirma que pagaria por isso.

---

## Princípio que ordena tudo

A ordem das fases abaixo **não é arbitrária** — ela existe para honrar três premissas inegociáveis:

1. **Auth com `oficina_id` no JWT vem ANTES de qualquer RLS.** As políticas só funcionam se o claim existir. Construir RLS antes do claim é construir uma fechadura sem porta.
2. **Banco de teste antes da produção, sempre.** A produção é o único banco vivo; um erro brica o totem que já funciona. Toda migração: teste → backup → produção → verificar.
3. **Escopo travado não reabre.** Tudo que está em "FORA do MVP" (orçamento, estoque, NF, integrações, ranking, ROI detalhado) só entra com ordem explícita sua.

Cada fase fecha com o **`qa`** (typecheck + build) verde antes de seguir.

---

## Fase 0 — Fundação do repositório

Objetivo: ter o esqueleto rodando local e na Vercel, ainda sem lógica de negócio.

1. Criar o projeto **Next.js 16 + TypeScript + Tailwind v4** (App Router).
2. Configurar `tsconfig` estrito, ESLint e o script `typecheck` (`tsc --noEmit`) — o `qa` depende disso.
3. Subир o repo no **GitHub** e ligar **Vercel** (deploy automático do `main`).
4. Criar **dois projetos Supabase**: um de **TESTE** e um de **PRODUÇÃO**. Anotar as URLs/keys em `.env.local` (nunca commitar; nunca expor service role no cliente).
5. Configurar **GitHub Actions** rodando `typecheck` + `build` em cada PR.

**Checkpoint:** página em branco no ar (Vercel) + `qa` verde. Acione o subagente `recon` para confirmar como o app cria o cliente Supabase.

---

## Fase 1 — Autenticação e o claim `oficina_id` (a base de tudo)

Objetivo: a sessão carregar `oficina_id` dentro do JWT. **Esta fase é pré-requisito da RLS — não é "tarefa de depois".**

1. Modelar a tabela `oficinas` e a relação usuário → oficina (papéis `dono` e `gerente`).
2. Configurar **Supabase Auth** para dono/admin (conta real, acesso por papel).
3. Implementar o **access token hook / custom claim** que injeta `oficina_id` (e `role`) no JWT.
4. **Validar o claim** com `auth.jwt() ->> 'oficina_id'` antes de escrever qualquer política.
5. Tratar a **autenticação do device (Totem)**: a *oficina* autentica o tablet (sessão persistente com `oficina_id`). O *operário* só se identifica tocando no nome — isso é identificação, não acesso ao banco.

> ⚠️ Tudo que toca banco/JWT aqui passa pelo **`supabase-guardian`**, em banco de TESTE primeiro.

**Checkpoint:** logar como dono e inspecionar o token — `oficina_id` presente. Sem isso, NÃO avance.

---

## Fase 2 — Schema multi-tenant + RLS

Objetivo: o isolamento por oficina funcionando, testado, sem brickar nada.

1. Modelar as tabelas do MVP, **todas com `oficina_id`**: `funcionarios`, `ordens_servico` (OS), `apontamentos`, `pontos` (batidas), `bloqueios`.
2. Campos-chave da OS: `placa` (normalizada em maiúsculas, **uma OS ativa por placa** — única parcial), `etapa_atual` (coluna do kanban) **≠** `status_geral` (ciclo de vida), `valor_orcamento`, `data_entrada`.
3. Escrever as **políticas RLS** filtrando por `auth.jwt() ->> 'oficina_id'` em toda tabela.
4. **Migrations versionadas e idempotentes.** Aplicar a sequência sagrada: teste → confirmar leitura/gravação do app → backup → produção → verificar.

**Checkpoint:** dois logins de oficinas diferentes nunca enxergam dados um do outro. `qa` verde.

---

## Fase 3 — Totem: ponto + apontamento

Objetivo: o operário consegue bater ponto e apontar tarefa no tablet. Telas pelo subagente **`painel-builder`** (tablet-friendly: alto contraste, alvos de toque grandes).

1. Tela de **identificação** (toca no nome — sem PIN no piloto).
2. **Ponto:** 2 batidas (entrada/saída). Presença libera o apontamento. **Não é folha/CLT** — é produtividade.
3. **Apontamento:** carro (placa) + etapa. Regras:
   - **Um apontamento ativo por operário** (iniciar outro pausa o atual).
   - `etapa_atual` é setada quando o operário **inicia** a tarefa naquela etapa.
   - **Retrabalho** = checkbox. **Complexidade** = 3 níveis, "simples" pré-selecionado.
4. **Tempos ancorados no relógio do servidor**, nunca do tablet. **Teto anti-fantasma ~10,5h** → vira anomalia para o admin corrigir.
5. **Bloqueio** = flag com motivo: PROBLEMA (aguardando peça / aprovação) × FLUXO (em outro setor / aguardando cura).

**Checkpoint:** operário bate ponto, inicia/pausa apontamento, tempos batem com o servidor. `qa` verde.

---

## Fase 4 — Painel: as 2 perguntas do dono

Objetivo: a gestão vê a produção em tempo real. Realtime no kanban e nos estados do operário.

**Pergunta 1 — "Todo mundo produzindo agora?"** → os **4 estados do operário**:
produzindo · em pausa (com motivo) · presente sem tarefa · ausente.

**Pergunta 2 — "Que carro está travado/lento?"** → **kanban das 8 etapas** (Desmontagem · Funilaria · Preparação · Pintura · Polimento · Montagem · Qualidade · Entrega) com:
- **prazo em destaque** (o holofote do piloto);
- a métrica **dias na oficina × R$ do orçamento** (revela barato-lento = prejuízo disfarçado × caro-rápido = ouro).

Camadas no piloto: PRAZO = holofote · produtividade individual = fundação (coletar + mostrar ao vivo) · ranking = Fase 2 · ROI = fast-follow.

> Lembrete técnico: a query **nunca confia no cliente** para isolar oficina — o isolamento é da RLS.

**Checkpoint:** dono abre o painel e responde às 2 perguntas sem ajuda. `qa` verde.

---

## Fase 5 — Painel do admin: corrigir anomalias

Objetivo: o admin/gerente opera o sistema. Tudo pelo **painel** (não pelo totem).

1. **Criar/editar OS e funcionário** (busca-antes-de-criar pela placa; normalização em maiúsculas).
2. **Corrigir anomalias:** editar tempo de apontamento, fechar apontamento-fantasma, mover card no kanban.
3. Visão por papel: **dono** (produtividade + saúde de prazos + ROI; leitura majoritária) × **gerente** (operação).

**Checkpoint:** admin corrige um apontamento-fantasma e move um card. `qa` verde.

---

## Fase 6 — Endurecimento para o piloto

Objetivo: confiável o bastante para rodar sozinho na oficina-piloto.

1. **Backup** automatizado (Cloudflare R2).
2. **Observabilidade:** Sentry (erros) + Crisp (suporte/contato).
3. Tratar os **casos de honestidade:** o GDelta só mede DEPOIS de instalado; retrabalho auto-reportado é tratado como **piso**, não número exato.
4. Teste de fumaça no tablet real da oficina (rede, sessão persistente, toque).

**Checkpoint:** simular um dia de uso ponta a ponta sem intervenção do dev.

---

## Fase 7 — Piloto (2 semanas)

1. Onboarding: dona da oficina-piloto = **dono**; Eliel + 1 pessoa da oficina = **admin/gerente**.
2. **Semana 1:** você ainda apoia a operação.
3. **Semana 2:** você **tira a mão** da operação diária — o teste real é o dono usando sozinho.
4. Medir o critério de sucesso: abertura diária do painel + a fala "pagaria por isso".

---

## Disciplina de trabalho com os subagentes (todo ciclo)

- **Antes de editar:** `recon` (só leitura) mapeia o estado real do código.
- **Qualquer banco:** `supabase-guardian`, em teste primeiro, nunca produção sem sua confirmação explícita.
- **Telas painel/totem:** `painel-builder`.
- **Antes de "pronto":** `qa` (typecheck + build).
- **Decisão travada conflitou com algo?** PARE e me pergunte — não reabra sozinho.

---

## Fora do MVP (não construir sem ordem sua)

Orçamento · estoque · emissão de NF · integrações externas · ranking/reconhecimento de operário · ROI detalhado.
São fases futuras. O foco do piloto é provar valor com o mínimo.
