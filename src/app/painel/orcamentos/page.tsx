'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
const inp = 'rounded-lg border border-black/15 px-2 py-1.5 text-sm dark:border-white/20 dark:bg-transparent';
const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const linhaVazia = (): Linha => ({ tipo: 'peca', descricao: '', quantidade: 1, custo_unitario: 0, venda_unitaria: 0 });

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
  const corMargem =
    totais.margemPct < 0 ? 'text-red-600' : totais.margemPct < 20 ? 'text-amber-600' : 'text-emerald-600';

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
      setFormErro(oc.status === 'error' ? oc.message : 'Falha ao criar.');
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
    return <main className="flex flex-1 items-center justify-center p-6 text-zinc-500">Carregando…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
        <Link href="/painel" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
          ← Painel
        </Link>
      </div>

      <form onSubmit={salvar} className="mb-8 rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <p className="mb-3 text-sm font-medium">Novo orçamento</p>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={`${inp} flex-1`}>
            <option value="">Cliente (opcional)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <select value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} className={`${inp} flex-1`}>
            <option value="">Veículo (opcional)</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.placa}{v.modelo ? ` · ${v.modelo}` : ''}</option>
            ))}
          </select>
        </div>

        {/* itens */}
        <div className="space-y-2">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs text-zinc-500 sm:grid">
            <span className="col-span-3">Tipo</span>
            <span className="col-span-4">Descrição</span>
            <span className="col-span-1 text-right">Qtd</span>
            <span className="col-span-2 text-right">Custo un.</span>
            <span className="col-span-2 text-right">Venda un.</span>
          </div>
          {itens.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-12">
              <select value={l.tipo} onChange={(e) => setLinha(i, { tipo: e.target.value as TipoItem })} className={`${inp} col-span-2 sm:col-span-3`}>
                {TIPOS_ITEM.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              <input value={l.descricao} onChange={(e) => setLinha(i, { descricao: e.target.value })} placeholder="Descrição" className={`${inp} col-span-2 sm:col-span-4`} />
              <input type="number" min="0" step="0.5" value={l.quantidade} onChange={(e) => setLinha(i, { quantidade: Number(e.target.value) || 0 })} className={`${inp} text-right sm:col-span-1`} />
              <input type="number" min="0" step="0.01" value={l.custo_unitario} onChange={(e) => setLinha(i, { custo_unitario: Number(e.target.value) || 0 })} className={`${inp} text-right sm:col-span-2`} />
              <input type="number" min="0" step="0.01" value={l.venda_unitaria} onChange={(e) => setLinha(i, { venda_unitaria: Number(e.target.value) || 0 })} className={`${inp} text-right sm:col-span-2`} />
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button type="button" onClick={addLinha} className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300">
            + Adicionar item
          </button>
          {itens.length > 1 && (
            <button type="button" onClick={() => removeLinha(itens.length - 1)} className="text-sm text-zinc-400 hover:text-red-600">
              remover último
            </button>
          )}
        </div>

        {/* PAINEL DE MARGEM AO VIVO */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-4 sm:grid-cols-4 dark:bg-white/5">
          <div>
            <p className="text-xs text-zinc-500">Venda</p>
            <p className="text-lg font-semibold">{fmt(totais.totalVenda)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Custo</p>
            <p className="text-lg font-semibold">{fmt(totais.totalCusto)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Lucro</p>
            <p className={`text-lg font-semibold ${corMargem}`}>{fmt(totais.lucro)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Margem</p>
            <p className={`text-lg font-semibold ${corMargem}`}>{totais.margemPct.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-zinc-500">Desconto R$</label>
          <input type="number" min="0" step="0.01" value={desconto} onChange={(e) => setDesconto(Number(e.target.value) || 0)} className={`${inp} w-32 text-right`} />
        </div>

        {formErro && <p className="mt-3 text-sm text-red-600">{formErro}</p>}
        <button type="submit" disabled={salvando} className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black">
          {salvando ? 'Salvando…' : 'Salvar orçamento'}
        </button>
      </form>

      {/* lista */}
      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
      {orcamentos.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum orçamento ainda.</p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/15">
          {orcamentos.map((o) => {
            const venda = o.itens.reduce((a, x) => a + Number(x.total_venda), 0) - Number(o.desconto);
            const margem = o.itens.reduce((a, x) => a + Number(x.margem), 0) - Number(o.desconto);
            const pct = venda > 0 ? (margem / venda) * 100 : 0;
            return (
              <li key={o.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {o.cliente?.nome ?? 'Sem cliente'}
                    {o.veiculo?.placa ? ` · ${o.veiculo.placa}` : ''}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {o.status} · {o.itens.length} item(ns) · {new Date(o.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmt(venda)}</p>
                  <p className={`text-xs ${pct < 0 ? 'text-red-600' : pct < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>margem {pct.toFixed(1)}%</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
