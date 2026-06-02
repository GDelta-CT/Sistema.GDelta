/**
 * Marca GDelta — assets oficiais (PNG transparente).
 * Componentes puramente visuais (sem estado/efeitos) → server-safe.
 * Dimensione SEMPRE pela altura (ex.: `h-12`); a largura usa `w-auto`
 * internamente para preservar a proporção original do arquivo.
 */

type BrandProps = {
  /** Classe de tamanho/posição. Defina a ALTURA aqui (ex.: "h-12"). */
  className?: string;
  /**
   * Texto alternativo. Quando o logo aparece ao lado de um texto que já
   * diz "GDelta", passe `alt=""` para tratá-lo como decorativo.
   */
  alt?: string;
};

/** Logo completo (símbolo + wordmark "G|DELTA" + tagline). Para hero/login. */
export function BrandLogo({ className, alt = 'GDelta' }: BrandProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/gdelta-logo.png"
      alt={alt}
      className={`w-auto select-none ${className ?? ''}`}
    />
  );
}

/** Símbolo/ícone isolado (o "G" com a seta-delta). Para cabeçalhos compactos. */
export function BrandMark({ className, alt = 'GDelta' }: BrandProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/gdelta-symbol.png"
      alt={alt}
      className={`w-auto select-none ${className ?? ''}`}
    />
  );
}
