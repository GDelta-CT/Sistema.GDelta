import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { BrandMark } from '@/components/brand';

/**
 * Header fino, fixo e translúcido (glass) — assinatura premium discreta.
 * Server Component: sem estado. O link "Entrar" leva ao /login (rota real).
 */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-[clamp(1rem,4vw,2rem)]">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="GDelta — início"
        >
          <BrandMark className="h-8" alt="" />
          <span className="font-display text-body-lg font-bold tracking-[-0.01em] text-fg">
            G<span className="text-primary">Delta</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Ações principais">
          <a
            href="#como-funciona"
            className="hidden items-center rounded-control px-3.5 py-2 text-small font-medium text-fg-muted transition-colors hover:text-fg sm:inline-flex"
          >
            Como funciona
          </a>
          <Link
            href="/login"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2 text-small font-semibold text-on-primary shadow-sm transition-[background-color,transform] duration-150 ease-default hover:bg-primary-hover active:scale-[0.98]"
          >
            Entrar
            <ArrowRight
              aria-hidden="true"
              weight="bold"
              className="size-4 transition-transform duration-150 ease-default group-hover:translate-x-0.5"
            />
          </Link>
        </nav>
      </div>
    </header>
  );
}
