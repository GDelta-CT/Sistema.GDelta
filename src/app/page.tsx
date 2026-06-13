import Link from 'next/link';
// Subpath SSR-safe do Phosphor: ícones renderizam dentro de Server Component
// (o barrel padrão é 'use client' e contaminaria a página inteira).
import {
  Gauge,
  ArrowRight,
  PlayCircle,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';
import { OrcamentoDemo } from '@/components/landing/orcamento-demo';
import { SiteHeader } from '@/components/landing/site-header';
import { Diferenciais } from '@/components/landing/diferenciais';
import { BandaFiscal } from '@/components/landing/banda-fiscal';
import { ComoFunciona } from '@/components/landing/como-funciona';
import { Personas } from '@/components/landing/personas';
import { CtaFinal } from '@/components/landing/cta-final';

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="topo" className="flex flex-1 flex-col">
        {/* ===================== HERO ===================== */}
        <section
          aria-labelledby="hero-titulo"
          className="relative overflow-hidden px-[clamp(1rem,4vw,2rem)] pb-[clamp(3rem,7vh,5rem)] pt-[clamp(6rem,14vh,9rem)]"
        >
          {/* Brilho azul-aço da marca — duas camadas para profundidade
              (decorativo, não interativo). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-1/4 left-[15%] -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-pill bg-primary opacity-[0.07] blur-[120px] dark:opacity-[0.18]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1/3 right-[5%] -z-10 h-[32rem] w-[32rem] rounded-pill bg-primary opacity-[0.05] blur-[120px] dark:opacity-[0.12]"
          />

          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-12">
            {/* Copy do hero */}
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-1.5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-muted shadow-sm">
                <Gauge aria-hidden="true" weight="bold" className="size-3.5 text-primary" />
                Inteligência de gestão · funilaria e pintura
              </span>

              <h1
                id="hero-titulo"
                className="mt-6 font-display text-display font-bold tracking-[-0.02em] text-fg [text-wrap:balance]"
              >
                Ele não te conta o que aconteceu. Mostra se{' '}
                <span className="text-primary">valeu a pena.</span>
              </h1>

              <p className="mt-5 max-w-xl text-balance text-body-lg text-fg-muted">
                O G Delta calcula lucro e margem ao vivo enquanto você monta o
                orçamento, e o tempo de cada etapa se mede sozinho no chão de
                fábrica — cronômetro e ponto automáticos. Você decide com
                números, enquanto ainda dá pra mudar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-7 py-3.5 text-body font-semibold text-on-primary shadow-md transition-[background-color,transform] duration-150 ease-default hover:bg-primary-hover active:scale-[0.98]"
                >
                  Entrar
                  <ArrowRight
                    aria-hidden="true"
                    weight="bold"
                    className="size-4 transition-transform duration-150 ease-default group-hover:translate-x-0.5"
                  />
                </Link>
                <a
                  href="#como-funciona"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border bg-surface px-6 py-3.5 text-body font-semibold text-fg transition-colors duration-150 ease-default hover:bg-bg-subtle"
                >
                  <PlayCircle
                    aria-hidden="true"
                    weight="duotone"
                    className="size-5 text-primary"
                  />
                  Ver como funciona
                </a>
              </div>

              {/* Provas rápidas (sem inventar métricas — são capacidades reais) */}
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {['Margem ao vivo', 'Tempo medido sozinho', 'ROI ao vivo'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-small text-fg-muted">
                      <CheckCircle
                        aria-hidden="true"
                        weight="fill"
                        className="size-4 text-success"
                      />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Componente assinatura: demo do orçamento com lucro ao vivo */}
            <div className="lg:col-span-6">
              <OrcamentoDemo />
            </div>
          </div>
        </section>

        {/* ===================== SEÇÕES ===================== */}
        <Diferenciais />
        <BandaFiscal />
        <ComoFunciona />
        <Personas />
        <CtaFinal />
      </main>
    </>
  );
}
