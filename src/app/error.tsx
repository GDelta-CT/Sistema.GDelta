'use client';

import { WarningCircle } from '@phosphor-icons/react';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <WarningCircle aria-hidden weight="duotone" className="size-10 text-danger" />
      <h1 className="font-display text-h3 text-fg">Algo deu errado</h1>
      <p className="max-w-sm text-small text-fg-muted">
        Tivemos um problema ao carregar esta tela. Tente de novo; se persistir, recarregue a página.
      </p>
      <button
        onClick={reset}
        className="mt-1 rounded-control bg-primary px-4 py-2 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
      >
        Tentar de novo
      </button>
    </main>
  );
}
