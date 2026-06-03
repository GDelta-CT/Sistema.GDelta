/**
 * Camada de dados do módulo Veículo (Fase 1).
 * Mesmo padrão do Clientes. oficina_id é auto-preenchido pelo trigger (JWT);
 * a RLS isola por oficina. Placa normalizada em maiúsculas (única por oficina).
 */

import { getSupabase } from './client';
import type { FetchState } from './clientes';

export type Veiculo = {
  id: string;
  cliente_id: string | null;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano_modelo: string | null;
  combustivel: string | null;
  cor: string | null;
  chassi: string | null;
  renavam: string | null;
  fipe_codigo: string | null;
  fipe_valor: number | null;
  criado_em: string;
};

export type VeiculoComCliente = Veiculo & { cliente: { nome: string } | null };

const TIMEOUT_MS = 8000;
const COLS = 'id, cliente_id, placa, marca, modelo, ano_modelo, combustivel, cor, chassi, renavam, fipe_codigo, fipe_valor, criado_em';
const COLS_COM_CLIENTE = `${COLS}, cliente:clientes(nome)`;

function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Conexão demorou demais. Verifique a internet.')), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('duplicate') || m.includes('unique') || m.includes('23505')) return 'Já existe um veículo com essa placa nesta oficina.';
  if (m.includes('jwt') || m.includes('invalid api key')) return 'Sessão inválida. Faça login de novo.';
  if (m.includes('permission') || m.includes('rls') || m.includes('policy') || m.includes('denied')) return 'Sem permissão para esta ação.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com o servidor.';
  return msg;
}

/** Maiúsculas + só letras/números (ABC1D23 / ABC1234). */
export function normalizarPlaca(crua: string): string {
  return (crua || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Chassi (VIN): maiúsculas, só letras/números, no máx. 17 caracteres. */
export function normalizarChassi(s: string): string {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
}

/** RENAVAM: só dígitos, no máx. 11 caracteres. */
export function normalizarRenavam(s: string): string {
  return (s || '').replace(/\D/g, '').slice(0, 11);
}

/** Hint suave: chassi (VIN) costuma ter exatamente 17 caracteres alfanuméricos. Nunca bloqueia. */
export function chassiPareceValido(s: string): boolean {
  return /^[A-Z0-9]{17}$/.test(normalizarChassi(s));
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

export async function listarVeiculos(): Promise<FetchState<VeiculoComCliente[]>> {
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('veiculos').select(COLS_COM_CLIENTE).order('criado_em', { ascending: false })
    )) as QueryResult<VeiculoComCliente[]>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data || data.length === 0) return { status: 'empty' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

/** Busca-antes-de-criar: procura um veículo pela placa (já normalizada). */
export async function buscarVeiculoPorPlaca(placaCrua: string): Promise<FetchState<Veiculo | null>> {
  const placa = normalizarPlaca(placaCrua);
  if (placa.length < 7) return { status: 'error', message: 'Placa inválida (confira os 7 caracteres).' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('veiculos').select(COLS).eq('placa', placa).maybeSingle()
    )) as QueryResult<Veiculo>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    return { status: 'success', data: data ?? null };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export type VeiculoInput = {
  placa: string;
  cliente_id?: string | null;
  marca?: string | null;
  modelo?: string | null;
  ano_modelo?: string | null;
  combustivel?: string | null;
  cor?: string | null;
  chassi?: string | null;
  renavam?: string | null;
  fipe_codigo?: string | null;
  fipe_valor?: number | null;
};

export async function criarVeiculo(input: VeiculoInput): Promise<FetchState<Veiculo>> {
  const placa = normalizarPlaca(input.placa);
  if (placa.length < 7) return { status: 'error', message: 'Placa inválida (confira os 7 caracteres).' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase()
        .from('veiculos')
        .insert({
          placa,
          cliente_id: input.cliente_id ?? null,
          marca: input.marca?.trim() || null,
          modelo: input.modelo?.trim() || null,
          ano_modelo: input.ano_modelo?.trim() || null,
          combustivel: input.combustivel?.trim() || null,
          cor: input.cor?.trim() || null,
          chassi: input.chassi ? normalizarChassi(input.chassi) || null : null,
          renavam: input.renavam ? normalizarRenavam(input.renavam) || null : null,
          fipe_codigo: input.fipe_codigo?.trim() || null,
          fipe_valor: input.fipe_valor ?? null,
        }) // oficina_id preenchido pelo trigger a partir do JWT
        .select(COLS)
        .single()
    )) as QueryResult<Veiculo>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao criar o veículo.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

export async function atualizarVeiculo(id: string, input: Partial<VeiculoInput>): Promise<FetchState<Veiculo>> {
  const patch: Record<string, unknown> = {};
  if (input.placa !== undefined) patch.placa = normalizarPlaca(input.placa);
  if (input.cliente_id !== undefined) patch.cliente_id = input.cliente_id;
  if (input.marca !== undefined) patch.marca = input.marca?.trim() || null;
  if (input.modelo !== undefined) patch.modelo = input.modelo?.trim() || null;
  if (input.ano_modelo !== undefined) patch.ano_modelo = input.ano_modelo?.trim() || null;
  if (input.combustivel !== undefined) patch.combustivel = input.combustivel?.trim() || null;
  if (input.cor !== undefined) patch.cor = input.cor?.trim() || null;
  if (input.chassi !== undefined) patch.chassi = input.chassi ? normalizarChassi(input.chassi) || null : null;
  if (input.renavam !== undefined) patch.renavam = input.renavam ? normalizarRenavam(input.renavam) || null : null;
  if (input.fipe_codigo !== undefined) patch.fipe_codigo = input.fipe_codigo?.trim() || null;
  if (input.fipe_valor !== undefined) patch.fipe_valor = input.fipe_valor;
  if (Object.keys(patch).length === 0) return { status: 'error', message: 'Nada para atualizar.' };
  try {
    const { data, error } = (await withTimeout(
      getSupabase().from('veiculos').update(patch).eq('id', id).select(COLS).single()
    )) as QueryResult<Veiculo>;
    if (error) return { status: 'error', message: traduzirErro(error.message) };
    if (!data) return { status: 'error', message: 'Falha ao atualizar o veículo.' };
    return { status: 'success', data };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
