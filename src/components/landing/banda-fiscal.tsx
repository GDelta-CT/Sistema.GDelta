import Link from 'next/link';
import { Receipt, ShieldCheck, CalendarCheck, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Reveal } from './reveal';

/**
 * Banda do gancho fiscal — NFS-e nacional obrigatória a partir de 01/09/2026.
 * Urgência real (prazo concreto), tom de tranquilidade ("sem dor de cabeça").
 * Superfície escura tintada de marca para destacar a faixa do fluxo claro.
 */
export function BandaFiscal() {
  return (
    <section
      aria-labelledby="fiscal-titulo"
      className="px-[clamp(1rem,4vw,2rem)] py-[clamp(1rem,3vh,2rem)]"
    >
      <Reveal className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-panel border border-primary-800/60 bg-primary-950 px-[clamp(1.5rem,5vw,3.5rem)] py-[clamp(2rem,5vh,3rem)] shadow-xl">
        {/* Brilho de marca interno (decorativo) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-pill bg-primary opacity-25 blur-[110px]"
        />

        <div className="relative flex flex-col items-start gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-pill border border-primary-300/30 bg-primary-50/10 px-3.5 py-1.5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-primary-100">
              <CalendarCheck aria-hidden="true" weight="bold" className="size-3.5" />
              Obrigatório a partir de 01/09/2026
            </span>

            <h2
              id="fiscal-titulo"
              className="mt-4 font-display text-h1 font-bold tracking-[-0.02em] text-neutral-0 [text-wrap:balance]"
            >
              Pronto para a nota nacional obrigatória,{' '}
              <span className="text-primary-300">sem dor de cabeça.</span>
            </h2>
            <p className="mt-4 max-w-xl text-body-lg text-primary-100/90">
              A NFS-e nacional passa a valer para todo o país. O G Delta já emite
              a nota a partir do orçamento aprovado — você cumpre a obrigação sem
              parar a oficina nem virar especialista em fisco.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              <li className="flex items-center gap-2 text-small text-primary-100">
                <Receipt aria-hidden="true" weight="duotone" className="size-5 text-primary-300" />
                Emissão direto do serviço fechado
              </li>
              <li className="flex items-center gap-2 text-small text-primary-100">
                <ShieldCheck aria-hidden="true" weight="duotone" className="size-5 text-primary-300" />
                No padrão nacional, sem retrabalho
              </li>
            </ul>
          </div>

          <Link
            href="/login"
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-neutral-0 px-6 py-3 text-body font-semibold text-primary-900 shadow-md transition-[transform,box-shadow] duration-150 ease-default hover:shadow-lg active:scale-[0.98]"
          >
            Quero ficar em dia
            <ArrowRight
              aria-hidden="true"
              weight="bold"
              className="size-4 transition-transform duration-150 ease-default group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
