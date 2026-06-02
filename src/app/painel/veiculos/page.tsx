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
const input =
  'min-h-[44px] w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary disabled:cursor-not-allowed disabled:opacity-60';

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
      })
      .catch(() => router.replace('/login'));
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
      <main className="flex flex-1 items-center justify-center p-6 text-small text-fg-muted">Carregando…</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Frota</p>
          <h1 className="font-display text-h1 text-fg">Veículos</h1>
        </div>
        <Link
          href="/painel"
          className="inline-flex min-h-[44px] items-center rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-strong hover:text-fg"
        >
          ← Painel
        </Link>
      </header>

      <form
        onSubmit={adicionar}
        className="mb-10 space-y-4 rounded-card border border-border bg-surface p-5 shadow-sm"
      >
        <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Novo veículo</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="placa" className="mb-1.5 block text-caption text-fg-muted">Placa</label>
            <input
              id="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              required
              aria-label="Placa"
              className={`${input} font-numeric uppercase tracking-wide`}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cliente" className="mb-1.5 block text-caption text-fg-muted">Cliente</label>
            <select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-label="Cliente" className={input}>
              <option value="">Cliente (opcional)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assistente FIPE (opcional) */}
        <div className="rounded-control border border-dashed border-border-strong bg-surface-sunken p-4">
          <div className="mb-3 flex items-center gap-2">
            <span aria-hidden className="text-primary">✦</span>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Assistente FIPE · opcional</p>
          </div>
          <p className="mb-3 text-caption text-fg-muted">Selecione marca, modelo e ano para preencher os campos automaticamente.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={selMarca} onChange={(e) => onMarca(e.target.value)} className={input} disabled={marcas.length === 0} aria-label="Marca (FIPE)">
              <option value="">Marca</option>
              {marcas.map((m) => (
                <option key={m.codigo} value={m.codigo}>{m.nome}</option>
              ))}
            </select>
            <select value={selModelo} onChange={(e) => onModelo(e.target.value)} className={input} disabled={modelos.length === 0} aria-label="Modelo (FIPE)">
              <option value="">Modelo</option>
              {modelos.map((m) => (
                <option key={m.codigo} value={m.codigo}>{m.nome}</option>
              ))}
            </select>
            <select onChange={(e) => onAno(e.target.value)} className={input} disabled={anos.length === 0} defaultValue="" aria-label="Ano (FIPE)">
              <option value="">Ano</option>
              {anos.map((a) => (
                <option key={a.codigo} value={a.codigo}>{a.nome}</option>
              ))}
            </select>
          </div>
          {fipeMsg && <p className="mt-3 rounded-control bg-surface px-3 py-2 text-caption text-fg-muted" role="status" aria-live="polite">{fipeMsg}</p>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="marca" className="mb-1.5 block text-caption text-fg-muted">Marca</label>
            <input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca" aria-label="Marca" className={input} />
          </div>
          <div className="flex-1">
            <label htmlFor="modelo" className="mb-1.5 block text-caption text-fg-muted">Modelo</label>
            <input id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo" aria-label="Modelo" className={input} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="ano" className="mb-1.5 block text-caption text-fg-muted">Ano</label>
            <input id="ano" value={anoModelo} onChange={(e) => setAnoModelo(e.target.value)} placeholder="Ano" aria-label="Ano" className={`${input} font-numeric`} />
          </div>
          <div className="flex-1">
            <label htmlFor="cor" className="mb-1.5 block text-caption text-fg-muted">Cor</label>
            <input id="cor" value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Cor" aria-label="Cor" className={input} />
          </div>
          <div className="flex-1">
            <label htmlFor="fipe-valor" className="mb-1.5 block text-caption text-fg-muted">Valor FIPE (R$)</label>
            <input
              id="fipe-valor"
              type="number"
              min="0"
              step="0.01"
              value={fipeValor ?? ''}
              onChange={(e) => setFipeValor(e.target.value ? Number(e.target.value) || null : null)}
              placeholder="0,00"
              aria-label="Valor FIPE em reais"
              className={`${input} font-numeric`}
            />
          </div>
        </div>

        {formErro && <p className="text-small text-danger" role="alert">{formErro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex h-12 items-center justify-center rounded-control bg-primary px-5 text-small font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : 'Adicionar veículo'}
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-display text-h3 text-fg">Veículos cadastrados</h2>
        {erro && <p className="mb-3 text-small text-danger" role="alert">{erro}</p>}
        {veiculos.length === 0 ? (
          <p className="text-small text-fg-muted">Nenhum veículo ainda. Cadastre o primeiro acima.</p>
        ) : (
          <ul className="space-y-2">
            {veiculos.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center rounded-control border border-border-strong bg-surface-sunken px-2.5 py-1 font-numeric text-small font-semibold uppercase tracking-wide text-fg">
                      {v.placa}
                    </span>
                    {(v.marca || v.modelo) && (
                      <span className="truncate font-medium text-fg">
                        {[v.marca, v.modelo].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-caption text-fg-subtle">
                    {[v.ano_modelo, v.cor, v.cliente?.nome].filter(Boolean).join(' · ') || 'Sem detalhes'}
                  </p>
                </div>
                {v.fipe_valor ? (
                  <div className="shrink-0 text-right">
                    <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">FIPE</p>
                    <p className="font-numeric text-body-lg text-fg">
                      {v.fipe_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
