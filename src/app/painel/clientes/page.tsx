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
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-zinc-500">Carregando…</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <Link
          href="/painel"
          className="text-sm text-zinc-500 underline-offset-4 hover:underline"
        >
          ← Painel
        </Link>
      </div>

      <form
        onSubmit={adicionar}
        className="mb-6 space-y-3 rounded-2xl border border-black/10 p-5 dark:border-white/15"
      >
        <p className="text-sm font-medium">Novo cliente</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCliente)}
            className="rounded-lg border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          >
            {TIPOS_CLIENTE.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome / razão social"
            required
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="CPF / CNPJ"
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </div>
        {formErro && <p className="text-sm text-red-600">{formErro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {salvando ? 'Salvando…' : 'Adicionar cliente'}
        </button>
      </form>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
      {clientes.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum cliente ainda. Adicione o primeiro acima.</p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/15">
          {clientes.map((c) => (
            <li key={c.id} className="p-4">
              <p className="font-medium">{c.nome}</p>
              <p className="text-xs text-zinc-500">
                {TIPOS_CLIENTE.find((t) => t.id === c.tipo)?.nome ?? c.tipo}
                {c.documento ? ` · ${c.documento}` : ''}
                {c.telefone ? ` · ${c.telefone}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
