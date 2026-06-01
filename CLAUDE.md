# GDelta — Sistema (SaaS) · Fonte da verdade (escopo + regras de trabalho)

> Estas regras valem em TODA sessão. Leia antes de qualquer ação. Em conflito
> com qualquer outra orientação, as regras de **segurança/ambiente** prevalecem.
> O fundador é **não-técnico**: explique em linguagem simples; ao usar um termo
> técnico, diga o que ele significa na prática. **Recomende UMA opção, não um menu.**

---

## 1. O que é (e o que NÃO é) este projeto

**GDelta Sistema** é o **SaaS completo de gestão** para oficinas de funilaria e
pintura de pequeno e médio porte. Nasce da inteligência financeira que já é
vendida hoje (o "Dashboard Gestão GDelta") e constrói o operacional ao redor dela.

**Módulos do Sistema** (detalhe nos `docs/`): Orçamento ao vivo · Clientes
(particular × seguradora) · Veículo por placa + FIPE · Pátio/OS · Estoque
inteligente · Emissão de nota (NFS-e/NF-e via agregador) · Financeiro (DRE,
ponto de equilíbrio, aging, markup real, semáforo, ranking, funil).

**Este projeto NÃO é o Totem.** O **Totem** (chão de fábrica: apontamento +
painel de produção) é **outro projeto, outro repositório** (`totem-apontamento`,
construído no Antigravity). A convergência entre os dois é **fase futura** — não
agora. **Nesta sessão, mexa SOMENTE no Sistema, neste repo (`Sistema.GDelta`).**

---

## 2. Diretrizes inegociáveis (decididas pelo fundador)

1. **Lane:** só o Sistema GDelta, neste repo. **NÃO tocar no Totem** (outro repo).
2. **Banco:** Supabase **NOVO e exclusivo do Sistema**. **NÃO usar o banco do
   Totem.** Dois ambientes desde já — **TESTE** e **PROD**.
3. **Ordem sagrada do multi-tenant:** auth real (Supabase Auth) + claim
   `oficina_id` dentro do JWT (**access token hook**) **ANTES** de qualquer
   política RLS. *O que travou o Totem foi RLS sem o claim no token — não repetir.*
   **Nada de fechadura sem porta.**
4. **Schema-compatível com o Totem:** mesma base conceitual (`oficinas`,
   `user_oficinas`), mesmo padrão de claim e de RLS — para a convergência futura
   ser simples. (Mesmo PADRÃO; **bancos separados**.)
5. **Sem digitação dupla:** cada módulo é a **fonte da verdade** do seu pedaço, ou
   lê de outra fonte — nunca entrada manual repetida.
6. **Honestidade de medição:** o Sistema só mede depois de instalado. Nada de
   "antes × depois" não medido, nem no produto nem no marketing.
7. **Premium, não paridade:** não perseguir feature-a-feature com o Cília. Ganhar
   nos 3 pontos que doem: orçamento com margem ao vivo, inteligência financeira
   real, chão de fábrica em tempo real (este via Totem, futuro).
8. **Fiscal sempre via agregador** (Focus NFe / Nuvem Fiscal / PlugNotas / eNotas)
   — nunca conformidade fiscal própria.
9. **Não avançar com erro.** Em conflito com os `docs/` ou com algo que o fundador
   decidiu: **PARAR e perguntar.**

---

## 3. Ambientes — REGRA CRÍTICA

- **TESTE:** projeto Supabase exclusivo do Sistema. *(ref: a definir — fundador
  fornece.)* É onde TODA migration roda **primeiro**.
- **PROD:** projeto Supabase exclusivo do Sistema. *(ref: a definir — fundador
  fornece.)* Só recebe migration **depois de validada no TESTE**.
- **NUNCA** rodar migration direto no PROD. **NUNCA** aplicar em PROD sem
  confirmação explícita do fundador.
- Antes de QUALQUER escrita no banco: **confirmar o ref de destino** e mostrar ao
  fundador.
- **Segredos:** o agente **não cria conta/projeto** e **não manuseia segredo**
  além de colocar no `.env` os valores que o **fundador** entregar. `.env*` está
  no `.gitignore` — nunca commitar.

---

## 4. Tarefas que são do FUNDADOR (peça e aguarde — não faça por conta)

- **Criar os 2 projetos Supabase** (TESTE e PROD) no painel e entregar as chaves.
- **Conectar o repo à Vercel** (deploy).
- **Aprovar** qualquer migration que vá ao PROD.
- **`git push`** / publicar / gastar em serviço pago.

---

## 5. Stack

Next.js 16 · React 19 · TypeScript (modo estrito) · Tailwind v4 · Supabase
(Auth + Postgres + RLS) · Vercel · GitHub Actions (CI: typecheck + build).

---

## 6. FASE 0 — Fundação (ordem; cada passo: `qa` verde + commit)

0. **Setup** — `CLAUDE.md`, agentes, repo, `.gitignore`. *(este passo)*
1. **Recon** — repo limpo + versões node/npm/git.
2. **Scaffold** — Next 16 + TS + Tailwind v4; página em branco local.
3. **Fiação do Supabase** — cliente + `.env` TESTE/PROD; conexão ao TESTE.
4. **Auth + claim `oficina_id`** (TESTE) — Supabase Auth + access token hook;
   **provar** `oficina_id` dentro do JWT antes de seguir.
5. **Schema base + RLS** (TESTE→PROD) — `oficinas`, `user_oficinas` (role
   dono/gerente), RLS por `auth.jwt() ->> 'oficina_id'`; **provar isolamento**
   A↔B no TESTE; só então aplicar no PROD vazio e verificar.
6. **Login + página protegida** (frontend) — prova a corrente: login → JWT com
   `oficina_id` → RLS → dado certo.
7. **CI + deploy** — `qa` no GitHub Actions; fundador conecta a Vercel.

**Definição de Pronto da Fase 0:** página protegida no ar (Vercel) · `qa` verde
no CI · isolamento multi-tenant comprovado no TESTE (login real com `oficina_id`
no JWT + RLS funcionando). → Abre a **Fase 1: Clientes → Veículo (placa/FIPE) →
Orçamento ao vivo**.

---

## 7. Disciplina de execução

- **Um passo pequeno e reversível por vez.** Cada passo fecha com **`qa` verde** e
  **commit**. Não juntar vários passos num salto só.
- **Mostrar o que vai fazer ANTES** (diff/plano) em mudanças de banco, auth ou RLS.
- **Em erro: PARAR e perguntar** — não improvisar.
- **NÃO fazer `git push`** sem autorização explícita do fundador.
- Reportar ao fim de cada passo em **pontos curtos**: o que foi feito, `qa`, commit.

### Autonomia
- **FAÇA sem pedir** (e reporte depois): ler repo/banco; escrever código do escopo;
  migrations **puramente aditivas no TESTE** (após confirmar CLI linkado no TESTE);
  rodar dev/`qa`/testes de isolamento.
- **PARE e mostre plano/diff:** migrations que mexam em **GRANTS/RLS/auth** ou
  destrutivas; qualquer mudança de isolamento multi-tenant.
- **PARE e peça DECISÃO:** tocar **PROD**; `git push`/deploy; gasto em serviço
  pago; mudar escopo travado; trade-off de produto sem resposta óbvia.

---

## 8. Subagentes (em `.claude/agents/`)

- **recon** — só leitura. Mapeia o estado real do código/banco antes de editar.
  *Confie no código, nunca no resumo.*
- **supabase-guardian** — banco/auth/RLS. **TESTE primeiro, nunca PROD sem
  confirmação.** Dono da ordem sagrada (claim antes de RLS).
- **frontend** — Next.js/React/Tailwind. Telas e fiação de UI; `qa` verde antes de
  "pronto".
- **qa** — typecheck + build. Reporta **só o que quebrou** (arquivo:linha).

> Acione o subagente certo para cada passo. Em dúvida de segurança (banco/auth/
> RLS/PROD): **pare e pergunte ao fundador.**
