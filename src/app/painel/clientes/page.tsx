'use client';

import { useCallback, useEffect, useState, type ComponentType, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Buildings,
  CalendarCheck,
  CurrencyDollar,
  IdentificationCard,
  MagnifyingGlass,
  Phone,
  Plus,
  User,
  UsersThree,
  UserPlus,
  WarningCircle,
  type IconProps,
} from '@phosphor-icons/react';
import { getSupabase } from '@/lib/supabase/client';
import {
  listarClientes,
  criarCliente,
  TIPOS_CLIENTE,
  type Cliente,
  type TipoCliente,
} from '@/lib/supabase/clientes';
import { upsertSeguradoraPerfil } from '@/lib/supabase/seguradoras';
import { PainelSkeleton } from '@/components/skeleton';

type Estado = 'carregando' | 'pronto';

const inp =
  'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary';

/** Input com adorno de ícone à esquerda (decorativo). */
const inpComIcone =
  'min-h-11 w-full rounded-control border border-border bg-surface py-2 pl-10 pr-3 text-small text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary';

const iconeTipo: Record<TipoCliente, ComponentType<IconProps>> = {
  particular: User,
  seguradora: Buildings,
  cooperativa: UsersThree,
};

const chipTipo: Record<TipoCliente, string> = {
  particular: 'bg-surface-sunken text-fg-muted',
  seguradora: 'bg-primary/10 text-primary',
  cooperativa: 'bg-success-tint text-success',
};

/** Realce do avatar/ícone do tipo na lista (coerente com o chip). */
const avatarTipo: Record<TipoCliente, string> = {
  particular: 'bg-surface-sunken text-fg-muted',
  seguradora: 'bg-primary/10 text-primary',
  cooperativa: 'bg-success-tint text-success',
};

export default function ClientesPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoCliente>('particular');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  // Campos extras só da seguradora (entidade de primeira classe).
  const [prazoAprovacao, setPrazoAprovacao] = useState('');
  const [franquiaValor, setFranquiaValor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const r = await listarClientes();
    if (r.status === 'success') setClientes(r.data);
    else if (r.status === 'empty') setClientes([]);
    else setErro(r.message);
    setEstado('pronto');
  }, []);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace('/login');
          return;
        }
        carregar();
      })
      .catch(() => router.replace('/login'));
  }, [router, carregar]);

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setFormErro(null);
    const r = await criarCliente({ tipo, nome, documento, telefone });
    if (r.status !== 'success') {
      setSalvando(false);
      setFormErro(r.status === 'error' ? r.message : 'Não foi possível salvar.');
      return;
    }
    // Seguradora é primeira classe: persiste prazo de aprovação + franquia padrão.
    if (tipo === 'seguradora') {
      const prazo = prazoAprovacao.trim() && Number.isFinite(Number(prazoAprovacao)) ? Number(prazoAprovacao) : null;
      const franquia = franquiaValor.trim() && Number.isFinite(Number(franquiaValor)) ? Number(franquiaValor) : null;
      if (prazo !== null || franquia !== null) {
        const p = await upsertSeguradoraPerfil(r.data.id, {
          prazo_aprovacao_dias: prazo,
          franquia_valor: franquia,
        });
        if (p.status === 'error') {
          // O cliente JÁ foi criado; só o perfil falhou. Reseta o form como num
          // sucesso para o usuário não reenviar e criar uma seguradora duplicada.
          setSalvando(false);
          setNome('');
          setDocumento('');
          setTelefone('');
          setPrazoAprovacao('');
          setFranquiaValor('');
          setTipo('particular');
          setFormErro('Cliente salvo, mas não consegui gravar prazo/franquia. Edite o cliente depois para completar.');
          await carregar();
          return;
        }
      }
    }
    setSalvando(false);
    setNome('');
    setDocumento('');
    setTelefone('');
    setPrazoAprovacao('');
    setFranquiaValor('');
    setTipo('particular');
    await carregar();
  }

  if (estado === 'carregando') {
    return <PainelSkeleton maxWidth="max-w-2xl" />;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">GDelta · Cadastro</p>
          <h1 className="font-display text-h1 text-fg">Clientes</h1>
        </div>
        <Link
          href="/painel"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-small text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          Painel
        </Link>
      </header>

      <form
        onSubmit={adicionar}
        className="mb-10 rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <UserPlus size={20} weight="duotone" />
          </span>
          <div>
            <p className="text-overline uppercase tracking-[0.12em] text-fg-subtle">Novo cliente</p>
            <p className="text-caption text-fg-subtle">Cadastre em segundos.</p>
          </div>
        </div>

        <fieldset className="mb-4">
          <legend className="mb-2 text-caption font-medium text-fg-muted">Tipo</legend>
          {/* Mantém o estado `tipo`/`setTipo`: segmentos acessíveis (radiogroup) substituem o <select>. */}
          <div
            role="radiogroup"
            aria-label="Tipo de cliente"
            className="grid grid-cols-3 gap-2"
          >
            {TIPOS_CLIENTE.map((t) => {
              const Icone = iconeTipo[t.id];
              const ativo = tipo === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setTipo(t.id)}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-control border px-2 py-2.5 text-caption font-medium transition-colors ${
                    ativo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                  }`}
                >
                  <Icone size={20} weight={ativo ? 'fill' : 'regular'} aria-hidden="true" />
                  {t.nome}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente-nome" className="text-caption font-medium text-fg-muted">
              Nome / razão social
            </label>
            <input
              id="cliente-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome / razão social"
              required
              aria-required="true"
              className={inp}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cliente-documento" className="text-caption font-medium text-fg-muted">
                CPF / CNPJ
              </label>
              <div className="relative">
                <IdentificationCard
                  size={18}
                  weight="regular"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  id="cliente-documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="CPF / CNPJ"
                  inputMode="numeric"
                  className={inpComIcone}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cliente-telefone" className="text-caption font-medium text-fg-muted">
                Telefone
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  weight="regular"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  id="cliente-telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Telefone"
                  type="tel"
                  inputMode="tel"
                  className={inpComIcone}
                />
              </div>
            </div>
          </div>

          {/* Seguradora é primeira classe: prazo de aprovação + franquia padrão. */}
          {tipo === 'seguradora' && (
            <div className="grid gap-4 rounded-control border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="seguradora-prazo" className="text-caption font-medium text-fg-muted">
                  Prazo de aprovação (dias)
                </label>
                <div className="relative">
                  <CalendarCheck
                    size={18}
                    weight="regular"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                  />
                  <input
                    id="seguradora-prazo"
                    value={prazoAprovacao}
                    onChange={(e) => setPrazoAprovacao(e.target.value)}
                    placeholder="Ex.: 5"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className={inpComIcone}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="seguradora-franquia" className="text-caption font-medium text-fg-muted">
                  Franquia padrão (R$)
                </label>
                <div className="relative">
                  <CurrencyDollar
                    size={18}
                    weight="regular"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                  />
                  <input
                    id="seguradora-franquia"
                    value={franquiaValor}
                    onChange={(e) => setFranquiaValor(e.target.value)}
                    placeholder="Ex.: 1500,00"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    className={inpComIcone}
                  />
                </div>
              </div>
            </div>
          )}
          {/* TODO seguradora: UI de mão de obra própria (data layer pronto em
              src/lib/supabase/seguradoras.ts: listarMaoDeObra/criarMaoDeObra/removerMaoDeObra).
              Encaixa melhor numa tela de edição da seguradora do que neste form de criação. */}
        </div>

        {formErro && (
          <p role="alert" className="mt-4 flex items-center gap-2 text-small text-danger">
            <WarningCircle size={18} weight="fill" aria-hidden="true" className="shrink-0" />
            {formErro}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60"
        >
          {!salvando && <Plus size={18} weight="bold" aria-hidden="true" />}
          {salvando ? 'Salvando…' : 'Adicionar cliente'}
        </button>
      </form>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-h3 text-fg">Clientes cadastrados</h2>
          {clientes.length > 0 && (
            <span className="font-numeric text-caption tabular-nums text-fg-subtle">
              {clientes.length}
            </span>
          )}
        </div>

        {erro && (
          <p
            role="alert"
            className="mb-3 flex items-center gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3 text-small text-danger"
          >
            <WarningCircle size={18} weight="fill" aria-hidden="true" className="shrink-0" />
            {erro}
          </p>
        )}

        {clientes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-12 text-center">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-pill bg-surface-sunken text-fg-subtle"
              aria-hidden="true"
            >
              <MagnifyingGlass size={24} weight="regular" />
            </span>
            <p className="text-small text-fg-muted">Nenhum cliente ainda. Adicione o primeiro acima.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {clientes.map((c) => {
              const tipoNome = TIPOS_CLIENTE.find((t) => t.id === c.tipo)?.nome ?? c.tipo;
              const Icone = iconeTipo[c.tipo];
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-xs transition-all hover:border-border-strong hover:shadow-sm"
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${avatarTipo[c.tipo]}`}
                    aria-hidden="true"
                  >
                    <Icone size={20} weight="fill" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{c.nome}</p>
                    {(c.documento || c.telefone) && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-fg-subtle">
                        {c.documento && (
                          <span className="inline-flex items-center gap-1">
                            <IdentificationCard size={14} weight="regular" aria-hidden="true" />
                            <span className="truncate">{c.documento}</span>
                          </span>
                        )}
                        {c.telefone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={14} weight="regular" aria-hidden="true" />
                            <span className="truncate">{c.telefone}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-pill px-3 py-1 text-caption font-semibold ${chipTipo[c.tipo]}`}
                  >
                    {tipoNome}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
