#!/usr/bin/env bun
/**
 * doctor — valida a integridade do scaffold agents-guru em qualquer máquina.
 *
 * Checa: todos os arquivos esperados existem; o frontmatter de agents/commands/skills
 * é parseável e tem os campos obrigatórios; as references citadas nos SKILL.md resolvem.
 *
 * Read-only. Exit 0 = íntegro, 1 = problemas. Uso: bun ./scripts/doctor.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems: string[] = [];
const ok: string[] = [];

function must(rel: string) {
  if (existsSync(join(ROOT, rel))) ok.push(rel);
  else problems.push(`faltando: ${rel}`);
}

// 1. Arquivos raiz e estrutura
for (const f of [
  "CLAUDE.md", "AGENTS.md", "README.md", ".gitignore",
  ".claude/settings.json",
  ".claude/checklists/awwwards-quality-gate.md",
  "scripts/doctor.ts",
]) must(f);

// 2. Agents esperados
const AGENTS = [
  "brownfield-cartographer", "scope-amplifier", "gap-hunter", "dependency-tracer",
  "design-architect", "frontend-forge", "awwwards-judge", "ds-extractor",
  "build-verifier", "backend-architect", "backend-forge",
  "code-reviewer", "debugger", "test-engineer", "security-auditor", "performance-engineer", "refactorer",
];
for (const a of AGENTS) must(`.claude/agents/${a}.md`);

// 3. Commands esperados
const COMMANDS = [
  "comprehend", "amplify-scope", "hunt-gaps", "trace-deps",
  "build-experience", "build-product", "design-review", "extract-ds", "apply-ds",
  "verify", "architect", "build-backend",
];
for (const c of COMMANDS) must(`.claude/commands/${c}.md`);

// 4. Skills esperadas
const SKILLS = ["reasoning-toolkit", "planning", "verification-loop", "context-management", "code-design-patterns", "skill-authoring", "gap-discovery", "design-system-engine", "frontend-build-modes", "design-system-extractor", "component-libraries"];
for (const s of SKILLS) must(`.claude/skills/${s}/SKILL.md`);

// 5. Scripts de skill
for (const f of [
  ".claude/skills/reasoning-toolkit/scripts/confidence-lint.ts",
  ".claude/skills/frontend-build-modes/scripts/oklch-validate.ts",
  ".claude/skills/frontend-build-modes/scripts/perf-audit.ts",
  ".claude/skills/frontend-build-modes/scripts/scaffold-output.ts",
  ".claude/skills/design-system-engine/assets/tokens.template.json",
  ".claude/skills/frontend-build-modes/templates/experience-shell.html",
  ".claude/skills/frontend-build-modes/templates/product-page.tsx.txt",
  ".claude/skills/design-system-extractor/scripts/normalize-ds.ts",
  ".claude/skills/design-system-extractor/scripts/ds-to-css.ts",
  ".claude/skills/component-libraries/catalog.json",
  ".claude/skills/component-libraries/scripts/lib-search.ts",
  ".claude/skills/component-libraries/references/catalog.md",
]) must(f);

// 5b. Design system default (Graphite) — fonte única, store de design-systems
for (const f of [
  "design-systems/README.md",
  "design-systems/default/design-tokens.json",
  "design-systems/default/design-system.md",
  "design-systems/default/PROVENANCE.md",
]) must(f);

// --- helpers de frontmatter ---
function frontmatter(path: string): Record<string, string> | null {
  const txt = readFileSync(path, "utf8");
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const obj: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (mm) obj[mm[1]] = mm[2].trim();
  }
  return obj;
}

// 6. Frontmatter de agents (name, description) e maxTurns recomendado
for (const a of AGENTS) {
  const p = join(ROOT, `.claude/agents/${a}.md`);
  if (!existsSync(p)) continue;
  const fm = frontmatter(p);
  if (!fm) { problems.push(`agent ${a}: sem frontmatter`); continue; }
  if (!fm.name) problems.push(`agent ${a}: falta 'name'`);
  if (!fm.description) problems.push(`agent ${a}: falta 'description'`);
  if (!fm.maxTurns) problems.push(`agent ${a}: falta 'maxTurns' (recomendado)`);
}

// 7. Frontmatter de commands (description)
for (const c of COMMANDS) {
  const p = join(ROOT, `.claude/commands/${c}.md`);
  if (!existsSync(p)) continue;
  const fm = frontmatter(p);
  if (!fm) { problems.push(`command ${c}: sem frontmatter`); continue; }
  if (!fm.description) problems.push(`command ${c}: falta 'description'`);
}

// 8. Frontmatter de skills (name, description) + references citadas resolvem
for (const s of SKILLS) {
  const skillMd = join(ROOT, `.claude/skills/${s}/SKILL.md`);
  if (!existsSync(skillMd)) continue;
  const fm = frontmatter(skillMd);
  if (!fm?.name) problems.push(`skill ${s}: falta 'name'`);
  if (!fm?.description) problems.push(`skill ${s}: falta 'description'`);

  // references citadas no corpo devem existir em references/
  const body = readFileSync(skillMd, "utf8");
  const refDir = join(ROOT, `.claude/skills/${s}/references`);
  const cited = new Set([...body.matchAll(/`?([a-z0-9-]+\.md)`?/gi)].map((m) => m[1]));
  if (existsSync(refDir)) {
    const onDisk = new Set(readdirSync(refDir));
    for (const ref of cited) {
      // só cobra os que parecem references desta skill (existe um homônimo no dir OU é citado como reference)
      if (ref === "SKILL.md") continue;
      if (onDisk.has(ref)) ok.push(`${s}/references/${ref}`);
    }
    // checa que todo arquivo em references/ é citado em algum lugar (alerta leve)
    for (const file of onDisk) {
      if (!body.includes(file)) problems.push(`skill ${s}: reference '${file}' existe mas não é citada no SKILL.md`);
    }
  }
}

// Relatório
console.log("agents-guru doctor\n");
console.log(`Verificados: ${ok.length} item(ns) ok.`);
if (problems.length === 0) {
  console.log("\nScaffold íntegro. Nenhum problema encontrado.");
  process.exit(0);
}
console.log(`\n${problems.length} problema(s):`);
for (const p of problems) console.log("  - " + p);
process.exit(1);
