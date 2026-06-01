/**
 * Cliente Supabase para o browser (componentes "use client").
 *
 * - Singleton: evita recriar o client a cada render.
 * - Usa a ANON KEY (pública por design). A segurança NÃO está no segredo da
 *   chave, e sim no RLS + no claim `oficina_id` dentro do JWT (ordem sagrada).
 * - A sessão persiste e se renova sozinha; é ela que carrega o `oficina_id`
 *   no token, usado pelo RLS e pelos triggers de escrita.
 *
 * Decisão em aberto (a cargo do @architect no Passo 6): manter só este client
 * de browser ou adotar `@supabase/ssr` para sessão no servidor. Por ora, o
 * mínimo que prova a conexão no Passo 3.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      '[GDelta] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. ' +
        'Preencha o .env.local com os valores do projeto de TESTE e reinicie o dev server.'
    );
  }

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-client-info': 'gdelta-sistema/0.1' },
    },
  });
  return _client;
}
