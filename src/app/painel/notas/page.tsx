'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Receipt,
  FileText,
  CheckCircle,
  HourglassMedium,
  PencilSimple,
  XCircle,
  Prohibit,
  WarningCircle,
  ClipboardText,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarNotas,
  STATUS_NOTA,
  type NotaFiscal,
  type StatusNota,
  type TipoNota,
} from '@/lib/supabase/notas';
import type { Icon } from '@phosphor-icons/react';
import { PainelSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';

type Estado = 'carregando' | 'pronto';

/** Tom do semáforo (StatusChip) por status. */
type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

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
const chipStatus: Record<StatusNota, { tone: Tone; Icone: Icon }> = {
  rascunho: { tone: 'neutral', Icone: PencilSimple },
  processando: { tone: 'warning', Icone: HourglassMedium },
  autorizada: { tone: 'success', Icone: CheckCircle },
  rejeitada: { tone: 'danger', Icone: XCircle },
  cancelada: { tone: 'danger', Icone: Prohibit },
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
      <PageHeader
        overline="GDelta · Fiscal"
        titulo="Notas fiscais"
        acao={<VoltarPainel />}
      />

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
          <EmptyState
            icon={Receipt}
            titulo="Nenhuma nota fiscal ainda"
            descricao="As notas nascem ao emitir uma NFS-e a partir de uma OS. Abra uma ordem de serviço para emitir a primeira."
            acao={
              <Link
                href="/painel/os"
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
              >
                <ClipboardText size={16} weight="bold" aria-hidden />
                Ir para Ordens de serviço
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {notas.map((nota) => {
              const sem = chipStatus[nota.status];
              const StatusIcone = sem.Icone;
              return (
                <li
                  key={nota.id}
                  className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-xs transition-[border-color,box-shadow] duration-150 ease-default hover:border-border-strong hover:shadow-sm"
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
                        <StatusChip tone={sem.tone} icon={StatusIcone}>
                          {nomeStatus(nota.status)}
                        </StatusChip>
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
