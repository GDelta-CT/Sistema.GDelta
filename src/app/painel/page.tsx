'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { BrandMark } from '@/components/brand';

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
      if (error) setErro('Não foi possível carregar os dados. Tente de novo.');
      else setOficinas(rows ?? []);
      setEstado('pronto');
    })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function sair() {
    await getSupabase().auth.signOut();
    router.replace('/login');
  }

  if (estado === 'carregando') {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-fg-muted">Carregando…</main>
    );
  }

  const navItems = [
    {
      href: '/painel/clientes',
      titulo: 'Clientes',
      desc: 'Cadastro e histórico de quem confia na sua oficina.',
      icone: '👤',
    },
    {
      href: '/painel/veiculos',
      titulo: 'Veículos',
      desc: 'Placas, modelos e o dono de cada carro.',
      icone: '🚗',
    },
    {
      href: '/painel/orcamentos',
      titulo: 'Orçamentos',
      desc: 'Monte propostas e veja o lucro em tempo real.',
      icone: '📄',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Símbolo da marca; o texto "GDelta" ao lado já nomeia → decorativo. */}
          <BrandMark className="h-11" alt="" />
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta</p>
            <h1 className="font-display text-h1 text-fg">Painel</h1>
          </div>
        </div>
        <button
          onClick={sair}
          className="inline-flex min-h-[44px] items-center rounded-control border border-border bg-surface px-4 py-2 text-small font-medium text-fg-muted shadow-xs transition-colors hover:border-border-strong hover:text-fg"
        >
          Sair
        </button>
      </header>

      <nav aria-label="Navegação do painel" className="mb-6">
        <ul className="grid gap-3 sm:grid-cols-3">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex h-full min-h-[44px] flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-sunken text-body-lg"
                  aria-hidden
                >
                  {item.icone}
                </span>
                <span className="font-display text-h3 text-fg transition-colors group-hover:text-primary">
                  {item.titulo}
                </span>
                <span className="text-caption text-fg-subtle">{item.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg">
        <p className="mb-4 text-overline uppercase tracking-[0.12em] text-fg-subtle">Sessão</p>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-4 shadow-xs">
            <dt className="text-caption uppercase tracking-wide text-fg-subtle">Logado como</dt>
            <dd className="mt-1 break-all font-numeric text-small text-fg">{email}</dd>
          </div>
          <div className="rounded-card border border-border bg-surface p-4 shadow-xs">
            <dt className="text-caption uppercase tracking-wide text-fg-subtle">
              <code className="font-numeric">oficina_id</code> carimbado no JWT
            </dt>
            <dd className="mt-1 break-all font-numeric text-small text-fg">{oficinaIdJWT ?? '—'}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 text-small font-medium text-fg">
            Oficinas que você enxerga{' '}
            <span className="text-fg-subtle">(filtrado por RLS)</span>
          </p>
          {erro && (
            <p
              role="alert"
              className="rounded-control bg-danger-tint px-3 py-2 text-small text-danger"
            >
              {erro}
            </p>
          )}
          {oficinas.length === 0 ? (
            <p className="text-small text-fg-muted">Nenhuma.</p>
          ) : (
            <ul className="space-y-2">
              {oficinas.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-2.5 shadow-xs"
                >
                  <span className="text-small font-medium text-fg">{o.nome}</span>
                  <span className="font-numeric text-caption text-fg-subtle">{o.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
