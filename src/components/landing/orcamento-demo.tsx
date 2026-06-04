'use client';

/**
 * OrcamentoDemo — componente-assinatura da landing comercial.
 *
 * Um "orçamento ao vivo": o visitante edita quantidade e preço de venda e vê,
 * na hora, o LUCRO (R$) e a MARGEM (%) com semáforo — provando o diferencial
 * do produto sem nenhum backend. Espelha o orçamento real do app
 * (src/app/painel/orcamentos/page.tsx): mesma fórmula e mesmo semáforo.
 *
 *   lucro     = Σ (venda − custo) · qtd   →   totalVenda − totalCusto
 *   margemPct = lucro / totalVenda · 100
 *   semáforo  = <0 Prejuízo · <20 Atenção · senão Lucrativo
 *
 * 100% client-side, sem fetch. Respeita prefers-reduced-motion. pt-BR, sem emoji.
 */

import { useEffect, useId, useRef, useState } from 'react';
import {
  CheckCircle,
  Minus,
  Plus,
  Trash,
  Warning,
  XCircle,
  type Icon,
} from '@phosphor-icons/react';

/* ----------------------------- modelo ----------------------------- */

type Item = {
  id: number;
  descricao: string;
  /** Sufixo de natureza para o público (peça vs. serviço). */
  natureza: string;
  custo: number;
  venda: number;
  qtd: number;
};

/** Itens realistas de funilaria/pintura, já pré-preenchidos. */
const ITENS_INICIAIS: Item[] = [
  { id: 1, descricao: 'Para-choque', natureza: 'peça', custo: 200, venda: 480, qtd: 1 },
  { id: 2, descricao: 'Pintura', natureza: 'serviço', custo: 150, venda: 520, qtd: 1 },
  { id: 3, descricao: 'Polimento', natureza: 'serviço', custo: 40, venda: 120, qtd: 1 },
];

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ----------------------- count-up acessível ----------------------- */

/** Conta até o alvo com easeOutCubic; vai direto ao valor sob reduced-motion. */
function useAnimatedNumber(target: number, duration = 500): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : duration;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(from + (target - from) * eased); // setState só no rAF
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* --------------------------- subcomponente -------------------------- */

/** Stepper acessível (−/valor/+) para quantidade. min-h-11 nos botões. */
function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center overflow-hidden rounded-control border border-border bg-surface"
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`Diminuir ${label}`}
        className="grid min-h-11 w-10 place-items-center text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={15} weight="bold" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
        aria-label={label}
        className="w-10 border-x border-border bg-surface py-2 text-center font-numeric text-small tabular-nums text-fg outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`Aumentar ${label}`}
        className="grid min-h-11 w-10 place-items-center text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={15} weight="bold" aria-hidden />
      </button>
    </div>
  );
}

/* ----------------------------- principal ---------------------------- */

export function OrcamentoDemo() {
  const [itens, setItens] = useState<Item[]>(ITENS_INICIAIS);
  const nextId = useRef(ITENS_INICIAIS.length + 1);
  const uid = useId();

  function patch(id: number, p: Partial<Item>) {
    setItens((arr) => arr.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }
  function remover(id: number) {
    setItens((arr) => (arr.length > 1 ? arr.filter((it) => it.id !== id) : arr));
  }
  function adicionar() {
    setItens((arr) => [
      ...arr,
      { id: nextId.current++, descricao: 'Novo item', natureza: 'serviço', custo: 0, venda: 0, qtd: 1 },
    ]);
  }

  // Mesma fórmula do app (calcularTotais): sem desconto nesta vitrine.
  const totalVenda = itens.reduce((a, i) => a + i.qtd * i.venda, 0);
  const totalCusto = itens.reduce((a, i) => a + i.qtd * i.custo, 0);
  const lucro = totalVenda - totalCusto;
  const margemPct = totalVenda > 0 ? (lucro / totalVenda) * 100 : 0;

  // Semáforo via tokens (espelha page.tsx): <0 Prejuízo · <20 Atenção · senão Lucrativo.
  const sem: { label: string; Icon: Icon; text: string; chip: string; bar: string } =
    margemPct < 0
      ? { label: 'Prejuízo', Icon: XCircle, text: 'text-danger', chip: 'bg-danger-bg text-on-danger', bar: 'bg-danger-bg' }
      : margemPct < 20
        ? { label: 'Atenção', Icon: Warning, text: 'text-warning', chip: 'bg-warning-bg text-on-warning', bar: 'bg-warning-bg' }
        : { label: 'Lucrativo', Icon: CheckCircle, text: 'text-success', chip: 'bg-success-bg text-on-success', bar: 'bg-success-bg' };

  const barW = Math.max(0, Math.min(100, margemPct));
  const lucroAnim = useAnimatedNumber(lucro);
  const margemAnim = useAnimatedNumber(margemPct);

  return (
    <section
      aria-labelledby={`${uid}-titulo`}
      className="overflow-hidden rounded-card border border-border bg-surface shadow-lg"
    >
      {/* Cabeçalho */}
      <header className="border-b border-border bg-surface-raised px-5 py-4 sm:px-6">
        <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">
          Demonstração ao vivo
        </p>
        <h3 id={`${uid}-titulo`} className="font-display text-h3 text-fg">
          Monte e veja o lucro — ao vivo
        </h3>
        <p className="mt-1 text-small text-fg-muted">
          Ajuste a quantidade e o preço de venda. O lucro e a margem mudam na hora.
        </p>
      </header>

      <div className="grid gap-px bg-border lg:grid-cols-12">
        {/* ESQUERDA — itens editáveis */}
        <div className="bg-surface p-5 sm:p-6 lg:col-span-7">
          <div className="space-y-3">
            {itens.map((it) => {
              const vendaId = `${uid}-venda-${it.id}`;
              const lucroLinha = (it.venda - it.custo) * it.qtd;
              return (
                <article
                  key={it.id}
                  className="rounded-card border border-border bg-surface-raised p-3.5 transition-colors hover:border-border-strong sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">
                        {it.descricao}{' '}
                        <span className="text-fg-subtle">({it.natureza})</span>
                      </p>
                      <p className="mt-0.5 text-caption text-fg-subtle">
                        Custo <span className="font-numeric tabular-nums">{fmt(it.custo)}</span> / un.
                      </p>
                    </div>
                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remover(it.id)}
                        aria-label={`Remover ${it.descricao}`}
                        className="grid min-h-11 w-11 shrink-0 place-items-center rounded-control text-fg-subtle transition-colors hover:bg-danger-tint hover:text-danger"
                      >
                        <Trash size={16} aria-hidden />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
                    {/* Quantidade — stepper */}
                    <div>
                      <p className="mb-1 text-overline uppercase tracking-wide text-fg-subtle">
                        Quantidade
                      </p>
                      <Stepper
                        label={`Quantidade de ${it.descricao}`}
                        value={it.qtd}
                        onChange={(n) => patch(it.id, { qtd: n })}
                        min={1}
                      />
                    </div>

                    {/* Preço de venda — input numérico */}
                    <div>
                      <label
                        htmlFor={vendaId}
                        className="mb-1 block text-overline uppercase tracking-wide text-fg-subtle"
                      >
                        Venda (un.)
                      </label>
                      <div className="inline-flex items-center rounded-control border border-border bg-surface focus-within:border-primary">
                        <span className="pl-3 pr-1 text-small text-fg-subtle" aria-hidden>
                          R$
                        </span>
                        <input
                          id={vendaId}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={10}
                          value={it.venda}
                          onChange={(e) => patch(it.id, { venda: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-24 bg-transparent py-2 pr-3 text-right font-numeric text-small tabular-nums text-fg outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {/* Lucro da linha */}
                    <p className="ml-auto text-right">
                      <span className="block text-overline uppercase tracking-wide text-fg-subtle">
                        Lucro
                      </span>
                      <span
                        className={`font-numeric text-body-lg tabular-nums ${lucroLinha < 0 ? 'text-danger' : 'text-fg'}`}
                      >
                        {fmt(lucroLinha)}
                      </span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            onClick={adicionar}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2.5 py-1.5 text-small font-medium text-primary transition-colors hover:bg-surface-sunken"
          >
            <Plus size={16} weight="bold" aria-hidden />
            Adicionar item
          </button>
        </div>

        {/* DIREITA — resultado em destaque */}
        <aside className="bg-surface-raised p-5 sm:p-6 lg:col-span-5">
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">
            Lucro do orçamento
          </p>
          <p
            className={`mt-1 font-numeric text-metric leading-none tabular-nums ${sem.text}`}
            aria-hidden
          >
            {fmt(lucroAnim)}
          </p>
          {/* Anuncia uma vez o valor-alvo final (não o count-up de ~60fps). */}
          <span className="sr-only" aria-live="polite">
            Lucro do orçamento: {fmt(lucro)}
          </span>

          <div className="mt-3 flex items-center gap-3">
            {/* key={sem.label} reinicia o .gd-pulse a cada troca de faixa do semáforo */}
            <span
              key={sem.label}
              className={`gd-pulse inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-caption font-semibold ${sem.chip}`}
            >
              <sem.Icon size={15} weight="fill" aria-hidden />
              {sem.label}
            </span>
            <span className={`font-numeric text-h3 tabular-nums ${sem.text}`}>
              {margemAnim.toFixed(1)}%
            </span>
          </div>

          {/* Barra de margem — anima por transform: scaleX (origin-left), nunca width */}
          <div className="mt-5">
            <div
              className="relative h-2.5 overflow-hidden rounded-pill bg-surface-sunken"
              role="img"
              aria-label={`Margem de ${Math.round(margemPct)}%, meta de 20%`}
            >
              <div
                className={`h-full w-full origin-left rounded-pill ${sem.bar} transition-transform duration-300 ease-default`}
                style={{ transform: `scaleX(${barW / 100})` }}
              />
              {/* Marca da meta de 20% */}
              <div
                className="absolute inset-y-0 w-0.5 bg-border-strong"
                style={{ left: '20%' }}
                aria-hidden
              />
            </div>
            <p className="mt-1.5 text-caption text-fg-subtle">meta de margem: 20%</p>
          </div>

          <dl className="mt-6 space-y-2.5 border-t border-border pt-4 text-small">
            <div className="flex items-center justify-between">
              <dt className="text-fg-muted">Venda</dt>
              <dd className="font-numeric tabular-nums text-fg">{fmt(totalVenda)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-fg-muted">Custo</dt>
              <dd className="font-numeric tabular-nums text-fg">{fmt(totalCusto)}</dd>
            </div>
          </dl>

          <p className="mt-6 text-caption text-fg-subtle">
            É exatamente assim no G Delta — só que salvando o orçamento do seu cliente.
          </p>
        </aside>
      </div>
    </section>
  );
}
