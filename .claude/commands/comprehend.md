---
description: Compreende o basecode de um projeto brownfield - mapeia stack, design-language, pontos de extensão e riscos.
argument-hint: <path-do-projeto>
allowed-tools: Bash, Read, Grep, Glob, Agent
---

Compreenda o projeto brownfield em: $ARGUMENTS

Passos:
1. Resolva o path. Se vazio, use o diretório atual do projeto-alvo. Confirme que existe e não está vazio.
2. Faça o inventário inicial (ignore node_modules/.git/dist):
   !`find "$ARGUMENTS" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' | head -300`
3. Capture os manifests principais para dar contexto ao agente (package.json, etc.).
4. Dispare o agente `brownfield-cartographer` passando o path e o inventário. Peça o mapa do território completo com confiança graduada e chain of custody.
5. Reporte ao usuário o mapa (stack, design-language atual, pontos de extensão, riscos) e ofereça salvar em `.agents-guru/territory-map.md`.

Não altere nada no projeto analisado.
