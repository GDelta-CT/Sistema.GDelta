'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardText,
  Car,
  User,
  Clock,
  WarningCircle,
  Receipt,
} from '@phosphor-icons/react';
import { DEMO } from '@/lib/demo/mode';
import { guardarSessao, obterSessao } from '@/lib/demo/session';
import {
  listarOsComercial,
  listarPatio,
  STATUS_OS,
  type OsComercialComRefs,
  type PatioLinha,
  type StatusOs,
} from '@/lib/supabase/os-comercial';
import {
  getNotasPorOs,
  type NotaFiscal,
} from '@/lib/supabase/notas';
import { PainelSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';
import { StatusNotaChip } from '@/components/ui/status-nota-chip';

type Estado = 'carregando' | 'pronto';

/** Tom do semáforo (StatusChip) por status. */
type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Tom do chip (semáforo) por status da OS. Nome vem de STATUS_OS. */
const chipStatus: Record<StatusOs, Tone> = {
  aberta: 'primary',
  em_producao: 'warning',
  concluida: 'success',
  entregue: 'success',
  cancelada: 'danger',
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
  // Notas fiscais por OS (mais nova primeiro). Complementar: degrada em silêncio
  // se a camada de notas ainda não estiver disponível (sem chip, sem crash).
  const [notasPorOs, setNotasPorOs] = useState<Record<string, NotaFiscal[]>>({});
  const [emitindoId, setEmitindoId] = useState<string | null>(null);
  // Aviso honesto por OS após tentar emitir (ex.: agregador não configurado).
  const [avisoEmissao, setAvisoEmissao] = useState<Record<string, string>>({});

  // Busca as notas de cada OS para o chip de status fiscal. Degrada em silêncio
  // se a camada de notas estiver indisponível (tabela pré-migration): sem crash.
  const carregarNotas = useCallback(async (lista: OsComercialComRefs[]) => {
    if (lista.length === 0) {
      setNotasPorOs({});
      return;
    }
    const pares = await Promise.all(
      lista.map(async (os) => {
        try {
          const r = await getNotasPorOs(os.id);
          return r.status === 'success' ? ([os.id, r.data] as const) : null;
        } catch {
          return null;
        }
      })
    );
    const mapa: Record<string, NotaFiscal[]> = {};
    for (const par of pares) if (par) mapa[par[0]] = par[1];
    setNotasPorOs(mapa);
  }, []);

  const carregar = useCallback(async () => {
    setErro(null);
    const [ro, rp] = await Promise.all([listarOsComercial(), listarPatio()]);
    const lista = ro.status === 'success' ? ro.data : [];
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
    await carregarNotas(lista);
  }, [carregarNotas]);

  useEffect(() => {
    guardarSessao(router, () => carregar());
  }, [router, carregar]);

  /**
   * Emitir NFS-e — a emissão fiscal é SEMPRE server-side (o token do agregador
   * NUNCA roda no browser). Aqui só chamamos o endpoint `POST /api/fiscal/emitir`
   * com o access_token da sessão; o servidor cria o rascunho e tenta o agregador.
   * Mostramos `message` (honesto: se o agregador não estiver configurado, a
   * mensagem reflete isso) e recarregamos as notas para o chip de status atualizar.
   */
  async function emitir(os: OsComercialComRefs) {
    setEmitindoId(os.id);
    setAvisoEmissao((m) => {
      const { [os.id]: _omit, ...resto } = m;
      void _omit;
      return resto;
    });
    // MODO DEMO: a emissão fiscal é server-side com token real — não roda na
    // demo. Mostra um aviso honesto e não chama o endpoint.
    if (DEMO) {
      setAvisoEmissao((m) => ({ ...m, [os.id]: 'Modo demonstração: emissão fiscal indisponível.' }));
      setEmitindoId(null);
      return;
    }
    try {
      const sessao = await obterSessao();
      const token = sessao?.access_token;
      if (!token) {
        setAvisoEmissao((m) => ({ ...m, [os.id]: 'Sessão expirada, faça login de novo.' }));
        return;
      }
      const resp = await fetch('/api/fiscal/emitir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ os_comercial_id: os.id, tipo: 'nfse' }),
      });
      const r = await resp.json();
      // Mensagem honesta vinda do servidor (cobre sucesso e agregador ausente).
      setAvisoEmissao((m) => ({
        ...m,
        [os.id]: r.message ?? 'Não foi possível emitir a nota.',
      }));
      // O rascunho/nota foi criado no servidor: recarrega para o chip atualizar.
      await carregarNotas(oss);
    } catch {
      setAvisoEmissao((m) => ({
        ...m,
        [os.id]: 'Falha de conexão ao emitir a nota. Tente de novo.',
      }));
    } finally {
      setEmitindoId(null);
    }
  }

  if (estado === 'carregando') {
    return <PainelSkeleton maxWidth="max-w-3xl" />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Produção"
        titulo="Ordens de serviço"
        acao={<VoltarPainel />}
      />

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
          <EmptyState
            icon={ClipboardText}
            titulo="Nenhuma ordem de serviço ainda"
            descricao="As OS nascem ao aprovar um orçamento. Aprove uma proposta para começar a acompanhar a produção e a emissão fiscal aqui."
            acao={
              <Link
                href="/painel/orcamentos"
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
              >
                <Receipt size={16} weight="bold" aria-hidden />
                Ir para Orçamentos
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {oss.map((os) => {
              const veiculoNome = [os.veiculo?.marca, os.veiculo?.modelo].filter(Boolean).join(' ');
              const dias = diasPorOs[os.id];
              // Nota mais recente da OS (listada mais nova primeiro pela camada de dados).
              const nota = notasPorOs[os.id]?.[0];
              const aviso = avisoEmissao[os.id];
              const emitindo = emitindoId === os.id;
              return (
                <li
                  key={os.id}
                  className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-xs transition-[border-color,box-shadow] duration-150 ease-default hover:border-border-strong hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
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
                        <StatusChip tone={chipStatus[os.status]}>
                          {nomeStatus(os.status)}
                        </StatusChip>
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
                  </div>

                  {/* Rodapé fiscal: status da nota (se houver) + ação de emissão. */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-caption text-fg-subtle">
                      <span className="inline-flex items-center gap-1">
                        <Receipt size={14} weight="duotone" aria-hidden className="shrink-0" />
                        Nota fiscal
                      </span>
                      {nota ? (
                        <>
                          <StatusNotaChip status={nota.status} />
                          {nota.numero ? <span className="font-numeric">· Nº {nota.numero}</span> : null}
                        </>
                      ) : (
                        <span className="text-fg-subtle">— sem nota</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => emitir(os)}
                      disabled={emitindo}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small font-medium text-fg-muted transition-colors duration-150 ease-default hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:text-fg-muted"
                    >
                      <Receipt size={16} weight="bold" aria-hidden />
                      {emitindo ? 'Emitindo…' : 'Emitir NFS-e'}
                    </button>
                  </div>

                  {/* Aviso honesto pós-tentativa (ex.: agregador não configurado). */}
                  {aviso && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 rounded-control border border-warning/30 bg-warning-tint px-3 py-2 text-caption text-warning"
                    >
                      <WarningCircle size={15} weight="fill" aria-hidden className="shrink-0" />
                      {aviso}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
