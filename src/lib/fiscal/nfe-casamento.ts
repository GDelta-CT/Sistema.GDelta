/**
 * Casamento (matching) dos itens lidos da NF-e com o estoque já existente.
 *
 * POR QUE existe: a NF-e do fornecedor traz `cProd` (código DELE) e `xProd`
 * (descrição). O estoque do GDelta identifica item por `nome` (único por
 * oficina) — não há, hoje, coluna de "código do fornecedor". Então o casamento
 * possível e honesto é por DESCRIÇÃO normalizada: se a descrição da nota bate
 * com o nome de um item existente, é ATUALIZAÇÃO; senão, é NOVO.
 *
 * Função pura (sem rede / sem Supabase): recebe os itens da nota + os itens do
 * estoque e devolve, para cada linha da nota, a sugestão de casamento. A tela
 * pode então deixar o usuário confirmar/ajustar antes de gravar.
 *
 * Normalização: minúsculas, sem acento, espaços colapsados. É deliberadamente
 * conservadora — na dúvida, marca como NOVO (o usuário corrige), nunca funde
 * dois itens diferentes silenciosamente.
 */

import type { NfeItemLido } from './nfe-xml';
import type { EstoqueItem } from '@/lib/supabase/estoque';

/** Item de estoque mínimo para o casamento (só o que o matcher precisa). */
export type ItemEstoqueRef = Pick<EstoqueItem, 'id' | 'nome' | 'unidade'>;

/** Uma linha da nota já casada (ou não) com um item do estoque. */
export type LinhaCasada = {
  /** O item como lido do XML. */
  origem: NfeItemLido;
  /** id do item de estoque casado, ou `null` quando é item NOVO. */
  itemId: string | null;
  /** Nome do item de estoque casado (para exibir), ou `null` se novo. */
  itemNome: string | null;
};

/** Normaliza um texto para comparar descrição × nome (sem acento, minúsculo). */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (combining marks)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Casa cada item da nota com o estoque por descrição normalizada.
 *
 * Determinístico e simples: monta um índice nome-normalizado → item e procura
 * correspondência exata da descrição da nota. Sem fuzzy/heurística frágil — o
 * objetivo é não errar para mais (fundir itens distintos), e o usuário ainda
 * confirma na tela.
 */
export function casarItens(
  itensNota: NfeItemLido[],
  estoque: ItemEstoqueRef[]
): LinhaCasada[] {
  const porNome = new Map<string, ItemEstoqueRef>();
  for (const it of estoque) {
    porNome.set(normalizar(it.nome), it);
  }

  return itensNota.map((origem) => {
    const match = porNome.get(normalizar(origem.descricao));
    return {
      origem,
      itemId: match ? match.id : null,
      itemNome: match ? match.nome : null,
    };
  });
}
