---
description: Extrai um design system agêntico de um website ao vivo (computed styles via browser real) e salva em design-systems/<name>/.
argument-hint: <url> [name]
allowed-tools: Bash, Read, Write, Edit, Glob, Agent
---

Extraia o design system de: $ARGUMENTS

Passos:
1. Separe a URL do `name` opcional. Se não houver `name`, derive do hostname (ex.: `stripe.com` → `stripe`). Confirme que a URL é pública.
2. Pré-flight: cheque `command -v agent-browser`. Se ausente, avise e ofereça o escape hatch de visão (a partir de um screenshot que o usuário fornecer ou que o agent-browser capturar).
3. Dispare o agente `ds-extractor` com a URL e o name. Ele deve seguir o protocolo da skill `design-system-extractor`: recon → harvest (computed styles) → normalize → validate (APCA/gamut) → synthesize → emit.
4. Reporte ao usuário: os tokens principais (fg/bg/accent), a confiança global, os gaps, e o caminho `design-systems/<name>/`.
5. Ofereça aplicar com `/apply-ds <name>` num próximo build.

Tudo em `design-systems/<name>/` (fonte única, sem arquivos soltos). Não toque no projeto-alvo nem em `build-output/`.
