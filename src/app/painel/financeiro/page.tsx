'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChartLineUp,
  Wallet,
  CurrencyDollar,
  Coins,
  Funnel,
  Trophy,
  Crown,
  ClipboardText,
  HourglassMedium,
  CheckCircle,
  Package,
  Receipt,
  ChartBar,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { BrandMark } from '@/components/brand';
import { STATUS_OS, type StatusOs } from '@/lib/supabase/os-comercial';
import { STATUS_ORCAMENTO, type StatusOrcamento } from '@/lib/supabase/orcamentos';
import {
  getFinanceiroKpis,
  getFunilOs,
  getFunilOrcamentos,
  getRankingClientes,
  getMargemRealOs,
  type FinanceiroKpis,
  type FunilOsLinha,
  type FunilOrcamentoLinha,
  type RankingCliente,
  type MargemRealOs,
} from '@/lib/supabase/financeiro';

type Estado = 'carregando' | 'pronto';

/** Cada bloco do dashboard carrega de uma view; guardamos os dados OU a mensagem
 *  de falha, para degradar SEÇÃO A SEÇÃO (uma view ausente não derruba a tela). */
type Bloco<T> = { data: T; erro: null } | { data: null; erro: string };

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (n: number) => n.toLocaleString('pt-BR');

const nomeStatusOs = (s: StatusOs) => STATUS_OS.find((x) => x.id === s)?.nome ?? s;
const nomeStatusOrcamento = (s: StatusOrcamento) => STATUS_ORCAMENTO.find((x) => x.id === s)?.nome ?? s;

/** Cor da barra do funil de OS (semáforo via tokens), coerente com as outras telas. */
const barraStatusOs: Record<StatusOs, string> = {
  aberta: 'bg-primary',
  em_producao: 'bg-warning-bg',
  concluida: 'bg-success-bg',
  entregue: 'bg-success-bg',
  cancelada: 'bg-danger-bg',
};

/** Cor da barra do funil de orçamentos (semáforo via tokens). */
const barraStatusOrcamento: Record<StatusOrcamento, string> = {
  rascunho: 'bg-border-strong',
  enviado: 'bg-primary',
  aprovado: 'bg-success-bg',
  recusado: 'bg-danger-bg',
};

/** Semáforo da margem % via tokens: >=20% saudável, >=0 atenção, <0 prejuízo. */
const semaforoMargem = (pct: number): string =>
  pct >= 20
    ? 'bg-success-tint text-success'
    : pct >= 0
      ? 'bg-warning-tint text-warning'
      : 'bg-danger-tint text-danger';

/** Contadores de OS por status nos cards do topo (ícone + cor do chip via tokens). */
const CONTADORES: { chave: keyof FinanceiroKpis; rotulo: string; Icone: Icon; chip: string }[] = [
  { chave: 'os_abertas', rotulo: 'Abertas', Icone: ClipboardText, chip: 'bg-primary/10 text-primary' },
  { chave: 'os_em_producao', rotulo: 'Em produção', Icone: HourglassMedium, chip: 'bg-warning-tint text-warning' },
  { chave: 'os_concluidas', rotulo: 'Concluídas', Icone: CheckCircle, chip: 'bg-success-tint text-success' },
  { chave: 'os_entregues', rotulo: 'Entregues', Icone: Package, chip: 'bg-success-bg text-on-success' },
];

export default function FinanceiroPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // KPIs: a view devolve UMA linha por oficina, ou null quando ainda não há OS.
  const [kpis, setKpis] = useState<Bloco<FinanceiroKpis | null>>({ data: null, erro: null });
  const [funilOs, setFunilOs] = useState<Bloco<FunilOsLinha[]>>({ data: [], erro: null });
  const [funilOrc, setFunilOrc] = useState<Bloco<FunilOrcamentoLinha[]>>({ data: [], erro: null });
  const [ranking, setRanking] = useState<Bloco<RankingCliente[]>>({ data: [], erro: null });
  const [margem, setMargem] = useState<Bloco<MargemRealOs[]>>({ data: [], erro: null });

  const carregar = useCallback(async () => {
    // Cinco leituras agregadas em paralelo. Cada uma degrada sozinha: status
    // 'empty' vira lista vazia (sem erro) e 'error' guarda a mensagem traduzida.
    const [rk, ros, rorc, rr, rm] = await Promise.all([
      getFinanceiroKpis(),
      getFunilOs(),
      getFunilOrcamentos(),
      getRankingClientes(10),
      getMargemRealOs(20),
    ]);

    // getFinanceiroKpis devolve FetchState<FinanceiroKpis | null>: 'success' já
    // carrega null quando não há OS; 'empty' (parte do tipo) também vira null.
    setKpis(
      rk.status === 'success'
        ? { data: rk.data, erro: null }
        : rk.status === 'empty'
          ? { data: null, erro: null }
          : { data: null, erro: rk.message }
    );
    setFunilOs(
      ros.status === 'success'
        ? { data: ros.data, erro: null }
        : ros.status === 'empty'
          ? { data: [], erro: null }
          : { data: null, erro: ros.message }
    );
    setFunilOrc(
      rorc.status === 'success'
        ? { data: rorc.data, erro: null }
        : rorc.status === 'empty'
          ? { data: [], erro: null }
          : { data: null, erro: rorc.message }
    );
    setRanking(
      rr.status === 'success'
        ? { data: rr.data, erro: null }
        : rr.status === 'empty'
          ? { data: [], erro: null }
          : { data: null, erro: rr.message }
    );
    setMargem(
      rm.status === 'success'
        ? { data: rm.data, erro: null }
        : rm.status === 'empty'
          ? { data: [], erro: null }
          : { data: null, erro: rm.message }
    );

    setEstado('pronto');
  }, []);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace('/login');
          return;
        }
        carregar();
      })
      .catch(() => router.replace('/login'));
  }, [router, carregar]);

  if (estado === 'carregando') {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-small text-fg-muted">Carregando…</main>
    );
  }

  const k = kpis.data;
  // "Sem dados em lugar nenhum": nenhuma OS (KPIs null) e os funis vazios, sem
  // erros — é uma oficina nova → mostramos um vazio convidando a criar orçamento.
  const vazioGeral =
    !kpis.erro &&
    k === null &&
    !funilOs.erro &&
    (funilOs.data?.length ?? 0) === 0 &&
    !funilOrc.erro &&
    (funilOrc.data?.length ?? 0) === 0 &&
    !ranking.erro &&
    (ranking.data?.length ?? 0) === 0 &&
    !margem.erro &&
    (margem.data?.length ?? 0) === 0;

  const maxValorOs = Math.max(1, ...(funilOs.data ?? []).map((l) => Number(l.valor_total)));
  const maxQtdOrc = Math.max(1, ...(funilOrc.data ?? []).map((l) => l.qtd));
  const maxValorRanking = Math.max(1, ...(ranking.data ?? []).map((l) => Number(l.valor_total)));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Símbolo da marca; o título ao lado já nomeia → decorativo. */}
          <BrandMark className="h-10" alt="" />
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Financeiro</p>
            <h1 className="font-display text-h1 text-fg">Financeiro</h1>
          </div>
        </div>
        <Link
          href="/painel"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Painel
        </Link>
      </header>

      {vazioGeral ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-16 text-center">
          <span aria-hidden className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-surface-sunken text-fg-subtle">
            <ChartLineUp size={26} weight="duotone" />
          </span>
          <p className="text-small font-medium text-fg">Sem indicadores ainda</p>
          <p className="max-w-sm text-caption text-fg-muted">
            Os números nascem dos orçamentos aprovados e das OS. Aprove uma proposta em{' '}
            <Link href="/painel/orcamentos" className="font-medium text-primary hover:underline">
              Orçamentos
            </Link>{' '}
            para começar a medir.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ============================== KPIs ============================== */}
          <section aria-labelledby="kpis-titulo">
            <h2 id="kpis-titulo" className="mb-3 font-display text-h3 text-fg">
              Visão geral
            </h2>

            {kpis.erro ? (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3 text-small text-danger"
              >
                <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
                {kpis.erro}
              </p>
            ) : k === null ? (
              <p className="rounded-card border border-dashed border-border bg-surface px-4 py-6 text-center text-small text-fg-muted">
                Nenhuma OS ainda — os indicadores aparecem após a primeira aprovação.
              </p>
            ) : (
              <>
                {/* Receita / ticket: três métricas em destaque (currency). */}
                <div className="grid gap-3.5 sm:grid-cols-3">
                  <article className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-overline uppercase tracking-[0.12em] text-fg-subtle">
                      <Wallet size={16} weight="duotone" aria-hidden className="text-primary" />
                      Receita em aberto
                    </div>
                    <p className="mt-2 font-numeric text-metric leading-none text-fg">{fmt(Number(k.receita_aberta))}</p>
                    <p className="mt-1.5 text-caption text-fg-subtle">pipeline das OS não entregues</p>
                  </article>

                  <article className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-overline uppercase tracking-[0.12em] text-fg-subtle">
                      <CurrencyDollar size={16} weight="duotone" aria-hidden className="text-success" />
                      Receita entregue
                    </div>
                    <p className="mt-2 font-numeric text-metric leading-none text-success">{fmt(Number(k.receita_entregue))}</p>
                    <p className="mt-1.5 text-caption text-fg-subtle">OS já entregues ao cliente</p>
                  </article>

                  <article className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-overline uppercase tracking-[0.12em] text-fg-subtle">
                      <Coins size={16} weight="duotone" aria-hidden className="text-primary" />
                      Ticket médio
                    </div>
                    <p className="mt-2 font-numeric text-metric leading-none text-fg">{fmt(Number(k.ticket_medio))}</p>
                    <p className="mt-1.5 text-caption text-fg-subtle">valor médio por OS</p>
                  </article>
                </div>

                {/* Contadores de OS por status (semáforo via tokens). */}
                <div className="mt-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                  {CONTADORES.map(({ chave, rotulo, Icone, chip }) => (
                    <article
                      key={chave}
                      className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-xs"
                    >
                      <span aria-hidden className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${chip}`}>
                        <Icone size={20} weight="duotone" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-numeric text-h3 leading-none text-fg">{num(Number(k[chave]))}</p>
                        <p className="mt-1 truncate text-caption text-fg-subtle">{rotulo}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ============================== Funil ============================= */}
          <section aria-labelledby="funil-titulo">
            <h2 id="funil-titulo" className="mb-3 flex items-center gap-2 font-display text-h3 text-fg">
              <Funnel size={20} weight="duotone" aria-hidden className="text-fg-muted" />
              Funil
            </h2>

            <div className="grid gap-3.5 lg:grid-cols-2">
              {/* Funil de OS: qtd + valor por status. */}
              <article className="rounded-card border border-border bg-surface p-5 shadow-sm">
                <p className="mb-4 text-overline uppercase tracking-[0.12em] text-fg-subtle">OS por status</p>
                {funilOs.erro ? (
                  <p
                    role="alert"
                    className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-caption text-danger"
                  >
                    <WarningCircle size={15} weight="fill" aria-hidden className="shrink-0" />
                    {funilOs.erro}
                  </p>
                ) : (funilOs.data?.length ?? 0) === 0 ? (
                  <p className="text-caption text-fg-muted">Nenhuma OS para exibir ainda.</p>
                ) : (
                  <ul className="space-y-3">
                    {(funilOs.data ?? []).map((l) => {
                      const w = Math.max(2, Math.round((Number(l.valor_total) / maxValorOs) * 100));
                      return (
                        <li key={l.status}>
                          <div className="flex items-baseline justify-between gap-3 text-small">
                            <span className="flex items-center gap-2 text-fg">
                              <span className="text-fg-muted">{nomeStatusOs(l.status)}</span>
                              <span className="font-numeric text-caption text-fg-subtle">· {num(l.qtd)} OS</span>
                            </span>
                            <span className="font-numeric text-fg">{fmt(Number(l.valor_total))}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surface-sunken">
                            <div
                              className={`h-full origin-left rounded-pill ${barraStatusOs[l.status]} transition-transform duration-500 ease-default`}
                              style={{ transform: `scaleX(${w / 100})` }}
                              aria-hidden
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>

              {/* Funil de orçamentos: qtd por status. */}
              <article className="rounded-card border border-border bg-surface p-5 shadow-sm">
                <p className="mb-4 text-overline uppercase tracking-[0.12em] text-fg-subtle">Orçamentos por status</p>
                {funilOrc.erro ? (
                  <p
                    role="alert"
                    className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-caption text-danger"
                  >
                    <WarningCircle size={15} weight="fill" aria-hidden className="shrink-0" />
                    {funilOrc.erro}
                  </p>
                ) : (funilOrc.data?.length ?? 0) === 0 ? (
                  <p className="text-caption text-fg-muted">Nenhum orçamento para exibir ainda.</p>
                ) : (
                  <ul className="space-y-3">
                    {(funilOrc.data ?? []).map((l) => {
                      const w = Math.max(2, Math.round((l.qtd / maxQtdOrc) * 100));
                      return (
                        <li key={l.status}>
                          <div className="flex items-baseline justify-between gap-3 text-small">
                            <span className="text-fg-muted">{nomeStatusOrcamento(l.status)}</span>
                            <span className="font-numeric text-fg">{num(l.qtd)}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surface-sunken">
                            <div
                              className={`h-full origin-left rounded-pill ${barraStatusOrcamento[l.status]} transition-transform duration-500 ease-default`}
                              style={{ transform: `scaleX(${w / 100})` }}
                              aria-hidden
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            </div>
          </section>

          {/* ============================ Ranking ============================ */}
          <section aria-labelledby="ranking-titulo">
            <h2 id="ranking-titulo" className="mb-3 flex items-center gap-2 font-display text-h3 text-fg">
              <Trophy size={20} weight="duotone" aria-hidden className="text-fg-muted" />
              Ranking de clientes
            </h2>

            <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
              {ranking.erro ? (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-caption text-danger"
                >
                  <WarningCircle size={15} weight="fill" aria-hidden className="shrink-0" />
                  {ranking.erro}
                </p>
              ) : (ranking.data?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Receipt size={26} weight="duotone" aria-hidden className="text-fg-subtle" />
                  <p className="text-small text-fg-muted">Sem faturamento por cliente ainda.</p>
                </div>
              ) : (
                <ol className="space-y-2">
                  {(ranking.data ?? []).map((c, i) => {
                    const w = Math.max(2, Math.round((Number(c.valor_total) / maxValorRanking) * 100));
                    const lider = i === 0;
                    return (
                      <li
                        key={c.cliente_id ?? `${c.cliente_nome}-${i}`}
                        className="flex items-center gap-3 rounded-control border border-border bg-surface px-3.5 py-3 shadow-xs transition-colors hover:border-border-strong"
                      >
                        <span
                          aria-hidden
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control font-numeric text-small font-semibold ${
                            lider ? 'bg-primary/10 text-primary' : 'bg-surface-sunken text-fg-muted'
                          }`}
                        >
                          {lider ? <Crown size={16} weight="fill" /> : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-small font-medium text-fg">{c.cliente_nome}</span>
                            <span className="shrink-0 font-numeric text-small text-fg">{fmt(Number(c.valor_total))}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-sunken">
                              <div
                                className="h-full origin-left rounded-pill bg-primary transition-transform duration-500 ease-default"
                                style={{ transform: `scaleX(${w / 100})` }}
                                aria-hidden
                              />
                            </div>
                            <span className="shrink-0 font-numeric text-caption text-fg-subtle">{num(c.qtd_os)} OS</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>

          {/* ========================= Margem real por OS ===================== */}
          <section aria-labelledby="margem-titulo">
            <h2 id="margem-titulo" className="mb-3 flex items-center gap-2 font-display text-h3 text-fg">
              <ChartBar size={20} weight="duotone" aria-hidden className="text-fg-muted" />
              Margem real por OS
            </h2>

            <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
              {margem.erro ? (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-caption text-danger"
                >
                  <WarningCircle size={15} weight="fill" aria-hidden className="shrink-0" />
                  {margem.erro}
                </p>
              ) : (margem.data?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <ChartBar size={26} weight="duotone" aria-hidden className="text-fg-subtle" />
                  <p className="text-small text-fg-muted">Sem OS para calcular margem ainda.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(margem.data ?? []).map((o) => {
                    const pct = Number(o.margem_pct);
                    return (
                      <li
                        key={o.os_id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-border bg-surface px-3.5 py-3 shadow-xs transition-colors hover:border-border-strong"
                      >
                        <span className="font-numeric text-small font-semibold text-fg">OS-{num(o.numero)}</span>
                        <div className="ml-auto flex flex-wrap items-baseline gap-x-4 gap-y-1">
                          <span className="flex items-baseline gap-1.5">
                            <span className="text-caption text-fg-subtle">Valor</span>
                            <span className="font-numeric text-small text-fg">{fmt(Number(o.valor))}</span>
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span className="text-caption text-fg-subtle">Custo</span>
                            <span className="font-numeric text-small text-fg-muted">{fmt(Number(o.custo_total))}</span>
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span className="text-caption text-fg-subtle">Margem</span>
                            <span className="font-numeric text-small font-medium text-fg">{fmt(Number(o.margem_real))}</span>
                          </span>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-pill px-2 py-0.5 font-numeric text-caption font-semibold ${semaforoMargem(pct)}`}
                          >
                            {num(pct)}%
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Honestidade da medição: custo de material é aproximação no MVP. */}
              <p className="mt-4 text-caption text-fg-subtle">
                O custo de material usa o custo médio atual de cada item do estoque (a baixa não guarda o
                custo do momento) — é uma aproximação.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Honestidade de medição: os números refinam conforme o uso. */}
      <p className="mt-10 text-caption text-fg-subtle">
        Indicadores derivados de orçamentos aprovados e OS — refinam conforme o uso.
      </p>
    </main>
  );
}
