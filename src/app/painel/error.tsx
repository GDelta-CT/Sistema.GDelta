'use client';

import Link from 'next/link';
import { WarningCircle } from '@phosphor-icons/react';

export default function PainelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <WarningCircle aria-hidden weight="duotone" className="size-10 text-danger" />
      <h1 className="font-display text-h3 text-fg">Não foi possível carregar</h1>
      <p className="max-w-sm text-small text-fg-muted">
        Verifique sua conexão e tente de novo. Se continuar, faça login novamente.
      </p>
      <div className="mt-1 flex gap-2">
        <button
          onClick={reset}
          className="rounded-control bg-primary px-4 py-2 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Tentar de novo
        </button>
        <Link
          href="/login"
          className="rounded-control border border-border px-4 py-2 text-small text-fg-muted transition-colors hover:text-fg"
        >
          Ir para o login
        </Link>
      </div>
    </main>
  );
}
