# Computed-style harvest (recipe agent-browser)

O coração que separa este extrator de um que só "lê o HTML". O `agent-browser` dá um browser real; este JS, rodado via `agent-browser eval`, lê os computed styles de elementos renderizados e devolve JSON.

## Pré-requisito

`agent-browser` no PATH (CLI de automação de browser para agentes). Verificar: `command -v agent-browser`. Se ausente, caia para o escape hatch de visão (ver `extraction-protocol.md`).

## Sequência

```bash
agent-browser open "<url>"
agent-browser wait --load networkidle
agent-browser wait 1500
agent-browser screenshot --full-page --out "design-systems/<name>/_screenshot.png"
agent-browser eval "$(cat harvest.js)" > "design-systems/<name>/_harvest.json"
```

## harvest.js (o snippet de captura)

Roda no contexto da página. Caminha o DOM visível, agrega computed styles com frequência, e amostra tipografia/espaçamento. Mantenha-o como referência; cole no `agent-browser eval`.

```js
(() => {
  const seen = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const colors = new Map(), bgs = new Map(), borders = new Map(),
        shadows = new Map(), radii = new Map(), fonts = new Map(),
        sizes = new Map(), weights = new Map(), gaps = new Map(),
        pads = new Map(), transitions = new Map();
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const norm = (c) => (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") ? c : null;

  let n = 0;
  for (const el of document.querySelectorAll("*")) {
    if (n > 4000) break;
    if (!vis(el)) continue;
    n++;
    const s = getComputedStyle(el);
    const col = norm(s.color); if (col) seen(colors, col);
    const bg = norm(s.backgroundColor); if (bg) seen(bgs, bg);
    const bc = norm(s.borderColor); if (bc && s.borderStyle !== "none") seen(borders, bc);
    if (s.boxShadow && s.boxShadow !== "none") seen(shadows, s.boxShadow);
    if (s.borderRadius && s.borderRadius !== "0px") seen(radii, s.borderRadius);
    seen(fonts, s.fontFamily);
    seen(sizes, s.fontSize);
    seen(weights, s.fontWeight);
    if (s.gap && s.gap !== "normal" && s.gap !== "0px") seen(gaps, s.gap);
    [s.paddingTop, s.paddingLeft].forEach((p) => { if (p && p !== "0px") seen(pads, p); });
    if (s.transition && s.transition !== "all 0s ease 0s") seen(transitions, s.transition);
  }

  // keyframes do CSS (motion)
  const keyframes = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) keyframes.push(rule.name);
      }
    } catch (_) { /* cross-origin sheet: ignora */ }
  }

  const top = (m, k = 40) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k)
    .map(([value, count]) => ({ value, count }));

  return JSON.stringify({
    url: location.href,
    title: document.title,
    sampled_elements: n,
    colors: top(colors), backgrounds: top(bgs), borders: top(borders),
    shadows: top(shadows), radii: top(radii),
    font_families: top(fonts), font_sizes: top(sizes), font_weights: top(weights),
    gaps: top(gaps), paddings: top(pads), transitions: top(transitions, 20),
    keyframes,
    reduced_motion_supported: !!window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || [...document.styleSheets].some((sh) => { try { return [...sh.cssRules].some((r) => /prefers-reduced-motion/.test(r.cssText)); } catch { return false; } }),
    prefers_color_scheme_dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  });
})();
```

## Estados (hover/focus/active)

Para os elementos interativos representativos (botão primário, link, input), repita por estado:

```bash
agent-browser hover "<seletor>"   && agent-browser eval "getComputedStyle(document.querySelector('<seletor>')).cssText"
agent-browser focus "<seletor>"   && agent-browser eval "..."
```

Registre o delta entre default e cada estado — é a parte do design system que screenshots estáticos perdem.

## Multi-página

Repita open+eval para cada página-chave do mapa (Fase 1). O `normalize-ds.ts` agrega os `_harvest.json` por página e usa a consistência entre páginas como sinal de confiança (cor que aparece em todas as páginas no mesmo papel = High).

## O que o harvest NÃO pega (vai para gaps)

- Animações de JS (GSAP/Lottie/Framer Motion) — só os efeitos no DOM; timings da lib exigem o source.
- Tokens atrás de auth/CAPTCHA.
- Temas alternados via localStorage (não via media query) — podem passar despercebidos.
