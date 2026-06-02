'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash, CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import { listarClientes, type Cliente } from '@/lib/supabase/clientes';
import { listarVeiculos, type VeiculoComCliente } from '@/lib/supabase/veiculos';
import {
  listarOrcamentos,
  criarOrcamento,
  adicionarItens,
  calcularTotais,
  TIPOS_ITEM,
  type OrcamentoLinha,
  type TipoItem,
} from '@/lib/supabase/orcamentos';

type Estado = 'carregando' | 'pronto';
type Linha = { tipo: TipoItem; descricao: string; quantidade: number; custo_unitario: number; venda_unitaria: number };

const inp =
  'w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors focus:border-primary';
const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const linhaVazia = (): Linha => ({ tipo: 'peca', descricao: '', quantidade: 1, custo_unitario: 0, venda_unitaria: 0 });

/** Conta o número até o alvo (count-up) com easeOutCubic; respeita prefers-reduced-motion. */
function useAnimatedNumber(target: number, duration = 500): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : duration;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased); // setState só no callback do rAF (não no corpo do effect)
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function OrcamentosPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [orcamentos, setOrcamentos] = useState<OrcamentoLinha[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<VeiculoComCliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [itens, setItens] = useState<Linha[]>([linhaVazia()]);
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);

  const totais = calcularTotais(itens, desconto);
  const sem =
    totais.margemPct < 0
      ? { label: 'Prejuízo', Icon: XCircle, text: 'text-danger', chip: 'bg-danger-bg text-on-danger', bar: 'bg-danger-bg' }
      : totais.margemPct < 20
        ? { label: 'Atenção', Icon: Warning, text: 'text-warning', chip: 'bg-warning-bg text-on-warning', bar: 'bg-warning-bg' }
        : { label: 'Lucrativo', Icon: CheckCircle, text: 'text-success', chip: 'bg-success-bg text-on-success', bar: 'bg-success-bg' };
  const barW = Math.max(0, Math.min(100, totais.margemPct));
  const lucroAnim = useAnimatedNumber(totais.lucro);
  const margemAnim = useAnimatedNumber(totais.margemPct);

  const carregar = useCallback(async () => {
    const [ro, rc, rv] = await Promise.all([listarOrcamentos(), listarClientes(), listarVeiculos()]);
    if (ro.status === 'success') setOrcamentos(ro.data);
    else if (ro.status === 'empty') setOrcamentos([]);
    else setErro(ro.message);
    setClientes(rc.status === 'success' ? rc.data : []);
    setVeiculos(rv.status === 'success' ? rv.data : []);
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

  function setLinha(i: number, patch: Partial<Linha>) {
    setItens((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  const addLinha = () => setItens((arr) => [...arr, linhaVazia()]);
  const removeLinha = (i: number) => setItens((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const itensValidos = itens.filter((l) => l.descricao.trim().length > 0 && l.quantidade > 0);
    if (itensValidos.length === 0) {
      setFormErro('Adicione ao menos um item com descrição e quantidade maior que zero.');
      return;
    }
    setSalvando(true);
    setFormErro(null);
    const oc = await criarOrcamento({ cliente_id: clienteId || null, veiculo_id: veiculoId || null, desconto });
    if (oc.status !== 'success') {
      setSalvando(false);
      setFormErro(oc.status === 'error' ? oc.message : 'Não foi possível criar.');
      return;
    }
    const it = await adicionarItens(oc.data.id, itensValidos);
    setSalvando(false);
    if (it.status !== 'success') {
      setFormErro(it.status === 'error' ? it.message : 'Itens não salvos.');
      return;
    }
    setClienteId('');
    setVeiculoId('');
    setDesconto(0);
    setItens([linhaVazia()]);
    await carregar();
  }

  if (estado === 'carregando') {
    return <main className="flex flex-1 items-center justify-center p-6 text-fg-muted">Carregando…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Orçamento</p>
          <h1 className="font-display text-h1 text-fg">Novo orçamento</h1>
        </div>
        <Link
          href="/painel"
          className="inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Painel
        </Link>
      </header>

      <form onSubmit={salvar}>
        <div className="grid gap-6 lg:grid-cols-12">
          {/* ESQUERDA — montagem */}
          <div className="space-y-5 lg:col-span-7">
            <section className="rounded-card border border-border bg-surface p-5 shadow-sm">
              <p className="mb-3 text-overline uppercase tracking-[0.12em] text-fg-subtle">Cliente &amp; veículo</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={`${inp} flex-1`} aria-label="Cliente">
                  <option value="">Cliente (opcional)</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <select value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} className={`${inp} flex-1`} aria-label="Veículo">
                  <option value="">Veículo (opcional)</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>{v.placa}{v.modelo ? ` · ${v.modelo}` : ''}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-card border border-border bg-surface p-5 shadow-sm">
              <p className="mb-3 text-overline uppercase tracking-[0.12em] text-fg-subtle">Itens · peça, mão de obra, insumo</p>
              <div className="space-y-2">
                <div className="hidden grid-cols-12 gap-2 px-1 text-overline uppercase tracking-wide text-fg-subtle sm:grid">
                  <span className="col-span-3">Tipo</span>
                  <span className="col-span-4">Descrição</span>
                  <span className="col-span-1 text-right">Qtd</span>
                  <span className="col-span-2 text-right">Custo un.</span>
                  <span className="col-span-2 text-right">Venda un.</span>
                </div>
                {itens.map((l, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                    <select value={l.tipo} onChange={(e) => setLinha(i, { tipo: e.target.value as TipoItem })} className={`${inp} col-span-2 sm:col-span-3`} aria-label="Tipo do item">
                      {TIPOS_ITEM.map((t) => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                    <input value={l.descricao} onChange={(e) => setLinha(i, { descricao: e.target.value })} placeholder="Descrição" className={`${inp} col-span-2 sm:col-span-4`} aria-label="Descrição" />
                    <input type="number" min="0" step="0.5" value={l.quantidade} onChange={(e) => setLinha(i, { quantidade: Number(e.target.value) || 0 })} className={`${inp} text-right font-numeric sm:col-span-1`} aria-label="Quantidade" />
                    <input type="number" min="0" step="0.01" value={l.custo_unitario} onChange={(e) => setLinha(i, { custo_unitario: Number(e.target.value) || 0 })} className={`${inp} text-right font-numeric sm:col-span-2`} aria-label="Custo unitário" />
                    <input type="number" min="0" step="0.01" value={l.venda_unitaria} onChange={(e) => setLinha(i, { venda_unitaria: Number(e.target.value) || 0 })} className={`${inp} text-right font-numeric sm:col-span-2`} aria-label="Venda unitária" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button type="button" onClick={addLinha} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-small font-medium text-primary transition-colors hover:bg-surface-sunken">
                  <Plus size={16} weight="bold" aria-hidden />
                  Adicionar item
                </button>
                {itens.length > 1 && (
                  <button type="button" onClick={() => removeLinha(itens.length - 1)} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-small text-fg-subtle transition-colors hover:text-danger">
                    <Trash size={16} aria-hidden />
                    Remover último
                  </button>
                )}
              </div>
            </section>

            <section className="flex items-center justify-between rounded-card border border-border bg-surface p-5 shadow-sm">
              <label htmlFor="desconto" className="text-small text-fg-muted">Desconto (R$)</label>
              <input id="desconto" type="number" min="0" step="0.01" value={desconto} onChange={(e) => setDesconto(Number(e.target.value) || 0)} className="w-36 rounded-control border border-border bg-surface px-3 py-2 text-right font-numeric text-fg outline-none focus:border-primary" />
            </section>
          </div>

          {/* DIREITA — Painel de Lucro (sticky) */}
          <aside className="lg:col-span-5">
            <div className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg lg:sticky lg:top-6">
              <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Lucro do orçamento</p>
              <p className={`mt-1 font-numeric text-metric-lg leading-none tabular-nums ${sem.text}`}>{fmt(lucroAnim)}</p>

              <div className="mt-3 flex items-center gap-3">
                <span
                  key={sem.label}
                  className={`gd-pulse inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-caption font-semibold ${sem.chip}`}
                >
                  <sem.Icon size={15} weight="fill" aria-hidden /> {sem.label}
                </span>
                <span className={`font-numeric text-h3 tabular-nums ${sem.text}`}>{margemAnim.toFixed(1)}%</span>
              </div>

              <div className="mt-5">
                <div className="relative h-2.5 overflow-hidden rounded-pill bg-surface-sunken">
                  <div
                    className={`h-full w-full origin-left rounded-pill ${sem.bar} transition-transform duration-300 ease-default`}
                    style={{ transform: `scaleX(${barW / 100})` }}
                  />
                  <div className="absolute inset-y-0 w-0.5 bg-border-strong" style={{ left: '20%' }} aria-hidden />
                </div>
                <p className="mt-1.5 text-caption text-fg-subtle">meta de margem: 20%</p>
              </div>

              <dl className="mt-6 space-y-2.5 border-t border-border pt-4 text-small">
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">Venda</dt>
                  <dd className="font-numeric text-fg">{fmt(totais.totalVenda)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">Custo</dt>
                  <dd className="font-numeric text-fg">{fmt(totais.totalCusto)}</dd>
                </div>
              </dl>

              {formErro && <p className="mt-4 text-small text-danger">{formErro}</p>}

              <button
                type="submit"
                disabled={salvando}
                className="mt-5 h-12 w-full rounded-control bg-primary font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {salvando ? 'Salvando…' : 'Salvar orçamento'}
              </button>
            </div>
          </aside>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-h3 text-fg">Orçamentos recentes</h2>
        {erro && <p className="mb-3 text-small text-danger">{erro}</p>}
        {orcamentos.length === 0 ? (
          <p className="text-small text-fg-muted">Nenhum orçamento ainda. Monte o primeiro acima.</p>
        ) : (
          <ul className="space-y-2">
            {orcamentos.map((o) => {
              const venda = o.itens.reduce((a, x) => a + Number(x.total_venda), 0) - Number(o.desconto);
              const margem = o.itens.reduce((a, x) => a + Number(x.margem), 0) - Number(o.desconto);
              const pct = venda > 0 ? (margem / venda) * 100 : 0;
              const c = pct < 0 ? 'text-danger' : pct < 20 ? 'text-warning' : 'text-success';
              return (
                <li key={o.id} className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-xs">
                  <div>
                    <p className="font-medium text-fg">
                      {o.cliente?.nome ?? 'Sem cliente'}
                      {o.veiculo?.placa ? ` · ${o.veiculo.placa}` : ''}
                    </p>
                    <p className="text-caption text-fg-subtle">
                      {o.status} · {o.itens.length} item(ns) · {new Date(o.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-numeric text-body-lg text-fg">{fmt(venda)}</p>
                    <p className={`font-numeric text-caption ${c}`}>margem {pct.toFixed(1)}%</p>
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
