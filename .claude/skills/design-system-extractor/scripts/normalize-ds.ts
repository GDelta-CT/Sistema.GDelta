#!/usr/bin/env bun
/**
 * normalize-ds — converte um _harvest.json (computed styles crus do agent-browser)
 * em design-tokens.json canônico do projeto, de forma determinística.
 *
 * - rgb()/rgba() -> hex; dedup por frequência.
 * - categoriza neutro vs cromático por chroma; escolhe bg/fg/accent por frequência+papel.
 * - deriva unidade de espaçamento por GCD e razão da escala tipográfica.
 * - anexa confidence por seção (frequência + presença).
 *
 * Read-only sobre o input; escreve o tokens.json no destino.
 * Uso: bun normalize-ds.ts <_harvest.json> --name <slug> [--out <path>]
 * Exit 0 ok, 1 sem dados suficientes, 2 uso.
 */
import { writeFileSync } from "node:fs";

type Freq = { value: string; count: number };
type Harvest = {
  url?: string; title?: string;
  colors?: Freq[]; backgrounds?: Freq[]; borders?: Freq[]; shadows?: Freq[]; radii?: Freq[];
  font_families?: Freq[]; font_sizes?: Freq[]; font_weights?: Freq[];
  gaps?: Freq[]; paddings?: Freq[]; transitions?: Freq[]; keyframes?: string[];
  reduced_motion_supported?: boolean; prefers_color_scheme_dark?: boolean;
};

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const input = process.argv[2];
const name = arg("--name");
if (!input || !name) { console.error("uso: bun normalize-ds.ts <_harvest.json> --name <slug> [--out <path>]"); process.exit(2); }
const out = arg("--out") ?? `design-systems/${name}/design-tokens.json`;

const harvest: Harvest = JSON.parse(await Bun.file(input).text());

// --- cor: rgb()/rgba()/hex -> hex 6-dígitos ---
function toHex(c: string): string | null {
  c = c.trim();
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) return ("#" + c.slice(1).split("").map((x) => x + x).join("")).toLowerCase();
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(",").map((x) => parseFloat(x.trim()));
  const [r, g, b, a] = parts;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  if (a !== undefined && a < 0.5) return null; // descarta quase-transparente
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return ("#" + h(r) + h(g) + h(b)).toLowerCase();
}

function chroma(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}
function lightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function dedupHex(list: Freq[] = []): Freq[] {
  const m = new Map<string, number>();
  for (const f of list) { const hex = toHex(f.value); if (hex) m.set(hex, (m.get(hex) || 0) + f.count); }
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

const colors = dedupHex(harvest.colors);
const bgs = dedupHex(harvest.backgrounds);
const allColors = dedupHex([...(harvest.colors ?? []), ...(harvest.backgrounds ?? []), ...(harvest.borders ?? [])]);

const CHROMATIC = 0.12;
const neutrals = allColors.filter((c) => chroma(c.value) < CHROMATIC).sort((a, b) => lightness(a.value) - lightness(b.value));
const chromatics = allColors.filter((c) => chroma(c.value) >= CHROMATIC).sort((a, b) => b.count - a.count);

const fg = colors[0]?.value ?? "#000000";
const bg = bgs[0]?.value ?? "#ffffff";
const accent = chromatics[0]?.value ?? colors.find((c) => chroma(c.value) >= CHROMATIC)?.value ?? "#276ef1";

// escala neutra: amostra 6 pontos ao longo da lightness dos neutros observados
function neutralScale(): Record<string, string> {
  const steps = ["50", "100", "300", "500", "700", "900"];
  const ramp: Record<string, string> = {};
  if (neutrals.length === 0) return ramp;
  steps.forEach((s, i) => {
    const idx = Math.round((i / (steps.length - 1)) * (neutrals.length - 1));
    ramp[s] = neutrals[neutrals.length - 1 - idx].value; // 50 = mais claro
  });
  return ramp;
}

// --- espaçamento: GCD dos px observados ---
function pxNums(list: Freq[] = []): number[] {
  const ns: number[] = [];
  for (const f of list) { const m = f.value.match(/([\d.]+)px/); if (m) { const n = Math.round(parseFloat(m[1])); if (n > 0) ns.push(n); } }
  return ns;
}
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
const spaceNums = [...pxNums(harvest.gaps), ...pxNums(harvest.paddings)].filter((n) => n >= 2 && n <= 160);
const baseUnit = spaceNums.length ? spaceNums.reduce((a, b) => gcd(a, b)) : 8;

// --- tipografia: razão da escala ---
const sizePx = [...new Set(pxNums(harvest.font_sizes))].sort((a, b) => a - b);
let ratio = 1.25;
if (sizePx.length >= 3) {
  const ratios: number[] = [];
  for (let i = 1; i < sizePx.length; i++) if (sizePx[i - 1] > 0) ratios.push(sizePx[i] / sizePx[i - 1]);
  ratios.sort((a, b) => a - b);
  ratio = Math.round(ratios[Math.floor(ratios.length / 2)] * 1000) / 1000 || 1.25;
}
const families = (harvest.font_families ?? []).map((f) => f.value);

// --- confiança por seção ---
const conf = (n: number, pages = 1) => (n >= 50 ? "High" : n >= 12 ? "Moderate" : n >= 3 ? "Low" : "Speculative");

const radii = (harvest.radii ?? []).slice(0, 5).map((r) => r.value);

const tokens = {
  meta: {
    project: name,
    source_url: harvest.url ?? null,
    method: "dom",
    generated_from: input,
    confidence_global: colors.length && bgs.length && families.length ? "Moderate" : "Low",
  },
  color: {
    bg, fg, accent,
    neutral: neutralScale(),
    chromatic: chromatics.slice(0, 6).map((c) => c.value),
    confidence: { fg: conf(colors[0]?.count ?? 0), bg: conf(bgs[0]?.count ?? 0), accent: conf(chromatics[0]?.count ?? 0) },
    contrast_targets_apca: { body: 75, large: 60, ui: 45 },
    contrast_pairs: [{ fg, bg, context: "body" }],
  },
  typography: {
    ratio,
    font_display: families[0] ?? "",
    font_body: families[1] ?? families[0] ?? "",
    sizes_observed_px: sizePx,
    weights_observed: [...new Set((harvest.font_weights ?? []).map((w) => w.value))],
    confidence: conf((harvest.font_families ?? [])[0]?.count ?? 0),
  },
  spacing: { base: `${baseUnit}px`, observed_px: [...new Set(spaceNums)].sort((a, b) => a - b), confidence: conf(spaceNums.length) },
  radius: radii.length ? { observed: radii } : {},
  motion: {
    transitions_observed: (harvest.transitions ?? []).slice(0, 8).map((t) => t.value),
    keyframes: harvest.keyframes ?? [],
    reduced_motion_supported: !!harvest.reduced_motion_supported,
  },
  theme: { prefers_dark: !!harvest.prefers_color_scheme_dark },
};

if (!colors.length && !bgs.length) { console.error("[normalize] harvest sem cores — extração insuficiente."); process.exit(1); }

writeFileSync(out, JSON.stringify(tokens, null, 2));
console.log(`[normalize] ${out}`);
console.log(`  fg=${fg} bg=${bg} accent=${accent} | base=${baseUnit}px ratio=${ratio} | neutros=${neutrals.length} cromáticos=${chromatics.length}`);
console.log(`  confiança global=${tokens.meta.confidence_global}. Rode oklch-validate.ts no resultado.`);
