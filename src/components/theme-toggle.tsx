'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';

/**
 * Alterna entre tema claro e escuro adicionando/removendo a classe `dark`
 * em <html> (mesmo gancho usado pelos tokens em globals.css) e persiste a
 * escolha em localStorage (chave 'tema' = 'dark' | 'light').
 *
 * A classe inicial já é definida pelo script anti-flash em layout.tsx, antes
 * do paint. Aqui só lemos o DOM em useEffect (nunca no render) para sincronizar
 * o estado visual sem causar mismatch de hidratação.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Pós-hidratação: sincroniza o estado com a classe que o anti-flash já aplicou.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    const root = document.documentElement;
    root.classList.toggle('dark', next);
    try {
      localStorage.setItem('tema', next ? 'dark' : 'light');
    } catch {
      // localStorage pode falhar (modo privado / bloqueio); a troca visual segue.
    }
    setIsDark(next);
  }

  const label = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-surface text-fg-muted shadow-sm transition-colors hover:bg-surface-raised hover:text-fg"
    >
      {isDark ? <Sun weight="bold" /> : <Moon weight="bold" />}
    </button>
  );
}
