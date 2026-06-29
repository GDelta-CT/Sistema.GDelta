/**
 * Guarda de sessão consciente do MODO DEMO.
 *
 * As páginas do painel repetem o MESMO portão: ler a sessão do Supabase e, sem
 * ela, mandar para /login; com ela, carregar a tela. Este helper centraliza
 * EXATAMENTE esse portão, com um único ponto de bypass para a demo.
 *
 * - Modo normal (`DEMO === false`): comportamento IDÊNTICO ao original —
 *   `getSupabase().auth.getSession()`, redireciona em ausência de sessão e no
 *   `catch`. Byte-a-byte a mesma lógica que estava inline em cada página.
 * - Modo demo (`DEMO === true`): NÃO toca no Supabase. Resolve na hora com uma
 *   sessão fake (identidade `demo@gdelta.com.br`, oficina demo) e chama
 *   `onReady` — nenhum redirect, nenhuma chamada de rede.
 *
 * Mantém a assinatura "passe o router e o que rodar quando houver sessão", então
 * a troca em cada página é uma substituição 1:1 do bloco do `useEffect`.
 */

import { DEMO, DEMO_IDENTIDADE } from './mode';
import { getSupabase } from '@/lib/supabase/client';

/** Roteador mínimo que o helper usa (subset de `useRouter()`). */
type RouterLike = { replace: (href: string) => void };

/**
 * Forma mínima da sessão que as telas leem (`user.email`, `access_token`). Em
 * modo normal é a sessão real do Supabase (compatível por estrutura); em demo é
 * a sessão fake desta constante.
 */
export type SessaoLike = {
  access_token: string;
  user: { email: string | null };
};

/** Sessão fake da demo — identidade do fundador apresentando ao investidor. */
export const SESSAO_DEMO: SessaoLike = {
  // Token cosmético: em demo NENHUMA chamada autenticada acontece de verdade.
  access_token: 'demo-token',
  user: { email: DEMO_IDENTIDADE.email },
};

/**
 * Portão de sessão. Em demo, chama `onReady(SESSAO_DEMO)` imediatamente. Em modo
 * normal, replica o portão original do Supabase (redirect em ausência/erro).
 *
 * `onReady` recebe a sessão para os poucos casos que a usam (email/token); a
 * maioria das telas ignora o argumento e só dispara seu `carregar()`.
 */
export function guardarSessao(
  router: RouterLike,
  onReady: (sessao: SessaoLike) => void
): void {
  if (DEMO) {
    onReady(SESSAO_DEMO);
    return;
  }
  getSupabase()
    .auth.getSession()
    .then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      onReady(data.session as unknown as SessaoLike);
    })
    .catch(() => router.replace('/login'));
}

/**
 * Lê a sessão atual de forma consciente da demo (para fluxos imperativos, como
 * pegar o `access_token` antes de um fetch). Em demo devolve a sessão fake; em
 * modo normal, a sessão real do Supabase (ou `null`).
 */
export async function obterSessao(): Promise<SessaoLike | null> {
  if (DEMO) return SESSAO_DEMO;
  const { data } = await getSupabase().auth.getSession();
  return (data.session as unknown as SessaoLike) ?? null;
}

/**
 * Sair: em modo normal faz `signOut` real e vai para /login. Em demo não há
 * sessão real para encerrar — apenas volta para a home (a landing), preservando
 * a sensação de "saí do sistema" sem tocar no Supabase.
 */
export async function sair(router: RouterLike): Promise<void> {
  if (DEMO) {
    router.replace('/');
    return;
  }
  await getSupabase().auth.signOut();
  router.replace('/login');
}
