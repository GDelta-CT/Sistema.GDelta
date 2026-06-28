'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Car,
  Receipt,
  ClipboardText,
  FileText,
  ChartLineUp,
  Package,
  PaintBucket,
  SignOut,
  ArrowRight,
  Buildings,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { BrandMark } from '@/components/brand';
import { PainelSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

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
    return <PainelSkeleton maxWidth="max-w-3xl" />;
  }

  const navItems: { href: string; titulo: string; desc: string; Icone: Icon }[] = [
    {
      href: '/painel/clientes',
      titulo: 'Clientes',
      desc: 'Cadastro e histórico de quem confia na sua oficina.',
      Icone: Users,
    },
    {
      href: '/painel/veiculos',
      titulo: 'Veículos',
      desc: 'Placas, modelos e o dono de cada carro.',
      Icone: Car,
    },
    {
      href: '/painel/orcamentos',
      titulo: 'Orçamentos',
      desc: 'Monte propostas e veja o lucro em tempo real.',
      Icone: Receipt,
    },
    {
      href: '/painel/os',
      titulo: 'Ordens de serviço',
      desc: 'Acompanhe a produção das OS aprovadas.',
      Icone: ClipboardText,
    },
    {
      href: '/painel/notas',
      titulo: 'Notas fiscais',
      desc: 'NFS-e e NF-e emitidas a partir das OS.',
      Icone: FileText,
    },
    {
      href: '/painel/financeiro',
      titulo: 'Financeiro',
      desc: 'KPIs, funil e ranking — o pulso do faturamento.',
      Icone: ChartLineUp,
    },
    {
      href: '/painel/estoque',
      titulo: 'Estoque',
      desc: 'Peças e materiais, com alerta de estoque baixo.',
      Icone: Package,
    },
    {
      href: '/painel/tintas',
      titulo: 'Tintas',
      desc: 'Fórmulas de cor custeadas por grama — margem honesta.',
      Icone: PaintBucket,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-5">
        <div className="flex items-center gap-3.5">
          {/* Símbolo da marca; o texto "GDelta" ao lado já nomeia → decorativo. */}
          <BrandMark className="h-11" alt="" />
          <div className="min-w-0">
            <p className="text-overline uppercase tracking-[0.18em] text-fg-subtle">GDelta · Painel</p>
            <h1 className="font-display text-h1 leading-none text-fg">Bem-vindo de volta</h1>
            {email && (
              <p className="mt-1.5 truncate text-small text-fg-muted">
                Tudo da oficina, num só lugar — <span className="font-numeric text-fg">{email}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={sair}
          className="group inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-small font-medium text-fg-muted shadow-xs transition-colors duration-150 ease-default hover:border-border-strong hover:text-fg active:scale-[0.98]"
        >
          <SignOut size={18} weight="bold" className="text-fg-subtle transition-colors duration-150 ease-default group-hover:text-fg" aria-hidden />
          Sair
        </button>
      </header>

      <nav aria-label="Navegação do painel" className="mb-8">
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {navItems.map(({ href, titulo, desc, Icone }) => (
            <li key={href}>
              <Link
                href={href}
                className="group relative flex h-full min-h-11 flex-col gap-3 overflow-hidden rounded-card border border-border bg-surface p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-default hover:-translate-y-1 hover:border-primary hover:shadow-lg active:translate-y-0 active:shadow-md"
              >
                {/* Brilho da marca no canto — decorativo, só opacidade. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-pill bg-primary opacity-0 blur-2xl transition-opacity duration-200 ease-default group-hover:opacity-10"
                />
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-control bg-primary/10 text-primary ring-1 ring-inset ring-primary/10 transition-colors duration-200 ease-default group-hover:bg-primary/15 group-hover:ring-primary/25"
                  aria-hidden
                >
                  <Icone size={24} weight="duotone" />
                </span>
                <span className="flex items-center gap-1.5 font-display text-h3 leading-tight text-fg transition-colors duration-200 ease-default group-hover:text-primary">
                  {titulo}
                  <ArrowRight
                    size={18}
                    weight="bold"
                    className="-translate-x-1 opacity-0 transition-[transform,opacity] duration-200 ease-default group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
                <span className="text-caption leading-relaxed text-fg-subtle">{desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg sm:p-7">
        <p className="mb-5 text-overline uppercase tracking-[0.18em] text-fg-subtle">Sessão</p>

        <dl className="grid gap-3.5 sm:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-4 shadow-xs">
            <dt className="text-caption uppercase tracking-wide text-fg-subtle">Logado como</dt>
            <dd className="mt-1.5 break-all font-numeric text-small text-fg">{email}</dd>
          </div>
          <div className="rounded-card border border-border bg-surface p-4 shadow-xs">
            <dt className="text-caption uppercase tracking-wide text-fg-subtle">
              <code className="font-numeric">oficina_id</code> carimbado no JWT
            </dt>
            <dd className="mt-1.5 break-all font-numeric text-small text-fg">{oficinaIdJWT ?? '—'}</dd>
          </div>
        </dl>

        <div className="mt-7 border-t border-border pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Buildings size={18} weight="duotone" className="shrink-0 text-fg-muted" aria-hidden />
            <p className="text-small font-medium text-fg">
              Oficinas que você enxerga{' '}
              <span className="text-fg-subtle">(filtrado por RLS)</span>
            </p>
          </div>
          {erro && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-control bg-danger-tint px-3 py-2.5 text-small text-danger"
            >
              <WarningCircle size={18} weight="fill" className="shrink-0" aria-hidden />
              {erro}
            </p>
          )}
          {oficinas.length === 0 ? (
            !erro && (
              <EmptyState
                icon={Buildings}
                titulo="Nenhuma oficina por aqui ainda"
                descricao="Quando uma oficina for liberada para o seu acesso, ela aparece nesta lista."
              />
            )
          ) : (
            <ul className="space-y-2">
              {oficinas.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface px-3.5 py-3 shadow-xs transition-colors duration-150 ease-default hover:border-border-strong"
                >
                  <span className="flex items-center gap-2 text-small font-medium text-fg">
                    <Buildings size={16} weight="duotone" className="shrink-0 text-primary" aria-hidden />
                    {o.nome}
                  </span>
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
