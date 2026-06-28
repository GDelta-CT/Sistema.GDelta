/**
 * Rota PÚBLICA da proposta — /orcamento/[token].
 *
 * SEM guarda de sessão: é o CLIENTE FINAL que abre, sem login. Não há
 * middleware no projeto e esta página NÃO chama auth.getSession(); a segurança
 * é o token (credencial) + a RPC cliente-safe `orcamento_publico` (a fronteira
 * está no banco). O cliente JAMAIS vê custo/margem/lucro — o tipo da proposta
 * sequer carrega esses campos.
 *
 * Server component fino: só resolve o `token` (params é Promise no App Router
 * do Next 16) e entrega ao client component que faz as RPCs e a interação de
 * aprovar.
 */

import type { Metadata } from 'next';
import { PropostaPublicaView } from './proposta-publica';

export const metadata: Metadata = {
  title: 'Orçamento · GDelta',
  description: 'Confira os itens do seu orçamento e aprove pelo link.',
  // Proposta privada por token: não indexar em buscadores.
  robots: { index: false, follow: false },
};

export default async function OrcamentoPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PropostaPublicaView token={token} />;
}
