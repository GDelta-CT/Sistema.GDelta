import Link from 'next/link';
import { ArrowRight, Gauge } from '@phosphor-icons/react/dist/ssr';
import { BrandMark } from '@/components/brand';
import { Reveal } from './reveal';

/**
 * CTA final forte + rodapé com a marca.
 * Restabelece a promessa-mãe e leva ao /login (rota real).
 */
export function CtaFinal() {
  return (
    <>
      <section
        aria-labelledby="cta-titulo"
        className="px-[clamp(1rem,4vw,2rem)] py-[clamp(3.5rem,9vh,6.5rem)]"
      >
        <Reveal className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-panel border border-border bg-surface px-[clamp(1.5rem,5vw,4rem)] py-[clamp(2.5rem,7vh,4.5rem)] text-center shadow-xl">
          {/* Brilho de marca (decorativo) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-40%] -z-0 size-[34rem] -translate-x-1/2 rounded-pill bg-primary opacity-[0.06] blur-[120px] dark:opacity-[0.16]"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg px-4 py-1.5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-muted shadow-sm">
              <Gauge aria-hidden="true" weight="bold" className="size-3.5 text-primary" />
              Comece a enxergar o lucro
            </span>

            <h2
              id="cta-titulo"
              className="mx-auto mt-6 max-w-2xl font-display text-h1 font-bold tracking-[-0.02em] text-fg [text-wrap:balance]"
            >
              Pare de descobrir o resultado{' '}
              <span className="text-primary">tarde demais.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-body-lg text-fg-muted">
              O G Delta não te conta o que aconteceu. Ele te mostra se valeu a
              pena — enquanto ainda dá pra mudar.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-8 py-3.5 text-body font-semibold text-on-primary shadow-md transition-[background-color,transform] duration-150 ease-default hover:bg-primary-hover active:scale-[0.98] sm:w-auto"
              >
                Entrar no G Delta
                <ArrowRight
                  aria-hidden="true"
                  weight="bold"
                  className="size-4 transition-transform duration-150 ease-default group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="#diferenciais"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-control border border-border bg-surface px-7 py-3.5 text-body font-semibold text-fg transition-colors duration-150 ease-default hover:bg-bg-subtle sm:w-auto"
              >
                Ver os diferenciais
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border px-[clamp(1rem,4vw,2rem)] py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5" aria-label="GDelta — início">
            <BrandMark className="h-7" alt="" />
            <span className="font-display text-body font-bold tracking-[-0.01em] text-fg">
              G<span className="text-primary">Delta</span>
            </span>
          </Link>

          <p className="text-caption text-fg-subtle">
            Inteligência de gestão para funilaria e pintura · seus números, sempre do seu lado.
          </p>

          <Link
            href="/login"
            className="text-small font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline"
          >
            Entrar
          </Link>
        </div>
      </footer>
    </>
  );
}
