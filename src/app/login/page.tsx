'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Já logado? Vai direto pro painel.
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace('/painel');
      })
      .catch(() => {});
  }, [router]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro('Não foi possível entrar. Confira o e-mail e a senha.');
      return;
    }
    router.replace('/painel');
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-black/10 p-8 dark:border-white/15"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">GDelta — Entrar</h1>
          <p className="text-sm text-zinc-500">Acesse o painel da sua oficina.</p>
        </div>
        <input
          className="w-full rounded-lg border border-black/15 px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:bg-transparent dark:focus:border-white/50"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-black/15 px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:bg-transparent dark:focus:border-white/50"
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-opacity disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
