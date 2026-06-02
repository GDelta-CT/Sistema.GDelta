#!/usr/bin/env bun
/**
 * confidence-lint — flags overconfidence language in an analysis output.
 *
 * Reads a file path (argv[2]) or stdin and reports any banned certainty words
 * plus lines that assert a conclusion without a confidence label.
 * Read-only. Exit 0 = clean, Exit 1 = findings, Exit 2 = usage error.
 *
 * Usage:
 *   bun confidence-lint.ts <file.md>
 *   cat report.md | bun confidence-lint.ts
 */

const BANNED: { pattern: RegExp; note: string }[] = [
  { pattern: /\bcertainly\b|\bcertamente\b|\bwith certainty\b/gi, note: "afirma certeza" },
  { pattern: /\bproven\b|\bprovado\b|\bproves that\b/gi, note: "alega prova" },
  { pattern: /\bguaranteed\b|\bgarantido\b/gi, note: "garante resultado" },
  { pattern: /\bdefinitely\b|\bdefinitivamente\b/gi, note: "afirma definitividade" },
  { pattern: /\bobviously\b|\bobviamente\b|\bclearly\b(?! defined)/gi, note: "substitui justificativa por 'óbvio'" },
  { pattern: /\b100%\b|\bzero chance\b|\bimpossible\b|\bimpossível\b/gi, note: "viola a regra de Cromwell" },
  { pattern: /\balways\b|\bnever\b/gi, note: "absoluto empírico (ok só em lógica formal)" },
];

// A line that looks like a conclusion but carries no confidence label.
const CONCLUSION_HINT = /\b(therefore|portanto|conclu(o|ímos|i)|logo,|thus|then the (system|code|user))\b/i;
const HAS_LABEL = /\b(High|Moderate|Low|Speculative)\b/;

type Finding = { line: number; col: number; text: string; note: string };

function lint(source: string): Finding[] {
  const findings: Finding[] = [];
  const lines = source.split("\n");
  lines.forEach((line, idx) => {
    for (const { pattern, note } of BANNED) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(line)) !== null) {
        findings.push({ line: idx + 1, col: m.index + 1, text: m[0], note });
        if (m.index === pattern.lastIndex) pattern.lastIndex++;
      }
    }
    if (CONCLUSION_HINT.test(line) && !HAS_LABEL.test(line)) {
      findings.push({ line: idx + 1, col: 1, text: line.trim().slice(0, 60), note: "conclusão sem label de confiança" });
    }
  });
  return findings;
}

async function readInput(): Promise<string> {
  const path = process.argv[2];
  if (path) return await Bun.file(path).text();
  // stdin
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) chunks.push(chunk);
  return new TextDecoder().decode(Buffer.concat(chunks));
}

const source = await readInput();
if (!source.trim()) {
  console.error("uso: bun confidence-lint.ts <arquivo>  (ou via stdin)");
  process.exit(2);
}

const findings = lint(source);
if (findings.length === 0) {
  console.log("confidence-lint: limpo. Nenhuma linguagem de overconfidence detectada.");
  process.exit(0);
}

console.log(`confidence-lint: ${findings.length} ocorrência(s).\n`);
for (const f of findings) {
  console.log(`  L${f.line}:${f.col}  "${f.text}"  — ${f.note}`);
}
console.log("\nReveja: substitua certeza por confiança calibrada (ver confidence-calibration.md).");
process.exit(1);
