import {
  UserCircle,
  Calculator,
  Wrench,
  Quotes,
} from '@phosphor-icons/react/dist/ssr';
import { Reveal } from './reveal';

/**
 * Faixa de posicionamento por persona — a promessa-mãe traduzida para cada
 * pessoa da oficina. Dono / Orçamentista / Operário.
 * Server Component.
 */

const PERSONAS = [
  {
    icon: UserCircle,
    papel: 'Para o dono',
    promessa: 'Saiba se cada carro está dando lucro.',
    texto:
      'O painel responde a pergunta que tira o seu sono: este mês fechou no azul? E qual serviço puxou o resultado?',
  },
  {
    icon: Calculator,
    papel: 'Para o orçamentista',
    promessa: 'Orce vendo o lucro, não no chute.',
    texto:
      'Margem ao vivo a cada item. Você fecha com confiança e para de descobrir o prejuízo só no fim do mês.',
  },
  {
    icon: Wrench,
    papel: 'Para o operário',
    promessa: 'Aponte sua tarefa em dois toques.',
    texto:
      'Sem papel, sem planilha. Abre a OS, toca na tarefa, pronto — e o pátio atualiza sozinho lá no painel.',
  },
];

export function Personas() {
  return (
    <section
      aria-labelledby="personas-titulo"
      className="mx-auto w-full max-w-6xl px-[clamp(1rem,4vw,2rem)] py-[clamp(3.5rem,9vh,6.5rem)]"
    >
      <Reveal className="max-w-2xl">
        <p className="text-overline font-display font-semibold uppercase tracking-[0.08em] text-primary">
          Feito para a oficina inteira
        </p>
        <h2
          id="personas-titulo"
          className="mt-3 font-display text-h1 font-bold tracking-[-0.02em] text-fg [text-wrap:balance]"
        >
          Um número que serve a quem decide e a quem faz.
        </h2>
      </Reveal>

      <div className="mt-[clamp(2rem,5vh,3rem)] grid grid-cols-1 gap-5 md:grid-cols-3">
        {PERSONAS.map((p, i) => {
          const Icon = p.icon;
          return (
            <Reveal
              as="article"
              key={p.papel}
              delay={i * 90}
              className="group relative flex flex-col rounded-panel border border-border bg-surface p-7 shadow-sm transition-[box-shadow,border-color] duration-200 ease-default hover:border-border-strong hover:shadow-md"
            >
              <Quotes
                aria-hidden="true"
                weight="fill"
                className="absolute right-6 top-6 size-7 text-primary/15 transition-colors duration-200 group-hover:text-primary/25"
              />
              <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary/10 text-primary">
                <Icon aria-hidden="true" weight="duotone" className="size-6" />
              </span>
              <p className="mt-5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-subtle">
                {p.papel}
              </p>
              <p className="mt-2 font-display text-h3 font-semibold tracking-[-0.01em] text-fg [text-wrap:balance]">
                {p.promessa}
              </p>
              <p className="mt-3 text-small text-fg-muted">{p.texto}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
