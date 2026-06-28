'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarBlank,
  ArrowDownLeft,
  ArrowUpRight,
  WarningOctagon,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { EmptyState } from '@/components/ui/empty-state';
import {
  carregarAging,
  ORDEM_FAIXAS,
  ROTULO_FAIXA,
  AJUDA_FAIXA,
  ROTULO_LADO,
  SEVERIDADE_FAIXA,
  type Aging,
  type LadoAging,
  type LadoResultado,
  type FaixaResultado,
  type SeveridadeFaixa,
} from '@/lib/supabase/aging';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/* ─────────────────────────── Cor por severidade (tokens) ──────────────────── */

/** Cor da BARRA de cada faixa, por severidade (só tokens, sem cor crua). */
const BARRA_SEVERIDADE: Record<SeveridadeFaixa, string> = {
  saudavel: 'bg-success-bg',
  atencao: 'bg-warning-bg',
  alerta: 'bg-warning-bg',
  perigo: 'bg-danger-bg',
};

/** Cor do TEXTO do valor de cada faixa, por severidade (token). */
const TEXTO_SEVERIDADE: Record<SeveridadeFaixa, string> = {
  saudavel: 'text-fg',
  atencao: 'text-warning',
  alerta: 'text-warning',
  perigo: 'text-danger',
};

/** Cor do PONTO/marcador de cada faixa, por severidade (token). */
const PONTO_SEVERIDADE: Record<SeveridadeFaixa, string> = {
  saudavel: 'bg-success-bg',
  atencao: 'bg-warning-bg',
  alerta: 'bg-warning-bg',
  perigo: 'bg-danger-bg',
};

/* ─────────────────────────── Linha de uma faixa ──────────────────────────── */

function LinhaFaixa({ faixa }: { faixa: FaixaResultado }) {
  const sev = SEVERIDADE_FAIXA[faixa.faixa];
  const pct = faixa.pctDoLado ?? 0;
  const temValor = faixa.total > 0;

  return (
    <div className="px-4 py-3 sm:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-small text-fg">
          <span
            aria-hidden
            className={`h-2 w-2 shrink-0 rounded-pill ${temValor ? PONTO_SEVERIDADE[sev] : 'bg-border-strong'}`}
          />
          {ROTULO_FAIXA[faixa.faixa]}
        </span>
        <span
          className={`font-numeric text-small font-semibold tabular-nums ${
            temValor ? TEXTO_SEVERIDADE[sev] : 'text-fg-subtle'
          }`}
        >
          {fmtMoeda(faixa.total)}
        </span>
      </div>

      {/* Barra de participação da faixa no total do lado. */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface-sunken">
        <div
          aria-hidden
          className={`h-full origin-left rounded-pill transition-transform duration-500 ease-default ${BARRA_SEVERIDADE[sev]}`}
          style={{ transform: `scaleX(${Math.max(0, Math.min(100, pct)) / 100})` }}
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-caption text-fg-subtle">
        <span>{AJUDA_FAIXA[faixa.faixa]}</span>
        <span className="shrink-0 font-numeric tabular-nums">
          {faixa.pctDoLado === null ? '—' : fmtPct(faixa.pctDoLado)} ·{' '}
          {faixa.qtd} {faixa.qtd === 1 ? 'título' : 'títulos'}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Seção de um lado ──────────────────────────── */

/** Ícone e acento de cada lado (recebíveis entram, pagáveis saem). */
const ICONE_LADO: Record<LadoAging, Icon> = {
  receber: ArrowDownLeft,
  pagar: ArrowUpRight,
};

function SecaoLado({ lado }: { lado: LadoResultado }) {
  const Icone = ICONE_LADO[lado.lado];
  // % do lado já vencido (provisão de risco) — saúde honesta do lado.
  const pctVencido = lado.total > 0 ? (lado.vencido / lado.total) * 100 : null;
  const temPerigo = lado.perigo > 0;

  return (
    <section className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
      {/* Cabeçalho do lado: total-herói + provisão de risco. */}
      <header className="border-b border-border bg-surface-raised px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-small font-medium text-fg">
            <Icone size={18} weight="duotone" aria-hidden className="text-primary" />
            {ROTULO_LADO[lado.lado]}
          </h2>
          <span className="font-numeric text-caption tabular-nums text-fg-subtle">
            {lado.qtd} {lado.qtd === 1 ? 'título em aberto' : 'títulos em aberto'}
          </span>
        </div>

        <p className="mt-3 font-numeric text-h1 leading-none tabular-nums text-fg">
          {fmtMoeda(lado.total)}
        </p>

        {/* Provisão de risco: quanto já está vencido (e quanto é perigo 60+). */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption">
          <span className="text-fg-subtle">
            Vencido{' '}
            <span
              className={`font-numeric font-semibold tabular-nums ${
                lado.vencido > 0 ? 'text-warning' : 'text-fg-muted'
              }`}
            >
              {fmtMoeda(lado.vencido)}
            </span>
            {pctVencido !== null && (
              <span className="text-fg-subtle"> ({fmtPct(pctVencido)})</span>
            )}
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              temPerigo ? 'text-danger' : 'text-fg-subtle'
            }`}
          >
            <WarningOctagon size={13} weight="fill" aria-hidden className="shrink-0" />
            <span>
              60+{' '}
              <span className="font-numeric font-semibold tabular-nums">
                {fmtMoeda(lado.perigo)}
              </span>
            </span>
          </span>
        </div>
      </header>

      {/* As 4 faixas de idade. */}
      <div className="divide-y divide-border/60">
        {lado.faixas.map((f) => (
          <LinhaFaixa key={f.faixa} faixa={f} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function AgingPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarAging nunca lança; guardamos a estrutura completa.
  const [aging, setAging] = useState<Aging | null>(null);

  const carregar = useCallback(async () => {
    const dados = await carregarAging();
    setAging(dados);
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

  if (estado === 'carregando' || !aging) {
    return <PainelSkeleton maxWidth="max-w-4xl" />;
  }

  const receber = aging.lados.find((l) => l.lado === 'receber') as LadoResultado;
  const pagar = aging.lados.find((l) => l.lado === 'pagar') as LadoResultado;

  // Saldo líquido em aberto (a receber − a pagar): leitura de fôlego de caixa.
  const liquido = receber.total - pagar.total;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Aging"
        titulo="Idade de recebíveis e pagáveis"
        descricao="Quanto você tem a receber e a pagar, por faixa de idade — do que está a vencer ao vencido há mais de 60 dias, com a provisão de risco à vista."
        acao={<VoltarPainel />}
      />

      {aging.aguardandoDados ? (
        /* Estado vazio HONESTO: a fonte (v_aging) ainda não respondeu títulos. */
        <EmptyState
          icon={CalendarBlank}
          titulo="Aguardando dados"
          descricao="Ainda não há recebíveis nem pagáveis em aberto para envelhecer. Quando os títulos a receber/pagar começarem a existir — e a migration 0019 estiver aplicada no TEST — o Aging preenche sozinho, sem mudar esta tela."
        />
      ) : (
        <>
          {/* Resumo: saldo líquido em aberto + nº de títulos no cálculo. */}
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border bg-surface-raised px-5 py-4 shadow-sm">
            <span className="inline-flex items-baseline gap-2">
              <CalendarBlank
                size={18}
                weight="duotone"
                aria-hidden
                className="translate-y-0.5 text-primary"
              />
              <span className="text-small text-fg-muted">
                Saldo líquido em aberto{' '}
                <span
                  className={`font-numeric font-semibold tabular-nums ${
                    liquido >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {fmtMoeda(liquido)}
                </span>
              </span>
            </span>
            <span className="text-small text-fg-subtle">
              <span className="font-numeric font-semibold text-fg-muted">{aging.qtdTitulos}</span>{' '}
              {aging.qtdTitulos === 1 ? 'título em aberto' : 'títulos em aberto'} (a receber + a pagar)
            </span>
          </div>

          {/* Os dois lados: A receber × A pagar. */}
          <div className="grid gap-3.5 md:grid-cols-2">
            <SecaoLado lado={receber} />
            <SecaoLado lado={pagar} />
          </div>
        </>
      )}

      {/* Honestidade de medição: de onde vêm os números e o que falta. */}
      <p className="mt-8 text-caption leading-relaxed text-fg-subtle">
        O Aging classifica cada título em aberto pela distância de hoje ao vencimento — a faixa{' '}
        <span className="text-fg-muted">60+ dias</span> é a de maior risco (provisão alta). Os números
        nascem das contas a receber e a pagar; enquanto a migration 0019 não estiver aplicada no{' '}
        <span className="text-fg-muted">TEST</span>, a tela mostra{' '}
        <span className="text-fg-muted">aguardando dados</span> — então preenche sozinha, sem mudar o
        layout. As faixas espelham a aba 📅 Aging da planilha.
      </p>
    </main>
  );
}
