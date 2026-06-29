'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Repeat,
  CurrencyDollar,
  Tag,
  ArrowsClockwise,
  Receipt,
} from '@phosphor-icons/react';
import { guardarSessao } from '@/lib/demo/session';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import {
  carregarDespesas,
  ROTULO_TIPO,
  ROTULO_PERIODICIDADE,
  type ResumoDespesas,
  type Despesa,
  type GrupoCategoria,
} from '@/lib/supabase/despesas';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const fmtMoedaExata = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const fmtPct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Competência ISO (YYYY-MM-DD) → "mês/aaaa" curto (sem fuso, lê só a string). */
function fmtCompetencia(iso: string): string {
  const [ano, mes] = iso.split('-');
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];
  const i = Number(mes) - 1;
  if (!ano || i < 0 || i > 11) return iso;
  return `${meses[i]}/${ano}`;
}

/* ─────────────────────────── Card-resumo (herói) ──────────────────────────── */

function CardTotal({
  titulo,
  valor,
  qtd,
  pct,
  destaque,
  Icone,
}: {
  titulo: string;
  valor: number;
  qtd: number;
  /** % do total geral (null quando não há total). */
  pct: number | null;
  /** Faixa superior em destaque (o tipo "fixa" ganha o realce primário). */
  destaque: boolean;
  Icone: typeof Wallet;
}) {
  return (
    <article className="relative overflow-hidden rounded-panel border border-border bg-surface-raised p-6 shadow-sm">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-0.5 ${destaque ? 'bg-primary' : 'bg-border-strong'}`}
      />
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-small font-medium text-fg">
          <Icone size={18} weight="duotone" aria-hidden className="text-primary" />
          {titulo}
        </h2>
        <span className="font-numeric text-caption tabular-nums text-fg-subtle">
          {qtd} {qtd === 1 ? 'lançamento' : 'lançamentos'}
        </span>
      </div>
      <p className="mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums text-fg">
        {fmtMoeda(valor)}
      </p>
      <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
        {pct === null ? 'Sem despesas no período ainda.' : `${fmtPct(pct)} do total de despesas.`}
      </p>
    </article>
  );
}

/* ─────────────────────────── Linha de despesa ──────────────────────────── */

function LinhaDespesa({ despesa }: { despesa: Despesa }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-small text-fg">{despesa.descricao}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-caption text-fg-subtle">{fmtCompetencia(despesa.data_competencia)}</span>
          <Chip tone={despesa.tipo === 'fixa' ? 'primary' : 'neutral'}>
            {ROTULO_TIPO[despesa.tipo]}
          </Chip>
          {despesa.recorrente && despesa.periodicidade && (
            <Chip tone="neutral" icon={ArrowsClockwise}>
              {ROTULO_PERIODICIDADE[despesa.periodicidade]}
            </Chip>
          )}
        </div>
      </div>
      <span className="justify-self-end font-numeric text-small font-medium tabular-nums text-fg">
        {fmtMoedaExata(despesa.valor)}
      </span>
    </div>
  );
}

/* ─────────────────────────── Grupo por categoria ──────────────────────────── */

function GrupoCategoriaBloco({
  grupo,
  pctDoTotal,
}: {
  grupo: GrupoCategoria;
  pctDoTotal: number | null;
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-sunken px-4 py-3 sm:px-5">
        <h3 className="inline-flex items-center gap-2 text-small font-medium text-fg">
          <Tag size={16} weight="duotone" aria-hidden className="text-primary" />
          {grupo.rotulo}
          <span className="font-numeric text-caption tabular-nums text-fg-subtle">
            ({grupo.qtd})
          </span>
        </h3>
        <div className="text-right">
          <p className="font-numeric text-small font-semibold tabular-nums text-fg">
            {fmtMoeda(grupo.total)}
          </p>
          {pctDoTotal !== null && (
            <p className="font-numeric text-caption tabular-nums text-fg-subtle">
              {fmtPct(pctDoTotal)}
            </p>
          )}
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {grupo.itens.map((d) => (
          <LinhaDespesa key={d.id} despesa={d} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function DespesasPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarDespesas nunca lança; guardamos o resumo completo.
  const [resumo, setResumo] = useState<ResumoDespesas | null>(null);

  const carregar = useCallback(async () => {
    const dados = await carregarDespesas();
    setResumo(dados);
    setEstado('pronto');
  }, []);

  useEffect(() => {
    guardarSessao(router, () => carregar());
  }, [router, carregar]);

  if (estado === 'carregando' || !resumo) {
    return <PainelSkeleton maxWidth="max-w-4xl" />;
  }

  const { porTipo, totalGeral, qtdTotal, porCategoria, aguardandoDados, temDados } = resumo;
  const pctFixa = totalGeral > 0 ? (porTipo.fixa.total / totalGeral) * 100 : null;
  const pctVariavel = totalGeral > 0 ? (porTipo.variavel.total / totalGeral) * 100 : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Despesas"
        titulo="Despesas fixas e variáveis"
        descricao="Os gastos operacionais da oficina por competência — fixas (aluguel, software) e variáveis (caixa), agrupadas por categoria. É o que alimenta a linha de Despesas Operacionais da DRE."
        acao={<VoltarPainel />}
      />

      {/* Resumo: total fixas × variáveis (sempre visível; zera honesto). */}
      <section className="mb-6 grid gap-3.5 sm:grid-cols-2">
        <CardTotal
          titulo="Despesas fixas"
          valor={porTipo.fixa.total}
          qtd={porTipo.fixa.qtd}
          pct={pctFixa}
          destaque
          Icone={Repeat}
        />
        <CardTotal
          titulo="Despesas variáveis"
          valor={porTipo.variavel.total}
          qtd={porTipo.variavel.qtd}
          pct={pctVariavel}
          destaque={false}
          Icone={CurrencyDollar}
        />
      </section>

      {/* Faixa de total geral: a leitura única que a aba 💸 sempre mostra. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-card border border-border bg-surface px-5 py-4 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Wallet size={18} weight="duotone" aria-hidden className="text-primary" />
          <span className="text-small text-fg-muted">
            <span className="font-numeric font-semibold text-fg">{qtdTotal}</span>{' '}
            {qtdTotal === 1 ? 'despesa lançada' : 'despesas lançadas'}
          </span>
        </span>
        <span className="text-small text-fg-muted">
          Total de despesas:{' '}
          <span className="font-numeric font-semibold tabular-nums text-fg">
            {fmtMoeda(totalGeral)}
          </span>
        </span>
      </div>

      {/* Corpo: agrupamento por categoria · estado vazio honesto. */}
      {aguardandoDados ? (
        <EmptyState
          icon={Receipt}
          titulo="Aguardando dados"
          descricao="O módulo de despesas ainda não tem fonte no ambiente de TESTE. Aplicar a migration 0019 (financeiro/gestão) no TEST cria a tabela de despesas — então esta tela passa a listar fixas e variáveis sozinha, sem mudar nada aqui."
        />
      ) : !temDados ? (
        <EmptyState
          icon={Wallet}
          titulo="Nenhuma despesa lançada ainda"
          descricao="Quando os gastos operacionais forem registrados (aluguel, energia, material, marketing), eles aparecem aqui — somados por tipo e agrupados por categoria."
        />
      ) : (
        <div className="space-y-6">
          <h2 className="text-overline uppercase tracking-[0.12em] text-fg-subtle">
            Por categoria
          </h2>
          {porCategoria.map((grupo) => (
            <GrupoCategoriaBloco
              key={grupo.categoria ?? '__sem_categoria__'}
              grupo={grupo}
              pctDoTotal={totalGeral > 0 ? (grupo.total / totalGeral) * 100 : null}
            />
          ))}
        </div>
      )}

      {/* Honestidade de medição: de onde nasce e o que ainda falta. */}
      <p className="mt-8 text-caption leading-relaxed text-fg-subtle">
        {aguardandoDados ? (
          <>
            Esta tela já está pronta: ela lê a tabela <span className="text-fg-muted">despesas</span>{' '}
            por competência e degrada para{' '}
            <span className="text-fg-muted">aguardando dados</span> enquanto a fonte não existe — sem
            erro e sem número inventado. Aplique a migration 0019 no TEST para destravar fixas e
            variáveis.
          </>
        ) : (
          <>
            As despesas são lidas por competência (o mês a que o gasto pertence), somadas por tipo
            (fixa × variável) e agrupadas por categoria. Os mesmos números alimentam a linha de
            Despesas Operacionais da DRE.
          </>
        )}
      </p>

      {/* Status discreto da fonte, alinhado ao padrão das telas. */}
      <div className="mt-4">
        <StatusChip tone={aguardandoDados ? 'neutral' : 'success'} icon={aguardandoDados ? Receipt : Wallet}>
          {aguardandoDados ? 'Aguardando dados' : 'Fonte ao vivo'}
        </StatusChip>
      </div>
    </main>
  );
}
