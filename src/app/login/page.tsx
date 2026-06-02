'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/brand';

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
    <main className="flex flex-1 items-center justify-center bg-bg p-6">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm space-y-6 rounded-panel border border-border bg-surface-raised p-8 shadow-lg"
      >
        <div className="flex flex-col items-center space-y-2 text-center">
          <BrandLogo className="mb-2 h-20" />
          <h1 className="font-display text-h2 text-fg">Entrar</h1>
          <p className="text-small text-fg-muted">A inteligência que faz sua oficina dar lucro.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-caption font-medium text-fg-muted">
              E-mail
            </label>
            <input
              id="email"
              className="h-12 w-full rounded-control border border-border bg-surface px-3 text-body text-fg outline-none transition-colors focus:border-primary"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="voce@oficina.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="senha" className="text-caption font-medium text-fg-muted">
              Senha
            </label>
            <input
              id="senha"
              className="h-12 w-full rounded-control border border-border bg-surface px-3 text-body text-fg outline-none transition-colors focus:border-primary"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
        </div>

        {erro && (
          <p role="alert" className="rounded-control bg-danger-tint px-3 py-2 text-small text-danger">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="h-12 w-full rounded-control bg-primary font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
