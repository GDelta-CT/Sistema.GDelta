# design-systems/

Store de design systems do projeto — a fonte única de verdade. Um diretório por marca, sem arquivos soltos e sem duplicatas (a lição que aprendemos auditando o brandcraft, onde `uber.md` e `uber-com.md` divergiam fora de qualquer pasta canônica).

## Estrutura de cada design system

```
design-systems/<name>/
├── design-tokens.json   # tokens canônicos (validam no oklch-validate.ts)
├── design-system.md     # documento agêntico auto-suficiente (entrega primária)
├── tokens.css           # CSS custom properties prontas (geradas por ds-to-css.ts)
└── PROVENANCE.md         # fonte, data, método (dom|vision|synth), confiança, gaps
```

## O default

`default/` é a marca **Uber** (linguagem Uber Base). É o design system que os builds usam quando nenhum `--tokens` é passado.

## Como criar mais

- Extrair de um site ao vivo: `/extract-ds <url> <name>` (computed styles via browser real → `design-systems/<name>/`).
- Aplicar num build: `/apply-ds <name>` ou passe `--tokens design-systems/<name>/design-tokens.json` ao `/build-experience` / `/build-product`.

## Regra

Nada de `.md` solto de marca aqui na raiz. Toda marca vive em seu diretório com os 4 arquivos. O `doctor.ts` verifica a integridade do `default`.
