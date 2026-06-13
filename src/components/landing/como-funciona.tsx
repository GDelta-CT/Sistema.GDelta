import {
  Calculator,
  ClipboardText,
  Gauge,
  ChartLineUp,
} from '@phosphor-icons/react/dist/ssr';
import { Reveal } from './reveal';

/**
 * "Como funciona" — o fluxo real do produto: Orçamento → OS → Pátio → Financeiro.
 * Quatro passos com numeração mono (mostrador) e um trilho conectando-os.
 * Server Component.
 */

const PASSOS = [
  {
    n: '1',
    icon: Calculator,
    titulo: 'Orçamento',
    texto:
      'Monte com peça, tinta e mão de obra. O lucro e a margem aparecem ao vivo — você fecha vendo o resultado.',
  },
  {
    n: '2',
    icon: ClipboardText,
    titulo: 'Ordem de serviço',
    texto:
      'Aprovou? Vira OS num clique. A equipe toca para iniciar e o cronômetro corre sozinho — o tempo se mede, ninguém digita hora.',
  },
  {
    n: '3',
    icon: Gauge,
    titulo: 'Pátio',
    texto:
      'O carro entra no pátio e o relógio começa sozinho: dias na oficina, custo acumulado e gargalo, medidos em tempo real.',
  },
  {
    n: '4',
    icon: ChartLineUp,
    titulo: 'Financeiro',
    texto:
      'Tudo desemboca no DRE: markup real, margem do mês e o ranking do que dá lucro. A leitura, não o relatório.',
  },
];

export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="scroll-mt-20 border-y border-border bg-bg-subtle px-[clamp(1rem,4vw,2rem)] py-[clamp(3.5rem,9vh,6.5rem)]"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-overline font-display font-semibold uppercase tracking-[0.08em] text-primary">
            Como funciona
          </p>
          <h2
            id="como-funciona-titulo"
            className="mt-3 font-display text-h1 font-bold tracking-[-0.02em] text-fg [text-wrap:balance]"
          >
            Do orçamento ao lucro, num fluxo só.
          </h2>
          <p className="mt-4 max-w-xl text-body-lg text-fg-muted">
            Cada etapa alimenta a próxima. O número que nasce no orçamento te
            acompanha até o fechamento do mês — sem redigitar nada.
          </p>
        </Reveal>

        <ol className="relative mt-[clamp(2.5rem,6vh,4rem)] grid grid-cols-1 gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Trilho conector (decorativo, só no desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block"
          />
          {PASSOS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal as="li" key={p.n} delay={i * 90} className="relative">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 inline-flex size-12 items-center justify-center rounded-card border border-border bg-surface text-primary shadow-sm">
                    <Icon aria-hidden="true" weight="duotone" className="size-6" />
                  </span>
                  <span className="font-numeric text-h2 font-semibold tabular leading-none text-border-strong">
                    {p.n}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-h3 font-semibold text-fg">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-small text-fg-muted">{p.texto}</p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
