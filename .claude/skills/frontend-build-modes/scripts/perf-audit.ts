#!/usr/bin/env bun
/**
 * perf-audit — audita um build (arquivo .html ou diretório de projeto) contra o budget e
 * as proibições. Mede o que dá para medir estaticamente; o resto fica para o awwwards-judge.
 *
 * Checa: tamanho total (js/css/html), deps proibidas (lenis/locomotive/bootstrap),
 * fontes proibidas como escolha estética (Inter/Roboto/Arial), presença do bloco
 * prefers-reduced-motion, atributo lang, e meta SEO (title/description/og) em HTML.
 *
 * Read-only. Exit 0 = passou, 1 = findings. Uso: bun perf-audit.ts <arquivo|diretório>
 */
import { statSync, readdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

const target = process.argv[2];
if (!target) { console.error("uso: bun perf-audit.ts <arquivo|diretório>"); process.exit(2); }

const TEXT_EXT = new Set([".html", ".htm", ".css", ".js", ".jsx", ".ts", ".tsx", ".mjs"]);
const SKIP_DIR = new Set(["node_modules", ".git", ".next", "dist", "build"]);

const files: string[] = [];
function walk(p: string) {
  const st = statSync(p);
  if (st.isFile()) { files.push(p); return; }
  for (const name of readdirSync(p)) {
    if (SKIP_DIR.has(name)) continue;
    walk(join(p, name));
  }
}
walk(target);

let totalBytes = 0;
let combined = "";
let htmlSeen = false;
for (const f of files) {
  const ext = extname(f).toLowerCase();
  if (TEXT_EXT.has(ext)) {
    const content = readFileSync(f, "utf8");
    totalBytes += Buffer.byteLength(content);
    combined += "\n" + content;
    if (ext === ".html" || ext === ".htm") htmlSeen = true;
  } else {
    try { totalBytes += statSync(f).size; } catch {}
  }
}

const lower = combined.toLowerCase();
const findings: string[] = [];
const passes: string[] = [];

// deps proibidas
const banned = [
  { re: /\blenis\b/, name: "Lenis (scroll-hijacking)" },
  { re: /locomotive-scroll|locomotivescroll/, name: "Locomotive Scroll" },
  { re: /bootstrap(\.min)?\.css|cdn\.jsdelivr\.net\/npm\/bootstrap/, name: "Bootstrap" },
  { re: /toggleactions\s*:/, name: "GSAP toggleActions em scroll (deveria ser scrub)" },
  { re: /once\s*:\s*true/, name: "GSAP once:true (anima unidirecional)" },
];
for (const b of banned) if (b.re.test(lower)) findings.push(`dep/padrão proibido: ${b.name}`);

// fontes proibidas como font-family (heurística: dentro de font-family)
const fontFamilyBlocks = combined.match(/font-family\s*:[^;}]*/gi) ?? [];
for (const fam of fontFamilyBlocks) {
  if (/\b(inter|roboto|arial)\b/i.test(fam)) {
    findings.push(`fonte proibida como escolha estética em: ${fam.trim().slice(0, 60)}`);
    break;
  }
}

// checagens de HTML
if (htmlSeen) {
  if (/prefers-reduced-motion/i.test(combined)) passes.push("prefers-reduced-motion presente");
  else findings.push("falta bloco @media (prefers-reduced-motion)");
  if (/<html[^>]*\slang=/i.test(combined)) passes.push("atributo lang presente");
  else findings.push("falta atributo lang em <html>");
  if (/<title>\s*\S/i.test(combined)) passes.push("title presente"); else findings.push("falta <title> preenchido");
  if (/<meta[^>]+name=["']description["'][^>]*content=["']\s*\S/i.test(combined)) passes.push("meta description presente");
  else findings.push("falta meta description preenchida");
  if (/property=["']og:title["']/i.test(combined)) passes.push("og:title presente"); else findings.push("falta og:title");
}

// budget de tamanho
const kb = totalBytes / 1024;
const mb = kb / 1024;
const sizeLine = `tamanho total (texto+assets): ${mb >= 1 ? mb.toFixed(2) + " MB" : kb.toFixed(0) + " KB"}`;
if (mb > 2) findings.push(`${sizeLine} — excede o limite duro de 2MB`);
else if (mb > 1) findings.push(`${sizeLine} — acima do alvo de 1MB`);
else passes.push(sizeLine + " (dentro do alvo <1MB)");

console.log(`perf-audit: ${files.length} arquivo(s) analisado(s).\n`);
for (const p of passes) console.log("  ok   " + p);
for (const f of findings) console.log("  FAIL " + f);
console.log(`\nNota: LCP/CLS/FPS reais exigem Lighthouse/runtime — confirme manualmente.`);
process.exit(findings.length === 0 ? 0 : 1);
