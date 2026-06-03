/**
 * Camada de dados do módulo Notas Fiscais (Marco 3) — o Sistema REGISTRA a nota;
 * o agregador (Focus/PlugNotas/Nuvem Fiscal) é a autoridade fiscal que transmite.
 *
 * Mesmo padrão dos demais módulos: FetchState + withTimeout + erros traduzidos
 * (traduzirErro reusado de './clientes') + cast manual via QueryResult.
 *
 * Pontos de contrato (tabela public.notas_fiscais, migration 0012):
 *  - oficina_id é auto-preenchido pelo trigger a partir do JWT (sem digitação
 *    dupla); a RLS isola por oficina em TODAS as leituras/escritas.
 *  - O ciclo de vida é ASSÍNCRONO: a linha nasce 'rascunho' (antes de chamar o
 *    agregador) e o RETORNO do agregador (callback/poll) atualiza o status e os
 *    campos da nota (numero, chave_acesso, xml_url, pdf_url, mensagem).
 *  - emitida_em é marcada quando a nota chega a 'autorizada' (não quando criamos
 *    a linha); cancelada_em quando vai a 'cancelada'. Ambos via now() do banco.
 *  - O código typecheka mesmo que a migration 0012 ainda não esteja aplicada; se
 *    a tabela não existir, traduzirErro degrada a mensagem como qualquer falha.
 */

import { getSupabase } from './client';
import { traduzirErro, type FetchState } from './clientes';

export type TipoNota = 'nfse' | 'nfe';
export type StatusNota = 'rascunho' | 'processando' | 'autorizada' | 'rejeitada' | 'cancelada';

export const STATUS_NOTA: { id: StatusNota; nome: string }[] = [
  { id: 'rascunho', nome: 'Rascunho' },
  { id: 'processando', nome: 'Processando' },
  { id: 'autorizada', nome: 'Autorizada' },
  { id: 'rejeitada', nome: 'Rejeitada' },
  { id: 'cancelada', nome: 'Cancelada' },
];

export type NotaFiscal = {
  id: string;
  oficina_id: string;
  os_comercial_id: string;
  tipo: TipoNota;
  status: StatusNota;
  agregador: string;
  agregador_ref: string | null;
  numero: string | null;
  serie: string | null;
  valor: number;
  chave_acesso: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  mensagem: string | null;
  emitida_em: string | null;
  cancelada_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Conexão demorou demais. Verifique a internet.')), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

const COLS =
  'id, oficina_id, os_comercial_id, tipo, status, agregador, agregador_ref, numero, serie, valor, chave_acesso, xml_url, pdf_url, mensagem, emitida_em, cancelada_em, criado_em, atualizado_em';

/** Lista as notas da oficina (RLS), mais novas primeiro. */
export async function listarNotas(): Promise<FetchState<NotaFiscal[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('notas_fiscais').select(COLS).order('criado_em', { ascending: false })
    )) as QueryResult<NotaFiscal[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Notas geradas por uma OS Comercial (uma OS pode ter NFS-e de serviço + NF-e de peças). */
export async function getNotasPorOs(osComercialId: string): Promise<FetchState<NotaFiscal[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('notas_fiscais')
        .select(COLS)
        .eq('os_comercial_id', osComercialId)
        .order('criado_em', { ascending: false })
    )) as QueryResult<NotaFiscal[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Cria a linha da nota em 'rascunho' ANTES de chamar o agregador (a linha existe
 * mesmo que a chamada externa caia). oficina_id é preenchido pelo trigger via JWT.
 */
export async function criarRascunhoNota(input: {
  os_comercial_id: string;
  tipo: TipoNota;
  valor: number;
}): Promise<FetchState<NotaFiscal>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('notas_fiscais')
        .insert({
          os_comercial_id: input.os_comercial_id,
          tipo: input.tipo,
          valor: input.valor,
          status: 'rascunho',
        }) // oficina_id é preenchido pelo trigger a partir do JWT
        .select(COLS)
        .single()
    )) as QueryResult<NotaFiscal>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao criar o rascunho da nota.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/**
 * Aplica o RETORNO do agregador (callback/poll) na nota: status + campos da nota.
 * Marca emitida_em=now() quando status='autorizada' e cancelada_em=now() quando
 * 'cancelada' (os timestamps são do banco — o agregador é a autoridade do "quando").
 */
export async function registrarRetornoNota(
  id: string,
  r: {
    status: StatusNota;
    agregador?: string;
    agregador_ref?: string | null;
    numero?: string | null;
    chave_acesso?: string | null;
    xml_url?: string | null;
    pdf_url?: string | null;
    mensagem?: string | null;
  }
): Promise<FetchState<NotaFiscal>> {
  try {
    const patch: Record<string, unknown> = { status: r.status };
    if (r.agregador !== undefined) patch.agregador = r.agregador;
    if (r.agregador_ref !== undefined) patch.agregador_ref = r.agregador_ref;
    if (r.numero !== undefined) patch.numero = r.numero;
    if (r.chave_acesso !== undefined) patch.chave_acesso = r.chave_acesso;
    if (r.xml_url !== undefined) patch.xml_url = r.xml_url;
    if (r.pdf_url !== undefined) patch.pdf_url = r.pdf_url;
    if (r.mensagem !== undefined) patch.mensagem = r.mensagem;
    if (r.status === 'autorizada') patch.emitida_em = new Date().toISOString();
    if (r.status === 'cancelada') patch.cancelada_em = new Date().toISOString();

    const { data, error } = (await withTimeout(
      getSupabase().from('notas_fiscais').update(patch).eq('id', id).select(COLS).single()
    )) as QueryResult<NotaFiscal>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao registrar o retorno da nota.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Atualiza só o status da nota (transições simples do ciclo de vida). */
export async function atualizarStatusNota(id: string, status: StatusNota): Promise<FetchState<NotaFiscal>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('notas_fiscais').update({ status }).eq('id', id).select(COLS).single()
    )) as QueryResult<NotaFiscal>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao atualizar o status da nota.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
