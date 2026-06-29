'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Storefront,
  Wallet,
  WarningCircle,
  CalendarBlank,
  Tag,
  ClockCountdown,
  CheckCircle,
  Receipt,
  type Icon,
} from '@phosphor-icons/react';
import { guardarSessao } from '@/lib/demo/session';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Chip } from '@/components/ui/chip';
import {
  carregarFornecedoresContasPagar,
  STATUS_CONTA_APPEARANCE,
  type FornecedoresContasPagar,
  type ContaPagarEnriquecida,
  type GrupoFornecedor,
} from '@/lib/supabase/fornecedores';

type Estado = 'carregando' | 'pronto';

/* ─────────────────────────── Formatação ──────────────────────────── */

const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Formata uma data ISO (YYYY-MM-DD) como dd/mm/aaaa sem fuso (date puro). */
const fmtData = (iso: string): string => {
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
};

/** Ícone do chip por status de exibição — só decorativo (o texto já rotula). */
const ICONE_STATUS: Record<ContaPagarEnriquecida['statusExibicao'], Icon> = {
  aberta: ClockCountdown,
  vencida: WarningCircle,
  paga: CheckCircle,
};

/* ─────────────────────────── Linha de título ──────────────────────────── */

function LinhaConta({ conta }: { conta: ContaPagarEnriquecida }) {
  const aparencia = STATUS_CONTA_APPEARANCE[conta.statusExibicao];
  const Icone = ICONE_STATUS[conta.statusExibicao];

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
      {/* Descrição + categoria do título. */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium text-fg">{conta.descricao}</p>
        {conta.categoria && (
          <p className="mt-0.5 truncate text-caption text-fg-subtle">{conta.categoria}</p>
        )}
      </div>

      {/* Vencimento (ou data de pagamento quando paga). */}
      <span className="inline-flex items-center gap-1.5 text-caption text-fg-muted">
        <CalendarBlank size={14} weight="duotone" aria-hidden className="shrink-0 text-fg-subtle" />
        {conta.statusExibicao === 'paga' && conta.pago_em ? (
          <>pago {fmtData(conta.pago_em)}</>
        ) : (
          <>vence {fmtData(conta.vencimento)}</>
        )}
      </span>

      {/* Valor do título. */}
      <span className="font-numeric text-small font-semibold tabular-nums text-fg">
        {fmtMoeda(conta.valor)}
      </span>

      {/* Chip de status (aberta | vencida | paga). */}
      <StatusChip tone={aparencia.tone} icon={Icone}>
        {aparencia.label}
      </StatusChip>
    </li>
  );
}

/* ─────────────────────────── Grupo de fornecedor ──────────────────────────── */

function CardFornecedor({ grupo }: { grupo: GrupoFornecedor }) {
  return (
    <article className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
      {/* Cabeçalho do fornecedor: nome, categoria e o total em aberto. */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-sunken/60 px-4 py-3 sm:px-5">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
        >
          <Storefront size={18} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-small font-semibold text-fg">{grupo.nome}</h3>
          {grupo.categoria && (
            <span className="mt-0.5 inline-flex">
              <Chip icon={Tag}>{grupo.categoria}</Chip>
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Em aberto</p>
          <p className="font-numeric text-small font-semibold tabular-nums text-fg">
            {fmtMoeda(grupo.totalAberto)}
          </p>
          {grupo.totalVencido > 0 && (
            <p className="mt-0.5 font-numeric text-caption tabular-nums text-danger">
              {fmtMoeda(grupo.totalVencido)} vencido
            </p>
          )}
        </div>
      </header>

      {/* Títulos do fornecedor (ou aviso de fornecedor sem títulos). */}
      {grupo.contas.length === 0 ? (
        <p className="px-4 py-4 text-caption text-fg-subtle sm:px-5">
          Fornecedor cadastrado, sem títulos a pagar lançados.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {grupo.contas.map((conta) => (
            <LinhaConta key={conta.id} conta={conta} />
          ))}
        </ul>
      )}
    </article>
  );
}

/* ─────────────────────────── Resumo (mostradores) ──────────────────────────── */

function CardResumo({
  rotulo,
  ajuda,
  valor,
  Icone,
  medalhao,
  trilho,
  cor,
}: {
  rotulo: string;
  ajuda: string;
  valor: string;
  Icone: Icon;
  medalhao: string;
  trilho: string;
  cor: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-panel border border-border bg-surface-raised p-6 shadow-sm">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${trilho}`} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-overline uppercase tracking-[0.12em] text-fg-subtle">{rotulo}</span>
        <span
          aria-hidden
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${medalhao}`}
        >
          <Icone size={18} weight="duotone" />
        </span>
      </div>
      <p className={`mt-3 font-numeric text-metric leading-none tracking-tight tabular-nums ${cor}`}>
        {valor}
      </p>
      <p className="mt-3 text-caption leading-relaxed text-fg-subtle">{ajuda}</p>
    </article>
  );
}

/* ─────────────────────────── Página ──────────────────────────── */

export default function FornecedoresPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  // FAIL-SOFT: carregarFornecedoresContasPagar nunca lança; guardamos o pacote.
  const [dados, setDados] = useState<FornecedoresContasPagar | null>(null);

  const carregar = useCallback(async () => {
    const pacote = await carregarFornecedoresContasPagar();
    setDados(pacote);
    setEstado('pronto');
  }, []);

  useEffect(() => {
    guardarSessao(router, () => carregar());
  }, [router, carregar]);

  if (estado === 'carregando' || !dados) {
    return <PainelSkeleton maxWidth="max-w-4xl" />;
  }

  const { resumo, grupos, aguardandoDados } = dados;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Fornecedores"
        titulo="Fornecedores & contas a pagar"
        descricao="Quem você paga e o que vence — títulos a pagar por fornecedor, com o total em aberto e o que já passou do prazo."
        acao={<VoltarPainel />}
      />

      {aguardandoDados ? (
        <EmptyState
          icon={Storefront}
          titulo="Aguardando dados"
          descricao="O cadastro de fornecedores e as contas a pagar nascem da migration 0019 — aplique-a no TEST e os títulos aparecem aqui, agrupados por fornecedor, com o total em aberto e o vencido."
        />
      ) : (
        <>
          {/* Resumo: a pagar em aberto · vencidas. */}
          <section className="mb-6 grid gap-3.5 sm:grid-cols-2">
            <CardResumo
              rotulo="A pagar em aberto"
              ajuda={
                resumo.qtdAberta === 1
                  ? '1 título em aberto'
                  : `${resumo.qtdAberta} títulos em aberto`
              }
              valor={fmtMoeda(resumo.totalAberto)}
              Icone={Wallet}
              medalhao="bg-primary/10 text-primary"
              trilho="bg-primary/35"
              cor="text-fg"
            />
            <CardResumo
              rotulo="Vencidas"
              ajuda={
                resumo.qtdVencida === 0
                  ? 'nada vencido — em dia'
                  : resumo.qtdVencida === 1
                    ? '1 título passou do prazo'
                    : `${resumo.qtdVencida} títulos passaram do prazo`
              }
              valor={fmtMoeda(resumo.totalVencido)}
              Icone={WarningCircle}
              medalhao={
                resumo.totalVencido > 0
                  ? 'bg-danger-tint text-danger'
                  : 'bg-success-tint text-success'
              }
              trilho={resumo.totalVencido > 0 ? 'bg-danger/40' : 'bg-success/40'}
              cor={resumo.totalVencido > 0 ? 'text-danger' : 'text-fg'}
            />
          </section>

          {/* Lista de contas a pagar, agrupada por fornecedor. */}
          <section aria-labelledby="contas-titulo">
            <h2
              id="contas-titulo"
              className="mb-4 flex items-center gap-2 font-display text-h3 text-fg"
            >
              <Receipt size={20} weight="duotone" aria-hidden className="text-fg-muted" />
              Contas a pagar por fornecedor
            </h2>

            {grupos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-surface py-10 text-center">
                <Receipt size={26} weight="duotone" aria-hidden className="text-fg-subtle" />
                <p className="max-w-prose text-small text-fg-muted">
                  Nenhum fornecedor ou título a pagar ainda — cadastre um fornecedor e lance as
                  contas para acompanhar os vencimentos.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {grupos.map((grupo) => (
                  <CardFornecedor
                    key={grupo.fornecedorId ?? '__sem_fornecedor__'}
                    grupo={grupo}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Honestidade de medição: a fonte e o que ainda depende da migration. */}
      <p className="mt-8 text-caption leading-relaxed text-fg-subtle">
        Os títulos vêm do cadastro de fornecedores e das contas a pagar. Um título em aberto com
        vencimento anterior a hoje é marcado como{' '}
        <span className="text-danger">vencido</span>. Enquanto a migration 0019 não estiver aplicada
        no TEST, a tela mostra <span className="text-fg-muted">aguardando dados</span> — então
        preenche sozinha, sem mudar nada aqui.
      </p>
    </main>
  );
}
