/**
 * Route Handler: emissão fiscal SERVER-SIDE (Marco 3).
 *
 * Porquê este endpoint existe:
 *  - O token do agregador fiscal (FISCAL_*) NUNCA pode chegar ao browser. A
 *    emissão acontece aqui, no servidor, onde `getAgregador()` lê os segredos
 *    via `process.env` e o resultado normalizado é o único que volta ao cliente.
 *  - A RLS por oficina continua sendo a fronteira: criamos um client Supabase
 *    server-side que ASSUME a identidade do usuário (Authorization Bearer do
 *    @supabase/supabase-js), sem persistir sessão. Assim a leitura da OS e a
 *    escrita da nota respeitam o claim `oficina_id` do JWT, e o trigger
 *    set_oficina_id_from_jwt preenche oficina_id no insert (sem digitação dupla).
 *
 * Ciclo (espelha src/lib/supabase/notas.ts):
 *  1. valida sessão (Authorization) e body;
 *  2. carrega a OS (RLS restringe à oficina do usuário);
 *  3. cria a linha da nota em 'rascunho' ANTES de chamar o agregador (a nota
 *     existe mesmo que a chamada externa caia);
 *  4. tenta emitir; o retorno do agregador atualiza status + campos da nota.
 *
 * Segurança: o token do usuário e os FISCAL_* JAMAIS são logados ou retornados.
 */

// Garante runtime Node (não Edge): a camada fiscal usa process.env server-side.
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { getAgregador, type TipoNota } from '@/lib/fiscal';

/** Corpo aceito pelo endpoint. `tipo` é opcional (default 'nfse'). */
type EmitirBody = {
  os_comercial_id?: unknown;
  tipo?: unknown;
};

/**
 * Recorte da OS necessário para emitir. O embed `cliente:clientes(...)` é
 * tipado como objeto único (a inferência do supabase-js trata relações como
 * array; aqui usamos o cast mínimo do projeto via QueryResult).
 */
type OsParaEmissao = {
  id: string;
  valor_orcamento: number;
  cliente: { nome: string | null; documento: string | null } | null;
};

type QueryResult<T> = { data: T | null; error: { message: string } | null };

export async function POST(req: Request): Promise<Response> {
  try {
    // 1) Sessão: exige Authorization Bearer <access_token do usuário Supabase>.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ ok: false, message: 'Sessão ausente.' }, { status: 401 });
    }

    // 2) Client Supabase server-side com a identidade do usuário (RLS aplica
    //    como o usuário). Sem persistir sessão — é uma requisição única.
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const {
      data: { user },
    } = await supa.auth.getUser();
    if (!user) {
      return Response.json({ ok: false, message: 'Sessão ausente.' }, { status: 401 });
    }

    // 3) Body: { os_comercial_id: string, tipo?: 'nfse' | 'nfe' } (default 'nfse').
    let body: EmitirBody;
    try {
      body = (await req.json()) as EmitirBody;
    } catch {
      return Response.json({ ok: false, message: 'Requisição inválida.' }, { status: 400 });
    }

    const osComercialId =
      typeof body.os_comercial_id === 'string' ? body.os_comercial_id.trim() : '';
    if (!osComercialId) {
      return Response.json({ ok: false, message: 'os_comercial_id é obrigatório.' }, { status: 400 });
    }

    const tipo: TipoNota = body.tipo === 'nfe' ? 'nfe' : 'nfse';

    // 4) Carrega a OS. A RLS já restringe à oficina do usuário; ausência -> 404.
    const { data: os, error: osError } = (await supa
      .from('os_comercial')
      .select('id, valor_orcamento, cliente:clientes(nome, documento)')
      .eq('id', osComercialId)
      .maybeSingle()) as QueryResult<OsParaEmissao>;

    if (osError || !os) {
      return Response.json({ ok: false, message: 'OS não encontrada.' }, { status: 404 });
    }

    // 5) Rascunho da nota ANTES de chamar o agregador (oficina_id vem do trigger).
    const { data: nota, error: notaError } = (await supa
      .from('notas_fiscais')
      .insert({
        os_comercial_id: osComercialId,
        tipo,
        valor: os.valor_orcamento,
        status: 'rascunho',
      })
      .select('id')
      .single()) as QueryResult<{ id: string }>;

    if (notaError || !nota) {
      return Response.json({ ok: false, message: 'Falha ao criar o rascunho da nota.' }, { status: 500 });
    }

    const notaId = nota.id;

    // 6) Emissão server-side. Caminho esperado hoje: o NullAgregador lança
    //    "não configurado" — a nota permanece como 'rascunho'.
    try {
      const r = await getAgregador().emitir({
        osComercialId,
        tipo,
        valor: Number(os.valor_orcamento),
        tomador: {
          nome: os.cliente?.nome ?? 'Sem cliente',
          documento: os.cliente?.documento ?? null,
        },
      });

      await supa
        .from('notas_fiscais')
        .update({
          status: r.status,
          agregador: r.agregador,
          agregador_ref: r.agregadorRef ?? null,
          numero: r.numero ?? null,
          chave_acesso: r.chaveAcesso ?? null,
          xml_url: r.xmlUrl ?? null,
          pdf_url: r.pdfUrl ?? null,
          mensagem: r.mensagem ?? null,
          emitida_em: r.status === 'autorizada' ? new Date().toISOString() : null,
        })
        .eq('id', notaId);

      return Response.json({ ok: true, status: r.status, message: 'Emissão enviada.', nota_id: notaId });
    } catch (e) {
      // Falha esperada quando não há agregador/credencial configurada. A nota
      // já existe em 'rascunho'; devolvemos a mensagem do agregador (sem segredos).
      return Response.json({
        ok: false,
        status: 'rascunho',
        message: e instanceof Error ? e.message : 'Agregador fiscal não configurado.',
        nota_id: notaId,
      });
    }
  } catch {
    // Erro inesperado (rede, parsing interno, etc.). Nunca vaza detalhes/segredos.
    return Response.json({ ok: false, message: 'Falha ao emitir.' }, { status: 500 });
  }
}
