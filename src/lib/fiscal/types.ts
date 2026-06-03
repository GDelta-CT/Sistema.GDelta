/**
 * Contrato AGNÓSTICO de agregador fiscal (Focus NFe / Nuvem Fiscal / PlugNotas).
 *
 * O resto do sistema fala com a interface `AgregadorFiscal` e NUNCA com um
 * provedor específico: trocar de agregador é trocar a implementação, não o
 * código que emite a nota. Os tipos abaixo são o denominador comum entre os
 * agregadores — campos opcionais cobrem o que só existe em parte deles
 * (ex.: `chaveAcesso` é de NF-e; NFS-e municipal normalmente não tem).
 */

/** NFS-e (serviço, municipal) ou NF-e (produto, estadual/SEFAZ). */
export type TipoNota = 'nfse' | 'nfe';

/**
 * Ciclo de vida normalizado da nota, independente do agregador:
 *  - rascunho:    montada localmente, ainda não enviada;
 *  - processando: enviada, aguardando autorização assíncrona da SEFAZ/prefeitura;
 *  - autorizada:  emitida com sucesso (tem numero/xml/pdf);
 *  - rejeitada:   recusada (ver `mensagem` para o motivo);
 *  - cancelada:   autorizada e depois cancelada.
 */
export type StatusNota = 'rascunho' | 'processando' | 'autorizada' | 'rejeitada' | 'cancelada';

/** Dados mínimos para emitir uma nota, vindos da OS Comercial. */
export type NotaInput = {
  osComercialId: string;
  tipo: TipoNota;
  valor: number;
  tomador: { nome: string; documento: string | null };
  descricao?: string;
};

/** Retorno normalizado de qualquer operação (emitir/consultar/cancelar). */
export type NotaResultado = {
  status: StatusNota;
  /** Identificador do agregador que produziu o resultado (ex.: 'focus'). */
  agregador: string;
  /** Referência opaca do agregador, usada para consultar/cancelar depois. */
  agregadorRef?: string | null;
  numero?: string | null;
  chaveAcesso?: string | null;
  xmlUrl?: string | null;
  pdfUrl?: string | null;
  /** Motivo de rejeição/cancelamento ou aviso, quando houver. */
  mensagem?: string | null;
};

/**
 * Porta de saída do sistema para o mundo fiscal. Toda implementação concreta
 * (FocusNfeAgregador, etc.) honra este contrato; o app só conhece esta forma.
 */
export interface AgregadorFiscal {
  /** Nome estável do agregador, espelhado em `NotaResultado.agregador`. */
  readonly nome: string;
  /** Envia a nota para emissão. Tipicamente retorna status 'processando'. */
  emitir(input: NotaInput): Promise<NotaResultado>;
  /** Consulta o estado atual de uma nota pela referência do agregador. */
  consultar(agregadorRef: string): Promise<NotaResultado>;
  /** Solicita o cancelamento de uma nota já autorizada. */
  cancelar(agregadorRef: string, motivo: string): Promise<NotaResultado>;
}
