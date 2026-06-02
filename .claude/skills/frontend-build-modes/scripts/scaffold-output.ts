#!/usr/bin/env bun
/**
 * scaffold-output — cria a pasta de output de um build com a convenção de nomes do projeto.
 * É o ÚNICO script que escreve, e só dentro de ./build-output/.
 *
 * Uso: bun scaffold-output.ts <experience|product> <slug>
 * Cria: ./build-output/<mode>-<slug>/  (+ index.html no experience; estrutura mínima no product)
 */
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const mode = process.argv[2];
const slug = process.argv[3];

if (mode !== "experience" && mode !== "product") {
  console.error("uso: bun scaffold-output.ts <experience|product> <slug>");
  process.exit(2);
}
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("slug inválido: use kebab-case (ex.: estudio-arquitetura)");
  process.exit(2);
}

const root = join("build-output", `${mode}-${slug}`);
if (existsSync(root)) {
  console.error(`já existe: ${root} — escolha outro slug ou remova manualmente.`);
  process.exit(1);
}

mkdirSync(root, { recursive: true });

if (mode === "experience") {
  mkdirSync(join(root, "assets"), { recursive: true });
  writeFileSync(join(root, "index.html"), "<!-- preencher a partir de templates/experience-shell.html -->\n");
  console.log(`criado: ${root}/index.html + ${root}/assets/`);
} else {
  for (const d of ["app", "components/ui", "components/dashboard", "lib", "styles"]) {
    mkdirSync(join(root, d), { recursive: true });
  }
  console.log(`criado: ${root}/ (app, components/ui, components/dashboard, lib, styles)`);
}

console.log("output pronto. Builds nunca escrevem fora de build-output/.");
