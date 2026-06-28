'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Cube,
  Drop,
  Package,
  Plus,
  Receipt,
  Storefront,
  Warning,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarItens,
  criarItem,
  registrarMovimento,
  listarAlertas,
  CATEGORIAS_ESTOQUE,
  type EstoqueItem,
  type CategoriaEstoque,
  type MovimentoTipo,
} from '@/lib/supabase/estoque';
import { PainelSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';
import { Chip } from '@/components/ui/chip';
import { StatusChip } from '@/components/ui/status-chip';
import { categoriaEstoque, type ChipTone } from '@/lib/status';

type Estado = 'carregando' | 'pronto';

/** Bloco que degrada sozinho: ou os dados, ou a mensagem de falha (uma tabela
 *  ausente — pré-migration — não derruba a tela inteira). */
type Bloco<T> = { data: T; erro: null } | { data: null; erro: string };

const fmtMoeda = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (n: number) => n.toLocaleString('pt-BR');

const inp =
  'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary';

/** Ícone por categoria (coerente com os chips). */
const iconeCategoria: Record<CategoriaEstoque, Icon> = {
  peca: Package,
  materia_prima: Drop,
  escritorio: Cube,
};

/** Tom por categoria — fonte única que tinge o chip (via `<Chip tone>`) e o
 *  swatch do ícone na lista, mantendo os dois sempre coerentes. */
const toneCategoria: Record<CategoriaEstoque, ChipTone> = {
  peca: 'primary',
  materia_prima: 'success',
  escritorio: 'neutral',
};

/** Swatch do ícone por categoria (mesmos tokens do tom; sem cor crua). */
const swatchCategoria: Record<ChipTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  neutral: 'bg-surface-sunken text-fg-muted',
};

export default function EstoquePage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');

  // Itens e alertas degradam separadamente: a lista é o conteúdo principal; o
  // contador de alertas é um resumo extra que some sozinho se a view não existir.
  const [itens, setItens] = useState<Bloco<EstoqueItem[]>>({ data: [], erro: null });
  const [qtdAlertas, setQtdAlertas] = useState<number | null>(null);

  // Form de novo item.
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEstoque>('peca');
  const [unidade, setUnidade] = useState('un');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);

  // Movimento aberto por item (inline). Guarda apenas o id do item em edição.
  const [movItemId, setMovItemId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    // Leituras em paralelo; cada bloco degrada sozinho.
    const [ri, ra] = await Promise.all([listarItens(), listarAlertas()]);

    setItens(
      ri.status === 'success'
        ? { data: ri.data, erro: null }
        : ri.status === 'empty'
          ? { data: [], erro: null }
          : { data: null, erro: ri.message }
    );

    // Alertas: 'empty' = nenhum item abaixo do mínimo (0); 'error' (ex.: view
    // ausente pré-migration) some sem alarde — o chip por item já cobre o caso.
    setQtdAlertas(
      ra.status === 'success' ? ra.data.length : ra.status === 'empty' ? 0 : null
    );

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

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setFormErro(null);

    const minimoTxt = estoqueMinimo.trim();
    const minimo =
      minimoTxt && Number.isFinite(Number(minimoTxt)) ? Number(minimoTxt) : undefined;

    const r = await criarItem({
      nome,
      categoria,
      unidade: unidade.trim() || undefined,
      estoque_minimo: minimo,
    });

    if (r.status !== 'success') {
      setSalvando(false);
      setFormErro(r.status === 'error' ? r.message : 'Não foi possível salvar.');
      return;
    }

    setSalvando(false);
    setNome('');
    setCategoria('peca');
    setUnidade('un');
    setEstoqueMinimo('');
    await carregar();
  }

  if (estado === 'carregando') {
    return <PainelSkeleton maxWidth="max-w-3xl" />;
  }

  const lista = itens.data ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Estoque"
        titulo="Estoque"
        descricao="Controle peças, matéria-prima e materiais — saldo e custo médio recalculados a cada movimento."
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/painel/estoque/importar"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <Receipt size={16} weight="bold" aria-hidden />
              Importar nota
            </Link>
            <VoltarPainel />
          </div>
        }
      />

      {/* ============================ Novo item ============================ */}
      <form
        onSubmit={adicionar}
        className="mb-10 rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
            aria-hidden
          >
            <Package size={20} weight="duotone" />
          </span>
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Novo item</p>
            <p className="text-caption text-fg-subtle">Cadastre peças, matéria-prima e materiais.</p>
          </div>
        </div>

        <fieldset className="mb-4">
          <legend className="mb-2 text-caption font-medium text-fg-muted">Categoria</legend>
          <div role="radiogroup" aria-label="Categoria do item" className="grid grid-cols-3 gap-2">
            {CATEGORIAS_ESTOQUE.map((c) => {
              const Icone = iconeCategoria[c.id];
              const ativo = categoria === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setCategoria(c.id)}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-control border px-2 py-2.5 text-caption font-medium transition-colors duration-150 ease-default ${
                    ativo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                  }`}
                >
                  <Icone size={20} weight={ativo ? 'fill' : 'regular'} aria-hidden />
                  {c.nome}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-nome" className="text-caption font-medium text-fg-muted">
              Nome do item
            </label>
            <input
              id="item-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Parafuso sextavado M8"
              required
              aria-required="true"
              className={inp}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-unidade" className="text-caption font-medium text-fg-muted">
                Unidade
              </label>
              <input
                id="item-unidade"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="un"
                className={inp}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-minimo" className="text-caption font-medium text-fg-muted">
                Estoque mínimo
              </label>
              <input
                id="item-minimo"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                placeholder="Ex.: 10"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                className={`${inp} font-numeric`}
              />
            </div>
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
          {salvando ? 'Salvando…' : 'Adicionar item'}
        </button>
      </form>

      {/* ============================== Lista ============================== */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-h3 text-fg">Itens em estoque</h2>
          {lista.length > 0 && (
            <span className="inline-flex items-center rounded-pill border border-border bg-surface-sunken px-2.5 py-0.5 font-numeric text-caption font-semibold tabular-nums text-fg-muted">
              {lista.length}
            </span>
          )}
        </div>

        {/* Resumo de alertas (degrada sozinho: some se a view não existir). */}
        {qtdAlertas !== null && qtdAlertas > 0 && (
          <p className="mb-3 flex items-start gap-2.5 rounded-card border border-warning/30 bg-warning-tint px-4 py-3 text-small text-warning">
            <Warning size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
            <span>
              <span className="font-numeric font-semibold">{fmtNum(qtdAlertas)}</span>{' '}
              {qtdAlertas === 1 ? 'item está' : 'itens estão'} no ou abaixo do estoque mínimo.
            </span>
          </p>
        )}

        {itens.erro && (
          <p
            role="alert"
            className="mb-3 flex items-center gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3 text-small text-danger"
          >
            <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
            {itens.erro}
          </p>
        )}

        {/* Sem erro e sem itens → vazio orientando para o form acima. */}
        {!itens.erro && lista.length === 0 ? (
          <EmptyState
            icon={Storefront}
            titulo="Nenhum item ainda"
            descricao="Cadastre o primeiro item no formulário acima para começar a controlar saldo e custo médio."
          />
        ) : (
          <ul className="space-y-2">
            {lista.map((item) => {
              const Icone = iconeCategoria[item.categoria];
              const baixo = Number(item.quantidade) <= Number(item.estoque_minimo);
              const aberto = movItemId === item.id;
              return (
                <li
                  key={item.id}
                  className="rounded-card border border-border bg-surface shadow-xs transition-[border-color,box-shadow] duration-150 ease-default hover:border-border-strong hover:shadow-sm"
                >
                  <div className="flex items-start gap-4 p-4">
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${swatchCategoria[toneCategoria[item.categoria]]}`}
                      aria-hidden
                    >
                      <Icone size={20} weight="fill" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-fg">{item.nome}</p>
                        <Chip tone={toneCategoria[item.categoria]} icon={Icone}>
                          {categoriaEstoque(item.categoria).label}
                        </Chip>
                        {baixo && (
                          <StatusChip tone="danger" icon={Warning}>
                            Estoque baixo
                          </StatusChip>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-caption text-fg-subtle">
                        <span className="inline-flex items-baseline gap-1">
                          <span className="font-numeric text-small font-medium text-fg">
                            {fmtNum(Number(item.quantidade))}
                          </span>
                          <span>{item.unidade}</span>
                        </span>
                        <span className="inline-flex items-baseline gap-1">
                          custo médio
                          <span className="font-numeric text-fg-muted">{fmtMoeda(Number(item.custo_medio))}</span>
                        </span>
                        <span className="inline-flex items-baseline gap-1">
                          mínimo
                          <span className="font-numeric text-fg-muted">{fmtNum(Number(item.estoque_minimo))}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMovItemId(aberto ? null : item.id)}
                      aria-expanded={aberto}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-caption font-medium text-fg-muted transition-colors duration-150 ease-default hover:border-border-strong hover:text-fg"
                    >
                      {aberto ? 'Fechar' : 'Movimentar'}
                    </button>
                  </div>

                  {aberto && (
                    <MovimentoForm
                      item={item}
                      onPronto={async () => {
                        setMovItemId(null);
                        await carregar();
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-10 text-caption text-fg-subtle">
        Saldo e custo médio são recalculados pelo sistema a cada movimentação.
      </p>
    </main>
  );
}

/* ====================================================================== */
/* Movimento inline (entrada/saída) por item.                              */
/* ====================================================================== */

function MovimentoForm({ item, onPronto }: { item: EstoqueItem; onPronto: () => void | Promise<void> }) {
  const [tipo, setTipo] = useState<MovimentoTipo>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    const qtd = Number(quantidade);
    if (!quantidade.trim() || !Number.isFinite(qtd) || qtd <= 0) {
      setErro('Informe uma quantidade maior que zero.');
      return;
    }

    // custo_unitario só faz sentido na entrada (alimenta o custo médio).
    let custo: number | undefined;
    if (tipo === 'entrada' && custoUnitario.trim()) {
      const c = Number(custoUnitario);
      if (!Number.isFinite(c) || c < 0) {
        setErro('Custo unitário inválido.');
        return;
      }
      custo = c;
    }

    setEnviando(true);
    const r = await registrarMovimento({
      item_id: item.id,
      tipo,
      quantidade: qtd,
      custo_unitario: custo,
      // os_comercial_id: TODO — vincular saída a uma OS comercial (seletor futuro).
      observacao: observacao.trim() || undefined,
    });

    if (r.status !== 'success') {
      setEnviando(false);
      setErro(r.status === 'error' ? r.message : 'Não foi possível registrar.');
      return;
    }

    setEnviando(false);
    await onPronto();
  }

  return (
    <form onSubmit={registrar} className="border-t border-border bg-surface-sunken/40 p-4">
      <fieldset className="mb-3">
        <legend className="mb-2 text-caption font-medium text-fg-muted">Tipo de movimento</legend>
        <div role="radiogroup" aria-label="Tipo de movimento" className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'entrada', nome: 'Entrada', Icone: ArrowDown },
              { id: 'saida', nome: 'Saída', Icone: ArrowUp },
            ] as const
          ).map((t) => {
            const ativo = tipo === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setTipo(t.id)}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border px-3 py-2 text-caption font-medium transition-colors duration-150 ease-default ${
                  ativo
                    ? t.id === 'entrada'
                      ? 'border-success bg-success-tint text-success'
                      : 'border-danger bg-danger-tint text-danger'
                    : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                }`}
              >
                <t.Icone size={16} weight="bold" aria-hidden />
                {t.nome}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`mov-qtd-${item.id}`} className="text-caption font-medium text-fg-muted">
            Quantidade ({item.unidade})
          </label>
          <input
            id={`mov-qtd-${item.id}`}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            required
            aria-required="true"
            className={`${inp} font-numeric`}
          />
        </div>

        {/* Custo unitário só na entrada (alimenta o cálculo do custo médio). */}
        {tipo === 'entrada' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`mov-custo-${item.id}`} className="text-caption font-medium text-fg-muted">
              Custo unitário (R$)
            </label>
            <input
              id={`mov-custo-${item.id}`}
              value={custoUnitario}
              onChange={(e) => setCustoUnitario(e.target.value)}
              placeholder="Ex.: 12,50"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className={`${inp} font-numeric`}
            />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <label htmlFor={`mov-obs-${item.id}`} className="text-caption font-medium text-fg-muted">
          Observação <span className="font-normal text-fg-subtle">(opcional)</span>
        </label>
        <input
          id={`mov-obs-${item.id}`}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex.: compra do fornecedor, nota 123"
          className={inp}
        />
      </div>

      {erro && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-small text-danger">
          <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-sm"
      >
        {enviando ? 'Registrando…' : 'Registrar movimento'}
      </button>
    </form>
  );
}
