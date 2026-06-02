'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Envelope, Lock, SignIn, WarningCircle } from '@phosphor-icons/react';
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
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,6vh,4rem)]">
      {/* Detalhe visual: brilho azul-aço da marca (decorativo, não interativo) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/3 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-pill bg-primary opacity-[0.07] blur-[120px] dark:opacity-[0.16]"
      />

      <form
        onSubmit={entrar}
        className="w-full max-w-sm space-y-7 rounded-panel border border-border bg-surface-raised p-8 shadow-xl sm:p-9"
      >
        <div className="flex flex-col items-center space-y-3 text-center">
          <BrandLogo className="mb-1 h-20" />
          <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1 text-overline font-display font-semibold uppercase tracking-[0.12em] text-fg-muted shadow-xs">
            <span aria-hidden="true" className="size-1.5 rounded-pill bg-primary" />
            Acesso ao painel
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-h2 text-fg">Entrar</h1>
            <p className="text-small text-fg-muted">A inteligência que faz sua oficina dar lucro.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-caption font-medium text-fg-muted">
              E-mail
            </label>
            <div className="relative">
              <Envelope
                aria-hidden="true"
                weight="duotone"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fg-subtle transition-colors"
              />
              <input
                id="email"
                className="h-12 w-full rounded-control border border-border bg-surface pl-10 pr-3 text-body text-fg outline-none transition-colors focus:border-primary"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="voce@oficina.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="senha" className="text-caption font-medium text-fg-muted">
              Senha
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                weight="duotone"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fg-subtle transition-colors"
              />
              <input
                id="senha"
                className="h-12 w-full rounded-control border border-border bg-surface pl-10 pr-3 text-body text-fg outline-none transition-colors focus:border-primary"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {erro && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-control bg-danger-tint px-3 py-2.5 text-small text-danger"
          >
            <WarningCircle aria-hidden="true" weight="fill" className="size-5 shrink-0" />
            <span>{erro}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary font-semibold text-on-primary shadow-sm transition-colors duration-150 ease-default hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
        >
          <SignIn aria-hidden="true" weight="bold" className="size-5" />
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
