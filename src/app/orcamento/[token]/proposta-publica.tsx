'use client';

/**
 * PropostaPublicaView — a proposta NA VISÃO DO CLIENTE FINAL. Renderiza SÓ
 * campos seguros (descrição, quantidade, valor de VENDA, total) que chegam da
 * RPC cliente-safe `orcamento_publico`. NUNCA custo/margem/lucro —
 * esses campos sequer existem no tipo `PropostaPublica`, então é impossível
 * vazá-los no HTML.
 *
 * Esta é a "cara da oficina" pro cliente: design limpo, confiável, mobile-first
 * (o cliente abre no celular pelo link do WhatsApp). Todos os estados tratados:
 * carregando · não encontrado · indisponível (0021) · erro · proposta ·
 * aprovada (confirmação).
 *
 * SEM sessão: roda na rota pública. Não chama auth.getSession(); o token é a
 * credencial e a RPC do banco é a fronteira de segurança.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  WarningCircle,
  Storefront,
  Car,
  CalendarBlank,
  ShieldCheck,
  SealCheck,
  Clock,
} from '@phosphor-icons/react';
import { BrandLogo } from '@/components/brand';
import {
  buscarOrcamentoPublico,
  aprovarOrcamentoPublico,
  type PropostaPublica,
} from '@/lib/supabase/orcamento-publico';

type Carregamento =
  | { fase: 'carregando' }
  | { fase: 'ok'; proposta: PropostaPublica }
  | { fase: 'nao_encontrado' }
  | { fase: 'indisponivel'; message: string }
  | { fase: 'erro'; message: string };

type AcaoAprovar =
  | { tipo: 'idle' }
  | { tipo: 'enviando' }
  | { tipo: 'aprovado' }
  | { tipo: 'ja_decidido'; statusAtual: PropostaPublica['status'] }
  | { tipo: 'erro'; message: string };

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function fmtData(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Casca de página comum (centra o conteúdo, mobile-first) para todos os estados. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      {children}
    </main>
  );
}

/** Estado central (ícone + título + texto) para vazio/erro/indisponível. */
function EstadoCentral({
  Icon,
  tom,
  titulo,
  texto,
}: {
  Icon: typeof CheckCircle;
  tom: 'danger' | 'neutral' | 'success';
  titulo: string;
  texto: string;
}) {
  const cor =
    tom === 'danger'
      ? 'bg-danger-tint text-danger'
      : tom === 'success'
        ? 'bg-success-tint text-success'
        : 'bg-surface-sunken text-fg-muted';
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-card border border-border bg-surface px-6 py-16 text-center">
      <span className={`inline-flex h-16 w-16 items-center justify-center rounded-pill ${cor}`} aria-hidden>
        <Icon size={32} weight="duotone" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-h2 text-fg">{titulo}</h1>
        <p className="max-w-prose text-small text-fg-muted">{texto}</p>
      </div>
    </div>
  );
}

export function PropostaPublicaView({ token }: { token: string }) {
  const [estado, setEstado] = useState<Carregamento>({ fase: 'carregando' });
  const [acao, setAcao] = useState<AcaoAprovar>({ tipo: 'idle' });

  const carregar = useCallback(async () => {
    setEstado({ fase: 'carregando' });
    const r = await buscarOrcamentoPublico(token);
    if (r.status === 'success') setEstado({ fase: 'ok', proposta: r.data });
    else if (r.status === 'nao_encontrado') setEstado({ fase: 'nao_encontrado' });
    else if (r.status === 'indisponivel') setEstado({ fase: 'indisponivel', message: r.message });
    else setEstado({ fase: 'erro', message: r.message });
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aprovar() {
    setAcao({ tipo: 'enviando' });
    const r = await aprovarOrcamentoPublico(token);
    if (r.status === 'success') {
      setAcao({ tipo: 'aprovado' });
      // Reflete o novo status na proposta exibida (sem refazer a leitura).
      setEstado((prev) =>
        prev.fase === 'ok' ? { fase: 'ok', proposta: { ...prev.proposta, status: 'aprovado' } } : prev
      );
    } else if (r.status === 'ja_decidido') {
      setAcao({ tipo: 'ja_decidido', statusAtual: r.statusAtual });
      setEstado((prev) =>
        prev.fase === 'ok' ? { fase: 'ok', proposta: { ...prev.proposta, status: r.statusAtual } } : prev
      );
    } else if (r.status === 'nao_encontrado') {
      setEstado({ fase: 'nao_encontrado' });
    } else if (r.status === 'indisponivel') {
      setAcao({ tipo: 'erro', message: r.message });
    } else {
      setAcao({ tipo: 'erro', message: r.message });
    }
  }

  if (estado.fase === 'carregando') {
    return (
      <Shell>
        <div aria-busy="true" className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="sr-only">Carregando a proposta…</span>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-pill bg-surface-sunken animate-pulse" aria-hidden />
          <p className="text-small text-fg-muted">Carregando a proposta…</p>
        </div>
      </Shell>
    );
  }

  if (estado.fase === 'nao_encontrado') {
    return (
      <Shell>
        <EstadoCentral
          Icon={WarningCircle}
          tom="danger"
          titulo="Orçamento não encontrado"
          texto="Este link pode estar incorreto ou ter expirado. Confira com a oficina e tente abrir de novo."
        />
      </Shell>
    );
  }

  if (estado.fase === 'indisponivel') {
    return (
      <Shell>
        <EstadoCentral
          Icon={Clock}
          tom="neutral"
          titulo="Proposta indisponível no momento"
          texto={estado.message}
        />
      </Shell>
    );
  }

  if (estado.fase === 'erro') {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-card border border-border bg-surface px-6 py-16 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-pill bg-danger-tint text-danger" aria-hidden>
            <WarningCircle size={32} weight="duotone" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-h2 text-fg">Não deu para carregar</h1>
            <p className="max-w-prose text-small text-fg-muted">{estado.message}</p>
          </div>
          <button
            type="button"
            onClick={carregar}
            className="mt-1 inline-flex min-h-11 items-center rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Tentar de novo
          </button>
        </div>
      </Shell>
    );
  }

  // estado.fase === 'ok'
  const { proposta } = estado;
  const emissao = fmtData(proposta.criado_em);
  const jaAprovado = proposta.status === 'aprovado' || acao.tipo === 'aprovado';
  const recusado = proposta.status === 'recusado';

  return (
    <Shell>
      {/* Cabeçalho — a marca da oficina (a cara dela pro cliente). */}
      <header className="mb-6 flex flex-col items-center gap-3 text-center">
        <BrandLogo className="h-9 sm:h-10" alt="" />
        <div className="flex items-center gap-2 text-fg">
          <Storefront size={18} weight="fill" aria-hidden className="text-primary" />
          <span className="font-display text-h3">{proposta.oficina_nome ?? 'Sua oficina'}</span>
        </div>
        <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Orçamento de serviço</p>
      </header>

      <article className="rounded-panel border border-border bg-surface-raised p-5 shadow-sm sm:p-7">
        {/* Saudação + veículo */}
        <div className="mb-5 flex flex-col gap-2 border-b border-border pb-5">
          {proposta.cliente_nome && (
            <p className="text-body text-fg">
              Olá, <span className="font-semibold">{proposta.cliente_nome}</span>! Segue a proposta para o seu veículo.
            </p>
          )}
          {(proposta.veiculo_placa || proposta.veiculo_descricao) && (
            <p className="flex flex-wrap items-center gap-2 text-small text-fg-muted">
              <Car size={16} weight="fill" aria-hidden className="text-fg-subtle" />
              {proposta.veiculo_descricao && <span>{proposta.veiculo_descricao}</span>}
              {proposta.veiculo_placa && (
                <span className="rounded-control bg-surface-sunken px-2 py-0.5 font-numeric text-caption tracking-wide text-fg">
                  {proposta.veiculo_placa}
                </span>
              )}
            </p>
          )}
          {emissao && (
            <p className="flex items-center gap-2 text-caption text-fg-subtle">
              <CalendarBlank size={14} weight="fill" aria-hidden />
              Emitido em {emissao}
            </p>
          )}
        </div>

        {/* Itens da proposta — SÓ valor de venda. Sem custo/margem. */}
        <h2 className="mb-3 text-overline uppercase tracking-[0.12em] text-fg-subtle">Itens e serviços</h2>
        {proposta.itens.length === 0 ? (
          <p className="rounded-control border border-dashed border-border bg-surface-sunken px-3 py-4 text-center text-small text-fg-muted">
            A oficina ainda não detalhou os itens desta proposta.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {proposta.itens.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-small font-medium text-fg">{item.descricao || 'Item'}</p>
                  <p className="mt-0.5 text-caption text-fg-subtle">
                    {item.quantidade} × {fmt(item.valor_unitario)}
                  </p>
                </div>
                <p className="shrink-0 font-numeric text-small text-fg tabular-nums">{fmt(item.total)}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Total final pro cliente */}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
          <span className="text-body font-semibold text-fg">Total</span>
          <span className="font-numeric text-metric-md tabular-nums text-fg">{fmt(proposta.total)}</span>
        </div>

        {/* Selo de confiança */}
        <p className="mt-4 flex items-center justify-center gap-1.5 text-caption text-fg-subtle">
          <ShieldCheck size={14} weight="fill" aria-hidden />
          Proposta enviada pela oficina · valores sem surpresas
        </p>
      </article>

      {/* Ação do cliente — Aprovar / confirmações */}
      <div className="mt-6">
        {jaAprovado ? (
          <div
            role="status"
            className="flex flex-col items-center gap-2 rounded-panel border border-success/40 bg-success-tint px-6 py-7 text-center"
          >
            <SealCheck size={40} weight="fill" aria-hidden className="text-success" />
            <p className="font-display text-h3 text-fg">Orçamento aprovado!</p>
            <p className="max-w-prose text-small text-fg-muted">
              Aprovação registrada — a oficina vai ver e dar sequência. Obrigado pela confiança.
            </p>
          </div>
        ) : recusado || acao.tipo === 'ja_decidido' ? (
          <div
            role="status"
            className="flex flex-col items-center gap-2 rounded-panel border border-border bg-surface-sunken px-6 py-7 text-center"
          >
            <WarningCircle size={36} weight="fill" aria-hidden className="text-fg-subtle" />
            <p className="font-display text-h3 text-fg">Proposta encerrada</p>
            <p className="max-w-prose text-small text-fg-muted">
              Esta proposta já foi respondida. Se precisar, fale com a oficina para gerar um novo orçamento.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={aprovar}
              disabled={acao.tipo === 'enviando'}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-control bg-success text-body-lg font-semibold text-on-success shadow-md transition-[background-color,box-shadow,transform] duration-150 ease-default hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
            >
              <CheckCircle size={22} weight="fill" aria-hidden />
              {acao.tipo === 'enviando' ? 'Aprovando…' : 'Aprovar orçamento'}
            </button>
            <p className="mt-2 text-center text-caption text-fg-subtle">
              Ao aprovar, sua resposta fica registrada e a oficina dá sequência.
            </p>
            {acao.tipo === 'erro' && (
              <p
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-small text-danger"
              >
                <WarningCircle size={16} weight="fill" aria-hidden className="shrink-0" />
                {acao.message}
              </p>
            )}
          </>
        )}
      </div>

      <footer className="mt-8 text-center text-caption text-fg-subtle">
        Orçamento gerado pelo GDelta
      </footer>
    </Shell>
  );
}
