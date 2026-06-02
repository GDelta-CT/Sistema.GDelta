#!/usr/bin/env bun
/**
 * lib-search — busca no catálogo de 100 bibliotecas (catalog.json) para o agente
 * escolher o que precisa, com a CDN moderna pronta.
 *
 * Uso:
 *   bun lib-search.ts --list-categories
 *   bun lib-search.ts --category charts
 *   bun lib-search.ts --need "node based flow editor"        # busca por palavras
 *   bun lib-search.ts -q "markdown streaming ia" --json
 *   bun lib-search.ts --md > ../references/catalog.md         # gera o catálogo legível
 *
 * Read-only. Exit 0.
 */
import { join } from "node:path";

const CATALOG = join(import.meta.dir, "..", "catalog.json");
const data = JSON.parse(await Bun.file(CATALOG).text());
const libs: any[] = data.libraries;

function arg(...flags: string[]): string | undefined {
  for (const f of flags) { const i = process.argv.indexOf(f); if (i >= 0) return process.argv[i + 1]; }
  return undefined;
}
const has = (f: string) => process.argv.includes(f);

const CATEGORY_LABELS: Record<string, string> = {
  charts: "Gráficos / data-viz", tables: "Tabelas / data grid", graph: "Grafos / redes",
  flow: "Fluxo / node-based", animation: "Animação / motion", "3d": "3D / WebGL",
  canvas: "Canvas / whiteboard", scroll: "Scroll", "component-library": "Design systems / componentes",
  headless: "Headless / primitivos", blocks: "Blocos / efeitos (copy-paste)", icons: "Ícones",
  styling: "Styling / CSS", markdown: "Markdown", syntax: "Syntax highlight", editor: "Editores rich-text",
  terminal: "Terminal / TUI", state: "Estado", forms: "Formulários", validation: "Validação",
  toast: "Toasts / notificações", command: "Command menu", carousel: "Carousel / slider",
  dnd: "Drag & drop", overlay: "Overlays / drawer", date: "Datas / pickers",
  micro: "Microinterações", virtualization: "Virtualização",
};

// ordem canônica das categorias para o markdown
const ORDER = Object.keys(CATEGORY_LABELS);

function score(lib: any, terms: string[]): number {
  const hay = `${lib.name} ${lib.npm ?? ""} ${lib.category} ${lib.purpose_pt}`.toLowerCase();
  let s = 0;
  for (const t of terms) if (hay.includes(t)) s += hay.indexOf(t) === hay.indexOf(lib.name.toLowerCase()) ? 3 : 2;
  return s;
}

function printLib(l: any) {
  console.log(`- ${l.name}  [${l.category}]${l.npm ? "  npm: " + l.npm : "  (sem npm)"}`);
  console.log(`    ${l.purpose_pt}`);
  if (l.cdn_esm) console.log(`    esm: ${l.cdn_esm}`);
  if (l.cdn_script) console.log(`    <script>: ${l.cdn_script}`);
  if (l.caveat) console.log(`    nota: ${l.caveat}`);
}

// --- modos ---
if (has("--list-categories")) {
  const counts: Record<string, number> = {};
  for (const l of libs) counts[l.category] = (counts[l.category] || 0) + 1;
  console.log(`Catálogo: ${libs.length} bibliotecas (${data.meta.as_of}).\n`);
  for (const c of ORDER) if (counts[c]) console.log(`  ${c.padEnd(18)} ${String(counts[c]).padStart(3)}  ${CATEGORY_LABELS[c]}`);
  process.exit(0);
}

if (has("--md")) {
  const m = data.meta;
  console.log(`# Catálogo de bibliotecas de UI/UX (${m.count})\n`);
  console.log(`> ${m.title} — referência de ${m.as_of}. ${m.criteria}\n`);
  console.log(`> Gerado por \`lib-search.ts --md\` a partir de \`catalog.json\` (fonte única; não editar à mão).\n`);
  console.log(`> CDN: ${m.cdn_note}\n`);
  for (const c of ORDER) {
    const group = libs.filter((l) => l.category === c);
    if (!group.length) continue;
    console.log(`## ${CATEGORY_LABELS[c]} (${group.length})\n`);
    for (const l of group) {
      console.log(`### ${l.name}${l.npm ? ` — \`${l.npm}\`` : " — (sem pacote npm)"}`);
      console.log(l.purpose_pt);
      if (l.cdn_esm) console.log(`- ESM: \`${l.cdn_esm}\``);
      if (l.cdn_script) console.log(`- \`<script>\`: \`${l.cdn_script}\``);
      console.log(`- Aceitação: ${l.why_now}`);
      if (l.caveat) console.log(`- Nota: ${l.caveat}`);
      console.log("");
    }
  }
  process.exit(0);
}

const category = arg("--category", "-c");
const query = arg("--need", "-q", "--query");

let matches = libs;
if (category) matches = matches.filter((l) => l.category === category);
if (query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  matches = matches
    .map((l) => ({ l, s: score(l, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.l);
}

if (has("--json")) { console.log(JSON.stringify(matches, null, 2)); process.exit(0); }

if (!category && !query) {
  console.log(`Catálogo: ${libs.length} bibliotecas. Use:`);
  console.log(`  --list-categories                 lista categorias e contagem`);
  console.log(`  --category <cat>                  filtra por categoria`);
  console.log(`  --need "<palavras>"               busca por necessidade (ex.: "node flow editor")`);
  console.log(`  --json | --md                     saída em JSON ou markdown`);
  process.exit(0);
}

console.log(`${matches.length} resultado(s)${category ? ` em [${category}]` : ""}${query ? ` para "${query}"` : ""}:\n`);
for (const l of matches.slice(0, 20)) printLib(l);
process.exit(0);
