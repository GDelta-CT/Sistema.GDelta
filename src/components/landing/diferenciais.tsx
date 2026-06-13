import {
  Calculator,
  ChartLineUp,
  Gauge,
  CheckCircle,
  TrendUp,
  Stack,
  Clock,
  ArrowsClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { Reveal } from './reveal';

/**
 * Os 3 diferenciais que doem — linhas alternadas (assimetria deliberada),
 * cada uma com um "mostrador" visual coerente com a metáfora do painel.
 * Server Component: ícones de /dist/ssr (estáticos), nada interativo.
 */

function SemaforoBar() {
  // Mini painel de lucro — a assinatura do produto, estática.
  return (
    <div className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-subtle">
            Lucro do orçamento
          </p>
          <p className="mt-1 font-numeric text-metric font-semibold tabular leading-none text-success">
            R$ 1.240
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-success-tint px-3 py-1.5 text-caption font-semibold text-success">
          <CheckCircle aria-hidden="true" weight="fill" className="size-4" />
          Lucrativo
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-baseline justify-between text-caption text-fg-muted">
          <span>Margem</span>
          <span className="font-numeric tabular font-semibold text-fg">23%</span>
        </div>
        {/* Barra de margem com a marca dos 20% (limiar verde/âmbar) */}
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-pill bg-surface-sunken"
          role="img"
          aria-label="Margem de 23 por cento, acima da meta de 20 por cento"
        >
          <div
            className="h-full w-full origin-left rounded-pill bg-success-bg"
            style={{ transform: 'scaleX(0.23)' }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-pill bg-border-strong"
            style={{ left: '20%' }}
          />
        </div>
        <p className="pt-1 text-caption text-fg-muted">
          Meta de 20% marcada na barra — você cruza o limiar e o painel acende.
        </p>
      </div>
    </div>
  );
}

function FinanceiroCard() {
  const linhas = [
    { label: 'Faturamento', valor: 'R$ 48.200', tone: 'fg' as const },
    { label: 'Markup real', valor: '2,4×', tone: 'primary' as const },
    { label: 'Margem líquida', valor: '21%', tone: 'success' as const },
  ];
  return (
    <div className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg">
      <p className="text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-subtle">
        DRE do mês · resumo
      </p>
      <dl className="mt-4 divide-y divide-border">
        {linhas.map((l) => (
          <div key={l.label} className="flex items-center justify-between py-3">
            <dt className="text-small text-fg-muted">{l.label}</dt>
            <dd
              className={`font-numeric tabular text-body-lg font-semibold ${
                l.tone === 'success'
                  ? 'text-success'
                  : l.tone === 'primary'
                    ? 'text-primary'
                    : 'text-fg'
              }`}
            >
              {l.valor}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-2 rounded-control bg-success-tint px-3 py-2 text-caption font-medium text-success">
        <TrendUp aria-hidden="true" weight="bold" className="size-4 shrink-0" />
        <span>3 serviços puxam 70% do lucro — ranking no painel.</span>
      </div>
    </div>
  );
}

function PatioCard() {
  const carros = [
    { placa: 'BRA2E19', dias: 3, custo: 'R$ 80', tone: 'success' as const, label: 'No prazo' },
    { placa: 'RIO7C44', dias: 9, custo: 'R$ 240', tone: 'warning' as const, label: 'Atenção' },
    { placa: 'SPA1D07', dias: 16, custo: 'R$ 420', tone: 'danger' as const, label: 'Gargalo' },
  ];
  const toneText = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };
  const toneDot = {
    success: 'bg-success-bg',
    warning: 'bg-warning-bg',
    danger: 'bg-danger-bg',
  };
  return (
    <div className="rounded-panel border border-border bg-surface-raised p-6 shadow-lg">
      <p className="text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-subtle">
        Pátio · dias na oficina × R$
      </p>
      <ul className="mt-4 space-y-2.5">
        {carros.map((c) => (
          <li
            key={c.placa}
            className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`size-2 rounded-pill ${toneDot[c.tone]}`}
              />
              <span className="font-numeric tabular text-small font-semibold text-fg">
                {c.placa}
              </span>
            </div>
            <div className="flex items-center gap-3 text-caption">
              <span className="font-numeric tabular text-fg-muted">{c.dias} dias</span>
              <span className="font-numeric tabular text-fg-muted">{c.custo}</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${toneText[c.tone]}`}>
                {c.label}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-control bg-warning-tint px-3 py-2 text-caption font-medium text-warning">
        <Clock aria-hidden="true" weight="bold" className="size-4 shrink-0" />
        <span>Carro parado custa dinheiro — o gargalo aparece antes de virar prejuízo.</span>
      </div>
    </div>
  );
}

type Diferencial = {
  n: string;
  icon: typeof Gauge;
  overline: string;
  titulo: string;
  destaque: string;
  texto: string;
  bullets: { icon: typeof Gauge; texto: string }[];
  visual: React.ReactNode;
};

const DIFERENCIAIS: Diferencial[] = [
  {
    n: '01',
    icon: Calculator,
    overline: 'Orçamento com margem ao vivo',
    titulo: 'Orce vendo o lucro,',
    destaque: 'não descobrindo depois.',
    texto:
      'Enquanto você adiciona peça, tinta e mão de obra, o painel recalcula lucro e margem na hora. O semáforo acende verde, âmbar ou vermelho antes de você fechar o negócio.',
    bullets: [
      { icon: Gauge, texto: 'Lucro em R$ e margem em % a cada item lançado' },
      { icon: CheckCircle, texto: 'Semáforo de meta: cruzou 20%, o painel acende' },
      { icon: TrendUp, texto: 'Feche sabendo o resultado — nunca mais no escuro' },
    ],
    visual: <SemaforoBar />,
  },
  {
    n: '02',
    icon: ChartLineUp,
    overline: 'Inteligência financeira de verdade',
    titulo: 'Os números não só registrados:',
    destaque: 'interpretados.',
    texto:
      'DRE pronto, markup real por serviço, ranking do que dá lucro e o semáforo do mês. Não é um relatório que você precisa decifrar — é a leitura que diz onde está o dinheiro e mostra, ao vivo, o quanto o sistema te devolve.',
    bullets: [
      { icon: ChartLineUp, texto: 'DRE e margem líquida sem planilha paralela' },
      { icon: Stack, texto: 'Markup real por serviço, não o que você imagina' },
      { icon: TrendUp, texto: 'ROI ao vivo: o sistema se paga, e você vê quanto' },
    ],
    visual: <FinanceiroCard />,
  },
  {
    n: '03',
    icon: Gauge,
    overline: 'Chão de fábrica em tempo real',
    titulo: 'O tempo se mede sozinho,',
    destaque: 'em dias e em reais.',
    texto:
      'Cronômetro e ponto eletrônico automáticos: o tempo de cada etapa se mede sozinho, ligado à OS — ninguém digita hora no fim do dia. Cada carro vira um número: dias parado, quanto custa, onde está o gargalo e o que voltou para retrabalho.',
    bullets: [
      { icon: Clock, texto: 'Tempo cronometrado automático — medido, não digitado' },
      { icon: Gauge, texto: 'Gargalo visível antes de comer a sua margem' },
      { icon: ArrowsClockwise, texto: 'Retrabalho medido — o que está custando duas vezes' },
    ],
    visual: <PatioCard />,
  },
];

export function Diferenciais() {
  return (
    <section
      id="diferenciais"
      aria-labelledby="diferenciais-titulo"
      className="mx-auto w-full max-w-6xl px-[clamp(1rem,4vw,2rem)] py-[clamp(3.5rem,9vh,6.5rem)]"
    >
      <Reveal className="max-w-2xl">
        <p className="text-overline font-display font-semibold uppercase tracking-[0.08em] text-primary">
          Por que o G Delta
        </p>
        <h2
          id="diferenciais-titulo"
          className="mt-3 font-display text-h1 font-bold tracking-[-0.02em] text-fg [text-wrap:balance]"
        >
          Três coisas que nenhum ERP de oficina te dá.
        </h2>
        <p className="mt-4 max-w-xl text-body-lg text-fg-muted">
          Não é mais um sistema que registra o que já aconteceu. É a inteligência
          que mostra se valeu a pena — enquanto ainda dá pra mudar.
        </p>
      </Reveal>

      <div className="mt-[clamp(2.5rem,6vh,4rem)] flex flex-col gap-[clamp(3rem,7vh,5rem)]">
        {DIFERENCIAIS.map((d, i) => {
          const Icon = d.icon;
          const reverso = i % 2 === 1;
          return (
            <Reveal
              key={d.n}
              y={32}
              className="grid grid-cols-1 items-center gap-[clamp(1.5rem,4vw,3.5rem)] lg:grid-cols-12"
            >
              {/* Texto */}
              <div className={`lg:col-span-6 ${reverso ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-card border border-border bg-surface text-primary shadow-sm">
                    <Icon aria-hidden="true" weight="duotone" className="size-6" />
                  </span>
                  <span className="font-numeric text-h3 font-semibold tabular text-border-strong">
                    {d.n}
                  </span>
                </div>

                <p className="mt-5 text-overline font-display font-semibold uppercase tracking-[0.08em] text-fg-subtle">
                  {d.overline}
                </p>
                <h3 className="mt-2 font-display text-h2 font-semibold tracking-[-0.01em] text-fg [text-wrap:balance]">
                  {d.titulo}{' '}
                  <span className="text-primary">{d.destaque}</span>
                </h3>
                <p className="mt-4 max-w-xl text-body-lg text-fg-muted">{d.texto}</p>

                <ul className="mt-6 space-y-3">
                  {d.bullets.map((b) => {
                    const BIcon = b.icon;
                    return (
                      <li key={b.texto} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary/10 text-primary">
                          <BIcon aria-hidden="true" weight="bold" className="size-3.5" />
                        </span>
                        <span className="text-body text-fg">{b.texto}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Visual */}
              <div className={`lg:col-span-6 ${reverso ? 'lg:order-1' : 'lg:order-2'}`}>
                {d.visual}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
