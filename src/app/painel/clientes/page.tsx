'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarClientes,
  criarCliente,
  TIPOS_CLIENTE,
  type Cliente,
  type TipoCliente,
} from '@/lib/supabase/clientes';

type Estado = 'carregando' | 'pronto';

const inp =
  'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary';

const chipTipo: Record<TipoCliente, string> = {
  particular: 'bg-surface-sunken text-fg-muted',
  seguradora: 'bg-primary/10 text-primary',
  cooperativa: 'bg-success-tint text-success',
};

export default function ClientesPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoCliente>('particular');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const r = await listarClientes();
    if (r.status === 'success') setClientes(r.data);
    else if (r.status === 'empty') setClientes([]);
    else setErro(r.message);
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
    const r = await criarCliente({ tipo, nome, documento, telefone });
    setSalvando(false);
    if (r.status !== 'success') {
      setFormErro(r.status === 'error' ? r.message : 'Não foi possível salvar.');
      return;
    }
    setNome('');
    setDocumento('');
    setTelefone('');
    setTipo('particular');
    await carregar();
  }

  if (estado === 'carregando') {
    return <main className="flex flex-1 items-center justify-center p-6 text-fg-muted">Carregando…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Cadastro</p>
          <h1 className="font-display text-h1 text-fg">Clientes</h1>
        </div>
        <Link
          href="/painel"
          className="inline-flex min-h-11 items-center rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:text-fg"
        >
          ← Painel
        </Link>
      </header>

      <form
        onSubmit={adicionar}
        className="mb-10 rounded-card border border-border bg-surface p-5 shadow-sm"
      >
        <p className="mb-4 text-overline uppercase tracking-[0.12em] text-fg-subtle">Novo cliente</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente-tipo" className="text-caption font-medium text-fg-muted">
              Tipo
            </label>
            <select
              id="cliente-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCliente)}
              className={inp}
            >
              {TIPOS_CLIENTE.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente-nome" className="text-caption font-medium text-fg-muted">
              Nome / razão social
            </label>
            <input
              id="cliente-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome / razão social"
              required
              aria-required="true"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente-documento" className="text-caption font-medium text-fg-muted">
              CPF / CNPJ
            </label>
            <input
              id="cliente-documento"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="CPF / CNPJ"
              inputMode="numeric"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente-telefone" className="text-caption font-medium text-fg-muted">
              Telefone
            </label>
            <input
              id="cliente-telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Telefone"
              type="tel"
              inputMode="tel"
              className={inp}
            />
          </div>
        </div>

        {formErro && (
          <p role="alert" className="mt-4 text-small text-danger">
            {formErro}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : 'Adicionar cliente'}
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-display text-h3 text-fg">Clientes cadastrados</h2>
        {erro && (
          <p role="alert" className="mb-3 text-small text-danger">
            {erro}
          </p>
        )}
        {clientes.length === 0 ? (
          <p className="text-small text-fg-muted">Nenhum cliente ainda. Adicione o primeiro acima.</p>
        ) : (
          <ul className="space-y-2">
            {clientes.map((c) => {
              const tipoNome = TIPOS_CLIENTE.find((t) => t.id === c.tipo)?.nome ?? c.tipo;
              const contato = [c.documento, c.telefone].filter(Boolean).join(' · ');
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{c.nome}</p>
                    {contato && <p className="mt-0.5 truncate text-caption text-fg-subtle">{contato}</p>}
                  </div>
                  <span
                    className={`shrink-0 rounded-pill px-3 py-1 text-caption font-semibold ${chipTipo[c.tipo]}`}
                  >
                    {tipoNome}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
