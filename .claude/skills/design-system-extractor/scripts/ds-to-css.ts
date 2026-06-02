#!/usr/bin/env bun
/**
 * ds-to-css — aplica um design system: lê design-tokens.json e emite CSS custom
 * properties (:root) prontas para um build importar. Opcional: bloco @theme do Tailwind v4.
 *
 * Tolerante a formatos: consome o que estiver presente em color/typography/spacing/radius/motion.
 * Uso: bun ds-to-css.ts <design-tokens.json> [--out <tokens.css>] [--tailwind]
 * Sem --out, imprime no stdout. Exit 0 ok, 2 uso.
 */
import { writeFileSync } from "node:fs";

const input = process.argv[2];
if (!input) { console.error("uso: bun ds-to-css.ts <design-tokens.json> [--out <path>] [--tailwind]"); process.exit(2); }
const outPath = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
const tailwind = process.argv.includes("--tailwind");

const t = JSON.parse(await Bun.file(input).text());
const vars: [string, string][] = [];
const push = (k: string, v: unknown) => { if (v !== undefined && v !== null && String(v) !== "") vars.push([k, String(v)]); };

const color = t.color ?? {};
push("--color-bg", color.bg);
push("--color-fg", color.fg);
push("--color-fg-muted", color.fg_muted);
push("--color-surface", color.surface);
push("--color-border", color.border);
push("--color-accent", color.accent);

for (const [step, hex] of Object.entries(color.neutral ?? {})) push(`--color-neutral-${step}`, hex);
for (const [step, hex] of Object.entries(color.scale ?? {})) push(`--color-${step}`, hex);
for (const [name, hex] of Object.entries(color.semantic ?? {})) push(`--color-${name}`, hex);
(color.chromatic ?? []).forEach((hex: string, i: number) => push(`--color-chromatic-${i + 1}`, hex));

const typo = t.typography ?? {};
push("--font-display", typo.font_display);
push("--font-body", typo.font_body);
for (const [name, val] of Object.entries(typo.scale ?? {})) push(`--text-${name}`, val);

const spacing = t.spacing ?? {};
push("--space-base", spacing.base);
push("--space-content", spacing.content);
push("--space-section", spacing.section);
for (const [name, val] of Object.entries(spacing.scale ?? {})) push(`--space-${name}`, val);

const radius = t.radius ?? {};
for (const [name, val] of Object.entries(radius)) if (typeof val === "string" || typeof val === "number") push(`--radius-${name}`, val);

const motion = t.motion ?? {};
push("--ease", motion.easing);
if (motion.scrub?.section) push("--scrub-section", motion.scrub.section);

const cssBody = vars.map(([k, v]) => `  ${k}: ${v};`).join("\n");
let css = `/* Gerado por ds-to-css.ts a partir de ${input}. Não editar à mão. */\n:root {\n${cssBody}\n}\n`;

if (tailwind) {
  css += `\n/* Tailwind v4 @theme (cole no seu CSS global) */\n@theme {\n` +
    vars.filter(([k]) => k.startsWith("--color-")).map(([k, v]) => `  ${k.replace("--color-", "--color-")}: ${v};`).join("\n") +
    `\n}\n`;
}

if (outPath) { writeFileSync(outPath, css); console.log(`[ds-to-css] ${vars.length} vars -> ${outPath}`); }
else process.stdout.write(css);
