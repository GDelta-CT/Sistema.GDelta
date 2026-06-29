// scripts/db-apply.mjs
// -----------------------------------------------------------------------------
// Aplicador de migrations do GDelta no banco de TESTE, via Supabase Management API.
//
// SEGURANCA — por que isto e seguro mesmo sendo duravel:
//   1) O TOKEN nunca fica aqui nem no git. Vem de um arquivo LOCAL fora do repo:
//        C:/Users/Eliel/.gdelta-secrets/supabase-test.json
//        conteudo: { "ref": "<ref-do-TESTE>", "token": "<access-token>" }
//   2) GUARDA ANTI-PROD: so refs da allowlist de TESTE rodam. PROD jamais passa aqui.
//   3) O token nunca e impresso. So o ref e os nomes das migrations aparecem no log.
//   4) Idempotente: registra o que ja aplicou numa tabela de controle e nao repete.
//
// Uso:
//   node scripts/db-apply.mjs            -> aplica as migrations pendentes (>= START_FROM)
//   node scripts/db-apply.mjs --seed     -> roda scripts/seed-demo.sql (dados de demo)
//   node scripts/db-apply.mjs --status   -> so mostra o que ja foi aplicado
// -----------------------------------------------------------------------------

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const MIGRATIONS_DIR = join(REPO, 'supabase', 'migrations');

// Arquivo de credencial LOCAL (FORA do repo — nunca commitado).
const SECRETS_PATH = process.env.GDELTA_SECRETS || 'C:/Users/Eliel/.gdelta-secrets/supabase-test.json';

// GUARDA ANTI-PROD: somente estes refs (TESTE) sao aceitos. Confirmar com o fundador.
const ALLOWED_TEST_REFS = ['zivdqykrppatcgdezvqu'];

// 0001..0016 ja foram aplicados antes (token gdelta-aplicar-0015-0016). Aplicar daqui pra frente.
// (As migrations 0017+ sao aditivas/idempotentes, entao re-rodar e seguro.)
const START_FROM = '20260601001700';

function carregarCredencial() {
  if (!existsSync(SECRETS_PATH)) {
    throw new Error(
      `Credencial nao encontrada em ${SECRETS_PATH}.\n` +
      `Crie o arquivo (fora do repo) com:  { "ref": "<ref-do-TESTE>", "token": "<access-token>" }`
    );
  }
  const { ref, token } = JSON.parse(readFileSync(SECRETS_PATH, 'utf8').replace(/^﻿/, ''));
  if (!ref || !token) throw new Error('A credencial precisa de "ref" e "token".');
  if (!ALLOWED_TEST_REFS.includes(ref)) {
    throw new Error(`REF "${ref}" NAO esta na allowlist de TESTE. Recusando para proteger PROD.`);
  }
  return { ref, token };
}

async function runSql(ref, token, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL falhou (HTTP ${res.status}): ${text.slice(0, 600)}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  const args = process.argv.slice(2);
  const { ref, token } = carregarCredencial();
  console.log(`Banco de TESTE: ${ref}`);

  await runSql(ref, token,
    `create table if not exists public.gdelta_applied_migrations (
       name text primary key, applied_at timestamptz not null default now());`);

  const aplicadas = new Set(
    (await runSql(ref, token, `select name from public.gdelta_applied_migrations;`)).map((r) => r.name)
  );

  if (args.includes('--status')) {
    console.log('Ja aplicadas por este script:', [...aplicadas].sort().join(', ') || '(nenhuma)');
    return;
  }

  if (args.includes('--seed')) {
    const seedPath = join(__dirname, 'seed-demo.sql');
    if (!existsSync(seedPath)) throw new Error(`Seed nao encontrado: ${seedPath}`);
    console.log('Aplicando seed de demonstracao...');
    await runSql(ref, token, readFileSync(seedPath, 'utf8'));
    console.log('Seed aplicado.');
    return;
  }

  const arquivos = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  let n = 0;
  for (const nome of arquivos) {
    if (nome < START_FROM) continue;       // baseline: 0001..0016 ja estao no banco
    if (aplicadas.has(nome)) continue;      // ja aplicada por este script
    process.stdout.write(`-> ${nome} ... `);
    await runSql(ref, token, readFileSync(join(MIGRATIONS_DIR, nome), 'utf8'));
    await runSql(ref, token,
      `insert into public.gdelta_applied_migrations(name) values ($mig$${nome}$mig$) on conflict do nothing;`);
    console.log('ok');
    n++;
  }
  console.log(n ? `\n${n} migration(s) aplicada(s).` : '\nNada pendente — banco ja atualizado.');
}

main().catch((e) => { console.error('\nERRO:', e.message); process.exit(1); });
