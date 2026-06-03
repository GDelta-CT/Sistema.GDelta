/**
 * Ponto de entrada da camada fiscal agnóstica.
 *
 * O app chama `getAgregador()` e recebe um `AgregadorFiscal` — sem saber qual
 * provedor está por trás. A seleção é por env (`FISCAL_AGREGADOR`); quando nada
 * está configurado, devolve um `NullAgregador` que falha de forma clara em vez
 * de silenciosamente não emitir (fail-fast, não fail-silent).
 */

import type { AgregadorFiscal, NotaInput, NotaResultado } from './types';
import { FocusNfeAgregador } from './focus-nfe';

// Re-export do contrato para quem consome a camada importar tudo de um lugar só.
export type {
  AgregadorFiscal,
  NotaInput,
  NotaResultado,
  TipoNota,
  StatusNota,
} from './types';
export { FocusNfeAgregador } from './focus-nfe';

const MENSAGEM_NULL = 'Agregador fiscal não configurado.';

/**
 * Implementação nula (Null Object): satisfaz o contrato mas sempre lança.
 * Mantém o resto do código livre de checagens `if (agregador)` — a falha
 * acontece no ponto de uso, com mensagem explícita.
 */
class NullAgregador implements AgregadorFiscal {
  readonly nome = 'none';

  async emitir(input: NotaInput): Promise<NotaResultado> {
    void input;
    throw new Error(MENSAGEM_NULL);
  }

  async consultar(agregadorRef: string): Promise<NotaResultado> {
    void agregadorRef;
    throw new Error(MENSAGEM_NULL);
  }

  async cancelar(agregadorRef: string, motivo: string): Promise<NotaResultado> {
    void agregadorRef;
    void motivo;
    throw new Error(MENSAGEM_NULL);
  }
}

/**
 * Resolve o agregador fiscal ativo a partir do ambiente.
 *
 * - `FISCAL_AGREGADOR=focus` + `FISCAL_FOCUS_TOKEN` presente -> FocusNfeAgregador.
 * - qualquer outro caso (não definido, provedor desconhecido, token ausente)
 *   -> NullAgregador, que lança ao ser usado.
 */
export function getAgregador(): AgregadorFiscal {
  const agregador = process.env.FISCAL_AGREGADOR;

  if (agregador === 'focus' && process.env.FISCAL_FOCUS_TOKEN) {
    return new FocusNfeAgregador();
  }

  return new NullAgregador();
}
