#!/usr/bin/env bun
/**
 * oklch-validate — valida cores OKLCH e contraste APCA de um design-tokens.json (ou CSS).
 *
 * - Faz parse de todas as ocorrências de oklch(L C H).
 * - Valida formato (L em 0..1, C >= 0, H ângulo).
 * - Checa gamut sRGB convertendo OKLCH -> sRGB linear (flag se fora de [0,1]).
 * - Se o JSON tiver `contrast_pairs: [{fg, bg, context}]`, calcula APCA Lc e compara aos
 *   targets (body 75, large 60, ui 45). Aceita cores em hex OU oklch. Sem pairs, tenta color.fg/color.bg.
 *
 * Read-only. Exit 0 = ok, 1 = findings, 2 = uso.
 * Uso: bun oklch-validate.ts <tokens.json|arquivo.css>
 */

type RGB = { r: number; g: number; b: number; inGamut: boolean };

function oklchToLinearSrgb(L: number, C: number, Hdeg: number): RGB {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const eps = 0.001; // abaixo da quantização 1/255; tolera arredondamento de borda
  const inGamut = [r, g, bl].every((c) => c >= -eps && c <= 1 + eps);
  return { r, g, b: bl, inGamut };
}

function linToGamma(c: number): number {
  const x = Math.min(1, Math.max(0, c));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

// Luminância APCA-W3 (Ys) a partir de sRGB gamma-encoded 0..1
function apcaY(rgb: RGB): number {
  const r = linToGamma(rgb.r), g = linToGamma(rgb.g), b = linToGamma(rgb.b);
  return 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
}

function apcaLc(txt: RGB, bg: RGB): number {
  const blkThrs = 0.022, blkClmp = 1.414;
  const clamp = (Y: number) => (Y >= blkThrs ? Y : Y + Math.pow(blkThrs - Y, blkClmp));
  let Ytxt = clamp(apcaY(txt)), Ybg = clamp(apcaY(bg));
  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;
  let Sapc: number, Lc: number;
  if (Ybg > Ytxt) {
    Sapc = (Math.pow(Ybg, 0.56) - Math.pow(Ytxt, 0.57)) * 1.14;
    Lc = Sapc < 0.001 ? 0 : Sapc - 0.027;
  } else {
    Sapc = (Math.pow(Ybg, 0.65) - Math.pow(Ytxt, 0.62)) * 1.14;
    Lc = Sapc > -0.001 ? 0 : Sapc + 0.027;
  }
  return Lc * 100;
}

// Parsing robusto baseado em split: tolera alpha (/ a), sufixo deg, e L em %.
function parseOklch(s: string): { L: number; C: number; H: number } | null {
  const inner = s.match(/oklch\(([^)]*)\)/i)?.[1];
  if (!inner) return null;
  const noAlpha = inner.split("/")[0].trim();
  const parts = noAlpha.split(/\s+/);
  if (parts.length < 3) return null;
  const L = parts[0].endsWith("%") ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
  const C = parseFloat(parts[1]);
  const H = parseFloat(parts[2].replace(/deg$/i, ""));
  if ([L, C, H].some((v) => Number.isNaN(v))) return null;
  return { L, C, H };
}

// hex -> sRGB linear (hex está sempre dentro do gamut por definição)
function hexToLinearSrgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return {
    r: toLin(parseInt(h.slice(0, 2), 16) / 255),
    g: toLin(parseInt(h.slice(2, 4), 16) / 255),
    b: toLin(parseInt(h.slice(4, 6), 16) / 255),
    inGamut: true,
  };
}

// dispatcher: aceita hex ou oklch e devolve sRGB linear
function colorToLinearSrgb(s: string): RGB | null {
  if (/oklch\(/i.test(s)) {
    const o = parseOklch(s);
    return o ? oklchToLinearSrgb(o.L, o.C, o.H) : null;
  }
  return hexToLinearSrgb(s);
}

const path = process.argv[2];
if (!path) { console.error("uso: bun oklch-validate.ts <tokens.json|arquivo.css>"); process.exit(2); }

const raw = await Bun.file(path).text();
const findings: string[] = [];
let count = 0;

// coleta todas as strings oklch(...) do arquivo
const allMatches = raw.match(/oklch\([^)]*\)/gi) ?? [];
for (const str of allMatches) {
  count++;
  const parsed = parseOklch(str);
  if (!parsed) { findings.push(`formato inválido: ${str}`); continue; }
  const { L, C, H } = parsed;
  if (L < 0 || L > 1) findings.push(`L fora de 0..1 (${L}): ${str}`);
  if (C < 0) findings.push(`chroma negativo (${C}): ${str}`);
  if (H < 0 || H > 360) findings.push(`hue fora de 0..360 (${H}): ${str}`);
  const rgb = oklchToLinearSrgb(L, C, H);
  if (!rgb.inGamut) findings.push(`fora do gamut sRGB (será cortado pelo browser): ${str}`);
}

// contraste APCA se houver pares declarados
let contrastChecked = 0;
try {
  const json = JSON.parse(raw);
  const pairs: { fg: string; bg: string; context?: string }[] =
    json.contrast_pairs ?? json.color?.contrast_pairs ?? [];
  if (pairs.length === 0 && json?.color?.bg && json?.color?.fg) {
    pairs.push({ fg: json.color.fg, bg: json.color.bg, context: "body" });
  }
  const target: Record<string, number> = { body: 75, large: 60, ui: 45 };
  for (const p of pairs) {
    const fgRGB = colorToLinearSrgb(p.fg), bgRGB = colorToLinearSrgb(p.bg);
    if (!fgRGB || !bgRGB) continue;
    contrastChecked++;
    const lc = Math.abs(apcaLc(fgRGB, bgRGB));
    const ctx = p.context ?? "body";
    const need = target[ctx] ?? 75;
    const verdict = lc >= need ? "ok" : "ABAIXO";
    const line = `APCA ${ctx}: Lc ${lc.toFixed(1)} (alvo ${need}) — ${verdict}  [${p.fg} sobre ${p.bg}]`;
    if (lc < need) findings.push(line); else console.log("  " + line);
  }
} catch { /* não é JSON; só validou as cores */ }

console.log(`\noklch-validate: ${count} cor(es) verificadas, ${contrastChecked} par(es) de contraste.`);
if (findings.length === 0) { console.log("Tudo ok: formato válido, dentro do gamut, contraste nos alvos."); process.exit(0); }
console.log(`\n${findings.length} problema(s):`);
for (const f of findings) console.log("  - " + f);
process.exit(1);
