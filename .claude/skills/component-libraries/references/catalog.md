# Catálogo de bibliotecas de UI/UX (112)

> Arsenal de bibliotecas de UI/UX — as melhores de 2026 — referência de 2026-06. Bem aceitas e ativas em jan-jun 2026 (downloads npm da semana 25-31/mai/2026, stars, releases 2026). Verificado por pesquisa web. O pedido era ~100; entregamos 112 verificadas, todas vivas.

> Gerado por `lib-search.ts --md` a partir de `catalog.json` (fonte única; não editar à mão).

> CDN: cdn_esm = ESM moderno (esm.sh, pinado ao major). cdn_script = build UMD/IIFE para <script> via jsdelivr quando existe; null quando a lib exige bundler (React/headless/build-time).

## Gráficos / data-viz (10)

### ECharts — `echarts`
Biblioteca canvas/SVG completíssima para qualquer gráfico (linha, barra, mapa, heatmap, candlestick); use quando precisa de muitos tipos ou grandes volumes.
- ESM: `https://esm.sh/echarts@6`
- `<script>`: `https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js`
- Aceitação: ~3.16M downloads/sem; release 6.1.0 em mai/2026; 66k stars ativos
- Nota: Build pesado se importar tudo; prefira import modular

### Recharts — `recharts`
Gráficos declarativos como componentes React sobre D3; use em apps React de pequeno/médio porte sem configurar D3 na mão.
- ESM: `https://esm.sh/recharts@3`
- Aceitação: release 3.8 em 2026, push diário, 27k stars
- Nota: Só React; v3 removeu o build UMD

### Chart.js — `chart.js`
Biblioteca canvas leve e onipresente para os gráficos padrão; use como default pragmático em qualquer stack (com ou sem React via react-chartjs-2).
- ESM: `https://esm.sh/chart.js@4`
- `<script>`: `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js`
- Aceitação: ~11.6M downloads/sem; 67k stars; release 4.5.1 mai/2026

### ApexCharts — `apexcharts`
Gráficos SVG interativos e bonitos out-of-the-box (zoom, anotações, sparklines); use em dashboards com visual polido sem muito CSS.
- ESM: `https://esm.sh/apexcharts@5`
- `<script>`: `https://cdn.jsdelivr.net/npm/apexcharts@5/dist/apexcharts.min.js`
- Aceitação: ~1.8M downloads/sem; release 5.13 mai/2026
- Nota: SVG fica pesado com muitos pontos

### Nivo — `@nivo/core`
Componentes de chart React (SVG/Canvas/HTML) com design refinado e SSR; use quando quer gráficos lindos com pouca config em React.
- ESM: `https://esm.sh/@nivo/core@0.99`
- Aceitação: ~1.48M downloads/sem; 14k stars; push abr/2026
- Nota: Só React; pacotes separados por tipo (@nivo/bar, @nivo/line)

### visx — `@visx/visx`
Primitivos de baixo nível da Airbnb (escalas, eixos, shapes D3) como componentes React; use para visualizações 100% customizadas.
- ESM: `https://esm.sh/@visx/visx@3`
- Aceitação: 20.8k stars; push abr/2026
- Nota: Só React; é toolkit, não solução pronta

### Observable Plot — `@observablehq/plot`
API declarativa de alto nível sobre D3 (gramática de marks); use para gráficos exploratórios concisos sem o boilerplate do D3.
- ESM: `https://esm.sh/@observablehq/plot@0`
- `<script>`: `https://cdn.jsdelivr.net/npm/@observablehq/plot@0/dist/plot.umd.min.js`
- Aceitação: ~350k downloads/sem; push mai/2026
- Nota: Ainda 0.x; menos interatividade pronta que ECharts

### D3 — `d3`
O canivete suíço de visualização (escalas, seleções, layouts, geo, força); use para os 10% de visualizações sob medida que nenhuma lib pronta entrega.
- ESM: `https://esm.sh/d3@7`
- `<script>`: `https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js`
- Aceitação: ~12.5M downloads/sem; 113k stars; push mai/2026
- Nota: Baixo nível, curva alta

### TradingView Lightweight Charts — `lightweight-charts`
Charts financeiros HTML5 minúsculos e rapidíssimos (candlestick, área); use para séries temporais de preços/crypto com bundle enxuto.
- ESM: `https://esm.sh/lightweight-charts@5`
- `<script>`: `https://cdn.jsdelivr.net/npm/lightweight-charts@5/dist/lightweight-charts.standalone.production.js`
- Aceitação: ~655k downloads/sem; release 5.2 abr/2026
- Nota: Só dados financeiros; não serve para pizza/radar

### uPlot — `uplot`
Séries temporais ultrarrápida e leve (~50KB) em canvas; use para milhões de pontos com performance máxima.
- ESM: `https://esm.sh/uplot@1`
- `<script>`: `https://cdn.jsdelivr.net/npm/uplot@1/dist/uPlot.iife.min.js`
- Aceitação: ~379k downloads/sem; 10k stars; push abr/2026
- Nota: Só gráficos x/y, sem extras

## Tabelas / data grid (3)

### TanStack Table — `@tanstack/react-table`
Lógica de tabela headless e framework-agnóstica (sort, filtro, paginação) sem UI imposta; use quando quer controle total do markup.
- ESM: `https://esm.sh/@tanstack/react-table@8`
- Aceitação: ~13M downloads/sem; 28k stars; push diário
- Nota: Headless: você escreve toda a renderização

### AG Grid — `ag-grid-community`
Data grid enterprise com edição inline, copy-paste, agrupamento; use quando precisa de planilha estilo Excel no navegador.
- ESM: `https://esm.sh/ag-grid-community@35`
- `<script>`: `https://cdn.jsdelivr.net/npm/ag-grid-community@35/dist/ag-grid-community.min.js`
- Aceitação: ~2.49M downloads/sem; release 35.3 jun/2026
- Nota: Pesado; pivot só na versão Enterprise paga

### Glide Data Grid — `@glideapps/glide-data-grid`
Data grid React em canvas, extremamente rápido com render rico e a11y; use para milhões de células com scroll fluido.
- ESM: `https://esm.sh/@glideapps/glide-data-grid@6`
- Aceitação: ~328k downloads/sem; 5.2k stars; push jan/2026
- Nota: Só React

## Grafos / redes (3)

### Cytoscape.js — `cytoscape`
Teoria de grafos com visualização, layouts e algoritmos (caminhos, centralidade); use para análise de redes além de só desenhar.
- ESM: `https://esm.sh/cytoscape@3`
- `<script>`: `https://cdn.jsdelivr.net/npm/cytoscape@3/dist/cytoscape.min.js`
- Aceitação: ~8.1M downloads/sem; 11k stars; push jun/2026
- Nota: Canvas degrada acima de poucos milhares de nós (use Sigma para grafos enormes)

### Sigma.js — `sigma`
Renderizador de grafos em WebGL focado em performance; use para redes grandes (100k+ nós) com GPU, pareado com graphology.
- ESM: `https://esm.sh/sigma@3`
- `<script>`: `https://cdn.jsdelivr.net/npm/sigma@3/dist/sigma.min.js`
- Aceitação: ~160k downloads/sem; 12k stars; release 3.0.3 mai/2026
- Nota: Só renderiza; precisa de graphology para o modelo de dados

### AntV G6 — `@antv/g6`
Framework de visualização de grafos da Ant Group com layouts, interações e análise prontos; use para diagramas de rede ricos.
- ESM: `https://esm.sh/@antv/g6@5`
- `<script>`: `https://cdn.jsdelivr.net/npm/@antv/g6@5/dist/g6.min.js`
- Aceitação: ~212k downloads/sem; 12k stars; release 5.1 mai/2026
- Nota: Parte da doc/comunidade é em chinês

## Fluxo / node-based (2)

### React Flow (xyflow) — `@xyflow/react`
Líder para editores node-based e fluxogramas em React (drag de nós, zoom/pan, handles, minimap); use para workflow builders e pipelines visuais.
- ESM: `https://esm.sh/@xyflow/react@12`
- Aceitação: ~6.18M downloads/sem; 37k stars; release 12.11 jun/2026
- Nota: Só React (há @xyflow/svelte para Svelte); 'reactflow' é legado, use @xyflow/react

### Rete.js — `rete`
Framework TS-first para editores node-based orientados a processamento (nós que executam lógica); use quando os nós executam, não só desenham.
- ESM: `https://esm.sh/rete@2`
- Aceitação: ~45k downloads/sem; 12k stars; release 2.0.6 mai/2026
- Nota: Arquitetura por plugins; curva maior

## Animação / motion (7)

### Motion — `motion`
Animação declarativa para React e JS puro (gestos, layout, scroll-linked); a líder de animação/microinteração do ecossistema.
- ESM: `https://esm.sh/motion@12`
- `<script>`: `https://cdn.jsdelivr.net/npm/motion@12/+esm`
- Aceitação: ~12.3M downloads/sem; 32k stars; v12 ativa 2026
- Nota: Import mudou de 'framer-motion' para 'motion/react'

### GSAP — `gsap`
Engine de animação de alta performance (timelines, SVG, ScrollTrigger, morphing) agnóstica de framework; padrão para coreografia timeline-based.
- ESM: `https://esm.sh/gsap@3`
- `<script>`: `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js`
- Aceitação: 100% gratuito desde 2025 (todos os plugins liberados); release 3.13 em 2026
- Nota: ScrollTrigger sempre com scrub, nunca toggleActions (ver prohibitions do projeto)

### AutoAnimate — `@formkit/auto-animate`
Utilitário zero-config que adiciona transições suaves a qualquer mudança de DOM com uma linha; use para listas/elementos que adicionam/removem.
- ESM: `https://esm.sh/@formkit/auto-animate@0.9.0`
- `<script>`: `https://cdn.jsdelivr.net/npm/@formkit/auto-animate@0.9.0/index.min.js`
- Aceitação: 13.6k stars; bindings React/Vue/Solid/Svelte
- Nota: Só add/remove/move; para coreografia use Motion

### anime.js — `animejs`
Engine de animação JS leve para CSS, SVG, DOM e objetos, com API de timeline na v4; use para animações vanilla precisas.
- ESM: `https://esm.sh/animejs@4`
- `<script>`: `https://cdn.jsdelivr.net/npm/animejs@4/lib/anime.iife.min.js`
- Aceitação: 65k stars; v4.3 mantida em 2026

### lottie-web — `lottie-web`
Renderiza animações do After Effects (Bodymovin) em SVG/Canvas/HTML; use para animações vetoriais leves de designers.
- ESM: `https://esm.sh/lottie-web@5`
- `<script>`: `https://cdn.jsdelivr.net/npm/lottie-web@5/build/player/lottie.min.js`
- Aceitação: ~1.2M+ downloads/sem; 31k stars
- Nota: Para dotLottie/state machines modernos, use dotLottie

### dotLottie Web — `@lottiefiles/dotlottie-web`
Player oficial LottieFiles (core Rust+WASM) para Lottie e .lottie com backends Software/WebGL2/WebGPU; use para Lottie moderno com theming e state machines.
- ESM: `https://esm.sh/@lottiefiles/dotlottie-web@0.74.0`
- `<script>`: `https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.74.0/+esm`
- Aceitação: ~464k downloads/sem; releases diárias jun/2026
- Nota: Projeto novo (poucas stars), mas oficial e em forte crescimento

### Rive — `@rive-app/canvas`
Runtime web para animações interativas e state machines criadas no editor Rive; alternativa interativa ao Lottie.
- ESM: `https://esm.sh/@rive-app/canvas@2`
- `<script>`: `https://cdn.jsdelivr.net/npm/@rive-app/canvas@2/+esm`
- Aceitação: ~134k downloads/sem; releases jun/2026
- Nota: Wrapper React é @rive-app/react-canvas

## 3D / WebGL (5)

### Three.js — `three`
Biblioteca 3D de referência para WebGL/WebGPU: cenas, materiais, luzes, loaders, pós-processamento; dominante absoluto em 3D web.
- ESM: `https://esm.sh/three@0.180`
- `<script>`: `https://cdn.jsdelivr.net/npm/three@0.180/build/three.module.min.js`
- Aceitação: ~2.7M downloads/sem; 112k stars; WebGPURenderer drop-in, releases mensais 2026
- Nota: ES module; UMD clássico descontinuado (use <script type=module>)

### React Three Fiber — `@react-three/fiber`
Renderer React para Three.js, descrevendo cenas 3D declarativamente via componentes e hooks; padrão para 3D em apps React.
- ESM: `https://esm.sh/@react-three/fiber@9`
- Aceitação: v9.6 (React 19) 2026; ecossistema pmndrs ativo
- Nota: Só React

### @react-three/drei — `@react-three/drei`
Helpers e abstrações prontos (controles, loaders, shaders, ambientes) para React Three Fiber; companheiro indispensável do R3F.
- ESM: `https://esm.sh/@react-three/drei@10`
- Aceitação: ~515k downloads/sem; v10.7
- Nota: Só React

### Babylon.js — `@babylonjs/core`
Engine 3D/jogos completa com WebGL e WebGPU nativos (GLSL+WGSL), física e editor; a mais completa depois do Three.js.
- ESM: `https://esm.sh/@babylonjs/core@8`
- `<script>`: `https://cdn.jsdelivr.net/npm/babylonjs@8/babylon.min.js`
- Aceitação: Babylon 8 (2025) WebGPU sem conversão; core já em 9.x em jun/2026
- Nota: 'babylonjs' (UMD) e '@babylonjs/core' (ESM) coexistem

### TresJS — `@tresjs/core`
Renderer customizado do Vue para construir cenas Three.js declarativamente com componentes Vue; o 'R3F do Vue'.
- ESM: `https://esm.sh/@tresjs/core@5`
- Aceitação: v5.8 em 2026; ~3.5k stars, ativamente mantido
- Nota: Nicho Vue, menor que R3F

## Canvas / whiteboard (6)

### tldraw — `tldraw`
SDK de whiteboard/infinite canvas em React, pronto para colaboração em tempo real; líder em SDK de canvas para produtos.
- ESM: `https://esm.sh/tldraw@4`
- Aceitação: 47k stars; v4.0 em 2026 com WCAG 2.2 AA, releases mensais
- Nota: Licença própria (não MIT); marca d'água removível via licença paga; só React

### Excalidraw — `@excalidraw/excalidraw`
Whiteboard com estética desenhada à mão, embutível como componente React; padrão para diagramas hand-drawn.
- ESM: `https://esm.sh/@excalidraw/excalidraw@0.18`
- Aceitação: 123k stars; desenvolvimento ativo 2026
- Nota: Só React; ainda 0.x (API pode mudar)

### Fabric.js — `fabric`
Framework de canvas com objetos interativos, serialização e edição; ideal para editores de design 2D.
- ESM: `https://esm.sh/fabric@7`
- `<script>`: `https://cdn.jsdelivr.net/npm/fabric@7/dist/index.min.js`
- Aceitação: ~470k downloads/sem; 31k stars; v7 em 2026
- Nota: Pacote é 'fabric' (o antigo 'fabric.js' é legado)

### Konva — `konva`
Framework de canvas 2D com camadas, eventos e drag-and-drop, com integrações React/Vue/Svelte; melhor para UIs 2D interativas.
- ESM: `https://esm.sh/konva@10`
- `<script>`: `https://cdn.jsdelivr.net/npm/konva@10/konva.min.js`
- Aceitação: ~870k downloads/sem; 14k stars; v10 (react-konva ~936k/sem)

### Pixi.js — `pixi.js`
Renderer 2D acelerado por GPU (WebGL/WebGPU) para jogos e gráficos de alta taxa de quadros; líder em 2D de alta performance.
- ESM: `https://esm.sh/pixi.js@8`
- `<script>`: `https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js`
- Aceitação: ~403k downloads/sem; 47k stars; v8.16 jun/2026

### p5.js — `p5`
Plataforma de creative coding para arte generativa, visualização e ensino, com API acessível; referência em creative coding.
- ESM: `https://esm.sh/p5@2`
- `<script>`: `https://cdn.jsdelivr.net/npm/p5@2/lib/p5.min.js`
- Aceitação: 24k stars; v2.2 em 2026
- Nota: v2 traz breaking changes vs 1.x

## Scroll (1)

### Lenis — `lenis`
Smooth scroll leve (~3KB) que preserva position:sticky e integra com GSAP; padrão atual de smooth scroll.
- ESM: `https://esm.sh/lenis@1`
- `<script>`: `https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js`
- Aceitação: Mantida pela Darkroom Engineering; v1.3, guia Next 15/16 abr/2026
- Nota: SCROLL-HIJACKING: quebra a barra nativa e prejudica acessibilidade; o projeto frontend-guru PROÍBE em builds. Catalogado por conhecimento, não para uso em produção

## Design systems / componentes (9)

### shadcn/ui — (sem pacote npm)
Componentes React copy-paste sobre Tailwind + Radix/Base UI, com código que você possui e edita; o default para novos projetos React.
- Aceitação: ~115k stars; CLI v4 mar/2026 (registry, Base UI)
- Nota: Não é pacote npm — é CLI/registry: 'npx shadcn@latest add <componente>'. Sem CDN. Requer Tailwind + Radix/Base UI

### Mantine — `@mantine/core`
Biblioteca React completa com 100+ componentes, hooks e theming, focada em produtividade e DX.
- ESM: `https://esm.sh/@mantine/core@8`
- Aceitação: 1.81M downloads/sem (25-31 mai/2026); lib React de maior crescimento por 2 anos
- Nota: Pensada para bundler; CDN não é o caminho suportado

### MUI (Material UI) — `@mui/material`
Design system Material com o maior conjunto de componentes React enterprise e theming extensivo.
- ESM: `https://esm.sh/@mui/material@7`
- Aceitação: 8.74M downloads/sem (25-31 mai/2026); 93k stars; lançou Base UI 1.0 fev/2026
- Nota: Requer @emotion/react e @emotion/styled; bundle pesado

### Chakra UI — `@chakra-ui/react`
Biblioteca React acessível e componível com design tokens e ótima DX.
- ESM: `https://esm.sh/@chakra-ui/react@3`
- Aceitação: 1.48M downloads/sem (25-31 mai/2026); v3 sobre Ark UI/Panda
- Nota: v3 mudou a API vs v2; confira a major ao copiar exemplos

### HeroUI — `@heroui/react`
Biblioteca React moderna e bonita por padrão (ex-NextUI), sobre Tailwind e React Aria.
- ESM: `https://esm.sh/@heroui/react`
- Aceitação: 463k downloads/sem (25-31 mai/2026); rebrand NextUI consolidado; v3 anunciada 2026
- Nota: Pacotes @nextui-org/* deprecados; use @heroui

### daisyUI — `daisyui`
Plugin de componentes para Tailwind via classes semânticas (btn, card), framework-agnóstico e sem JS.
- ESM: `https://esm.sh/daisyui@5`
- `<script>`: `https://cdn.jsdelivr.net/npm/daisyui@latest/daisyui.css`
- Aceitação: 678k downloads/sem (25-31 mai/2026); 38k stars; v5 compatível com Tailwind v4
- Nota: É plugin CSS de Tailwind, não componentes JS

### Flowbite — `flowbite`
Componentes e blocos UI sobre Tailwind, com versões vanilla JS e para frameworks.
- ESM: `https://esm.sh/flowbite@3`
- `<script>`: `https://cdn.jsdelivr.net/npm/flowbite@latest/dist/flowbite.min.js`
- Aceitação: 541k downloads/sem core + 150k/sem flowbite-react (25-31 mai/2026); v3 Tailwind v4
- Nota: Core é vanilla; para React use flowbite-react

### Skeleton — `@skeletonlabs/skeleton`
Design system adaptativo para Svelte + Tailwind, construído sobre Zag.js.
- ESM: `https://esm.sh/@skeletonlabs/skeleton@4`
- Aceitação: 44.9k downloads/sem (25-31 mai/2026); v4.15 (Zag.js + Tailwind v4)
- Nota: Nicho Svelte

### Web Awesome — `@awesome.me/webawesome`
Biblioteca de web components framework-agnóstica (ex-Shoelace), do time do Font Awesome; use em qualquer stack ou sem framework.
- ESM: `https://esm.sh/@awesome.me/webawesome`
- `<script>`: `https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3/dist/webawesome.loader.js`
- Aceitação: 25.9k downloads/sem (25-31 mai/2026); v3.6; sucessor oficial do Shoelace
- Nota: Shoelace descontinuado; tem tier Pro pago

## Headless / primitivos (7)

### Radix UI Primitives — `radix-ui`
Primitivos React unstyled e acessíveis (Dialog, Dropdown, Tabs, Popover) com foco em ARIA e teclado; base do shadcn/ui.
- ESM: `https://esm.sh/radix-ui`
- Aceitação: react-dialog sozinho ~52M downloads/sem (25-31 mai/2026); o headless mais usado em React
- Nota: Pacote unificado 'radix-ui' ou um pacote por componente

### Base UI — `@base-ui/react`
Componentes React unstyled e hooks de baixo nível dos criadores de Radix, Floating UI e MUI.
- ESM: `https://esm.sh/@base-ui/react`
- Aceitação: 5.21M downloads/sem (25-31 mai/2026); 1.0 estável fev/2026 (35 componentes), já v1.5
- Nota: Nome mudou: o antigo @base-ui-components/react está congelado, use @base-ui/react

### React Aria Components — `react-aria-components`
Componentes e hooks da Adobe com a acessibilidade e i18n mais rigorosas do ecossistema React; base do HeroUI.
- ESM: `https://esm.sh/react-aria-components`
- Aceitação: 2.73M downloads/sem (25-31 mai/2026); atualizações ativas da Adobe em 2026
- Nota: Curva mais alta por compor hooks

### Ark UI — `@ark-ui/react`
Primitivos headless multi-framework (React, Vue, Solid) com lógica em máquinas de estado (Zag.js); base do Chakra v3 e Park UI.
- ESM: `https://esm.sh/@ark-ui/react`
- Aceitação: 777k downloads/sem (25-31 mai/2026); cresceu muito em 2026
- Nota: Pacotes separados por framework

### Zag.js — `@zag-js/react`
Máquinas de estado finitas para UI components, o núcleo de lógica que alimenta Ark UI, Chakra v3 e Skeleton.
- ESM: `https://esm.sh/@zag-js/react`
- Aceitação: 869k downloads/sem no adapter React (25-31 mai/2026)
- Nota: Baixo nível — a maioria consome via Ark UI

### Bits UI — `bits-ui`
Primitivos headless e acessíveis para Svelte, a camada de componentes sobre Melt UI; líder headless do mundo Svelte 5.
- Aceitação: 648k downloads/sem (25-31 mai/2026); v2.18
- Nota: Exclusivo Svelte; sem CDN utilizável — esm.sh não compila componentes .svelte (HTTP 500). Instale via npm/SvelteKit

### Kobalte — `@kobalte/core`
Toolkit de componentes unstyled e acessíveis (WAI-ARIA) para SolidJS, com plugin Tailwind dedicado.
- ESM: `https://esm.sh/@kobalte/core`
- Aceitação: 212k downloads/sem (25-31 mai/2026); referência headless do SolidJS
- Nota: Exclusivo SolidJS

## Blocos / efeitos (copy-paste) (3)

### Magic UI — (sem pacote npm)
50+ componentes animados e efeitos visuais copy-paste para design engineers, sobre Tailwind + Motion; popular para landing pages.
- Aceitação: ~19k stars; mesmo fluxo copy-paste do shadcn
- Nota: Não é runtime npm — registry copy-paste. Sem CDN. Requer Tailwind + Motion

### Aceternity UI — (sem pacote npm)
Componentes Tailwind + Motion de alto impacto visual (cards 3D, beams, efeitos), copy-paste; referência para hero sections.
- Aceitação: ~28k stars
- Nota: Não é pacote npm — copy-paste do site. Sem CDN. Requer Tailwind + Motion

### React Bits — (sem pacote npm)
Componentes animados copy-paste para texto/efeitos em landing pages, em vários estilos; ponto de partida default para efeitos de texto.
- Aceitação: ~37k stars; forte momentum 2026
- Nota: Não é runtime npm. O pacote 'react-bits' no npm é projeto diferente — não use. Sem CDN

## Ícones (5)

### Lucide — `lucide-react`
Ícones SVG limpos e consistentes (fork do Feather), o default do ecossistema shadcn/ui.
- ESM: `https://esm.sh/lucide-react`
- `<script>`: `https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js`
- Aceitação: 78.9M downloads/sem no lucide-react (25-31 mai/2026); o icon set mais usado
- Nota: Pacotes por framework; <script> usa o build 'lucide' vanilla

### Tabler Icons — `@tabler/icons-react`
5.900+ ícones SVG MIT em grid 24x24 e traço 2px, fortes em dashboards e interfaces data-heavy.
- ESM: `https://esm.sh/@tabler/icons-react`
- Aceitação: 2.02M downloads/sem (25-31 mai/2026)
- Nota: Pacotes por framework

### Phosphor Icons — `@phosphor-icons/react`
9.000+ ícones em seis pesos (thin a duotone) para hierarquia visual flexível.
- ESM: `https://esm.sh/@phosphor-icons/react`
- `<script>`: `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2/src/regular/style.css`
- Aceitação: 1.78M downloads/sem (25-31 mai/2026)
- Nota: Para <script> use @phosphor-icons/web (web font)

### Heroicons — `@heroicons/react`
Ícones SVG da Tailwind Labs em outline e solid, pareados com Tailwind UI.
- ESM: `https://esm.sh/@heroicons/react`
- Aceitação: 4.38M downloads/sem (25-31 mai/2026)
- Nota: Coleção menor (~1.3k); sub-imports por estilo

### Iconify — `@iconify/react`
Framework unificado para 200.000+ ícones de 150+ sets sob uma só API; use quando quer múltiplos sets juntos.
- ESM: `https://esm.sh/@iconify/react`
- `<script>`: `https://cdn.jsdelivr.net/npm/iconify-icon/dist/iconify-icon.min.js`
- Aceitação: 680k downloads/sem no @iconify/react (25-31 mai/2026)
- Nota: Carrega via API on-demand por padrão (considere bundle offline em produção)

## Styling / CSS (6)

### Tailwind CSS — `tailwindcss`
Engine utility-first de CSS, o padrão de facto para estilização de UI moderna.
- ESM: `https://esm.sh/tailwindcss@4`
- `<script>`: `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`
- Aceitação: Líder absoluto; v4 reescrita em Rust (rebuilds 3.5x+ mais rápidos)
- Nota: v4 é CSS-first (@theme) vs v3 (tailwind.config.js); em produção use o build, não o @tailwindcss/browser

### UnoCSS — `unocss`
Engine CSS atômica on-demand, instantânea e customizável, com presets compatíveis com Tailwind; forte no ecossistema Vue/Vite.
- ESM: `https://esm.sh/unocss`
- `<script>`: `https://cdn.jsdelivr.net/npm/@unocss/runtime`
- Aceitação: 334k downloads/sem (25-31 mai/2026); ~10ms hot reload
- Nota: Para <script> use @unocss/runtime (avalia no browser)

### Panda CSS — `@pandacss/dev`
CSS-in-JS zero-runtime build-time com tokens e recipes type-safe; motor de styling do Chakra v3 e Park UI.
- Aceitação: 308k downloads/sem (25-31 mai/2026); crescimento ~150% em 2 anos
- Nota: Build-time — sem CDN/runtime no browser

### Vanilla Extract — `@vanilla-extract/css`
Stylesheets em TypeScript com zero runtime e escopo local, gerando CSS estático no build; para design systems type-safe.
- Aceitação: 2.01M downloads/sem (25-31 mai/2026)
- Nota: Build-time — requer integração com bundler; sem CDN

### StyleX — `@stylexjs/stylex`
CSS-in-JS atômico da Meta, compilado ahead-of-time, com runtime quase nulo (alimenta Facebook/Instagram).
- Aceitação: 470k downloads/sem (25-31 mai/2026)
- Nota: Build-time — exige plugin de compilação; sem CDN

### Open Props — `open-props`
Conjunto de CSS custom properties (design tokens) prontas — cores, espaçamentos, sombras, easings — sem framework.
- ESM: `https://esm.sh/open-props`
- `<script>`: `https://cdn.jsdelivr.net/npm/open-props/open-props.min.css`
- Aceitação: 21k downloads/sem (25-31 mai/2026); leve e agnóstico
- Nota: Entrega só variáveis CSS, não componentes nem utilities

## Markdown (5)

### react-markdown — `react-markdown`
Renderiza Markdown como componentes React de forma segura, sem dangerouslySetInnerHTML; ecossistema remark/rehype.
- ESM: `https://esm.sh/react-markdown@10`
- Aceitação: ~23M downloads/sem em 2026
- Nota: Precisa de bundler/JSX

### markdown-it — `markdown-it`
Parser/renderizador de Markdown extensível por plugins, agnóstico de framework, com saída HTML.
- ESM: `https://esm.sh/markdown-it@14`
- `<script>`: `https://cdn.jsdelivr.net/npm/markdown-it@14/dist/markdown-it.min.js`
- Aceitação: ~23M downloads/sem em 2026; padrão para parsing extensível
- Nota: Não sanitiza HTML embutido por padrão

### marked — `marked`
Parser de Markdown focado em velocidade, com API mínima para converter Markdown em HTML.
- ESM: `https://esm.sh/marked@18`
- `<script>`: `https://cdn.jsdelivr.net/npm/marked@18/lib/marked.umd.js`
- Aceitação: ~44M downloads/sem (o mais baixado do cluster); v18 mai/2026
- Nota: Sem sanitização nativa; use DOMPurify para conteúdo não confiável

### MDX — `@mdx-js/mdx`
Permite usar componentes JSX dentro de Markdown, compilando .mdx para módulos; padrão para docs e blogs em React/Next/Astro.
- ESM: `https://esm.sh/@mdx-js/mdx@3`
- Aceitação: v3.1 estável; @mdx-js/loader ~803k downloads/sem; repo ativo abr/2026
- Nota: Requer etapa de build

### Streamdown — `streamdown`
Renderizador de Markdown React desenhado para streaming de saída de IA, lidando com blocos não terminados; drop-in para react-markdown em apps de IA.
- ESM: `https://esm.sh/streamdown@2`
- Aceitação: Lançado pela Vercel; v2.5 jun/2026 (KaTeX, Shiki, Mermaid)
- Nota: Específico React + streaming

## Syntax highlight (1)

### Shiki — `shiki`
Realça sintaxe de código usando gramáticas e temas TextMate, o mesmo motor do VS Code; base de Streamdown, Astro e docs modernas.
- ESM: `https://esm.sh/shiki@4`
- `<script>`: `https://cdn.jsdelivr.net/npm/shiki@4/+esm`
- Aceitação: v4.1 mai/2026; usado por 1681+ projetos
- Nota: Mais pesado que Prism; use a build fine-grained

## Editores rich-text (5)

### Tiptap — `@tiptap/react`
Framework headless de editor rich-text sobre ProseMirror, com API de extensões para React/Vue.
- ESM: `https://esm.sh/@tiptap/react@3`
- Aceitação: Tiptap 3.0 estável; org @tiptap ~9.5M downloads/mês; @tiptap/react v3.24 jun/2026
- Nota: Headless — você monta a UI; collab/Pro são pagos

### Lexical — `lexical`
Framework de editor de texto extensível do Meta, com foco em confiabilidade, acessibilidade e performance; escolha de alta escala.
- ESM: `https://esm.sh/lexical@0.44`
- Aceitação: v0.44 abr/2026; ~3.3M downloads/sem
- Nota: Ainda pré-1.0 (0.x): API pode quebrar entre minors

### BlockNote — `@blocknote/core`
Editor rich-text baseado em blocos estilo Notion, pronto para uso, sobre ProseMirror e Tiptap.
- ESM: `https://esm.sh/@blocknote/core@0.46`
- Aceitação: ~9.8k stars; releases até mai/2026; nicho block-based crescendo
- Nota: Volume modesto vs Tiptap/Lexical; MPL-2.0

### ProseMirror — `prosemirror-view`
Toolkit de baixo nível para construir editores WYSIWYM, base de Tiptap e BlockNote.
- ESM: `https://esm.sh/prosemirror-view@1`
- Aceitação: ~6.9M downloads/mês; 912+ projetos dependentes
- Nota: API verbosa; a maioria usa via Tiptap/BlockNote

### Milkdown — `@milkdown/core`
Framework de editor WYSIWYG Markdown plugin-driven, onde cada estado equivale a um Markdown.
- ESM: `https://esm.sh/@milkdown/core@7`
- Aceitação: v7.21 mai/2026; preset @milkdown/crepe ativo
- Nota: Ecossistema menor que Tiptap

## Terminal / TUI (3)

### xterm.js — `@xterm/xterm`
Emulador completo de terminal xterm no navegador, base de VS Code e muitas IDEs web; padrão de fato para terminais web.
- ESM: `https://esm.sh/@xterm/xterm@6`
- `<script>`: `https://cdn.jsdelivr.net/npm/@xterm/xterm@6/lib/xterm.min.js`
- Aceitação: v6.0 dez/2025 (output sincronizado DEC 2026, WebGL shadow DOM)
- Nota: Pacote migrou de 'xterm' para '@xterm/xterm'; importe o xterm.css à parte

### Ink — `ink`
React para apps de linha de comando interativos, usando Flexbox (Yoga) para layout no terminal; base de muitas CLIs modernas.
- ESM: `https://esm.sh/ink@7`
- Aceitação: v7.0.5 mai/2026; 5704+ projetos dependentes
- Nota: Roda em Node/terminal, não no browser

### asciinema-player — `asciinema-player`
Player web de gravações de sessão de terminal (.cast), leve e baseado em texto; para embutir demos de terminal em docs/blogs.
- ESM: `https://esm.sh/asciinema-player@3`
- `<script>`: `https://cdn.jsdelivr.net/npm/asciinema-player@3/dist/bundle/asciinema-player.min.js`
- Aceitação: v3.15 abr/2026 (JS + Rust/WASM)
- Nota: Reproduz gravações, não é terminal interativo; requer o CSS do player

## Estado (7)

### Zustand — `zustand`
Store de estado minimalista baseada em hooks para React, sem boilerplate nem provider; líder disparado de state em React.
- ESM: `https://esm.sh/zustand@5`
- Aceitação: ~24.5M downloads/sem em 2026, superando Redux Toolkit
- Nota: Para máquinas de estado complexas, XState pode ser melhor

### Jotai — `jotai`
Gerência de estado atômica e bottom-up para React, com átomos componíveis e store usável fora do React.
- ESM: `https://esm.sh/jotai@2`
- Aceitação: v2.20 mai/2026; 21k stars; ~2.2M downloads/sem
- Nota: Modelo atômico tem curva diferente de Zustand

### Nanostores — `nanostores`
Stores atômicas minúsculas (~300 bytes) e agnósticas de framework, para React, Vue, Svelte e Astro; default em Astro islands.
- ESM: `https://esm.sh/nanostores@1`
- Aceitação: v1.3 mai/2026
- Nota: Foco em casos leves, não apps monolíticos grandes

### TanStack Query — `@tanstack/react-query`
Gerência de estado de servidor: cache, sincronização, revalidação e mutações de dados assíncronos; padrão absoluto para data-fetching em React.
- ESM: `https://esm.sh/@tanstack/react-query@5`
- Aceitação: ~12M downloads/sem; v5.100 mai/2026
- Nota: É estado de servidor, não substitui store de cliente

### Redux Toolkit — `@reduxjs/toolkit`
Toolset oficial e opinativo do Redux, com slices, RTK Query e DevTools para apps grandes.
- ESM: `https://esm.sh/@reduxjs/toolkit@2`
- `<script>`: `https://cdn.jsdelivr.net/npm/@reduxjs/toolkit@2/+esm`
- Aceitação: ~5.5-9.8M downloads/sem; ainda padrão em apps enterprise
- Nota: Em declínio relativo vs Zustand; v2 removeu o build UMD — cdn_script é o módulo ESM do jsdelivr (use <script type=module>)

### XState — `xstate`
Máquinas de estado e statecharts para modelar lógica complexa com estados, transições e guardas explícitos.
- ESM: `https://esm.sh/xstate@5`
- `<script>`: `https://cdn.jsdelivr.net/npm/xstate@5/dist/xstate.umd.min.js`
- Aceitação: v5.32 jun/2026; 1420+ projetos dependentes
- Nota: Overkill para estado simples; curva de statecharts

### Legend-State — `@legendapp/state`
Estado super-rápido com reatividade fine-grained e persistência/sync local-first automáticos; tração em apps offline-first.
- ESM: `https://esm.sh/@legendapp/state@2`
- Aceitação: Repo ativo em 2026 com foco em performance e sync
- Nota: Não confundir com 'legend-xstate' (abandonado); ecossistema menor

## Formulários (2)

### React Hook Form — `react-hook-form`
Gerência de formulários em React via refs não-controladas, com mínimo re-render e validação plugável; lib de forms dominante.
- ESM: `https://esm.sh/react-hook-form@7`
- Aceitação: v7.76 mai/2026; ~12M downloads/sem; 9049+ dependentes
- Nota: Type-safety inferior à do TanStack Form em forms muito complexos

### TanStack Form — `@tanstack/react-form`
Gerência de estado de formulários headless, type-safe e performática para React/Vue/Angular/Solid/Lit.
- ESM: `https://esm.sh/@tanstack/react-form@1`
- Aceitação: v1.33 jun/2026 (1.x estável); cresce como alternativa type-safe ao RHF
- Nota: Adoção ainda bem menor que RHF; mais verboso

## Validação (3)

### Zod — `zod`
Validação e inferência de esquemas TypeScript-first com API encadeável; padrão do ecossistema TS.
- ESM: `https://esm.sh/zod@4`
- Aceitação: Zod 4 estável (v4.4 em 2026), com Zod Mini (~10KB); ~20M downloads/sem
- Nota: Bundle maior que Valibot; muito volume é dependência transitiva

### Valibot — `valibot`
Validação modular e tree-shakeable, com bundle até ~90% menor que Zod para casos simples; vencedora para front-end/edge.
- ESM: `https://esm.sh/valibot@1`
- Aceitação: v1.4 mai/2026; saltou de 300k para 4.5M+ downloads/mês em 12 meses
- Nota: API funcional (pipe) difere do encadeamento de Zod

### ArkType — `arktype`
Validador TypeScript-first onde os esquemas são escritos como tipos TS, com runtime extremamente rápido.
- ESM: `https://esm.sh/arktype@2`
- Aceitação: ~400k downloads/sem; 3-4x mais rápido que Zod no parse
- Nota: Sintaxe baseada em strings de tipo tem curva própria

## Toasts / notificações (2)

### Sonner — `sonner`
Componente de toast/notificação opinativo para React, o padrão de fato no ecossistema shadcn/Next.js.
- ESM: `https://esm.sh/sonner`
- Aceitação: ~1.8M downloads/sem; maior crescimento de stars da categoria (Q1 2026); default do shadcn
- Nota: Só React

### react-hot-toast — `react-hot-toast`
Toasts leves (~2KB) e headless-friendly para React, alternativa minimalista ao Sonner.
- ESM: `https://esm.sh/react-hot-toast`
- Aceitação: ~1.2-1.8M downloads/sem em 2026
- Nota: Cadência mais lenta; Sonner ganha em projetos novos

## Command menu (1)

### cmdk — `cmdk`
Command menu (cmd+k) rápido, unstyled e acessível para React; base do command palette do shadcn/ui.
- ESM: `https://esm.sh/cmdk`
- Aceitação: Padrão de fato para command palette em 2026; testado com VoiceOver
- Nota: Exige React 18; downloads exatos não confirmados

## Carousel / slider (2)

### Embla Carousel — `embla-carousel`
Engine de carousel headless (~7KB, zero deps) para React/Vue/Svelte/vanilla; motor do carousel do shadcn/ui.
- ESM: `https://esm.sh/embla-carousel`
- `<script>`: `https://cdn.jsdelivr.net/npm/embla-carousel/+esm`
- Aceitação: ~820k downloads/sem; crescimento puxado pelo shadcn
- Nota: Headless: sem setas/dots/a11y prontos

### Swiper — `swiper`
Slider batteries-included com 60+ tipos de slide e efeitos 3D, módulo de a11y nativo.
- ESM: `https://esm.sh/swiper`
- `<script>`: `https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js`
- Aceitação: ~2.1M downloads/sem; maior da categoria
- Nota: Bundle pesado (~47KB); overkill para slider simples

## Drag & drop (2)

### dnd-kit — `@dnd-kit/core`
Toolkit de drag-and-drop extensível em TS com core agnóstico e preset sortable; padrão da comunidade React.
- ESM: `https://esm.sh/@dnd-kit/core`
- Aceitação: ~2.8M downloads/sem; melhor doc e ecossistema da categoria
- Nota: Core sem publish há ~1 ano; cadência desacelerou — monitore

### Pragmatic drag and drop — `@atlaskit/pragmatic-drag-and-drop`
Drag-and-drop da Atlassian (<4KB core) battle-tested em Jira/Trello; forte com arquivos e escala de milhares de itens.
- ESM: `https://esm.sh/@atlaskit/pragmatic-drag-and-drop`
- Aceitação: Substituto oficial do react-beautiful-dnd (deprecado), em produção Atlassian
- Nota: Você constrói animações, handles e drop indicators manualmente

## Overlays / drawer (2)

### Vaul — `vaul`
Drawer unstyled para React (sobre Radix Dialog), com snap points e drawers aninhados; base do Drawer do shadcn/ui.
- ESM: `https://esm.sh/vaul`
- Aceitação: Usado por Vercel; base do shadcn Drawer; portado para Vue e Svelte
- Nota: v1.1.2 sem publish há ~1 ano (estável, cadência baixa)

### Floating UI — `@floating-ui/react`
Posicionamento de elementos flutuantes (tooltips, popovers, dropdowns) com colisão e flip; sucessor do Popper.
- ESM: `https://esm.sh/@floating-ui/react`
- `<script>`: `https://cdn.jsdelivr.net/npm/@floating-ui/dom/+esm`
- Aceitação: @floating-ui/dom ~6.25M downloads/sem (abr/2026)
- Nota: É engine de posição, não traz UI pronta

## Datas / pickers (4)

### date-fns — `date-fns`
Coleção funcional e tree-shakeable de utilitários de data para JS/TS; default para formatação e aritmética simples.
- ESM: `https://esm.sh/date-fns`
- Aceitação: v4 com timezone; recomendado em 2026 por bundle pequeno via tree-shaking
- Nota: Para timezones/calendários complexos, Temporal entrega mais correção

### Day.js — `dayjs`
Lib de datas ultraleve (~2KB) com API quase idêntica ao Moment e 70+ plugins; substituto direto do Moment.
- ESM: `https://esm.sh/dayjs`
- `<script>`: `https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js`
- Aceitação: 1ª recomendação como alternativa ao Moment em 2026
- Nota: Menos rigorosa que Temporal para aritmética complexa

### react-day-picker — `react-day-picker`
Date picker/calendário customizável para React; base do componente Calendar do shadcn/ui.
- ESM: `https://esm.sh/react-day-picker`
- Aceitação: v10.0 mai/2026; manutenção ativa
- Nota: Novos projetos podem migrar para @daypicker/react

### Temporal polyfill — `@js-temporal/polyfill`
Polyfill da API Temporal (datas imutáveis, timezone e calendários nativos) para usar o futuro padrão de datas hoje.
- ESM: `https://esm.sh/@js-temporal/polyfill`
- `<script>`: `https://cdn.jsdelivr.net/npm/@js-temporal/polyfill/+esm`
- Aceitação: Temporal chegou a Stage 4 no TC39 mar/2026; nativo em Chrome 144+/Firefox 139+
- Nota: Polyfill pesa ~60KB; desnecessário se você só formata datas

## Microinterações (4)

### NumberFlow — `@number-flow/react`
Componente que anima transições de números (contadores, tickers, moeda) com Intl.NumberFormat, para React/Vue/Svelte.
- ESM: `https://esm.sh/@number-flow/react`
- Aceitação: Estrela emergente de microinterações 2026; v0.6; já gerou ports
- Nota: Ainda v0.x

### @use-gesture/react — `@use-gesture/react`
Hooks de gestos (drag, pinch, scroll, wheel) para React, casando com Motion/React Spring e R3F.
- ESM: `https://esm.sh/@use-gesture/react`
- Aceitação: v10.3; ~812k-1.4M downloads/sem; 9.3k stars em 2026
- Nota: Recência de release não confirmada

### react-resizable-panels — `react-resizable-panels`
Painéis redimensionáveis (PanelGroup/Panel/Handle) para layouts tipo IDE, do autor do React DevTools.
- ESM: `https://esm.sh/react-resizable-panels`
- Aceitação: Padrão de 2026 para layouts redimensionáveis; v4 com 0 deps, React 18 e 19

### tsParticles — `@tsparticles/engine`
Engine de partículas/confetti/fireworks customizável, com componentes prontos para React/Vue/Svelte/Angular.
- ESM: `https://esm.sh/@tsparticles/engine`
- `<script>`: `https://cdn.jsdelivr.net/npm/@tsparticles/engine/+esm`
- Aceitação: Ecossistema ativo 2026 (@tsparticles/confetti atualizado mai/2026)
- Nota: Para só confetti, canvas-confetti é mais leve

## Virtualização (2)

### TanStack Virtual — `@tanstack/react-virtual`
Virtualizador headless e agnóstico para listas/grids enormes; par recomendado com TanStack Table.
- ESM: `https://esm.sh/@tanstack/react-virtual`
- Aceitação: ~11.7M downloads/sem; combo Table+Virtual virou default enterprise
- Nota: Headless: você implementa sticky headers, grupos, dynamic height

### react-virtuoso — `react-virtuoso`
Lista virtual rica em features para React: altura dinâmica, grupos, sticky headers e infinite scroll prontos.
- ESM: `https://esm.sh/react-virtuoso`
- Aceitação: v4.18 mai/2026; ~2-3M downloads/sem; ultrapassou react-window

