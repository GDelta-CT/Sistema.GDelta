'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardText, Car, User, Clock, WarningCircle } from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { BrandMark } from '@/components/brand';
import {
  listarOsComercial,
  listarPatio,
  STATUS_OS,
  type OsComercialComRefs,
  type PatioLinha,
  type StatusOs,
} from '@/lib/supabase/os-comercial';

type Estado = 'carregando' | 'pronto';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Estilo do chip (semáforo via tokens) por status da OS. Nome vem de STATUS_OS. */
const chipStatus: Record<StatusOs, string> = {
  aberta: 'bg-primary/10 text-primary',
  em_producao: 'bg-warning-tint text-warning',
  concluida: 'bg-success-tint text-success',
  entregue: 'bg-success-bg text-on-success',
  cancelada: 'bg-danger-tint text-danger',
};

const nomeStatus = (s: StatusOs) => STATUS_OS.find((x) => x.id === s)?.nome ?? s;

export default function OsComercialPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [oss, setOss] = useState<OsComercialComRefs[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  // Dias-na-oficina por OS (view v_os_dias_rs). Opcional: ausente se a migration
  // do Pátio ainda não foi aplicada — a tela degrada sem mostrar os dias.
  const [diasPorOs, setDiasPorOs] = useState<Record<string, number>>({});

  const carregar = useCallback(async () => {
    setErro(null);
    const [ro, rp] = await Promise.all([listarOsComercial(), listarPatio()]);
    if (ro.status === 'success') setOss(ro.data);
    else if (ro.status === 'empty') setOss([]);
    else setErro(ro.message);

    // Pátio é complementar: casa por os_id e degrada em silêncio se indisponível.
    if (rp.status === 'success') {
      const mapa: Record<string, number> = {};
      for (const linha of rp.data as PatioLinha[]) mapa[linha.os_id] = linha.dias;
      setDiasPorOs(mapa);
    } else {
      setDiasPorOs({});
    }
    setEstado('pronto');
  }, []);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace('/login');
          return;
        }
        carregar();
      })
      .catch(() => router.replace('/login'));
  }, [router, carregar]);

  if (estado === 'carregando') {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-small text-fg-muted">Carregando…</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Símbolo da marca; o título ao lado já nomeia → decorativo. */}
          <BrandMark className="h-10" alt="" />
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Produção</p>
            <h1 className="font-display text-h1 text-fg">Ordens de serviço</h1>
          </div>
        </div>
        <Link
          href="/painel"
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Painel
        </Link>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-h3 text-fg">OS comerciais</h2>
          {oss.length > 0 && (
            <span className="inline-flex items-center rounded-pill border border-border bg-surface-sunken px-2.5 py-0.5 font-numeric text-caption font-semibold text-fg-muted">
              {oss.length}
            </span>
          )}
        </div>

        {erro && (
          <p
            role="alert"
            className="mb-3 flex items-center gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3 text-small text-danger"
          >
            <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
            {erro}
          </p>
        )}

        {!erro && oss.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-12 text-center">
            <span aria-hidden className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-surface-sunken text-fg-subtle">
              <ClipboardText size={26} weight="duotone" />
            </span>
            <p className="text-small font-medium text-fg">Nenhuma ordem de serviço ainda</p>
            <p className="max-w-xs text-caption text-fg-muted">
              As OS nascem ao aprovar um orçamento. Aprove uma proposta em{' '}
              <Link href="/painel/orcamentos" className="font-medium text-primary hover:underline">
                Orçamentos
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {oss.map((os) => {
              const veiculoNome = [os.veiculo?.marca, os.veiculo?.modelo].filter(Boolean).join(' ');
              const dias = diasPorOs[os.id];
              return (
                <li
                  key={os.id}
                  className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-border bg-surface-sunken text-primary"
                    >
                      <ClipboardText size={22} weight="duotone" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center rounded-control border border-border-strong bg-surface-sunken px-2.5 py-1 font-numeric text-small font-semibold tracking-wide text-fg">
                          OS-{os.numero}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption font-semibold ${chipStatus[os.status]}`}
                        >
                          {nomeStatus(os.status)}
                        </span>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-fg-subtle">
                        <span className="inline-flex items-center gap-1">
                          <User size={13} weight="duotone" aria-hidden className="shrink-0" />
                          <span className="truncate">{os.cliente?.nome ?? 'Sem cliente'}</span>
                        </span>
                        {(os.veiculo?.placa || veiculoNome) && (
                          <span className="inline-flex items-center gap-1">
                            <Car size={13} weight="duotone" aria-hidden className="shrink-0" />
                            <span className="truncate">
                              {[os.veiculo?.placa, veiculoNome].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        )}
                        {typeof dias === 'number' && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} weight="duotone" aria-hidden className="shrink-0" />
                            <span className="font-numeric">
                              {dias} {dias === 1 ? 'dia' : 'dias'} na oficina
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Valor</p>
                    <p className="font-numeric text-body-lg text-fg">{fmt(Number(os.valor_orcamento))}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
