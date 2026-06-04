'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarVeiculos,
  criarVeiculo,
  normalizarChassi,
  normalizarRenavam,
  chassiPareceValido,
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
import { Car, Sparkle, User, WarningCircle } from '@phosphor-icons/react';
import { PainelSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { VoltarPainel } from '@/components/ui/voltar-painel';

type Estado = 'carregando' | 'pronto';
const input =
  'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors duration-150 ease-default placeholder:text-fg-subtle focus:border-primary disabled:cursor-not-allowed disabled:opacity-60';

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
  const [chassi, setChassi] = useState('');
  const [renavam, setRenavam] = useState('');
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
      chassi,
      renavam,
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
    setChassi('');
    setRenavam('');
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
    return <PainelSkeleton maxWidth="max-w-2xl" />;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        overline="GDelta · Frota"
        titulo="Veículos"
        descricao="Cadastre e consulte a frota — o assistente FIPE agiliza marca, modelo, ano e valor."
        acao={<VoltarPainel />}
      />

      <form
        onSubmit={adicionar}
        className="mb-10 space-y-5 rounded-panel border border-border bg-surface-raised p-5 shadow-sm sm:p-6"
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
            <div className="relative">
              <User
                size={18}
                weight="duotone"
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
              />
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                aria-label="Cliente"
                className={`${input} pl-10`}
              >
                <option value="">Cliente (opcional)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Assistente FIPE (opcional) — bloco de destaque "inteligente" */}
        <div className="relative overflow-hidden rounded-card border border-primary/30 bg-surface-sunken p-4 shadow-xs sm:p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-primary/30 bg-primary/10 text-primary"
              >
                <Sparkle size={18} weight="fill" />
              </span>
              <div>
                <p className="text-overline uppercase tracking-[0.12em] text-primary">Assistente FIPE</p>
                <p className="text-caption text-fg-muted">Preenche marca, modelo, ano e valor para você.</p>
              </div>
            </div>
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
            {fipeMsg && (
              <p
                className="mt-3 flex items-start gap-2 rounded-control border border-border bg-surface px-3 py-2 text-caption text-fg-muted shadow-xs"
                role="status"
                aria-live="polite"
              >
                <Sparkle size={14} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-primary" />
                <span>{fipeMsg}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Dados do veículo</span>
          <span aria-hidden className="h-px flex-1 bg-border" />
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="chassi" className="mb-1.5 block text-caption text-fg-muted">Chassi</label>
            <input
              id="chassi"
              value={chassi}
              onChange={(e) => setChassi(normalizarChassi(e.target.value))}
              placeholder="Chassi (opcional)"
              aria-label="Chassi"
              className={`${input} font-numeric uppercase tracking-wide`}
            />
            {chassi && !chassiPareceValido(chassi) && (
              <p className="mt-1.5 text-caption text-fg-subtle">Chassi geralmente tem 17 caracteres.</p>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="renavam" className="mb-1.5 block text-caption text-fg-muted">RENAVAM</label>
            <input
              id="renavam"
              value={renavam}
              onChange={(e) => setRenavam(normalizarRenavam(e.target.value))}
              placeholder="RENAVAM (opcional)"
              inputMode="numeric"
              aria-label="RENAVAM"
              className={`${input} font-numeric`}
            />
          </div>
        </div>

        {formErro && (
          <p className="flex items-center gap-2 text-small text-danger" role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden className="shrink-0" />
            {formErro}
          </p>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 text-small font-semibold text-on-primary shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm"
        >
          <Car size={18} weight="bold" aria-hidden />
          {salvando ? 'Salvando…' : 'Adicionar veículo'}
        </button>
      </form>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-h3 text-fg">Veículos cadastrados</h2>
          {veiculos.length > 0 && (
            <span className="inline-flex items-center rounded-pill border border-border bg-surface-sunken px-2.5 py-0.5 font-numeric text-caption font-semibold text-fg-muted">
              {veiculos.length}
            </span>
          )}
        </div>
        {erro && (
          <p className="mb-3 flex items-center gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3 text-small text-danger" role="alert">
            <WarningCircle size={18} weight="fill" aria-hidden className="shrink-0" />
            {erro}
          </p>
        )}
        {veiculos.length === 0 ? (
          !erro && (
            <EmptyState
              icon={Car}
              titulo="Nenhum veículo ainda"
              descricao="Cadastre o primeiro veículo no formulário acima — o assistente FIPE agiliza o preenchimento."
            />
          )
        ) : (
          <ul className="space-y-2">
            {veiculos.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-xs transition-colors duration-150 ease-default hover:border-border-strong"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    aria-hidden
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-border bg-surface-sunken text-primary"
                  >
                    <Car size={22} weight="duotone" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center rounded-control border border-border-strong bg-surface-sunken px-2.5 py-1 font-numeric text-small font-semibold uppercase tracking-wide text-fg">
                        {v.placa}
                      </span>
                      {(v.marca || v.modelo) && (
                        <span className="truncate font-medium text-fg">
                          {[v.marca, v.modelo].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-caption text-fg-subtle">
                      {v.cliente?.nome && <User size={13} weight="duotone" aria-hidden className="shrink-0" />}
                      <span className="truncate">
                        {[v.ano_modelo, v.cor, v.cliente?.nome].filter(Boolean).join(' · ') || 'Sem detalhes'}
                      </span>
                    </p>
                  </div>
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
