/**
 * Adapter de REFERÊNCIA para a Focus NFe (https://focusnfe.com.br).
 *
 * STUB INTENCIONAL: nada de credencial real, nada de chamada HTTP real ainda.
 * Enquanto não houver token configurado (`process.env.FISCAL_FOCUS_TOKEN`),
 * os três métodos LANÇAM, deixando explícito que a integração não está pronta.
 * Os TODOs marcam exatamente onde entraria o `fetch` quando for a hora.
 *
 * ── Shape típico da API Focus NFe ─────────────────────────────────────────
 * Autenticação: HTTP Basic, token como usuário e senha vazia
 *   Authorization: Basic base64(`${FISCAL_FOCUS_TOKEN}:`)
 * Ambientes: produção (https://api.focusnfe.com.br) e homologação
 *   (https://homologacao.focusnfe.com.br).
 *
 * 1) EMITIR — POST assíncrono com REF IDEMPOTENTE escolhida por nós:
 *      NFS-e: POST /v2/nfse?ref={ref}
 *      NF-e:  POST /v2/nfe?ref={ref}
 *    A `ref` (usamos o osComercialId) é a chave de idempotência: reenviar a
 *    mesma ref não duplica a nota. A resposta inicial costuma vir com
 *    { status: "processando_autorizacao" } (HTTP 202) — a SEFAZ/prefeitura
 *    processa de forma assíncrona.
 *
 * 2) AUTORIZAÇÃO (assíncrona) chega por DUAS vias equivalentes:
 *      a) Consulta (polling):   GET /v2/nfse/{ref}  ou  GET /v2/nfe/{ref}
 *      b) Callback (webhook):   a Focus faz POST na nossa URL quando muda de
 *         estado. Preferir o webhook a polling agressivo.
 *    No estado final { status: "autorizado" } o payload traz numero, e nos
 *    links: caminho_xml_nota_fiscal e caminho_danfe / caminho_pdf, além de
 *    chave_nfe (NF-e). Em falha: { status: "erro_autorizacao", mensagem_sefaz }.
 *
 * 3) CANCELAR — DELETE com justificativa (>= 15 caracteres, regra SEFAZ):
 *      DELETE /v2/nfse/{ref}  ou  DELETE /v2/nfe/{ref}   body: { justificativa }
 *
 * Mapeamento de status Focus -> StatusNota:
 *   processando_autorizacao        -> 'processando'
 *   autorizado                     -> 'autorizada'
 *   cancelado                      -> 'cancelada'
 *   erro_autorizacao / denegado    -> 'rejeitada'
 */

import type { AgregadorFiscal, NotaInput, NotaResultado } from './types';

const MENSAGEM_NAO_CONFIGURADO =
  'Agregador fiscal não configurado: defina FISCAL_AGREGADOR e a chave de API.';

export class FocusNfeAgregador implements AgregadorFiscal {
  readonly nome = 'focus';

  /**
   * Lê o token só quando um método é chamado (não no construtor), para que
   * instanciar o adapter nunca quebre — quebra apenas no uso sem credencial.
   */
  private requireToken(): string {
    const token = process.env.FISCAL_FOCUS_TOKEN;
    if (!token) throw new Error(MENSAGEM_NAO_CONFIGURADO);
    return token;
  }

  async emitir(input: NotaInput): Promise<NotaResultado> {
    this.requireToken();
    // TODO(fiscal): POST /v2/{tipo}?ref={input.osComercialId} com auth Basic
    //   (token:'') e o payload mapeado de NotaInput -> schema Focus. Resposta
    //   202 vira { status: 'processando', agregador: this.nome, agregadorRef }.
    void input;
    throw new Error(MENSAGEM_NAO_CONFIGURADO);
  }

  async consultar(agregadorRef: string): Promise<NotaResultado> {
    this.requireToken();
    // TODO(fiscal): GET /v2/{tipo}/{agregadorRef}; mapear status Focus ->
    //   StatusNota e extrair numero/chave_nfe/caminho_xml/caminho_pdf.
    void agregadorRef;
    throw new Error(MENSAGEM_NAO_CONFIGURADO);
  }

  async cancelar(agregadorRef: string, motivo: string): Promise<NotaResultado> {
    this.requireToken();
    // TODO(fiscal): DELETE /v2/{tipo}/{agregadorRef} com { justificativa: motivo }
    //   (mínimo 15 caracteres). Sucesso vira { status: 'cancelada', ... }.
    void agregadorRef;
    void motivo;
    throw new Error(MENSAGEM_NAO_CONFIGURADO);
  }
}
