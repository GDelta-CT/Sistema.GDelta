# Provenance — default (Uber)

- **Marca:** Uber · **linguagem:** Uber Base
- **Método:** `synth` — síntese a partir da linguagem pública Uber Base (preto/branco + Safety Blue + Uber Move), conferida com os tokens icônicos conhecidos. Não é um crawl ao vivo.
- **Data:** 2026-06-01
- **Confiança global:** High para os elementos icônicos (preto `#000`, branco `#fff`, Safety Blue `#276ef1`, semânticas, Uber Move). Moderate para os degraus finos do gray ramp e os tamanhos exatos de tipo (variam por superfície/versão).

## Caveats honestos

- **Marca registrada.** Logo/wordmark e a fonte Uber Move são proprietários da Uber. Este template documenta a linguagem para estudo/mockup; em entrega pública, troque por placeholder e fallback de fonte.
- **Contraste do Safety Blue.** `#276ef1` sobre branco atinge contraste de texto grande/UI, não de corpo. Para link em tamanho de corpo, o token recomenda `#1e54b7`. Isto é um limite real da marca, declarado, não um defeito do template.
- **Não é extração ao vivo.** Para sincronizar com o site atual: `/extract-ds https://uber.com default` (sobrescreve este diretório com método `dom`).

## Validação

- `oklch-validate.ts` nos `contrast_pairs` (hex): ver saída no log da última verificação.
- `tokens.css` gerado por `ds-to-css.ts` (não editar à mão).
