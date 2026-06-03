/**
 * Camada de dados — Seguradora como entidade de PRIMEIRA CLASSE (Fase 1).
 * A seguradora é um cliente (tipo 'seguradora'); aqui ficam as extensões que a
 * tornam primeira classe: perfil 1:1 (prazo de aprovação + franquia) e a tabela
 * de mão de obra própria.
 *
 * Mesmo padrão do Clientes/Veículo: FetchState + timeout + erros traduzidos.
 * Reaproveitamos FetchState e traduzirErro de './clientes' (sem reimplementar).
 * O oficina_id NUNCA é enviado nos inserts — o trigger set_oficina_id_from_jwt
 * preenche a partir do JWT; a RLS garante o isolamento por oficina.
 */

import { getSupabase } from './client';
import { traduzirErro, type FetchState } from './clientes';

export type SeguradoraPerfil = {
  cliente_id: string;
  prazo_aprovacao_dias: number | null;
  franquia_valor: number | null;
  observacoes: string | null;
  criado_em: string;
};

export type SeguradoraMaoDeObra = {
  id: string;
  seguradora_cliente_id: string;
  descricao: string;
  valor: number;
  unidade: string | null;
  criado_em: string;
};

const TIMEOUT_MS = 8000;
const COLS_PERFIL = 'cliente_id, prazo_aprovacao_dias, franquia_valor, observacoes, criado_em';
const COLS_MAO_DE_OBRA = 'id, seguradora_cliente_id, descricao, valor, unidade, criado_em';

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

// ---------------------------------------------------------------------------
// Perfil 1:1 da seguradora
// ---------------------------------------------------------------------------

export async function getSeguradoraPerfil(clienteId: string): Promise<FetchState<SeguradoraPerfil>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('seguradora_perfil').select(COLS_PERFIL).eq('cliente_id', clienteId).maybeSingle()
    )) as QueryResult<SeguradoraPerfil>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type SeguradoraPerfilInput = {
  prazo_aprovacao_dias?: number | null;
  franquia_valor?: number | null;
  observacoes?: string | null;
};

/**
 * Cria ou atualiza o perfil da seguradora (1:1 com o cliente).
 * Usa upsert por cliente_id (chave do perfil). oficina_id vem do trigger (JWT).
 */
export async function upsertSeguradoraPerfil(
  clienteId: string,
  input: SeguradoraPerfilInput
): Promise<FetchState<SeguradoraPerfil>> {
  if (!clienteId) return { status: 'error', message: 'Seguradora inválida.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('seguradora_perfil')
        .upsert(
          {
            cliente_id: clienteId,
            prazo_aprovacao_dias: input.prazo_aprovacao_dias ?? null,
            franquia_valor: input.franquia_valor ?? null,
            observacoes: input.observacoes?.trim() || null,
          }, // oficina_id é preenchido pelo trigger a partir do JWT
          { onConflict: 'cliente_id' }
        )
        .select(COLS_PERFIL)
        .single()
    )) as QueryResult<SeguradoraPerfil>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao salvar o perfil da seguradora.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ---------------------------------------------------------------------------
// Mão de obra própria da seguradora
// ---------------------------------------------------------------------------

export async function listarMaoDeObra(seguradoraClienteId: string): Promise<FetchState<SeguradoraMaoDeObra[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('seguradora_mao_de_obra')
        .select(COLS_MAO_DE_OBRA)
        .eq('seguradora_cliente_id', seguradoraClienteId)
        .order('descricao', { ascending: true })
    )) as QueryResult<SeguradoraMaoDeObra[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type MaoDeObraInput = {
  seguradora_cliente_id: string;
  descricao: string;
  valor: number;
  unidade?: string | null;
};

export async function criarMaoDeObra(input: MaoDeObraInput): Promise<FetchState<SeguradoraMaoDeObra>> {
  const descricao = input.descricao.trim();
  if (!input.seguradora_cliente_id) return { status: 'error', message: 'Seguradora inválida.' };
  if (!descricao) return { status: 'error', message: 'Informe a descrição da mão de obra.' };
  if (!Number.isFinite(input.valor)) return { status: 'error', message: 'Informe um valor válido.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('seguradora_mao_de_obra')
        .insert({
          seguradora_cliente_id: input.seguradora_cliente_id,
          descricao,
          valor: input.valor,
          unidade: input.unidade?.trim() || null,
        }) // oficina_id é preenchido pelo trigger a partir do JWT
        .select(COLS_MAO_DE_OBRA)
        .single()
    )) as QueryResult<SeguradoraMaoDeObra>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao salvar a mão de obra.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function removerMaoDeObra(id: string): Promise<FetchState<{ id: string }>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('seguradora_mao_de_obra').delete().eq('id', id).select('id').single()
    )) as QueryResult<{ id: string }>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao remover a mão de obra.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
