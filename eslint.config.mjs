import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tooling vendorizado / fora do app (não seguem nossa config; scripts Bun, etc.):
    ".aiox-core/**",
    ".claude/**",
    "scripts/**",
    "design-systems/**",
    "build-output/**",
  ]),
]);

export default eslintConfig;
