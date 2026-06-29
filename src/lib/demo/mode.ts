/**
 * MODO DEMONSTRAÇÃO — porteiro único.
 *
 * `DEMO` é `true` SOMENTE quando a env pública `NEXT_PUBLIC_DEMO` vale '1'.
 * Em produção/dev normal (env ausente ou diferente de '1'), `DEMO` é `false` e
 * NADA muda no app — todos os `if (DEMO)` ficam inertes e o caminho real do
 * Supabase (auth + dados) roda exatamente como hoje.
 *
 * Por que aqui e só aqui: ter uma constante única evita ler `process.env` solto
 * pelo código (e o risco de divergir a condição). Quem precisa do modo demo
 * importa `DEMO` desta fonte. A env precisa do prefixo `NEXT_PUBLIC_` para ser
 * inlinada no bundle do browser pelo Next — é o que permite o `if (DEMO)`
 * funcionar nos componentes "use client".
 *
 * 100% ADITIVO: este arquivo não tem efeito colateral; só expõe a flag.
 */

/** `true` apenas quando `NEXT_PUBLIC_DEMO === '1'`. Default seguro: `false`. */
export const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

/** Identidade fake usada nas telas em modo demo (sem login real). */
export const DEMO_IDENTIDADE = {
  email: 'demo@gdelta.com.br',
  oficinaId: 'demo-oficina-0001',
  oficinaNome: 'Auto Premium Demo',
} as const;
