'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Tivemos um problema ao carregar esta tela. Tente de novo; se persistir, recarregue a página.
      </p>
      <button
        onClick={reset}
        className="mt-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Tentar de novo
      </button>
    </main>
  );
}
