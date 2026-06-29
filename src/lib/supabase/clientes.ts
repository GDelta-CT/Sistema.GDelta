/**
 * Camada de dados do módulo Clientes (Fase 1).
 * Padrão idêntico ao do Totem: FetchState + timeout + erros traduzidos.
 * O oficina_id NÃO é enviado nos inserts — o trigger set_oficina_id_from_jwt
 * preenche a partir do JWT (regra "sem digitação dupla"); a RLS garante o isolamento.
 */

import { getSupabase } from './client';
import { DEMO } from '@/lib/demo/mode';

export type TipoCliente = 'particular' | 'seguradora' | 'cooperativa';

export type Cliente = {
  id: string;
  tipo: TipoCliente;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
  criado_em: string;
};

export type FetchState<T> =
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export const TIPOS_CLIENTE: { id: TipoCliente; nome: string }[] = [
  { id: 'particular', nome: 'Particular' },
  { id: 'seguradora', nome: 'Seguradora' },
  { id: 'cooperativa', nome: 'Cooperativa' },
];

const TIMEOUT_MS = 8000;
const COLS = 'id, tipo, nome, documento, email, telefone, observacoes, ativo, criado_em';

function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Conexão demorou demais. Verifique a internet.')), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('duplicate') || m.includes('unique') || m.includes('23505')) return 'Já existe um registro com esse dado nesta oficina.';
  if (m.includes('jwt') || m.includes('invalid api key')) return 'Sessão inválida. Faça login de novo.';
  if (m.includes('permission') || m.includes('rls') || m.includes('policy') || m.includes('denied')) return 'Sem permissão para esta ação.';
  if (m.includes('check constraint') || m.includes('violates check')) return 'Dados inválidos para esta operação.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com o servidor.';
  return msg;
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

export async function listarClientes(apenasAtivos = true): Promise<FetchState<Cliente[]>> {
  // MODO DEMO: cadastro fictício de clientes (mix seguradora/particular/coop).
  if (DEMO) {
    const { CLIENTES_DEMO } = await import('@/lib/demo/dataset');
    const lista = apenasAtivos ? CLIENTES_DEMO.filter((c) => c.ativo) : CLIENTES_DEMO;
    return lista.length === 0 ? { status: 'empty' } : { status: 'success', data: lista };
  }
  try {
    let q = getSupabase().from('clientes').select(COLS).order('nome', { ascending: true });
    if (apenasAtivos) q = q.eq('ativo', true);
    const { data, error } = (await withTimeout(q)) as QueryResult<Cliente[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function buscarClientePorId(id: string): Promise<FetchState<Cliente>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('clientes').select(COLS).eq('id', id).maybeSingle()
    )) as QueryResult<Cliente>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type ClienteInput = {
  tipo: TipoCliente;
  nome: string;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
};

export async function criarCliente(input: ClienteInput): Promise<FetchState<Cliente>> {
  const nome = input.nome.trim();
  if (!nome) return { status: 'error', message: 'Informe o nome do cliente.' };
  // MODO DEMO: nada é persistido; mensagem honesta (sem tocar no Supabase).
  if (DEMO) return { status: 'error', message: 'Modo demonstração: dados fictícios não são salvos.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('clientes')
        .insert({
          tipo: input.tipo,
          nome,
          documento: input.documento?.trim() || null,
          email: input.email?.trim() || null,
          telefone: input.telefone?.trim() || null,
          observacoes: input.observacoes?.trim() || null,
        }) // oficina_id é preenchido pelo trigger a partir do JWT
        .select(COLS)
        .single()
    )) as QueryResult<Cliente>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao criar o cliente.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function atualizarCliente(id: string, input: Partial<ClienteInput>): Promise<FetchState<Cliente>> {
  const patch: Record<string, unknown> = {};
  if (input.tipo !== undefined) patch.tipo = input.tipo;
  if (input.nome !== undefined) patch.nome = input.nome.trim();
  if (input.documento !== undefined) patch.documento = input.documento?.trim() || null;
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.telefone !== undefined) patch.telefone = input.telefone?.trim() || null;
  if (input.observacoes !== undefined) patch.observacoes = input.observacoes?.trim() || null;
  if (Object.keys(patch).length === 0) return { status: 'error', message: 'Nada para atualizar.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('clientes').update(patch).eq('id', id).select(COLS).single()
    )) as QueryResult<Cliente>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao atualizar o cliente.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Soft-delete: nunca apaga de verdade (preserva histórico de OS/orçamento). */
export async function setClienteAtivo(id: string, ativo: boolean): Promise<FetchState<Cliente>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('clientes').update({ ativo }).eq('id', id).select(COLS).single()
    )) as QueryResult<Cliente>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao mudar o status do cliente.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
