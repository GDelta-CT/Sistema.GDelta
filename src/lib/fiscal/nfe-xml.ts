/**
 * Parser de XML de NF-e (modelo 55) de COMPRA — leitura no CLIENTE via DOMParser.
 *
 * O QUE FAZ: lê o XML da nota do fornecedor (subido pelo dono) e extrai, sem
 * digitação dupla, os itens da nota (`infNFe > det > prod`) e o emitente
 * (`emit > xNome`/`CNPJ`) para alimentar a entrada de estoque. NÃO toca em rede
 * nem em Supabase — é função pura, roda 100% no browser.
 *
 * POR QUE no client: o XML é um arquivo local do usuário; parsear no browser
 * evita upload do arquivo cru e dá pré-visualização instantânea. O `DOMParser`
 * é nativo (disponível em runtime de navegador); este módulo só é importado por
 * um componente `'use client'`.
 *
 * HONESTIDADE DE ERRO (nunca quebra): todo retorno é um discriminated union
 * `{ ok: true, ... } | { ok: false, erro }`. XML malformado, arquivo que não é
 * NF-e, ou nota sem itens viram um `erro` legível em PT-BR — jamais um throw que
 * derruba a tela.
 *
 * NÓS DA SEFAZ (layout NF-e 4.00):
 *  - infNFe > det[*] > prod: cProd, xProd, qCom, vUnCom, uCom, cEAN
 *  - infNFe > emit: xNome, CNPJ (ou CPF, em produtor rural pessoa física)
 * O namespace `http://www.portalfiscal.inf.br/nfe` é IGNORADO de propósito: a
 * busca é por nome local da tag (getElementsByTagName casa com/sem prefixo), o
 * que torna o parser tolerante a XML com ou sem prefixo de namespace.
 */

/** Um item lido do XML (um nó `det > prod`), já com números convertidos. */
export type NfeItemLido = {
  /** Código do produto no fornecedor (`cProd`) — chave de casamento primária. */
  codigo: string;
  /** Descrição do produto (`xProd`). */
  descricao: string;
  /** Quantidade comercial (`qCom`). */
  quantidade: number;
  /** Valor unitário comercial (`vUnCom`). */
  valorUnitario: number;
  /** Unidade comercial (`uCom`), ex.: UN, PC, KG. Normalizada p/ minúscula. */
  unidade: string;
  /** Código de barras (`cEAN`), quando informado e diferente de "SEM GTIN". */
  ean: string | null;
  /** Total da linha (quantidade × valorUnitario), pré-calculado p/ a tela. */
  total: number;
};

/** Dados do emitente (fornecedor) da nota. */
export type NfeEmitente = {
  /** Razão social / nome (`xNome`). */
  nome: string;
  /** CNPJ (ou CPF) do emitente, só dígitos, ou `null` se ausente. */
  documento: string | null;
};

/** Resultado do parse: ou os dados lidos, ou um erro legível (nunca throw). */
export type NfeParseResultado =
  | { ok: true; emitente: NfeEmitente; itens: NfeItemLido[]; numero: string | null }
  | { ok: false; erro: string };

/** Lê o texto da primeira tag `tag` dentro de `escopo` (por nome local). */
function texto(escopo: Element | Document, tag: string): string | null {
  const el = escopo.getElementsByTagName(tag)[0];
  const t = el?.textContent?.trim();
  return t ? t : null;
}

/**
 * Converte um número no formato da SEFAZ (ponto decimal, sem milhar) para
 * `number`. Tolera vírgula decimal por segurança. `null`/vazio → 0.
 */
function parseNumero(v: string | null): number {
  if (!v) return 0;
  // SEFAZ usa ponto decimal; trocamos vírgula por ponto só por robustez.
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Só os dígitos de um documento (CNPJ/CPF), ou `null` se não sobrar nada. */
function soDigitos(v: string | null): string | null {
  if (!v) return null;
  const d = v.replace(/\D+/g, '');
  return d ? d : null;
}

/** EAN "SEM GTIN" (placeholder oficial da SEFAZ) não é um código real. */
function eanValido(v: string | null): string | null {
  if (!v) return null;
  const up = v.trim().toUpperCase();
  if (!up || up === 'SEM GTIN') return null;
  return v.trim();
}

/**
 * Parseia o conteúdo (string) de um XML de NF-e modelo 55.
 *
 * Caminho feliz: devolve `{ ok: true, emitente, itens, numero }`. Qualquer
 * problema (não-XML, parser error, sem `infNFe`, sem itens) devolve
 * `{ ok: false, erro }` com mensagem acionável em PT-BR.
 */
export function parseNfeXml(conteudo: string): NfeParseResultado {
  const texto0 = conteudo?.trim();
  if (!texto0) {
    return { ok: false, erro: 'O arquivo está vazio. Selecione o XML da nota.' };
  }

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(texto0, 'application/xml');
  } catch {
    return { ok: false, erro: 'Não foi possível ler o arquivo como XML.' };
  }

  // DOMParser não lança em XML inválido: ele injeta um <parsererror>.
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return {
      ok: false,
      erro: 'XML inválido ou corrompido. Confirme que é o arquivo .xml original da nota.',
    };
  }

  // Tem que parecer uma NF-e: precisa do nó infNFe (chave do layout).
  const infNFe = doc.getElementsByTagName('infNFe')[0];
  if (!infNFe) {
    return {
      ok: false,
      erro: 'Este XML não parece ser uma NF-e (nó infNFe não encontrado). Use o XML da nota de compra.',
    };
  }

  // Emitente (fornecedor). xNome é obrigatório numa NF-e válida.
  const emitEl = infNFe.getElementsByTagName('emit')[0];
  const nomeEmit = emitEl ? texto(emitEl, 'xNome') : null;
  const docEmit = emitEl ? soDigitos(texto(emitEl, 'CNPJ') ?? texto(emitEl, 'CPF')) : null;
  const emitente: NfeEmitente = {
    nome: nomeEmit ?? 'Fornecedor não identificado',
    documento: docEmit,
  };

  // Número da nota (ide > nNF) — só para exibição/observação.
  const ideEl = infNFe.getElementsByTagName('ide')[0];
  const numero = ideEl ? texto(ideEl, 'nNF') : null;

  // Itens: cada det > prod. Iteramos pelos <prod> dentro de infNFe.
  const prods = infNFe.getElementsByTagName('prod');
  const itens: NfeItemLido[] = [];
  for (let i = 0; i < prods.length; i++) {
    const prod = prods[i];
    const descricao = texto(prod, 'xProd');
    // Sem descrição não há item utilizável — pula linhas degeneradas.
    if (!descricao) continue;
    const quantidade = parseNumero(texto(prod, 'qCom'));
    const valorUnitario = parseNumero(texto(prod, 'vUnCom'));
    itens.push({
      codigo: texto(prod, 'cProd') ?? '',
      descricao,
      quantidade,
      valorUnitario,
      unidade: (texto(prod, 'uCom') ?? 'un').toLowerCase(),
      ean: eanValido(texto(prod, 'cEAN')),
      total: quantidade * valorUnitario,
    });
  }

  if (itens.length === 0) {
    return {
      ok: false,
      erro: 'A nota foi lida, mas nenhum item de produto foi encontrado (nós det/prod ausentes).',
    };
  }

  return { ok: true, emitente, itens, numero };
}
