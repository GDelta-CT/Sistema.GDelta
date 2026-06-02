'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';

type Estado = 'carregando' | 'pronto';
type Oficina = { id: string; nome: string };

/** Lê (sem validar assinatura) o oficina_id que o SERVIDOR carimbou no JWT. */
function lerOficinaIdDoJWT(token: string): string | null {
  try {
    const base = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base)) as Record<string, unknown>;
    return typeof payload.oficina_id === 'string' ? payload.oficina_id : null;
  } catch {
    return null;
  }
}

export default function PainelPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [oficinaIdJWT, setOficinaIdJWT] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(async ({ data }) => {
      const sessao = data.session;
      if (!sessao) {
        router.replace('/login');
        return;
      }
      setEmail(sessao.user.email ?? null);
      setOficinaIdJWT(lerOficinaIdDoJWT(sessao.access_token));

      const { data: rows, error } = await sb.from('oficinas').select('id, nome').returns<Oficina[]>();
      if (error) setErro(error.message);
      else setOficinas(rows ?? []);
      setEstado('pronto');
    });
  }, [router]);

  async function sair() {
    await getSupabase().auth.signOut();
    router.replace('/login');
  }

  if (estado === 'carregando') {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-zinc-500">Carregando…</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <Link
            href="/painel/clientes"
            className="text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Clientes
          </Link>
          <Link
            href="/painel/veiculos"
            className="text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Veículos
          </Link>
          <Link
            href="/painel/orcamentos"
            className="text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Orçamentos
          </Link>
        </div>
        <button
          onClick={sair}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
        >
          Sair
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <p className="text-sm text-zinc-500">
          Logado como <strong className="text-zinc-700 dark:text-zinc-200">{email}</strong>
        </p>
        <p className="text-sm text-zinc-500">
          <code>oficina_id</code> no token (carimbado pelo servidor):{' '}
          <strong className="text-zinc-700 dark:text-zinc-200">{oficinaIdJWT ?? '—'}</strong>
        </p>

        <div>
          <p className="mb-2 text-sm font-medium">Oficinas que você enxerga (filtrado por RLS):</p>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {oficinas.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma.</p>
          ) : (
            <ul className="list-inside list-disc text-sm">
              {oficinas.map((o) => (
                <li key={o.id}>
                  {o.nome} <span className="text-zinc-400">({o.id})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
