'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  Cube,
  Drop,
  FileX,
  Package,
  PlusCircle,
  Receipt,
  Storefront,
  UploadSimple,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarItens,
  importarNotaEstoque,
  CATEGORIAS_ESTOQUE,
  type CategoriaEstoque,
  type ImportarResultado,
} from '@/lib/supabase/estoque';
import { parseNfeXml, type NfeEmitente, type NfeItemLido } from '@/lib/fiscal/nfe-xml';
import { casarItens, type ItemEstoqueRef, type LinhaCasada } from '@/lib/fiscal/nfe-casamento';
import { PainelSkeleton } from '@/components/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip } from '@/components/ui/status-chip';
import { Chip } from '@/components/ui/chip';
import type { ChipTone } from '@/lib/status';

/* ─────────────────────────── helpers de formatação ───────────────────────── */

const fmtMoeda = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

/** Limite de tamanho do XML (NF-e real raramente passa de poucas centenas de KB). */
const MAX_BYTES = 5 * 1024 * 1024;

const inp =
  'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary';

const iconeCategoria: Record<CategoriaEstoque, Icon> = {
  peca: Package,
  materia_prima: Drop,
  escritorio: Cube,
};

/* ─────────────────────── linha em pré-visualização ────────────────────────── */

/**
 * Linha editável da pré-visualização: o casamento sugerido + a categoria que o
 * usuário escolhe para itens NOVOS (existentes herdam a do cadastro). Mantemos
 * tudo em estado local até o "Confirmar".
 */
type LinhaPreview = LinhaCasada & {
  /** Categoria a usar SE este item for criado (só vale quando itemId é null). */
  categoria: CategoriaEstoque;
  /** Selecionada para gravar (o usuário pode desmarcar uma linha). */
  incluir: boolean;
};

type Fase = 'carregando' | 'upload' | 'preview' | 'gravando' | 'resultado';

export default function ImportarNotaPage() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>('carregando');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Catálogo atual (para casar). Fail-soft: se a leitura falhar, casamos contra
  // [] — tudo vira "novo", e a tela segue funcional.
  const [estoque, setEstoque] = useState<ItemEstoqueRef[]>([]);

  // Dados da nota lida.
  const [emitente, setEmitente] = useState<NfeEmitente | null>(null);
  const [numeroNota, setNumeroNota] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaPreview[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  // Erros / resultado.
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ImportarResultado | null>(null);
  const [erroGrava, setErroGrava] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const r = await listarItens();
    if (r.status === 'success') {
      setEstoque(r.data.map((i) => ({ id: i.id, nome: i.nome, unidade: i.unidade })));
    } else {
      // 'empty' ou 'error' → catálogo vazio para o casamento (tudo vira novo).
      setEstoque([]);
    }
    setFase('upload');
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

  /* ─────────────────────────── leitura do arquivo ─────────────────────────── */

  function resetUpload() {
    setEmitente(null);
    setNumeroNota(null);
    setLinhas([]);
    setNomeArquivo(null);
    setErroUpload(null);
    setResultado(null);
    setErroGrava(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  /** Sugere a categoria de um item novo a partir da unidade (heurística leve). */
  function categoriaSugerida(item: NfeItemLido): CategoriaEstoque {
    const u = item.unidade;
    // Volume/massa costuma ser matéria-prima (tinta, verniz, massa); o resto, peça.
    if (['l', 'lt', 'kg', 'g', 'ml'].includes(u)) return 'materia_prima';
    return 'peca';
  }

  async function aoSelecionar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErroUpload(null);
    setResultado(null);
    setErroGrava(null);

    const nomeLower = file.name.toLowerCase();
    if (!nomeLower.endsWith('.xml')) {
      setErroUpload('Selecione um arquivo .xml — o XML da nota do fornecedor.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setErroUpload('Arquivo muito grande para ser uma NF-e. Confirme que é o XML correto.');
      return;
    }

    let conteudo: string;
    try {
      conteudo = await file.text();
    } catch {
      setErroUpload('Não foi possível ler o arquivo. Tente selecioná-lo novamente.');
      return;
    }

    const parsed = parseNfeXml(conteudo);
    if (!parsed.ok) {
      setErroUpload(parsed.erro);
      setNomeArquivo(file.name);
      return;
    }

    const casadas = casarItens(parsed.itens, estoque);
    setLinhas(
      casadas.map((c) => ({
        ...c,
        categoria: categoriaSugerida(c.origem),
        incluir: true,
      }))
    );
    setEmitente(parsed.emitente);
    setNumeroNota(parsed.numero);
    setNomeArquivo(file.name);
    setFase('preview');
  }

  /* ───────────────────────────── gravação ─────────────────────────────────── */

  const selecionadas = useMemo(() => linhas.filter((l) => l.incluir), [linhas]);

  const resumo = useMemo(() => {
    const novos = selecionadas.filter((l) => l.itemId === null).length;
    const atualiza = selecionadas.length - novos;
    const total = selecionadas.reduce((a, l) => a + l.origem.total, 0);
    return { novos, atualiza, total };
  }, [selecionadas]);

  async function confirmar() {
    if (selecionadas.length === 0) return;
    setFase('gravando');
    setErroGrava(null);

    const obs = [
      numeroNota ? `NF-e ${numeroNota}` : 'NF-e',
      emitente?.nome,
    ]
      .filter(Boolean)
      .join(' · ');

    const r = await importarNotaEstoque(
      selecionadas.map((l) => ({
        item_id: l.itemId,
        nome: l.origem.descricao,
        categoria: l.categoria,
        unidade: l.origem.unidade,
        quantidade: l.origem.quantidade,
        custo_unitario: l.origem.valorUnitario,
        observacao: obs,
      }))
    );

    setResultado(r);
    setFase('resultado');
  }

  function alterarCategoria(idx: number, categoria: CategoriaEstoque) {
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, categoria } : l)));
  }
  function alternarIncluir(idx: number) {
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, incluir: !l.incluir } : l)));
  }

  if (fase === 'carregando') {
    return <PainelSkeleton maxWidth="max-w-4xl" />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Estoque"
        titulo="Importar nota de compra"
        descricao="Suba o XML da NF-e do fornecedor — os itens entram no estoque com custo médio, sem digitar nada."
        acao={
          <Link
            href="/painel/estoque"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <ArrowLeft size={16} weight="bold" aria-hidden />
            Estoque
          </Link>
        }
      />

      {/* ===================== UPLOAD ===================== */}
      {(fase === 'upload' || (fase === 'preview' && linhas.length === 0)) && (
        <section
          aria-labelledby="titulo-upload"
          className="rounded-card border border-dashed border-border bg-surface p-8 text-center"
        >
          <span
            className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-pill bg-primary/10 text-primary"
            aria-hidden
          >
            <UploadSimple size={28} weight="duotone" />
          </span>
          <h2 id="titulo-upload" className="font-display text-h3 text-fg">
            Selecione o XML da nota
          </h2>
          <p className="mx-auto mt-1.5 max-w-prose text-small text-fg-muted">
            Arquivo .xml da NF-e (modelo 55) emitida pelo fornecedor. A leitura é feita no
            seu navegador — você confere os itens antes de gravar.
          </p>

          <label
            htmlFor="xml-file"
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
          >
            <UploadSimple size={18} weight="bold" aria-hidden />
            Escolher arquivo
          </label>
          <input
            ref={inputRef}
            id="xml-file"
            type="file"
            accept=".xml,application/xml,text/xml"
            onChange={aoSelecionar}
            className="sr-only"
          />

          {nomeArquivo && !erroUpload && (
            <p className="mt-3 text-caption text-fg-subtle">{nomeArquivo}</p>
          )}

          {erroUpload && (
            <p
              role="alert"
              className="mx-auto mt-4 flex max-w-prose items-start gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3 text-left text-small text-danger"
            >
              <FileX size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
              <span>{erroUpload}</span>
            </p>
          )}
        </section>
      )}

      {/* ===================== PREVIEW ===================== */}
      {fase === 'preview' && linhas.length > 0 && (
        <>
          {/* Fornecedor / nota */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-xs">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
                aria-hidden
              >
                <Receipt size={20} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">
                  Fornecedor da nota
                </p>
                <p className="truncate font-medium text-fg">{emitente?.nome}</p>
                <p className="text-caption text-fg-subtle">
                  {numeroNota ? `NF-e ${numeroNota}` : 'NF-e'}
                  {emitente?.documento ? ` · CNPJ/CPF ${emitente.documento}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                resetUpload();
                setFase('upload');
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-caption font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <ArrowsClockwise size={16} weight="bold" aria-hidden />
              Trocar arquivo
            </button>
          </div>

          {/* Tabela de itens */}
          <section aria-label="Itens lidos da nota" className="overflow-hidden rounded-card border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-display text-h3 text-fg">Itens da nota</h2>
              <span className="inline-flex items-center rounded-pill border border-border bg-surface-sunken px-2.5 py-0.5 font-numeric text-caption font-semibold tabular-nums text-fg-muted">
                {linhas.length}
              </span>
            </div>

            <ul className="divide-y divide-border">
              {linhas.map((linha, idx) => {
                const novo = linha.itemId === null;
                return (
                  <li
                    key={`${linha.origem.codigo}-${idx}`}
                    className={`px-4 py-3.5 transition-colors ${linha.incluir ? '' : 'opacity-55'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={linha.incluir}
                        onChange={() => alternarIncluir(idx)}
                        aria-label={`Incluir ${linha.origem.descricao}`}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-fg">{linha.origem.descricao}</p>
                          {novo ? (
                            <StatusChip tone="primary" icon={PlusCircle}>
                              Novo item
                            </StatusChip>
                          ) : (
                            <StatusChip tone="success" icon={ArrowsClockwise}>
                              Atualiza estoque
                            </StatusChip>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-numeric text-caption text-fg-subtle">
                          {linha.origem.codigo && (
                            <span>cód. {linha.origem.codigo}</span>
                          )}
                          <span>
                            {fmtNum(linha.origem.quantidade)} {linha.origem.unidade}
                          </span>
                          <span>{fmtMoeda(linha.origem.valorUnitario)} / un</span>
                          <span className="font-medium text-fg-muted">
                            {fmtMoeda(linha.origem.total)}
                          </span>
                        </div>

                        {!novo && linha.itemNome && (
                          <p className="mt-1 text-caption text-fg-subtle">
                            casado com{' '}
                            <span className="text-fg-muted">{linha.itemNome}</span>
                          </p>
                        )}

                        {/* Categoria só importa para item NOVO (vai ser criado). */}
                        {novo && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-caption text-fg-subtle">categoria:</span>
                            {CATEGORIAS_ESTOQUE.map((c) => {
                              const Icone = iconeCategoria[c.id];
                              const ativo = linha.categoria === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => alterarCategoria(idx, c.id)}
                                  aria-pressed={ativo}
                                  className={`inline-flex min-h-9 items-center gap-1 rounded-pill border px-2.5 py-1 text-caption font-medium transition-colors ${
                                    ativo
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                                  }`}
                                >
                                  <Icone size={13} weight={ativo ? 'fill' : 'regular'} aria-hidden />
                                  {c.nome}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Resumo + confirmar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface-sunken/50 p-4">
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-small">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-fg-subtle">Novos:</dt>
                <dd className="font-numeric font-semibold text-fg">{resumo.novos}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-fg-subtle">Atualizam:</dt>
                <dd className="font-numeric font-semibold text-fg">{resumo.atualiza}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-fg-subtle">Total da entrada:</dt>
                <dd className="font-numeric font-semibold text-fg">{fmtMoeda(resumo.total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={confirmar}
              disabled={selecionadas.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-sm"
            >
              <CheckCircle size={18} weight="bold" aria-hidden />
              {selecionadas.length === 0
                ? 'Selecione ao menos um item'
                : `Confirmar entrada (${selecionadas.length})`}
            </button>
          </div>

          <p className="mt-4 text-caption text-fg-subtle">
            Nos itens existentes, o custo médio é recalculado pelo sistema:
            (saldo × custo atual + qtd × custo da nota) ÷ (saldo + qtd).
          </p>
        </>
      )}

      {/* ===================== GRAVANDO ===================== */}
      {fase === 'gravando' && (
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-12 text-center"
        >
          <span className="inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-pill bg-primary/10 text-primary" aria-hidden>
            <Storefront size={24} weight="duotone" />
          </span>
          <p className="font-display text-h3 text-fg">Lançando no estoque…</p>
          <p className="text-small text-fg-muted">Registrando as entradas e recalculando o custo médio.</p>
        </div>
      )}

      {/* ===================== RESULTADO ===================== */}
      {fase === 'resultado' && resultado && (
        <ResultadoImportacao
          resultado={resultado}
          erro={erroGrava}
          aoNovo={() => {
            resetUpload();
            setFase('upload');
          }}
        />
      )}
    </main>
  );
}

/* ====================================================================== */
/* Resultado da importação (sucesso total / parcial / falha).             */
/* ====================================================================== */

function ResultadoImportacao({
  resultado,
  erro,
  aoNovo,
}: {
  resultado: ImportarResultado;
  erro: string | null;
  aoNovo: () => void;
}) {
  const tudoOk = resultado.falhas === 0 && resultado.gravadas > 0;
  const tudoFalhou = resultado.gravadas === 0;

  const tom: ChipTone = tudoOk ? 'success' : tudoFalhou ? 'danger' : 'warning';
  const Icone = tudoOk ? CheckCircle : WarningCircle;

  return (
    <section aria-live="polite">
      <div
        className={`mb-5 flex items-start gap-3 rounded-card border px-5 py-4 ${
          tudoOk
            ? 'border-success/30 bg-success-tint'
            : tudoFalhou
              ? 'border-danger/30 bg-danger-tint'
              : 'border-warning/30 bg-warning-tint'
        }`}
      >
        <span
          className={`mt-0.5 shrink-0 ${tudoOk ? 'text-success' : tudoFalhou ? 'text-danger' : 'text-warning'}`}
          aria-hidden
        >
          <Icone size={24} weight="fill" />
        </span>
        <div>
          <p className={`font-display text-h3 ${tudoOk ? 'text-success' : tudoFalhou ? 'text-danger' : 'text-warning'}`}>
            {tudoOk
              ? 'Entrada concluída'
              : tudoFalhou
                ? 'Nada foi gravado'
                : 'Entrada parcial'}
          </p>
          <p className="mt-0.5 text-small text-fg-muted">
            {resultado.gravadas} de {resultado.total}{' '}
            {resultado.total === 1 ? 'item lançado' : 'itens lançados'} no estoque.
            {tudoFalhou &&
              ' Verifique sua conexão/permissão — nenhuma alteração foi feita no estoque.'}
          </p>
        </div>
      </div>

      {erro && (
        <p role="alert" className="mb-4 flex items-center gap-2 text-small text-danger">
          <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
          {erro}
        </p>
      )}

      <ul className="space-y-2">
        {resultado.linhas.map((l, i) => (
          <li
            key={`${l.nome}-${i}`}
            className="flex items-start gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-xs"
          >
            <span className={`mt-0.5 shrink-0 ${l.ok ? 'text-success' : 'text-danger'}`} aria-hidden>
              {l.ok ? (
                <CheckCircle size={18} weight="fill" />
              ) : (
                <WarningCircle size={18} weight="fill" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-fg">{l.nome}</p>
                {l.ok ? (
                  <Chip tone={l.novo ? 'primary' : 'success'}>
                    {l.novo ? 'Criado' : 'Atualizado'}
                  </Chip>
                ) : (
                  <Chip tone="danger">Falhou</Chip>
                )}
              </div>
              {!l.ok && l.erro && (
                <p className="mt-0.5 text-caption text-danger">{l.erro}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/painel/estoque"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
        >
          <Storefront size={18} weight="bold" aria-hidden />
          Ver estoque
        </Link>
        <button
          type="button"
          onClick={aoNovo}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border px-5 font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <UploadSimple size={18} weight="bold" aria-hidden />
          Importar outra nota
        </button>
      </div>
    </section>
  );
}
