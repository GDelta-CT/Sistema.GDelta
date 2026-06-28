'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, TrendUp, ChartLineUp, Scales } from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';
import { statusMargem } from '@/lib/status';
import {
  carregarDre,
  DRE_META,
  type Dre,
  type DreChave,
  type DreLinha,
  type DreDerivado,
  type DrePapel,
} from '@/lib/supabase/dre';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const fmtMultiplo = (n: number) =>
  `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}×`;

/** Formata o valor de uma linha conforme seu papel/sinal (deduções vêm com −). */
function fmtValorLinha(linha: DreLinha): string {
  if (linha.aguardandoDados || linha.valor === null) return '—';
  const meta = DRE_META[linha.chave];
  const base = fmtMoeda(Math.abs(linha.valor));
  // Linhas subtrativas (deduções/custos) mostram o sinal de menos só quando
  // têm valor; subtotais e grupos mostram o valor cru (a hierarquia já dá o
  // sentido). Linha subtrativa com valor zero fica neutra.
  if (meta.sinal === 'subtrai' && linha.valor !== 0) return `−${base}`;
  return base;
}

/* ─────────────────────────── Estilo por papel ──────────────────────────── */

/** Recuo do rótulo por papel (detalhe é recuado sob o grupo). */
const RECUO_PAPEL: Record<DrePapel, string> = {
  grupo: 'pl-0',
  detalhe: 'pl-5',
  deducao: 'pl-0',
  subtotal: 'pl-0',
  resultado: 'pl-0',
};

/** Peso/tom do rótulo por papel. */
const ROTULO_PAPEL: Record<DrePapel, string> = {
  grupo: 'font-medium text-fg',
  detalhe: 'text-fg-muted',
  deducao: 'font-medium text-fg',
  subtotal: 'font-semibold text-fg',
  resultado: 'font-semibold text-fg',
};

/** Peso/tom do valor por papel. */
const VALOR_PAPEL: Record<DrePapel, string> = {
  grupo: 'font-numeric tabular-nums text-fg',
  detalhe: 'font-numeric tabular-nums text-fg-muted',
  deducao: 'font-numeric tabular-nums text-fg',
  subtotal: 'font-numeric font-semibold tabular-nums text-fg',
  resultado: 'font-numeric font-semibold tabular-nums text-fg',
};

/* ─────────────────────────── Linha da DRE ──────────────────────────── */

function LinhaDre({ linha }: { linha: DreLinha }) {
  const meta = DRE_META[linha.chave];
  const aguardando = linha.aguardandoDados;
  const ehSubtotal = meta.papel === 'subtotal';

  return (
    <div
      className={`grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 gap-y-1 px-4 py-2.5 sm:px-5 ${
        ehSubtotal ? 'border-y border-border bg-surface-sunken/60' : ''
      }`}
    >
      {/* Rótulo + nota honesta quando aguardando. */}
      <div className={`min-w-0 ${RECUO_PAPEL[meta.papel]}`}>
        <p className={`text-small leading-snug ${ROTULO_PAPEL[meta.papel]}`}>{meta.nome}</p>
        {aguardando && linha.nota && (
          <p className="mt-0.5 text-caption leading-relaxed text-fg-subtle">{linha.nota}</p>
        )}
        {!aguardando && linha.nota && meta.papel !== 'detalhe' && (
          <p className="mt-0.5 text-caption leading-relaxed text-fg-subtle">{linha.nota}</p>
        )}
      </div>

      {/* % AV (análise vertical sobre a receita). */}
      <span className="justify-self-end font-numeric text-caption tabular-nums text-fg-subtle">
        {linha.avPct === null ? '' : fmtPct(linha.avPct)}
      </span>

      {/* Valor monetário (ou — / "aguardando"). */}
      <span
        className={`justify-self-end text-small ${
          aguardando ? 'font-numeric tabular-nums text-fg-subtle' : VALOR_PAPEL[meta.papel]
        }`}
      >
        {aguardando ? (
          <span className="text-caption text-fg-subtle">aguardando dados</span>
        ) : (
          fmtValorLinha(linha)
        )}
      </span>
    </div>
  );
}

/* ─────────────────────────── Derivado (chip) ──────────────────────────── */

function CardDerivado({ derivado }: { derivado: DreDerivado }) {
  const aguardando = derivado.aguardandoDados;
  const valorFmt =
    aguardando || derivado.valor === null
      ? '—'
      : derivado.unidade === 'moeda'
        ? fmtMoeda(derivado.valor)
        : fmtMultiplo(derivado.valor);

  const Icone = derivado.chave === 'markup' ? TrendUp : Scales;

  return (
    <article className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icone size={18} weight="duotone" aria-hidden className="text-primary" />
        <h3 className="text-small font-medium text-fg">{derivado.nome}</h3>
      </div>
      <p
        className={`font-numeric text-h2 leading-none tabular-nums ${
          aguardando ? 'text-fg-subtle' : 'text-fg'
        }`}
      >
        {valorFmt}
      </p>
      <p className="text-caption leading-relaxed text-fg-subtle">{derivado.nota}</p>
    </article>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function DrePage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarDre nunca lança; guardamos a DRE completa.
  const [dre, setDre] = useState<Dre | null>(null);

  const carregar = useCallback(async () => {
    const dados = await carregarDre();
    setDre(dados);
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

  if (estado === 'carregando' || !dre) {
    return <PainelSkeleton maxWidth="max-w-4xl" />;
  }

  // Linha-herói: o Resultado Líquido (último da ordem). Ainda aguardando dados
  // até deduções/folha/despesas/impostos entrarem — número-herói honesto ("—").
  const resultado = dre.linhas.find((l) => l.chave === 'resultado_liquido') as DreLinha;
  // Lucro bruto parcial é a medida AO VIVO mais "alta" que conseguimos hoje;
  // serve de prova visível de que a DRE respira do que já existe.
  const lucroBruto = dre.linhas.find((l) => l.chave === 'lucro_bruto') as DreLinha;

  const aoVivo = dre.linhas.filter((l) => !l.aguardandoDados).length;
  const total = dre.linhas.length;

  // Semáforo do herói: usa a margem do lucro bruto parcial (AV) quando há base;
  // é a leitura honesta de saúde enquanto o resultado líquido não fecha.
  const margemHeroi = lucroBruto.avPct;
  const heroiTone = margemHeroi !== null ? statusMargem(margemHeroi).tone : 'neutral';

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · DRE"
        titulo="Demonstração de resultado"
        descricao="A DRE em estrutura contábil-padrão — da receita das suas OS ao resultado líquido, com análise vertical e os derivados de gestão."
        acao={<VoltarPainel />}
      />

      {/* Número-herói: resultado líquido (aguardando) + lucro bruto parcial ao vivo. */}
      <section className="mb-6 grid gap-3.5 sm:grid-cols-2">
        {/* Herói: Resultado líquido — honesto enquanto não fecha. */}
        <article className="relative overflow-hidden rounded-panel border border-border bg-surface-raised p-6 shadow-sm">
          <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-border-strong" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-small font-medium text-fg">Resultado líquido</h2>
            <StatusChip tone="neutral" icon={Receipt}>
              Aguardando dados
            </StatusChip>
          </div>
          <p className="mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums text-fg-subtle">
            —
          </p>
          <p className="mt-3 text-caption leading-relaxed text-fg-subtle">{resultado.nota}</p>
        </article>

        {/* Lucro bruto parcial — a medida AO VIVO que prova a tela. */}
        <article className="relative overflow-hidden rounded-panel border border-border bg-surface-raised p-6 shadow-sm">
          <span
            aria-hidden
            className={`absolute inset-x-0 top-0 h-0.5 ${
              heroiTone === 'success'
                ? 'bg-success-bg'
                : heroiTone === 'warning'
                  ? 'bg-warning-bg'
                  : heroiTone === 'danger'
                    ? 'bg-danger-bg'
                    : 'bg-border-strong'
            }`}
          />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-small font-medium text-fg">Lucro bruto (parcial)</h2>
            {margemHeroi !== null && (
              <StatusChip tone={heroiTone} icon={TrendUp}>
                {statusMargem(margemHeroi).label}
              </StatusChip>
            )}
          </div>
          <p
            className={`mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums ${
              lucroBruto.aguardandoDados || lucroBruto.valor === null
                ? 'text-fg-subtle'
                : heroiTone === 'success'
                  ? 'text-success'
                  : heroiTone === 'warning'
                    ? 'text-warning'
                    : heroiTone === 'danger'
                      ? 'text-danger'
                      : 'text-fg'
            }`}
          >
            {lucroBruto.aguardandoDados || lucroBruto.valor === null
              ? '—'
              : fmtMoeda(lucroBruto.valor)}
          </p>
          <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
            {margemHeroi !== null
              ? `Margem bruta ${fmtPct(margemHeroi)} · receita − peças − tintas (sem folha/ISS ainda).`
              : 'Aprove e produza OS para a DRE começar a respirar.'}
          </p>
        </article>
      </section>

      {/* Resumo da medição: quantas linhas ao vivo / quantas OS no agregado. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border bg-surface px-5 py-4 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <ChartLineUp size={18} weight="duotone" aria-hidden className="text-primary" />
          <span className="text-small text-fg-muted">
            <span className="font-numeric font-semibold text-fg">{aoVivo}</span> de{' '}
            <span className="font-numeric font-semibold text-fg">{total}</span> linhas ao vivo
          </span>
        </span>
        <span className="text-small text-fg-subtle">
          <span className="font-numeric font-semibold text-fg-muted">{dre.qtdOs}</span>{' '}
          {dre.qtdOs === 1 ? 'OS no cálculo' : 'OS no cálculo'} ·{' '}
          {dre.baseAv === null
            ? 'sem base de AV'
            : `base de AV ${fmtMoeda(dre.baseAv)}`}
        </span>
      </div>

      {/* A DRE: linhas hierárquicas, com cabeçalho de colunas. */}
      <section className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
        {/* Cabeçalho de colunas. */}
        <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 border-b border-border bg-surface-sunken px-4 py-2.5 sm:px-5">
          <span className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Conta</span>
          <span className="justify-self-end text-overline uppercase tracking-[0.12em] text-fg-subtle">
            AV %
          </span>
          <span className="justify-self-end text-overline uppercase tracking-[0.12em] text-fg-subtle">
            Valor
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {dre.linhas.map((linha) => (
            <LinhaDre key={linha.chave} linha={linha} />
          ))}
        </div>
      </section>

      {/* Derivados de gestão: Markup e Ponto de Equilíbrio. */}
      <section className="mt-6">
        <h2 className="mb-3 text-overline uppercase tracking-[0.12em] text-fg-subtle">
          Derivados de gestão
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {dre.derivados.map((d) => (
            <CardDerivado key={d.chave} derivado={d} />
          ))}
        </div>
      </section>

      {/* Honestidade de medição: o que ainda depende de migrations no TEST. */}
      <p className="mt-8 text-caption leading-relaxed text-fg-subtle">
        A receita bruta, o custo de peças, o custo de tintas/insumos e o lucro bruto parcial nascem
        do que você já registra nas OS. Deduções (ISS), mão-de-obra direta (folha), despesas
        operacionais e impostos ficam{' '}
        <span className="text-fg-muted">aguardando dados</span> até que as tabelas correspondentes
        sejam aplicadas no ambiente — então a DRE fecha sozinha, sem mudar a tela. A análise vertical
        usa a receita bruta como base enquanto as deduções não entram.
      </p>
    </main>
  );
}
