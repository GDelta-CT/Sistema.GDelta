'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  FileText,
  CheckCircle,
  HourglassMedium,
  PencilSimple,
  XCircle,
  Prohibit,
  WarningCircle,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { BrandMark } from '@/components/brand';
import {
  listarNotas,
  STATUS_NOTA,
  type NotaFiscal,
  type StatusNota,
  type TipoNota,
} from '@/lib/supabase/notas';
import type { Icon } from '@phosphor-icons/react';
import { PainelSkeleton } from '@/components/skeleton';

type Estado = 'carregando' | 'pronto';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Rótulo curto do tipo da nota (serviço x produto). */
const nomeTipo: Record<TipoNota, string> = {
  nfse: 'NFS-e',
  nfe: 'NF-e',
};

/**
 * Aparência do chip de status (semáforo via tokens):
 *  - autorizada            -> success (emitida com sucesso)
 *  - processando/rascunho  -> warning/neutro (em andamento, ainda não vale)
 *  - rejeitada/cancelada   -> danger (não vale fiscalmente)
 */
const chipStatus: Record<StatusNota, { chip: string; Icone: Icon }> = {
  rascunho: { chip: 'bg-surface-sunken text-fg-muted', Icone: PencilSimple },
  processando: { chip: 'bg-warning-tint text-warning', Icone: HourglassMedium },
  autorizada: { chip: 'bg-success-tint text-success', Icone: CheckCircle },
  rejeitada: { chip: 'bg-danger-tint text-danger', Icone: XCircle },
  cancelada: { chip: 'bg-danger-tint text-danger', Icone: Prohibit },
};

const nomeStatus = (s: StatusNota) => STATUS_NOTA.find((x) => x.id === s)?.nome ?? s;

export default function NotasFiscaisPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    const r = await listarNotas();
    if (r.status === 'success') setNotas(r.data);
    else if (r.status === 'empty') setNotas([]);
    else setErro(r.message);
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
    return <PainelSkeleton maxWidth="max-w-3xl" />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Símbolo da marca; o título ao lado já nomeia → decorativo. */}
          <BrandMark className="h-10" alt="" />
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Fiscal</p>
            <h1 className="font-display text-h1 text-fg">Notas fiscais</h1>
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
          <h2 className="font-display text-h3 text-fg">Notas emitidas</h2>
          {notas.length > 0 && (
            <span className="inline-flex items-center rounded-pill border border-border bg-surface-sunken px-2.5 py-0.5 font-numeric text-caption font-semibold text-fg-muted">
              {notas.length}
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

        {!erro && notas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-12 text-center">
            <span aria-hidden className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-surface-sunken text-fg-subtle">
              <Receipt size={26} weight="duotone" />
            </span>
            <p className="text-small font-medium text-fg">Nenhuma nota fiscal ainda</p>
            <p className="max-w-xs text-caption text-fg-muted">
              As notas nascem ao emitir uma NFS-e a partir de uma OS em{' '}
              <Link href="/painel/os" className="font-medium text-primary hover:underline">
                Ordens de serviço
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notas.map((nota) => {
              const sem = chipStatus[nota.status];
              const StatusIcone = sem.Icone;
              return (
                <li
                  key={nota.id}
                  className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-border bg-surface-sunken text-primary"
                    >
                      <FileText size={22} weight="duotone" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center rounded-control border border-border-strong bg-surface-sunken px-2.5 py-1 text-small font-semibold tracking-wide text-fg">
                          {nomeTipo[nota.tipo]}
                        </span>
                        <span className="font-numeric text-small text-fg-muted">
                          {/* Número só existe após autorização; até lá, traço honesto. */}
                          Nº {nota.numero ?? '—'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-caption font-semibold ${sem.chip}`}
                        >
                          <StatusIcone size={13} weight="fill" aria-hidden className="shrink-0" />
                          {nomeStatus(nota.status)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-caption text-fg-subtle">
                        <span className="font-numeric">
                          {new Date(nota.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Valor</p>
                    <p className="font-numeric text-body-lg text-fg">{fmt(Number(nota.valor))}</p>
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
