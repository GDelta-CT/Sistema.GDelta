'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  CheckCircle,
  Warning,
  XCircle,
  Clock,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';
import {
  carregarKpis,
  ORDEM_KPIS,
  KPI_META,
  TOM_STATUS,
  ROTULO_STATUS,
  type KpiChave,
  type KpiResultado,
  type KpiStatus,
  type MetaKpi,
  type UnidadeKpi,
} from '@/lib/supabase/kpis';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
/** Percentual com 1 casa, mas inteiro quando redondo (ex.: 92% e não 92,0%). */
const fmtPct = (n: number) =>
  `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const fmtDias = (n: number) =>
  `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${n === 1 ? 'dia' : 'dias'}`;

/** Formata o VALOR atual conforme a unidade do KPI. */
function fmtValor(valor: number, unidade: UnidadeKpi): string {
  if (unidade === 'moeda') return fmtMoeda(valor);
  if (unidade === 'dias') return fmtDias(valor);
  return fmtPct(valor);
}

/** Formata o número simples de uma meta (sem o operador). */
function fmtMetaNum(n: number, unidade: UnidadeKpi): string {
  if (unidade === 'moeda') return fmtMoeda(n);
  if (unidade === 'dias') return `${n}`;
  return `${n}%`;
}

/** Texto legível da META, com o operador (ex.: "< 25 dias", "70–85%"). */
function rotuloMeta(meta: MetaKpi, unidade: UnidadeKpi): string {
  if (meta.sentido === 'faixa') {
    const sufixo = unidade === 'pct' ? '%' : unidade === 'dias' ? ' dias' : '';
    return `${meta.min}–${meta.max}${sufixo}`;
  }
  const op = meta.sentido === 'maior' ? '>' : '<';
  const sufixo = unidade === 'dias' ? ' dias' : '';
  return `${op} ${fmtMetaNum(meta.alvo, unidade)}${sufixo}`;
}

/* ─────────────────────────── Semáforo (visual) ──────────────────────────── */

/** Ícone Phosphor por status do semáforo — fonte única de aparência aqui. */
const ICONE_STATUS: Record<KpiStatus, Icon> = {
  atingida: CheckCircle,
  atencao: Warning,
  abaixo: XCircle,
  aguardando: Clock,
};

/** Classe da cor do número-herói por status (só tokens, sem cor crua). */
const TEXTO_STATUS: Record<KpiStatus, string> = {
  atingida: 'text-success',
  atencao: 'text-warning',
  abaixo: 'text-danger',
  aguardando: 'text-fg-subtle',
};

/** Classe do traço de acento no topo do card, por status (token). */
const ACENTO_STATUS: Record<KpiStatus, string> = {
  atingida: 'bg-success-bg',
  atencao: 'bg-warning-bg',
  abaixo: 'bg-danger-bg',
  aguardando: 'bg-border-strong',
};

/* ─────────────────────────── Card de KPI ──────────────────────────── */

function CardKpi({ kpi }: { kpi: KpiResultado }) {
  const meta = KPI_META[kpi.chave];
  const Icone = ICONE_STATUS[kpi.status];
  const aguardando = kpi.aguardandoDados;

  // % de atingimento vs. meta para a barra de progresso (saturada em 100% e só
  // quando há valor). Apresentação pura — não recalcula a regra do semáforo.
  const progresso =
    kpi.atingimento === null ? 0 : Math.max(0, Math.min(100, Math.round(kpi.atingimento * 100)));

  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface p-5 shadow-sm transition-[border-color,box-shadow] duration-200 ease-default hover:border-border-strong hover:shadow-md">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${ACENTO_STATUS[kpi.status]}`} />

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-small font-medium leading-snug text-fg">{meta.nome}</h2>
        <StatusChip tone={TOM_STATUS[kpi.status]} icon={Icone}>
          {ROTULO_STATUS[kpi.status]}
        </StatusChip>
      </div>

      {/* Valor-herói (ou "—" quando aguardando dados). */}
      <p
        className={`mt-4 font-numeric text-metric leading-none tracking-tight tabular-nums ${
          aguardando ? 'text-fg-subtle' : TEXTO_STATUS[kpi.status]
        }`}
      >
        {aguardando || kpi.valor === null ? '—' : fmtValor(kpi.valor, meta.unidade)}
      </p>

      {/* Linha de meta + barra de atingimento. */}
      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-caption">
          <span className="text-fg-subtle">Meta</span>
          <span className="font-numeric font-medium text-fg-muted">
            {rotuloMeta(kpi.meta, meta.unidade)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-pill bg-surface-sunken">
          <div
            className={`h-full origin-left rounded-pill transition-transform duration-500 ease-default ${
              aguardando ? 'bg-border-strong' : ACENTO_STATUS[kpi.status]
            }`}
            style={{ transform: `scaleX(${progresso / 100})` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Ajuda / nota honesta de medição. */}
      <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
        {aguardando ? kpi.nota : (kpi.nota ?? meta.ajuda)}
      </p>
    </article>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function KpisPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarKpis nunca lança; guardamos o mapa completo dos 9 KPIs.
  const [kpis, setKpis] = useState<Record<KpiChave, KpiResultado> | null>(null);

  const carregar = useCallback(async () => {
    const dados = await carregarKpis();
    setKpis(dados);
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

  if (estado === 'carregando' || !kpis) {
    return <PainelSkeleton maxWidth="max-w-5xl" />;
  }

  const lista = ORDEM_KPIS.map((c) => kpis[c]);
  const aoVivo = lista.filter((k) => !k.aguardandoDados).length;
  const atingidas = lista.filter((k) => k.status === 'atingida').length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · KPIs"
        titulo="KPIs estratégicos"
        descricao="Os 9 indicadores da gestão, cada um com meta e semáforo — derivados das suas OS, orçamentos e clientes."
        acao={<VoltarPainel />}
      />

      {/* Resumo do painel: quantos ao vivo / quantos na meta. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border bg-surface-raised px-5 py-4 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Target size={18} weight="duotone" aria-hidden className="text-primary" />
          <span className="text-small text-fg-muted">
            <span className="font-numeric font-semibold text-fg">{atingidas}</span> de{' '}
            <span className="font-numeric font-semibold text-fg">{lista.length}</span> na meta
          </span>
        </span>
        <span className="text-small text-fg-subtle">
          <span className="font-numeric font-semibold text-fg-muted">{aoVivo}</span> ao vivo ·{' '}
          <span className="font-numeric font-semibold text-fg-muted">{lista.length - aoVivo}</span>{' '}
          aguardando dados
        </span>
      </div>

      {/* Grid dos 9 KPIs (sempre completo, renderiza com banco vazio/sem token). */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((kpi) => (
          <CardKpi key={kpi.chave} kpi={kpi} />
        ))}
      </div>

      {/* Honestidade de medição: o que ainda depende de migrations no TEST. */}
      <p className="mt-8 text-caption leading-relaxed text-fg-subtle">
        Os indicadores ao vivo nascem do que você já registra. Retrabalho, RH (faturamento por
        funcionário e custo de folha) e ocupação por boxes ficam <span className="text-fg-muted">aguardando dados</span>{' '}
        até que as tabelas correspondentes sejam aplicadas no ambiente — então preenchem sozinhos, sem mudar a tela.
      </p>
    </main>
  );
}
