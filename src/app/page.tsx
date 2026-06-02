import Link from 'next/link';
// Subpath SSR-safe do Phosphor: ícones renderizam dentro de Server Component
// (o barrel padrão é 'use client' e contaminaria a página inteira).
import {
  Gauge,
  TrendUp,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { BrandLogo } from '@/components/brand';

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,6vh,4rem)] text-center">
      {/* Detalhe visual: brilho azul-aço da marca — duas camadas para profundidade
          (decorativo, não interativo). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 left-1/2 -z-10 h-[44rem] w-[44rem] -translate-x-1/2 rounded-pill bg-primary opacity-[0.07] blur-[120px] dark:opacity-[0.18]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-30%] left-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-pill bg-primary opacity-[0.04] blur-[120px] dark:opacity-[0.10]"
      />

      <div className="flex w-full max-w-2xl flex-col items-center gap-7">
        {/* Eyebrow / overline — ícone do "medidor" (metáfora do painel de instrumentos) */}
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-1.5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-muted shadow-sm">
          <Gauge aria-hidden="true" weight="bold" className="size-3.5 text-primary" />
          Gestão para funilaria e pintura
        </span>

        {/* Marca (o alt="GDelta" do logo já anuncia o nome) */}
        <BrandLogo className="h-28 sm:h-32" />

        {/* Headline */}
        <h1 className="font-display text-display font-bold tracking-[-0.02em] text-fg [text-wrap:balance]">
          A inteligência que faz sua oficina{' '}
          <span className="text-primary">dar lucro</span>
        </h1>

        {/* Subtítulo */}
        <p className="max-w-xl text-balance text-body-lg text-fg-muted">
          Monte o orçamento e veja lucro e margem ao vivo. Decida com números,
          não no escuro — antes de fechar o negócio.
        </p>

        {/* CTA */}
        <div className="mt-1 flex flex-col items-center gap-5">
          <Link
            href="/login"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-7 py-3 text-body font-semibold text-on-primary shadow-md transition-[background-color,transform] duration-150 ease-default hover:bg-primary-hover active:scale-[0.98]"
          >
            Entrar
            <ArrowRight
              aria-hidden="true"
              weight="bold"
              className="size-4 transition-transform duration-150 ease-default group-hover:translate-x-0.5"
            />
          </Link>

          {/* Assinatura: semáforo de lucro (cor nunca é o único portador: ícone + label) */}
          <span className="inline-flex items-center gap-2 rounded-pill bg-success-tint px-3.5 py-1.5 text-caption font-medium text-success">
            <TrendUp aria-hidden="true" weight="bold" className="size-4" />
            <span>
              Margem 23% · <span className="font-numeric tabular">R$ 1.240</span> de lucro
            </span>
          </span>
        </div>
      </div>

      {/* Rodapé discreto da marca */}
      <footer className="mt-[clamp(3rem,8vh,5rem)] flex items-center gap-1.5 text-caption text-fg-subtle">
        <ShieldCheck aria-hidden="true" weight="fill" className="size-3.5 text-fg-subtle" />
        <span>
          <span className="font-display font-semibold text-fg-muted">GDelta</span>{' '}
          · seus números, sempre do seu lado
        </span>
      </footer>
    </main>
  );
}
