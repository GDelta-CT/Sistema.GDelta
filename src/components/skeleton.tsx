/**
 * Skeletons — placeholders animados para estados de carregamento.
 * Componentes puramente visuais (sem estado/efeitos) → server-safe.
 * Toque premium: bloco em bg-surface-sunken com pulso contínuo
 * (Tailwind `animate-pulse`; a keyframe .gd-pulse do globals.css é um pop
 * 1x p/ o chip do semáforo, não um loop de loading) no lugar de
 * "Carregando…" textual. `animate-pulse` respeita prefers-reduced-motion
 * via a regra global de globals.css.
 *
 * Acessibilidade: a estrutura é decorativa (aria-hidden) e um único
 * <span class="sr-only"> anuncia "Carregando…" para leitores de tela.
 */

type SkeletonProps = {
  /** Classe de tamanho/forma (ex.: "h-4 w-32"). Define largura/altura aqui. */
  className?: string;
};

/**
 * Bloco base do skeleton: superfície rebaixada + cantos arredondados + pulso.
 * Use `className` para dimensionar (ex.: <Skeleton className="h-4 w-40" />).
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`block rounded-control bg-surface-sunken animate-pulse ${className ?? ''}`}
    />
  );
}

/**
 * Placeholder genérico de página do painel: cabeçalho skeleton + alguns
 * cards/linhas skeleton. Renderiza dentro do mesmo <main> de container das
 * telas reais para manter a mesma largura/padding (sem "pulo" no carregamento).
 *
 * `maxWidth` espelha a largura de conteúdo da tela (ex.: "max-w-5xl"); por
 * padrão usa "max-w-3xl", a largura mais comum no painel.
 */
export function PainelSkeleton({ maxWidth = 'max-w-3xl' }: { maxWidth?: string }) {
  return (
    <main
      aria-busy="true"
      className={`mx-auto w-full ${maxWidth} flex-1 px-4 py-8 sm:px-6`}
    >
      {/* Anúncio único e honesto para tecnologia assistiva. */}
      <span className="sr-only">Carregando…</span>

      {/* Cabeçalho: símbolo + título + ação. */}
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-card" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-pill" />
            <Skeleton className="h-7 w-40" />
          </div>
        </div>
        <Skeleton className="h-11 w-24" />
      </header>

      {/* Card de destaque (form/painel). */}
      <div className="mb-10 space-y-4 rounded-panel border border-border bg-surface-raised p-5 shadow-sm sm:p-6">
        <Skeleton className="h-3 w-28 rounded-pill" />
        <Skeleton className="h-11 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>

      {/* Lista: algumas linhas/cards skeleton. */}
      <div className="space-y-2">
        <Skeleton className="mb-3 h-5 w-44" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-xs"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-control" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-pill" />
          </div>
        ))}
      </div>
    </main>
  );
}
