'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarVeiculos,
  criarVeiculo,
  type VeiculoComCliente,
} from '@/lib/supabase/veiculos';
import { listarClientes, type Cliente } from '@/lib/supabase/clientes';
import {
  fipeListarMarcas,
  fipeListarModelos,
  fipeListarAnos,
  fipeBuscarValor,
  type FipeItem,
} from '@/lib/fipe';

type Estado = 'carregando' | 'pronto';
const input = 'rounded-lg border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent';

export default function VeiculosPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [veiculos, setVeiculos] = useState<VeiculoComCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  // campos do veículo
  const [placa, setPlaca] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [cor, setCor] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [fipeCodigo, setFipeCodigo] = useState('');
  const [fipeValor, setFipeValor] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);

  // seletores FIPE
  const [marcas, setMarcas] = useState<FipeItem[]>([]);
  const [modelos, setModelos] = useState<FipeItem[]>([]);
  const [anos, setAnos] = useState<FipeItem[]>([]);
  const [selMarca, setSelMarca] = useState('');
  const [selModelo, setSelModelo] = useState('');
  const [fipeMsg, setFipeMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [rv, rc] = await Promise.all([listarVeiculos(), listarClientes()]);
    if (rv.status === 'success') setVeiculos(rv.data);
    else if (rv.status === 'empty') setVeiculos([]);
    else setErro(rv.message);
    setClientes(rc.status === 'success' ? rc.data : []);
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
        fipeListarMarcas()
          .then(setMarcas)
          .catch(() => setFipeMsg('FIPE indisponível agora — preencha manualmente.'));
      });
  }, [router, carregar]);

  async function onMarca(codigo: string) {
    setSelMarca(codigo);
    setSelModelo('');
    setModelos([]);
    setAnos([]);
    setMarca(marcas.find((x) => x.codigo === codigo)?.nome ?? '');
    if (!codigo) return;
    try {
      setModelos(await fipeListarModelos(codigo));
    } catch {
      setFipeMsg('Falha ao carregar modelos da FIPE.');
    }
  }

  async function onModelo(codigo: string) {
    setSelModelo(codigo);
    setAnos([]);
    setModelo(modelos.find((x) => x.codigo === codigo)?.nome ?? '');
    if (!codigo) return;
    try {
      setAnos(await fipeListarAnos(selMarca, codigo));
    } catch {
      setFipeMsg('Falha ao carregar anos da FIPE.');
    }
  }

  async function onAno(codigo: string) {
    if (!codigo) return;
    try {
      const v = await fipeBuscarValor(selMarca, selModelo, codigo);
      setMarca(v.marca);
      setModelo(v.modelo);
      setAnoModelo(v.ano);
      setCombustivel(v.combustivel);
      setFipeCodigo(v.codigoFipe);
      setFipeValor(v.valor);
      setFipeMsg(`FIPE: ${v.marca} ${v.modelo} ${v.ano} — R$ ${v.valor.toLocaleString('pt-BR')}`);
    } catch {
      setFipeMsg('Falha ao buscar o valor FIPE.');
    }
  }

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setFormErro(null);
    const r = await criarVeiculo({
      placa,
      cliente_id: clienteId || null,
      marca,
      modelo,
      ano_modelo: anoModelo,
      combustivel,
      cor,
      fipe_codigo: fipeCodigo,
      fipe_valor: fipeValor,
    });
    setSalvando(false);
    if (r.status !== 'success') {
      setFormErro(r.status === 'error' ? r.message : 'Não foi possível salvar.');
      return;
    }
    setPlaca('');
    setClienteId('');
    setCor('');
    setMarca('');
    setModelo('');
    setAnoModelo('');
    setCombustivel('');
    setFipeCodigo('');
    setFipeValor(null);
    setSelMarca('');
    setSelModelo('');
    setModelos([]);
    setAnos([]);
    setFipeMsg(null);
    await carregar();
  }

  if (estado === 'carregando') {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-zinc-500">Carregando…</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Veículos</h1>
        <Link href="/painel" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
          ← Painel
        </Link>
      </div>

      <form
        onSubmit={adicionar}
        className="mb-6 space-y-3 rounded-2xl border border-black/10 p-5 dark:border-white/15"
      >
        <p className="text-sm font-medium">Novo veículo</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            placeholder="Placa (ABC1D23)"
            required
            className={`${input} flex-1`}
          />
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={`${input} flex-1`}>
            <option value="">Cliente (opcional)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Assistente FIPE (opcional) */}
        <div className="rounded-lg border border-dashed border-black/15 p-3 dark:border-white/20">
          <p className="mb-2 text-xs font-medium text-zinc-500">Puxar da Tabela FIPE (opcional)</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={selMarca} onChange={(e) => onMarca(e.target.value)} className={`${input} flex-1`} disabled={marcas.length === 0}>
              <option value="">Marca</option>
              {marcas.map((m) => (
                <option key={m.codigo} value={m.codigo}>{m.nome}</option>
              ))}
            </select>
            <select value={selModelo} onChange={(e) => onModelo(e.target.value)} className={`${input} flex-1`} disabled={modelos.length === 0}>
              <option value="">Modelo</option>
              {modelos.map((m) => (
                <option key={m.codigo} value={m.codigo}>{m.nome}</option>
              ))}
            </select>
            <select onChange={(e) => onAno(e.target.value)} className={`${input} flex-1`} disabled={anos.length === 0} defaultValue="">
              <option value="">Ano</option>
              {anos.map((a) => (
                <option key={a.codigo} value={a.codigo}>{a.nome}</option>
              ))}
            </select>
          </div>
          {fipeMsg && <p className="mt-2 text-xs text-zinc-500">{fipeMsg}</p>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca" className={`${input} flex-1`} />
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo" className={`${input} flex-1`} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={anoModelo} onChange={(e) => setAnoModelo(e.target.value)} placeholder="Ano" className={`${input} flex-1`} />
          <input value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Cor" className={`${input} flex-1`} />
          <input
            value={fipeValor ?? ''}
            onChange={(e) => setFipeValor(e.target.value ? Number(e.target.value) : null)}
            placeholder="Valor FIPE (R$)"
            inputMode="numeric"
            className={`${input} flex-1`}
          />
        </div>

        {formErro && <p className="text-sm text-red-600">{formErro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {salvando ? 'Salvando…' : 'Adicionar veículo'}
        </button>
      </form>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
      {veiculos.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum veículo ainda. Cadastre o primeiro acima.</p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/15">
          {veiculos.map((v) => (
            <li key={v.id} className="p-4">
              <p className="font-medium">
                {v.placa} {v.marca || v.modelo ? `· ${[v.marca, v.modelo].filter(Boolean).join(' ')}` : ''}
              </p>
              <p className="text-xs text-zinc-500">
                {[v.ano_modelo, v.cor, v.cliente?.nome].filter(Boolean).join(' · ')}
                {v.fipe_valor ? ` · FIPE R$ ${v.fipe_valor.toLocaleString('pt-BR')}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
