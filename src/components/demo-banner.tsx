/**
 * Faixa fina de honestidade do MODO DEMO.
 *
 * Renderiza SOMENTE quando `DEMO` é verdadeiro (env `NEXT_PUBLIC_DEMO=1`); em
 * produção/dev normal devolve `null` e não ocupa nenhum espaço — 100% aditivo.
 *
 * Mensagem clara de que os dados são fictícios, para o investidor (e qualquer
 * pessoa) saber que é uma demonstração, não a operação real de uma oficina.
 *
 * Usa só tokens do design system (sem cor crua), discreta mas legível, com bom
 * contraste. Server-safe (sem estado/efeito).
 */

import { Sparkle } from '@phosphor-icons/react/dist/ssr';
import { DEMO } from '@/lib/demo/mode';

export function DemoBanner() {
  if (!DEMO) return null;
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-1.5 text-caption font-medium text-primary"
    >
      <Sparkle size={14} weight="fill" aria-hidden className="shrink-0" />
      <span>
        Modo demonstração{' '}
        <span className="text-primary/70">· dados fictícios, nada é salvo</span>
      </span>
    </div>
  );
}
