# Matriz de verificação por modo

O que rodar para provar que um build funciona, por modo. Cada checagem é PASS/FAIL com evidência literal (comando + saída, ou erro de console).

## product (Next.js + shadcn)

| Checagem | Como | PASS quando |
|---|---|---|
| Dependências | `bun install` ou `npm ci` | sai 0 |
| Types | `bunx tsc --noEmit` | sem erro |
| Build | `next build` (ou `bunx next build`) | sai 0 |
| Lint | `next lint` / eslint | sem erro (warning é NEEDS, não FAIL) |
| Render | dev server + agent-browser na rota-chave | renderiza o conteúdo-alvo, console limpo |
| Cor / Perf | `oklch-validate.ts`, `perf-audit.ts` | passam (sem dep proibida, budget ok, contraste ok) |

## experience (HTML single-file)

| Checagem | Como | PASS quando |
|---|---|---|
| Abre | agent-browser abre o `.html` | carrega sem erro fatal |
| Console | capturar o console | zero erro (warning anotado) |
| Assets | aba network | nenhum 404 de asset referenciado |
| Render | inspecionar o DOM | o conteúdo principal e as seções existem |
| Motion | scroll programático | scrub bidirecional; respeita `prefers-reduced-motion` |
| Cor / Perf | `oklch-validate.ts`, `perf-audit.ts` | passam |

## service (backend / API)

| Checagem | Como | PASS quando |
|---|---|---|
| Dependências | gerenciador do projeto (`bun install`, `npm ci`, `pip install`, `go mod download`, etc.) | sai 0 |
| Types | typecheck do stack (`tsc --noEmit`, `mypy`, `go vet`, etc.) | sem erro |
| Build | build/compile do stack | sai 0 |
| Lint | linter do projeto | sem erro (warning é NEEDS) |
| Testes | suíte unit + integração | tudo verde; sem teste pulado mascarando falha |
| Smoke de API | sobe o serviço e bate nas rotas-chave (curl/cliente) | status e payload esperados; sem 5xx |
| Contrato | valida contra o schema/OpenAPI se houver | resposta casa o contrato |
| Secrets | grep por credencial hardcoded no diff | nenhuma |

## Regras

- Capture a SAÍDA, não a impressão. "Buildou" sem o exit code não é evidência.
- Se uma checagem não puder rodar (sem toolchain ou sem browser), marque BLOCKED com a razão — nunca PASS por omissão.
- Erro de console é FAIL, mesmo que a página "pareça ok".
- Não invente checagem que a tarefa não pediu (Simplicity First). Verifique o que importa para funcionar.
