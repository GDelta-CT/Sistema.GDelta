'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Drop,
  PaintBucket,
  PaintRoller,
  Plus,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarFormulasComCusto,
  listarItens as listarLinhasFormula,
  criarFormula,
  addItem,
  removerItem,
  removerFormula,
  type FormulaComCusto,
  type TintaFormulaItem,
} from '@/lib/supabase/tinta';
import { listarItens as listarItensEstoque, type EstoqueItem } from '@/lib/supabase/estoque';
import { PainelSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { StatusChip } from '@/components/ui/status-chip';

type Estado = 'carregando' | 'pronto';

const fmtMoeda = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (n: number) => n.toLocaleString('pt-BR');
/** Custo por grama é fino — preço por grama de base raramente passa de centavos. */
const fmtPorGrama = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4, maximumFractionDigits: 4 });

const inp =
  'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary';

export default function TintasPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');

  // Fórmulas com custo (view) e bases do estoque (matéria-prima) para o seletor.
  // Ambas degradam SUAVE: a 0018 ainda não foi aplicada → vêm vazias, sem quebrar.
  const [formulas, setFormulas] = useState<FormulaComCusto[]>([]);
  const [bases, setBases] = useState<EstoqueItem[]>([]);

  // Form de nova fórmula.
  const [nome, setNome] = useState('');
  const [codigoCor, setCodigoCor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);

  // Fórmula expandida (para ver/editar suas linhas), por id.
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [fs, ie] = await Promise.all([listarFormulasComCusto(), listarItensEstoque()]);
    setFormulas(fs);
    // Só matéria-prima vira base de tinta (unidade g, custo_medio = R$/grama).
    setBases(ie.status === 'success' ? ie.data.filter((i) => i.categoria === 'materia_prima') : []);
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

  async function adicionarFormula(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setFormErro(null);

    const r = await criarFormula({ nome, codigo_cor: codigoCor.trim() || null });
    if (r.status !== 'success') {
      setSalvando(false);
      setFormErro(r.status === 'error' ? r.message : 'Não foi possível salvar.');
      return;
    }

    setSalvando(false);
    setNome('');
    setCodigoCor('');
    await carregar();
    // Abre a recém-criada para já cair na montagem da receita.
    setAbertaId(r.data.id);
  }

  async function excluirFormula(id: string) {
    const r = await removerFormula(id);
    if (r.status === 'success') {
      if (abertaId === id) setAbertaId(null);
      await carregar();
    }
  }

  if (estado === 'carregando') {
    return <PainelSkeleton maxWidth="max-w-3xl" />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Tintas"
        titulo="Fórmulas de tinta"
        descricao="Custeie a cor pela receita de bases, por grama — a base da margem ao vivo honesta na pintura."
        acao={<VoltarPainel />}
      />

      {/* =========================== Nova fórmula =========================== */}
      <form
        onSubmit={adicionarFormula}
        className="mb-10 rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
            aria-hidden
          >
            <PaintBucket size={20} weight="duotone" />
          </span>
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Nova fórmula</p>
            <p className="text-caption text-fg-subtle">
              Dê um nome à cor; as bases você adiciona logo abaixo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="formula-nome" className="text-caption font-medium text-fg-muted">
              Nome da fórmula
            </label>
            <input
              id="formula-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Prata Sirius metálico"
              required
              aria-required="true"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="formula-codigo" className="text-caption font-medium text-fg-muted">
              Código da cor <span className="font-normal text-fg-subtle">(opcional)</span>
            </label>
            <input
              id="formula-codigo"
              value={codigoCor}
              onChange={(e) => setCodigoCor(e.target.value)}
              placeholder="Ex.: GAR / 1G3"
              className={`${inp} font-numeric sm:w-44`}
            />
          </div>
        </div>

        {formErro && (
          <p role="alert" className="mt-4 flex items-center gap-2 text-small text-danger">
            <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
            {formErro}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-sm"
        >
          {!salvando && <Plus size={18} weight="bold" aria-hidden />}
          {salvando ? 'Salvando…' : 'Criar fórmula'}
        </button>
      </form>

      {/* ============================== Lista ============================== */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-h3 text-fg">Fórmulas cadastradas</h2>
          {formulas.length > 0 && (
            <span className="inline-flex items-center rounded-pill border border-border bg-surface-sunken px-2.5 py-0.5 font-numeric text-caption font-semibold tabular-nums text-fg-muted">
              {formulas.length}
            </span>
          )}
        </div>

        {formulas.length === 0 ? (
          <EmptyState
            icon={PaintRoller}
            titulo="Nenhuma fórmula ainda"
            descricao="Crie a primeira fórmula no formulário acima e monte a receita com as bases do estoque para custear a cor por grama."
          />
        ) : (
          <ul className="space-y-2">
            {formulas.map((f) => {
              const aberta = abertaId === f.id;
              const semItens = f.gramas_total <= 0 || f.custo_por_grama === null;
              return (
                <li
                  key={f.id}
                  className="rounded-card border border-border bg-surface shadow-xs transition-[border-color,box-shadow] duration-150 ease-default hover:border-border-strong hover:shadow-sm"
                >
                  <div className="flex items-start gap-4 p-4">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
                      aria-hidden
                    >
                      <PaintBucket size={20} weight="fill" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-fg">{f.nome}</p>
                        {f.codigo_cor && (
                          <span className="inline-flex items-center rounded-pill bg-surface-sunken px-2 py-0.5 font-numeric text-caption text-fg-muted">
                            {f.codigo_cor}
                          </span>
                        )}
                        {semItens && (
                          <StatusChip tone="warning" icon={WarningCircle}>
                            Sem bases
                          </StatusChip>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-caption text-fg-subtle">
                        <span className="inline-flex items-baseline gap-1">
                          <span className="font-numeric text-small font-medium text-fg">
                            {fmtNum(Number(f.gramas_total))}
                          </span>
                          <span>g de mistura</span>
                        </span>
                        <span className="inline-flex items-baseline gap-1">
                          custo total
                          <span className="font-numeric text-fg-muted">{fmtMoeda(Number(f.custo_total))}</span>
                        </span>
                        <span className="inline-flex items-baseline gap-1">
                          por grama
                          <span className="font-numeric font-medium text-success">
                            {f.custo_por_grama === null ? '—' : fmtPorGrama(Number(f.custo_por_grama))}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAbertaId(aberta ? null : f.id)}
                      aria-expanded={aberta}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-caption font-medium text-fg-muted transition-colors duration-150 ease-default hover:border-border-strong hover:text-fg"
                    >
                      {aberta ? 'Fechar' : 'Bases'}
                    </button>
                  </div>

                  {aberta && (
                    <FormulaBases
                      formula={f}
                      bases={bases}
                      onExcluirFormula={() => excluirFormula(f.id)}
                      onMudou={carregar}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-10 text-caption text-fg-subtle">
        O custo de cada base vem do custo médio atual no estoque — trocou o lote, a margem reflete sozinha.
      </p>
    </main>
  );
}

/* ====================================================================== */
/* Bases da fórmula (linhas) — listar, adicionar e remover, inline.        */
/* ====================================================================== */

function FormulaBases({
  formula,
  bases,
  onExcluirFormula,
  onMudou,
}: {
  formula: FormulaComCusto;
  bases: EstoqueItem[];
  onExcluirFormula: () => void | Promise<void>;
  onMudou: () => void | Promise<void>;
}) {
  const [linhas, setLinhas] = useState<TintaFormulaItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [baseId, setBaseId] = useState('');
  const [gramas, setGramas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    const ls = await listarLinhasFormula(formula.id);
    setLinhas(ls);
    setCarregando(false);
  }, [formula.id]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Nome/unidade/custo da base, resolvidos pelo estoque (sem digitação dupla).
  const baseDe = (id: string) => bases.find((b) => b.id === id) ?? null;

  async function adicionarBase(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!baseId) {
      setErro('Escolha uma base do estoque.');
      return;
    }
    const g = Number(gramas);
    if (!gramas.trim() || !Number.isFinite(g) || g <= 0) {
      setErro('Informe uma quantidade em gramas maior que zero.');
      return;
    }

    setEnviando(true);
    const r = await addItem({ formula_id: formula.id, estoque_item_id: baseId, gramas: g });
    if (r.status !== 'success') {
      setEnviando(false);
      setErro(r.status === 'error' ? r.message : 'Não foi possível adicionar.');
      return;
    }

    setEnviando(false);
    setBaseId('');
    setGramas('');
    await recarregar();
    await onMudou();
  }

  async function excluirLinha(id: string) {
    const r = await removerItem(id);
    if (r.status === 'success') {
      await recarregar();
      await onMudou();
    }
  }

  return (
    <div className="border-t border-border bg-surface-sunken/40 p-4">
      {/* Linhas atuais. */}
      {carregando ? (
        <p className="py-2 text-caption text-fg-subtle">Carregando bases…</p>
      ) : linhas.length === 0 ? (
        <p className="mb-4 flex items-center gap-2 rounded-control border border-dashed border-border bg-surface px-3.5 py-3 text-caption text-fg-muted">
          <Drop size={16} weight="duotone" aria-hidden className="shrink-0 text-primary" />
          Esta fórmula ainda não tem bases — adicione a primeira abaixo.
        </p>
      ) : (
        <ul className="mb-4 space-y-1.5">
          {linhas.map((l) => {
            const b = baseDe(l.estoque_item_id);
            const custoLinha = b ? Number(b.custo_medio) * Number(l.gramas) : null;
            return (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-control border border-border bg-surface px-3.5 py-2.5 shadow-xs"
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-success-tint text-success"
                  aria-hidden
                >
                  <Drop size={16} weight="fill" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium text-fg">
                    {b ? b.nome : 'Base do estoque'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-fg-subtle">
                    <span className="inline-flex items-baseline gap-1">
                      <span className="font-numeric text-fg-muted">{fmtNum(Number(l.gramas))}</span> g
                    </span>
                    {custoLinha !== null && (
                      <span className="inline-flex items-baseline gap-1">
                        custo
                        <span className="font-numeric text-fg-muted">{fmtMoeda(custoLinha)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => excluirLinha(l.id)}
                  aria-label={`Remover ${b ? b.nome : 'base'} da fórmula`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-fg-subtle transition-colors duration-150 ease-default hover:border-danger/40 hover:bg-danger-tint hover:text-danger"
                >
                  <Trash size={16} weight="bold" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Adicionar base. */}
      <form onSubmit={adicionarBase} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`base-${formula.id}`} className="text-caption font-medium text-fg-muted">
            Base (matéria-prima)
          </label>
          {bases.length === 0 ? (
            <p className="rounded-control border border-dashed border-border bg-surface px-3 py-2.5 text-caption text-fg-muted">
              Cadastre bases no Estoque (categoria matéria-prima, em gramas) para usá-las aqui.
            </p>
          ) : (
            <select
              id={`base-${formula.id}`}
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className={inp}
            >
              <option value="">Escolha uma base…</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome} · {fmtMoeda(Number(b.custo_medio))}/{b.unidade}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`gramas-${formula.id}`} className="text-caption font-medium text-fg-muted">
            Gramas
          </label>
          <input
            id={`gramas-${formula.id}`}
            value={gramas}
            onChange={(e) => setGramas(e.target.value)}
            placeholder="0"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className={`${inp} font-numeric sm:w-28`}
          />
        </div>

        <button
          type="submit"
          disabled={enviando || bases.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-sm"
        >
          {!enviando && <Plus size={16} weight="bold" aria-hidden />}
          {enviando ? 'Adicionando…' : 'Adicionar'}
        </button>
      </form>

      {erro && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-small text-danger">
          <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
          {erro}
        </p>
      )}

      {/* Excluir a fórmula inteira (suas linhas vão junto por CASCADE no banco). */}
      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={onExcluirFormula}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 py-1.5 text-caption font-medium text-fg-subtle transition-colors duration-150 ease-default hover:text-danger"
        >
          <Trash size={15} weight="bold" aria-hidden />
          Excluir fórmula
        </button>
      </div>
    </div>
  );
}
