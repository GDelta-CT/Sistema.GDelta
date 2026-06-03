# Provenance — default (Graphite)

- **Marca:** Graphite (identidade original e neutra) · **linguagem:** monocromático + um acento índigo
- **Método:** `synth` — síntese original. Não deriva de nenhuma marca de terceiro nem de um crawl ao vivo.
- **Data:** 2026-06-02
- **Confiança global:** High para o esqueleto (preto `#0a0a0a`, branco `#fff`, acento índigo `#4f46e5`, semânticas) e para os pares de contraste validados. Os degraus finos do gray ramp são uma escala neutra padrão.

## Caveats honestos

- **Sem marca de terceiro.** Wordmark textual e fontes open-source (Space Grotesk, Manrope, ambas OFL). Nada proprietário embarcado, nada de trademark.
- **Contraste do acento.** `#4f46e5` sobre branco atinge contraste de texto grande/UI, não de corpo. Para link em tamanho de corpo, o token recomenda `#3730a3`. É um limite declarado, não um defeito.
- **É um default neutro, não uma identidade de marca.** Serve de fallback quando nenhum `--tokens` é passado. Para uma marca real: `/extract-ds <url> default` (sobrescreve este diretório com método `dom`).

## Validação

- `oklch-validate.ts` nos `contrast_pairs` (hex): ver saída no log da última verificação.
- `tokens.css` gerado por `ds-to-css.ts` (não editar à mão).
