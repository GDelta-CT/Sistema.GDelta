'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  TrendUp,
  TrendDown,
  ArrowsLeftRight,
  Warning,
  CheckCircle,
  CalendarBlank,
  ArrowClockwise,
  CloudWarning,
} from '@phosphor-icons/react';
import { guardarSessao } from '@/lib/demo/session';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';
import { EmptyState } from '@/components/ui/empty-state';
import {
  carregarFluxo,
  SEMANAS_JANELA,
  JANELAS_SEMANAS,
  type JanelaSemanas,
  type FluxoCaixa,
  type SemanaFluxo,
} from '@/lib/supabase/fluxo';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Valor com sinal explícito (+ entra, − sai) para o líquido/acumulado. */
const fmtMoedaSinal = (n: number) => {
  if (n === 0) return fmtMoeda(0);
  const base = fmtMoeda(Math.abs(n));
  return n > 0 ? `+${base}` : `−${base}`;
};

/** Dia/mês curto a partir de um ISO `YYYY-MM-DD` (sem fuso — corta a string). */
function diaMes(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

/** Rótulo do período de uma semana (ex.: "30/06 – 06/07"). */
function rotuloPeriodo(s: SemanaFluxo): string {
  return `${diaMes(s.semana)} – ${diaMes(s.fimSemana)}`;
}

/* ─────────────────────────── Cor por sinal ──────────────────────────── */

/** Classe de texto pelo sinal de um valor (positivo/negativo/zero). */
function corSinal(n: number): string {
  if (n > 0) return 'text-success';
  if (n < 0) return 'text-danger';
  return 'text-fg-muted';
}

/* ─────────────────────────── Card de número-herói ──────────────────────── */

function CardHeroi({
  titulo,
  valor,
  chip,
  nota,
  acento,
  corValor,
}: {
  titulo: string;
  valor: string;
  chip?: React.ReactNode;
  nota: string;
  acento: string;
  corValor: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-panel border border-border bg-surface-raised p-6 shadow-sm">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${acento}`} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-small font-medium text-fg">{titulo}</h2>
        {chip}
      </div>
      <p
        className={`mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums ${corValor}`}
      >
        {valor}
      </p>
      <p className="mt-3 text-caption leading-relaxed text-fg-subtle">{nota}</p>
    </article>
  );
}

/* ─────────────────────────── Linha da semana ──────────────────────────── */

function LinhaSemana({ s, indice }: { s: SemanaFluxo; indice: number }) {
  // A PRIMEIRA semana de virada negativa ganha destaque de alerta (o coração da
  // tela: "previne o saldo negativo antes de acontecer"). Demais semanas
  // negativas ficam marcadas em vermelho no acumulado, sem o fundo de alerta.
  const alerta = s.primeiraNegativa;

  return (
    <div
      className={`grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[7rem_1fr_1fr_1fr_1fr] sm:px-5 ${
        alerta ? 'bg-danger-tint' : ''
      }`}
    >
      {/* Período da semana + selo "esta semana"/alerta. */}
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:block">
        <p className="font-numeric text-small font-medium tabular-nums text-fg">
          {rotuloPeriodo(s)}
        </p>
        {indice === 0 && !alerta && (
          <span className="text-caption text-fg-subtle">esta semana</span>
        )}
        {alerta && (
          <span className="inline-flex items-center gap-1 text-caption font-medium text-danger">
            <Warning size={13} weight="fill" aria-hidden />
            caixa negativo
          </span>
        )}
      </div>

      {/* Entradas. */}
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-caption text-fg-subtle sm:hidden">Entradas</span>
        <span
          className={`font-numeric text-small tabular-nums ${
            s.entradas > 0 ? 'text-success' : 'text-fg-subtle'
          }`}
        >
          {s.entradas > 0 ? `+${fmtMoeda(s.entradas)}` : '—'}
        </span>
      </div>

      {/* Saídas. */}
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-caption text-fg-subtle sm:hidden">Saídas</span>
        <span
          className={`font-numeric text-small tabular-nums ${
            s.saidas > 0 ? 'text-danger' : 'text-fg-subtle'
          }`}
        >
          {s.saidas > 0 ? `−${fmtMoeda(s.saidas)}` : '—'}
        </span>
      </div>

      {/* Líquido da semana. */}
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-caption text-fg-subtle sm:hidden">Líquido</span>
        <span className={`font-numeric text-small tabular-nums ${corSinal(s.liquido)}`}>
          {fmtMoedaSinal(s.liquido)}
        </span>
      </div>

      {/* Saldo acumulado projetado (a coluna que antecipa a virada). */}
      <div className="flex items-baseline justify-between sm:block sm:text-right">
        <span className="text-caption text-fg-subtle sm:hidden">Acumulado</span>
        <span
          className={`font-numeric text-small font-semibold tabular-nums ${
            s.negativa ? 'text-danger' : 'text-fg'
          }`}
        >
          {fmtMoedaSinal(s.acumulado)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Seletor de janela ──────────────────────────── */

/**
 * Segmented control para escolher o horizonte da projeção (4 / 8 / 12 semanas).
 * Mesmo padrão acessível das outras telas (estoque): `role="radiogroup"` com
 * botões `role="radio"` + `aria-checked`, alvo de toque ≥44px (`min-h-11`) e
 * foco visível herdado do `:focus-visible` global. Sem cor crua — só tokens.
 */
function SeletorJanela({
  janela,
  aoTrocar,
}: {
  janela: JanelaSemanas;
  aoTrocar: (semanas: JanelaSemanas) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span id="rotulo-janela" className="text-caption font-medium text-fg-muted">
        Horizonte da projeção
      </span>
      <div
        role="radiogroup"
        aria-labelledby="rotulo-janela"
        className="inline-flex gap-1 rounded-control border border-border bg-surface-sunken p-1"
      >
        {JANELAS_SEMANAS.map((s) => {
          const ativo = s === janela;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => aoTrocar(s)}
              className={`min-h-11 rounded-control px-3.5 py-1.5 text-small font-medium tabular-nums transition-colors duration-150 ease-default ${
                ativo
                  ? 'bg-primary/10 text-primary shadow-xs'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {s} sem
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function FluxoPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarFluxo nunca lança; guardamos a projeção completa.
  const [fluxo, setFluxo] = useState<FluxoCaixa | null>(null);
  // Janela escolhida na tela (4 / 8 / 12 semanas) — recalcula a projeção exibida.
  const [janela, setJanela] = useState<JanelaSemanas>(SEMANAS_JANELA);

  const carregar = useCallback(async (semanas: JanelaSemanas) => {
    const dados = await carregarFluxo(semanas);
    setFluxo(dados);
    setEstado('pronto');
  }, []);

  // Guard de sessão (uma vez). Em seguida, e a cada troca de janela, recarrega.
  useEffect(() => {
    guardarSessao(router, () => carregar(janela));
  }, [router, carregar, janela]);

  // Troca a janela: volta ao skeleton e recarrega a projeção para o novo período.
  const trocarJanela = useCallback(
    (semanas: JanelaSemanas) => {
      if (semanas === janela) return;
      setEstado('carregando');
      setJanela(semanas);
    },
    [janela]
  );

  // Tentar de novo após um erro transitório: recarrega a MESMA janela atual.
  const recarregar = useCallback(() => {
    setEstado('carregando');
    carregar(janela);
  }, [carregar, janela]);

  if (estado === 'carregando' || !fluxo) {
    return <PainelSkeleton maxWidth="max-w-4xl" />;
  }

  const { semanas, semanasJanela, totalEntradas, totalSaidas, liquidoProjetado, indicePrimeiraNegativa } =
    fluxo;
  const aguardando = fluxo.aguardandoDados;
  const erroTransitorio = fluxo.erroTransitorio;
  const temMovimento = totalEntradas > 0 || totalSaidas > 0;

  // Rótulo do horizonte da janela em dias (~7 dias por semana) — acompanha a
  // janela escolhida (4 → ~30 dias, 8 → ~60, 12 → ~90).
  const diasJanela = semanasJanela * 7;

  // Semáforo do herói (líquido projetado da janela): positivo = saudável; virada
  // negativa em algum ponto = atenção/alerta; zero/sem movimento = neutro.
  const heroiTone =
    indicePrimeiraNegativa !== null
      ? 'danger'
      : liquidoProjetado > 0
        ? 'success'
        : liquidoProjetado < 0
          ? 'danger'
          : 'neutral';

  const acentoHeroi =
    heroiTone === 'success'
      ? 'bg-success-bg'
      : heroiTone === 'danger'
        ? 'bg-danger-bg'
        : 'bg-border-strong';

  const corHeroi =
    aguardando || !temMovimento
      ? 'text-fg-subtle'
      : heroiTone === 'success'
        ? 'text-success'
        : heroiTone === 'danger'
          ? 'text-danger'
          : 'text-fg';

  const semanaAlerta =
    indicePrimeiraNegativa !== null ? semanas[indicePrimeiraNegativa] : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Fluxo de caixa"
        titulo="Fluxo de caixa"
        descricao={`Projeção semanal das próximas ${semanasJanela} semanas (≈${diasJanela} dias) — entradas a receber menos saídas a pagar, com o saldo acumulado que antecipa o caixa negativo antes dele acontecer.`}
        acao={<VoltarPainel />}
      />

      {/* Seletor de janela: recalcula a projeção exibida (4 / 8 / 12 semanas). */}
      <SeletorJanela janela={janela} aoTrocar={trocarJanela} />

      {/* Erro TRANSITÓRIO: a janela voltou zerada por timeout/rede — NÃO é caixa
          real. Dizemos a verdade ("não foi possível atualizar") e oferecemos
          tentar de novo, em vez de exibir um falso "caixa positivo". */}
      {erroTransitorio ? (
        <EmptyState
          icon={CloudWarning}
          titulo="Não foi possível atualizar agora"
          descricao="A projeção de caixa não pôde ser carregada (conexão instável ou tempo esgotado). Isso não significa caixa positivo — é só uma falha temporária. Tente de novo."
          acao={
            <button
              type="button"
              onClick={recarregar}
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-small font-medium text-fg transition-colors duration-150 ease-default hover:border-border-strong hover:text-fg"
            >
              <ArrowClockwise size={16} weight="bold" aria-hidden />
              Tentar de novo
            </button>
          }
        />
      ) : aguardando ? (
        /* Estado vazio honesto: a view 0019 ainda não existe no ambiente. */
        <EmptyState
          icon={Wallet}
          titulo="Aguardando dados"
          descricao="A projeção de caixa nasce da view de fluxo (v_fluxo_caixa). Ela ainda não existe neste ambiente — aplicar a migration 0019 no TEST liga esta tela sozinha, sem mudar nada aqui."
        />
      ) : (
        <>
          {/* Números-herói: líquido projetado da janela + alerta de virada. */}
          <section className="mb-6 grid gap-3.5 sm:grid-cols-2">
            <CardHeroi
              titulo={`Líquido projetado · ${diasJanela} dias`}
              valor={temMovimento ? fmtMoedaSinal(liquidoProjetado) : '—'}
              corValor={corHeroi}
              acento={acentoHeroi}
              chip={
                temMovimento ? (
                  indicePrimeiraNegativa !== null ? (
                    <StatusChip tone="danger" icon={Warning}>
                      Caixa fica negativo
                    </StatusChip>
                  ) : liquidoProjetado >= 0 ? (
                    <StatusChip tone="success" icon={CheckCircle}>
                      Caixa positivo
                    </StatusChip>
                  ) : (
                    <StatusChip tone="danger" icon={TrendDown}>
                      Caixa negativo
                    </StatusChip>
                  )
                ) : (
                  <StatusChip tone="neutral" icon={Wallet}>
                    Sem títulos
                  </StatusChip>
                )
              }
              nota={
                temMovimento
                  ? 'Efeito líquido dos vencimentos sobre o caixa na janela (parte de zero; sem saldo inicial ainda).'
                  : 'Sem títulos a vencer na janela — lance contas a receber e a pagar para a projeção respirar.'
              }
            />

            {/* Card de alerta: a primeira semana em que o caixa vira negativo. */}
            <article className="relative overflow-hidden rounded-panel border border-border bg-surface-raised p-6 shadow-sm">
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-0.5 ${
                  semanaAlerta ? 'bg-danger-bg' : 'bg-success-bg'
                }`}
              />
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-small font-medium text-fg">Alerta de caixa</h2>
                {temMovimento &&
                  (semanaAlerta ? (
                    <StatusChip tone="danger" icon={Warning}>
                      Ação necessária
                    </StatusChip>
                  ) : (
                    <StatusChip tone="success" icon={CheckCircle}>
                      Tudo certo
                    </StatusChip>
                  ))}
              </div>
              {semanaAlerta ? (
                <>
                  <p className="mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums text-danger">
                    {rotuloPeriodo(semanaAlerta)}
                  </p>
                  <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
                    O saldo acumulado fica em{' '}
                    <span className="font-medium text-danger">
                      {fmtMoedaSinal(semanaAlerta.acumulado)}
                    </span>{' '}
                    nesta semana. Antecipe recebimentos ou negocie pagamentos antes dela.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums text-success">
                    {temMovimento ? 'OK' : '—'}
                  </p>
                  <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
                    {temMovimento
                      ? `O caixa projetado se mantém positivo em todas as ${semanasJanela} semanas da janela.`
                      : 'Sem títulos a vencer ainda — nada a projetar nesta janela.'}
                  </p>
                </>
              )}
            </article>
          </section>

          {/* Resumo da janela: entradas, saídas e quantas semanas. */}
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border bg-surface px-5 py-4 shadow-sm">
            <span className="inline-flex items-center gap-2">
              <TrendUp size={18} weight="duotone" aria-hidden className="text-success" />
              <span className="text-small text-fg-muted">
                Entradas{' '}
                <span className="font-numeric font-semibold text-fg">
                  {fmtMoeda(totalEntradas)}
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendDown size={18} weight="duotone" aria-hidden className="text-danger" />
              <span className="text-small text-fg-muted">
                Saídas{' '}
                <span className="font-numeric font-semibold text-fg">{fmtMoeda(totalSaidas)}</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarBlank size={18} weight="duotone" aria-hidden className="text-primary" />
              <span className="text-small text-fg-subtle">
                <span className="font-numeric font-semibold text-fg-muted">{semanasJanela}</span>{' '}
                semanas na janela
              </span>
            </span>
          </div>

          {/* A projeção: uma linha por semana, com cabeçalho de colunas. */}
          <section className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
            {/* Cabeçalho de colunas (só no desktop; mobile vira lista rotulada). */}
            <div className="hidden grid-cols-[7rem_1fr_1fr_1fr_1fr] items-baseline gap-x-4 border-b border-border bg-surface-sunken px-5 py-2.5 sm:grid">
              <span className="text-overline uppercase tracking-[0.12em] text-fg-subtle">
                Semana
              </span>
              <span className="justify-self-end text-overline uppercase tracking-[0.12em] text-fg-subtle">
                Entradas
              </span>
              <span className="justify-self-end text-overline uppercase tracking-[0.12em] text-fg-subtle">
                Saídas
              </span>
              <span className="justify-self-end text-overline uppercase tracking-[0.12em] text-fg-subtle">
                Líquido
              </span>
              <span className="justify-self-end text-overline uppercase tracking-[0.12em] text-fg-subtle">
                Acumulado
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {semanas.map((s, i) => (
                <LinhaSemana key={s.semana} s={s} indice={i} />
              ))}
            </div>
          </section>

          {/* Legenda honesta da medição. */}
          <p className="mt-8 flex items-start gap-2 text-caption leading-relaxed text-fg-subtle">
            <ArrowsLeftRight size={16} weight="duotone" aria-hidden className="mt-0.5 shrink-0" />
            <span>
              As entradas vêm das contas a receber e as saídas das contas a pagar, agrupadas pela
              semana do vencimento. O <span className="text-fg-muted">acumulado</span> parte de zero
              (sem saldo inicial de caixa ainda no ambiente) e mostra o efeito dos vencimentos sobre
              o caixa — a primeira semana em vermelho é onde ele viraria negativo.
            </span>
          </p>
        </>
      )}
    </main>
  );
}
