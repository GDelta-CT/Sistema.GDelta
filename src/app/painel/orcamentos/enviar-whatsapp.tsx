'use client';

/**
 * EnviarWhatsApp — botão "Enviar pro cliente (WhatsApp)" da tela INTERNA do
 * orçamento (visão do DONO). Monta o link público da proposta a partir do
 * `share_token` e abre o wa.me com uma mensagem cordial + o link.
 *
 * Três estados HONESTOS, sem nunca quebrar a tela:
 *  - sem `share_token` (migration 0021 não aplicada) → botão desabilitado com a
 *    dica "Disponível ao aplicar a migration 0021".
 *  - cliente sem telefone → botão desabilitado com a dica "Cadastre o telefone
 *    do cliente para enviar pelo WhatsApp".
 *  - pronto → botão ativo que abre o WhatsApp e oferece "ver como o cliente vê".
 *
 * Não toca em custo/margem: o link só carrega o token; a proposta pública é
 * renderizada pela rota /orcamento/[token], que lê a RPC cliente-safe.
 */

import { useState } from 'react';
import Link from 'next/link';
import { WhatsappLogo, Eye, Copy, Check, Info } from '@phosphor-icons/react';
import {
  montarLinkPublico,
  montarLinkWhatsApp,
  telefoneDigitsOnly,
} from '@/lib/supabase/orcamento-publico';

type Props = {
  /** Token público do orçamento (migration 0021). Ausente = 0021 não aplicada. */
  shareToken?: string;
  /** Telefone cru do cliente (pode vir nulo). */
  telefoneCliente: string | null;
  /** Nome do cliente, para personalizar a mensagem. */
  clienteNome?: string | null;
  /** Nome da oficina, para assinar a mensagem (quando disponível). */
  oficinaNome?: string | null;
};

const TIP_CLASSE =
  'inline-flex items-center gap-1.5 rounded-control border border-dashed border-border bg-surface-sunken px-3 py-2 text-caption text-fg-subtle';

export function EnviarWhatsApp({ shareToken, telefoneCliente, clienteNome, oficinaNome }: Props) {
  const [copiado, setCopiado] = useState(false);

  // Estado honesto 1: a 0021 ainda não foi aplicada (sem token, sem como montar o link).
  if (!shareToken) {
    return (
      <p className={TIP_CLASSE} role="note">
        <Info size={15} weight="fill" aria-hidden className="shrink-0" />
        Enviar pro cliente: disponível ao aplicar a migration 0021.
      </p>
    );
  }

  const link = montarLinkPublico(
    typeof window !== 'undefined' ? window.location.origin : '',
    shareToken
  );
  const temTelefone = telefoneDigitsOnly(telefoneCliente).length > 0;
  const waUrl = montarLinkWhatsApp({
    telefone: telefoneCliente,
    clienteNome,
    oficinaNome,
    link,
  });

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem clipboard (contexto inseguro): silencioso — o "ver como o cliente vê"
      // já abre o link, então o dono ainda consegue copiar da barra do navegador.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {temTelefone && waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-success px-4 py-2 text-small font-semibold text-on-success shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-default hover:shadow-md active:scale-[0.98]"
        >
          <WhatsappLogo size={16} weight="fill" aria-hidden />
          Enviar pro cliente (WhatsApp)
        </a>
      ) : (
        <span className={TIP_CLASSE} role="note">
          <Info size={15} weight="fill" aria-hidden className="shrink-0" />
          Cadastre o telefone do cliente para enviar pelo WhatsApp.
        </span>
      )}

      {/* "Ver como o cliente vê" — abre a rota pública na visão do cliente. */}
      <Link
        href={`/orcamento/${shareToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        <Eye size={16} weight="bold" aria-hidden />
        Ver como o cliente vê
      </Link>

      <button
        type="button"
        onClick={copiarLink}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        {copiado ? (
          <>
            <Check size={16} weight="bold" aria-hidden className="text-success" />
            Link copiado
          </>
        ) : (
          <>
            <Copy size={16} weight="bold" aria-hidden />
            Copiar link
          </>
        )}
      </button>
    </div>
  );
}
