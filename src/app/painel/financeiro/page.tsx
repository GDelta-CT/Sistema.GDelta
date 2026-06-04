'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
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
  Gauge,
  TrendUp,
  Warning,
  XCircle,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip } from '@/components/ui/status-chip';
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
import { PainelSkeleton } from '@/components/skeleton';

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

/** Tom semântico da margem agregada (semáforo via tokens) para o medidor/arco
 *  e o chip de leitura: rótulo, ícone Phosphor, tom do StatusChip e a variável
 *  de cor do traço do arco (token, nunca cor crua). */
const tomMargem = (pct: number) =>
  pct < 0
    ? { rotulo: 'Prejuízo', Icone: XCircle, tone: 'danger' as const, traco: 'var(--danger)', texto: 'text-danger' }
    : pct < 20
      ? { rotulo: 'Atenção', Icone: Warning, tone: 'warning' as const, traco: 'var(--warning)', texto: 'text-warning' }
      : { rotulo: 'Saudável', Icone: TrendUp, tone: 'success' as const, traco: 'var(--success)', texto: 'text-success' };

/** Conta o número até o alvo (count-up) com easeOutCubic; respeita prefers-reduced-motion. */
function useAnimatedNumber(target: number, duration = 500): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : duration;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased); // setState só no callback do rAF (não no corpo do effect)
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/** Medidor/arco de semáforo da margem real agregada. Semicírculo de 180° cujo
 *  preenchimento acompanha a margem (0–100%, prejuízo lido como 0) e cujo traço
 *  herda o tom via token (sem cor crua). O número-herói no centro usa o mesmo
 *  count-up easeOutCubic, reduced-motion-aware, dos demais herois. */
function MedidorMargem({ pct }: { pct: number }) {
  const tom = tomMargem(pct);
  const animado = useAnimatedNumber(pct);
  // Geometria do arco: semicírculo (raio 52) num viewBox 120×70; o comprimento
  // do traço é π·r e o offset revela a fração proporcional à margem saturada.
  const r = 52;
  const comprimento = Math.PI * r;
  const fracao = Math.max(0, Math.min(100, pct)) / 100;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[15rem]">
        <svg viewBox="0 0 120 70" className="w-full" role="img" aria-label={`Margem real ${pct.toFixed(1)} por cento`}>
          {/* Trilho do arco (neutro, via token). */}
          <path
            d="M 8 60 A 52 52 0 0 1 112 60"
            fill="none"
            stroke="var(--surface-sunken)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Preenchimento do arco (tom do semáforo, via token). */}
          <path
            d="M 8 60 A 52 52 0 0 1 112 60"
            fill="none"
            stroke={tom.traco}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={comprimento}
            strokeDashoffset={comprimento * (1 - fracao)}
            className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
          />
        </svg>
        {/* Leitura central sobreposta ao arco. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className={`font-numeric text-metric leading-none tracking-tight tabular-nums ${tom.texto}`}>
            {animado.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="mt-3">
        <StatusChip tone={tom.tone} icon={tom.Icone}>
          {tom.rotulo}
        </StatusChip>
      </div>
      <p className="mt-2 text-caption text-fg-subtle">meta de margem: 20%</p>
    </div>
  );
}

/** Contadores de OS por status nos cards do topo (ícone + cor do chip via tokens). */
const CONTADORES: { chave: keyof FinanceiroKpis; rotulo: string; Icone: Icon; chip: string }[] = [
  { chave: 'os_abertas', rotulo: 'Abertas', Icone: ClipboardText, chip: 'bg-primary/10 text-primary' },
  { chave: 'os_em_producao', rotulo: 'Em produção', Icone: HourglassMedium, chip: 'bg-warning-tint text-warning' },
  { chave: 'os_concluidas', rotulo: 'Concluídas', Icone: CheckCircle, chip: 'bg-success-tint text-success' },
  { chave: 'os_entregues', rotulo: 'Entregues', Icone: Package, chip: 'bg-success-bg text-on-success' },
];

/** Métricas-herói de receita/ticket: três mostradores em destaque (currency).
 *  Cada um define seu "tom" via tokens — sem cor crua: medalhão do ícone, trilho
 *  de acento (arco do mostrador) e cor da leitura principal. */
const HERO: {
  chave: keyof FinanceiroKpis;
  rotulo: string;
  ajuda: string;
  Icone: Icon;
  medalhao: string;
  trilho: string;
  valor: string;
}[] = [
  {
    chave: 'receita_aberta',
    rotulo: 'Receita em aberto',
    ajuda: 'pipeline das OS não entregues',
    Icone: Wallet,
    medalhao: 'bg-primary/10 text-primary',
    trilho: 'bg-primary/35',
    valor: 'text-fg',
  },
  {
    chave: 'receita_entregue',
    rotulo: 'Receita entregue',
    ajuda: 'OS já entregues ao cliente',
    Icone: CurrencyDollar,
    medalhao: 'bg-success-tint text-success',
    trilho: 'bg-success/40',
    valor: 'text-success',
  },
  {
    chave: 'ticket_medio',
    rotulo: 'Ticket médio',
    ajuda: 'valor médio por OS',
    Icone: Coins,
    medalhao: 'bg-primary/10 text-primary',
    trilho: 'bg-primary/35',
    valor: 'text-fg',
  },
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

  const k = kpis.data;

  // Margem real AGREGADA derivada das linhas já carregadas (sem nova query):
  // soma das margens reais sobre a soma da receita das mesmas OS. Apresentação
  // pura sobre `margem.data` — não toca na camada de dados.
  const linhasMargem = margem.data ?? [];
  const somaValor = linhasMargem.reduce((a, o) => a + Number(o.valor), 0);
  const somaMargemReal = linhasMargem.reduce((a, o) => a + Number(o.margem_real), 0);
  const margemAgregadaPct = somaValor > 0 ? (somaMargemReal / somaValor) * 100 : 0;

  // Count-up dos números-herói (mesmo easeOutCubic reduced-motion-aware de
  // orçamentos). Hooks chamados incondicionalmente, com alvos saneados a 0.
  const receitaAbertaAnim = useAnimatedNumber(Number(k?.receita_aberta ?? 0));
  const receitaEntregueAnim = useAnimatedNumber(Number(k?.receita_entregue ?? 0));
  const ticketMedioAnim = useAnimatedNumber(Number(k?.ticket_medio ?? 0));
  /** Valores animados dos herois, indexados pela chave do KPI (só os 3 herois). */
  const heroAnim: Partial<Record<keyof FinanceiroKpis, number>> = {
    receita_aberta: receitaAbertaAnim,
    receita_entregue: receitaEntregueAnim,
    ticket_medio: ticketMedioAnim,
  };

  if (estado === 'carregando') {
    return <PainelSkeleton maxWidth="max-w-5xl" />;
  }

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
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Financeiro"
        titulo="Financeiro"
        descricao="Receita, funil e margem — derivados das suas OS e orçamentos."
        acao={
          <Link
            href="/painel"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <ArrowLeft size={16} weight="bold" aria-hidden />
            Painel
          </Link>
        }
      />

      {vazioGeral ? (
        <EmptyState
          icon={ChartLineUp}
          titulo="Sem indicadores ainda"
          descricao="Os números nascem dos orçamentos aprovados e das OS. Aprove uma proposta para começar a medir."
          acao={
            <Link
              href="/painel/orcamentos"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover active:scale-[0.98]"
            >
              <Receipt size={18} weight="bold" aria-hidden />
              Ir para Orçamentos
              <ArrowRight size={16} weight="bold" aria-hidden />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* ===================== RESUMO (coluna sticky) ===================== *
           * Coluna de detalhe enxuta: os números-herói (count-up) e o medidor *
           * de margem real ficam fixos enquanto o conteúdo maior rola ao lado. */}
          <aside className="lg:col-span-4">
            <div className="space-y-3.5 lg:sticky lg:top-6">
              <section aria-labelledby="resumo-titulo">
                <h2 id="resumo-titulo" className="mb-4 font-display text-h3 text-fg">
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
                  <div className="space-y-3.5">
                    {/* Receita / ticket: mostradores-herói (currency) com count-up.
                        O trilho superior é o "arco" aceso do mostrador (estático). */}
                    {HERO.map(({ chave, rotulo, ajuda, Icone, medalhao, trilho, valor }) => (
                      <article
                        key={chave}
                        className="relative overflow-hidden rounded-card border border-border bg-surface p-5 shadow-sm transition-[border-color,box-shadow] duration-200 ease-default hover:border-border-strong hover:shadow-md"
                      >
                        <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${trilho}`} />
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-overline uppercase tracking-[0.12em] text-fg-subtle">{rotulo}</span>
                          <span
                            aria-hidden
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${medalhao}`}
                          >
                            <Icone size={18} weight="duotone" />
                          </span>
                        </div>
                        <p className={`mt-4 font-numeric text-metric leading-none tracking-tight tabular-nums ${valor}`}>
                          {fmt(heroAnim[chave] ?? Number(k[chave]))}
                        </p>
                        <p className="mt-2 text-caption text-fg-subtle">{ajuda}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Assinatura visual: medidor/arco de semáforo da margem real
                  agregada (só quando há OS com margem calculada). */}
              {!margem.erro && linhasMargem.length > 0 && (
                <section
                  aria-labelledby="medidor-titulo"
                  className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg"
                >
                  <h2
                    id="medidor-titulo"
                    className="mb-4 flex items-center gap-2 font-display text-h3 text-fg"
                  >
                    <Gauge size={20} weight="duotone" aria-hidden className="text-fg-muted" />
                    Margem real
                  </h2>
                  <MedidorMargem pct={margemAgregadaPct} />
                </section>
              )}
            </div>
          </aside>

          {/* ==================== CONTEÚDO (coluna maior) ==================== */}
          <div className="space-y-10 lg:col-span-8">
            {/* ====================== Contadores de OS ====================== */}
            {!kpis.erro && k !== null && (
              <section aria-labelledby="contadores-titulo">
                <h2 id="contadores-titulo" className="mb-4 flex items-center gap-2 font-display text-h3 text-fg">
                  <ClipboardText size={20} weight="duotone" aria-hidden className="text-fg-muted" />
                  Ordens de serviço
                </h2>
                {/* Contadores de OS por status (semáforo via tokens). */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                  {CONTADORES.map(({ chave, rotulo, Icone, chip }) => (
                    <article
                      key={chave}
                      className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-xs transition-[border-color,box-shadow] duration-200 ease-default hover:border-border-strong hover:shadow-sm"
                    >
                      <span aria-hidden className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${chip}`}>
                        <Icone size={20} weight="duotone" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-numeric text-h3 leading-none tabular-nums text-fg">{num(Number(k[chave]))}</p>
                        <p className="mt-1 truncate text-caption text-fg-subtle">{rotulo}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

          {/* ============================== Funil ============================= */}
          <section aria-labelledby="funil-titulo">
            <h2 id="funil-titulo" className="mb-4 flex items-center gap-2 font-display text-h3 text-fg">
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
            <h2 id="ranking-titulo" className="mb-4 flex items-center gap-2 font-display text-h3 text-fg">
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
                        className="flex items-center gap-3 rounded-control border border-border bg-surface px-3.5 py-3 shadow-xs transition-[border-color,box-shadow] duration-150 ease-default hover:border-border-strong hover:shadow-sm"
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
            <h2 id="margem-titulo" className="mb-4 flex items-center gap-2 font-display text-h3 text-fg">
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
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-border bg-surface px-3.5 py-3 shadow-xs transition-[border-color,box-shadow] duration-150 ease-default hover:border-border-strong hover:shadow-sm"
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
        </div>
      )}

      {/* Honestidade de medição: os números refinam conforme o uso. */}
      <p className="mt-10 text-caption text-fg-subtle">
        Indicadores derivados de orçamentos aprovados e OS — refinam conforme o uso.
      </p>
    </main>
  );
}
