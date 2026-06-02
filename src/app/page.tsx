import Link from 'next/link';
import { BrandLogo } from '@/components/brand';

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,6vh,4rem)] text-center">
      {/* Detalhe visual: brilho azul-aço da marca (decorativo, não interativo) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 left-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-pill bg-primary opacity-[0.07] blur-[120px] dark:opacity-[0.16]"
      />

      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        {/* Eyebrow / overline */}
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-1.5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-muted shadow-sm">
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-primary" />
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
        <div className="mt-2 flex flex-col items-center gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 py-3 text-body font-semibold text-on-primary shadow-md transition-colors duration-150 ease-default hover:bg-primary-hover active:scale-[0.98]"
          >
            Entrar
          </Link>

          {/* Assinatura: semáforo de lucro (cor nunca é o único portador: ícone + label) */}
          <span className="inline-flex items-center gap-2 rounded-pill bg-success-tint px-3 py-1.5 text-caption font-medium text-success">
            <span aria-hidden="true">✓</span>
            <span>
              Margem 23% · <span className="font-numeric tabular">R$ 1.240</span> de lucro
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
