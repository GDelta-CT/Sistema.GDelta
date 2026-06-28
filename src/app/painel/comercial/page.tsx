'use client';

/**
 * Pipeline Comercial — funil de orçamentos (aba 🎯 Orçamentos da Planilha v2.0).
 *
 * Responde a UMA pergunta de gestão: "do que orcei, quanto fecha — e por qual
 * canal?". Mostra TAXA DE CONVERSÃO (aprovados ÷ decididos), TICKET MÉDIO (dos
 * aprovados), o recorte por CANAL (Seguradora × Particular × Cooperativa) e o
 * FUNIL por status. Tudo derivado dos orçamentos que JÁ existem — fail-soft.
 *
 * Estados tratados: carregando (skeleton) · vazio (sem orçamentos) · pronto. Não
 * há ramo de "erro" porque a camada de dados degrada para vazio (nunca lança).
 *
 * Mesma qualidade/estrutura da tela de KPIs: PageHeader + VoltarPainel, banda de
 * resumo, grid de cards com acento por status, só tokens (sem cor crua, sem emoji).
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  CheckCircle,
  Receipt,
  Funnel,
  Hourglass,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusChip } from '@/components/ui/status-chip';
import { statusOrcamento, tipoCliente, type ChipTone } from '@/lib/status';
import {
  carregarPipeline,
  ROTULO_CANAL,
  ROTULO_STATUS_FUNIL,
  type PipelineComercial,
  type RecorteCanal,
  type EtapaFunil,
  type CanalComercial,
} from '@/lib/supabase/comercial';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
/** Percentual com 1 casa, mas inteiro quando redondo (ex.: 67% e não 67,0%). */
const fmtPct = (n: number) =>
  `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const fmtNum = (n: number) => n.toLocaleString('pt-BR');

/* ─────────────────────────── Aparência por canal ──────────────────────────── */

/** Tom do chip do canal — reusa a fonte única (@/lib/status); neutro p/ sem cliente. */
function tomCanal(canal: CanalComercial): ChipTone {
  return canal === 'sem_cliente' ? 'neutral' : tipoCliente(canal).tone;
}

/* ─────────────────────────── Card de métrica-herói ──────────────────────────── */

function CardMetrica({
  titulo,
  valor,
  legenda,
  icone: Icone,
  acento,
}: {
  titulo: string;
  valor: string;
  legenda: string;
  icone: typeof Target;
  acento: string;
}) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface p-5 shadow-sm transition-[border-color,box-shadow] duration-200 ease-default hover:border-border-strong hover:shadow-md">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${acento}`} />

      <div className="flex items-center gap-2">
        <Icone size={18} weight="duotone" aria-hidden className="text-primary" />
        <h2 className="text-small font-medium leading-snug text-fg">{titulo}</h2>
      </div>

      <p className="mt-4 font-numeric text-metric leading-none tracking-tight tabular-nums text-fg">
        {valor}
      </p>

      <p className="mt-3 text-caption leading-relaxed text-fg-subtle">{legenda}</p>
    </article>
  );
}

/* ─────────────────────────── Linha do funil ──────────────────────────── */

function LinhaFunil({ etapa, maxQtd }: { etapa: EtapaFunil; maxQtd: number }) {
  const ap = statusOrcamento(etapa.status); // rótulo + tom da fonte única
  // Largura da barra proporcional à maior etapa (apresentação pura).
  const largura = maxQtd > 0 ? Math.round((etapa.quantidade / maxQtd) * 100) : 0;
  // Tom → classe de preenchimento da barra (só tokens, sem cor crua).
  const fill: Record<ChipTone, string> = {
    primary: 'bg-primary',
    success: 'bg-success-bg',
    warning: 'bg-warning-bg',
    danger: 'bg-danger-bg',
    neutral: 'bg-border-strong',
  };

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-3">
        <StatusChip tone={ap.tone}>{ROTULO_STATUS_FUNIL[etapa.status]}</StatusChip>
        <div className="flex items-baseline gap-3">
          <span className="font-numeric text-small font-semibold tabular-nums text-fg">
            {fmtNum(etapa.quantidade)}
          </span>
          <span className="font-numeric text-caption tabular-nums text-fg-subtle">
            {fmtMoeda(etapa.valor)}
          </span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-surface-sunken">
        <div
          className={`h-full origin-left rounded-pill transition-transform duration-500 ease-default ${fill[ap.tone]}`}
          style={{ transform: `scaleX(${largura / 100})` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ─────────────────────────── Card de canal ──────────────────────────── */

function CardCanal({ recorte }: { recorte: RecorteCanal }) {
  return (
    <article className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-small font-medium text-fg">{ROTULO_CANAL[recorte.canal]}</h3>
        <StatusChip tone={tomCanal(recorte.canal)}>
          {fmtNum(recorte.total)} {recorte.total === 1 ? 'orçamento' : 'orçamentos'}
        </StatusChip>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-caption text-fg-subtle">Conversão</p>
          <p className="mt-1 font-numeric text-h3 font-semibold tabular-nums text-fg">
            {recorte.decididos > 0 ? fmtPct(recorte.conversaoPct) : '—'}
          </p>
          <p className="mt-0.5 text-caption text-fg-subtle">
            {fmtNum(recorte.aprovados)} de {fmtNum(recorte.decididos)} decididos
          </p>
        </div>
        <div>
          <p className="text-caption text-fg-subtle">Ticket médio</p>
          <p className="mt-1 font-numeric text-h3 font-semibold tabular-nums text-fg">
            {recorte.aprovados > 0 ? fmtMoeda(recorte.ticketMedio) : '—'}
          </p>
          <p className="mt-0.5 font-numeric text-caption tabular-nums text-fg-subtle">
            {fmtMoeda(recorte.valorAprovado)} fechado
          </p>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function ComercialPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarPipeline nunca lança; vem zerado (temDados:false) se vazio.
  const [pipeline, setPipeline] = useState<PipelineComercial | null>(null);

  const carregar = useCallback(async () => {
    const dados = await carregarPipeline();
    setPipeline(dados);
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

  if (estado === 'carregando' || !pipeline) {
    return <PainelSkeleton maxWidth="max-w-5xl" />;
  }

  const cabecalho = (
    <PageHeader
      overline="GDelta · Comercial"
      titulo="Pipeline comercial"
      descricao="O funil dos seus orçamentos — conversão, ticket médio e o recorte por canal, direto do que você já orça."
      acao={<VoltarPainel />}
    />
  );

  // ESTADO VAZIO: nenhum orçamento ainda (banco vazio / sem sessão / fonte off).
  if (!pipeline.temDados) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {cabecalho}
        <EmptyState
          icon={Target}
          titulo="Sem orçamentos ainda"
          descricao="Quando você criar orçamentos, este funil mostra sozinho a taxa de conversão, o ticket médio e a divisão por canal — sem você digitar nada de novo."
        />
      </main>
    );
  }

  const maxQtd = pipeline.funil.reduce((m, e) => Math.max(m, e.quantidade), 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      {cabecalho}

      {/* Banda de resumo: total, decididos, em aberto. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border bg-surface-raised px-5 py-4 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Funnel size={18} weight="duotone" aria-hidden className="text-primary" />
          <span className="text-small text-fg-muted">
            <span className="font-numeric font-semibold text-fg">{fmtNum(pipeline.total)}</span>{' '}
            {pipeline.total === 1 ? 'orçamento' : 'orçamentos'} no total
          </span>
        </span>
        <span className="text-small text-fg-subtle">
          <span className="font-numeric font-semibold text-fg-muted">{fmtNum(pipeline.aprovados)}</span>{' '}
          aprovados ·{' '}
          <span className="font-numeric font-semibold text-fg-muted">{fmtNum(pipeline.recusados)}</span>{' '}
          recusados ·{' '}
          <span className="font-numeric font-semibold text-fg-muted">{fmtNum(pipeline.emAberto)}</span>{' '}
          em aberto
        </span>
      </div>

      {/* Métricas-herói: conversão + ticket médio. */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <CardMetrica
          titulo="Taxa de conversão"
          valor={pipeline.decididos > 0 ? fmtPct(pipeline.conversaoPct) : '—'}
          legenda={
            pipeline.decididos > 0
              ? `${fmtNum(pipeline.aprovados)} aprovados de ${fmtNum(pipeline.decididos)} decididos (aprovado + recusado).`
              : 'Aguardando o primeiro orçamento decidido (aprovado ou recusado).'
          }
          icone={CheckCircle}
          acento="bg-success-bg"
        />
        <CardMetrica
          titulo="Ticket médio"
          valor={pipeline.aprovados > 0 ? fmtMoeda(pipeline.ticketMedio) : '—'}
          legenda={
            pipeline.aprovados > 0
              ? `${fmtMoeda(pipeline.valorAprovado)} fechados em ${fmtNum(pipeline.aprovados)} ${pipeline.aprovados === 1 ? 'orçamento' : 'orçamentos'}.`
              : 'Aprove um orçamento para o ticket médio aparecer.'
          }
          icone={Receipt}
          acento="bg-primary"
        />
      </div>

      {/* Funil por status do orçamento. */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Funnel size={18} weight="duotone" aria-hidden className="text-fg-muted" />
          <h2 className="font-display text-h3 text-fg">Funil por status</h2>
        </div>
        <div className="divide-y divide-border rounded-card border border-border bg-surface px-5 py-1 shadow-sm">
          {pipeline.funil.map((etapa) => (
            <LinhaFunil key={etapa.status} etapa={etapa} maxQtd={maxQtd} />
          ))}
        </div>
      </section>

      {/* Recorte por canal (Seguradora × Particular × Cooperativa). */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Target size={18} weight="duotone" aria-hidden className="text-fg-muted" />
          <h2 className="font-display text-h3 text-fg">Por canal</h2>
        </div>
        {pipeline.canais.length === 0 ? (
          <div className="flex items-center gap-3 rounded-card border border-dashed border-border bg-surface px-5 py-6 text-small text-fg-muted">
            <Hourglass size={20} weight="duotone" aria-hidden className="shrink-0 text-fg-subtle" />
            Vincule um cliente aos orçamentos para ver a divisão entre seguradora e particular.
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {pipeline.canais.map((recorte) => (
              <CardCanal key={recorte.canal} recorte={recorte} />
            ))}
          </div>
        )}
      </section>

      {/* Honestidade de medição: como conversão e ticket são contados. */}
      <p className="mt-8 text-caption leading-relaxed text-fg-subtle">
        A <span className="text-fg-muted">conversão</span> conta só o que foi decidido (aprovado ou
        recusado) — orçamentos em rascunho ou enviados ainda não pesam. O{' '}
        <span className="text-fg-muted">ticket médio</span> e os valores por canal usam o mesmo total
        (itens − desconto) que você vê ao montar o orçamento. Tudo nasce do que você já registra; o
        funil cresce sozinho conforme novos orçamentos entram. O recorte por canal usa o tipo do
        cliente; orçamentos sem cliente aparecem como <span className="text-fg-muted">sem cliente</span>.
      </p>
    </main>
  );
}
