'use client';

import Link from 'next/link';

export default function PainelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold">Não foi possível carregar</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Verifique sua conexão e tente de novo. Se continuar, faça login novamente.
      </p>
      <div className="mt-1 flex gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Tentar de novo
        </button>
        <Link href="/login" className="rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/20">
          Ir para o login
        </Link>
      </div>
    </main>
  );
}
