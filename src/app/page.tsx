import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium tracking-wide text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Fase 0 · Fundação
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">GDelta — Sistema</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Gestão para oficinas de funilaria e pintura. Em construção.
      </p>
      <Link
        href="/login"
        className="mt-2 rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white dark:bg-white dark:text-black"
      >
        Entrar
      </Link>
    </main>
  );
}
