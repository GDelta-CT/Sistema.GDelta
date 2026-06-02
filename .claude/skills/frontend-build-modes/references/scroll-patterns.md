# Scroll patterns

Padrões prontos para o modo experience. Todos bidirecionais (revertem ao subir), todos 60fps. Copie e adapte.

## Helper: scrubSection (use sempre para reveals com GSAP)

```js
function scrubSection(trigger, start, end, build) {
  const tl = gsap.timeline({
    scrollTrigger: { trigger, start, end, scrub: 0.8 }  // scrub = bidirecional + suave
  });
  build(tl);
  return tl;
}

// uso
scrubSection("#features", "top 80%", "bottom 60%", (tl) => {
  tl.from(".feature-card", { y: 60, opacity: 0, stagger: 0.08, ease: "power3.out" });
});
```

Nunca `toggleActions`/`once` aqui — quebraria a bidirecionalidade (ver `prohibitions.md`).

## Hero WebGL pinned (modo cinematic)

```js
ScrollTrigger.create({
  trigger: "#hero",
  pin: true,
  pinSpacing: true,
  start: "top top",
  end: "+=100%",            // altura, NÃO min-height
  onUpdate: (self) => {
    const p = self.progress;        // 0 -> 1, fonte única de verdade
    updateParticles(p);             // dirija o WebGL por p, nunca por scrollY manual
    if (p > 0.6) {                  // fade do conteúdo nos últimos 40%
      heroContent.style.opacity = String(1 - (p - 0.6) / 0.4);
    }
  }
});
```

Regra: hero WebGL usa `pin: true` + altura fixa `100vh` + `self.progress`. `min-height` + `scrollY` manual é hard reject.

## Carrossel horizontal (pin + x tween)

```js
const track = document.querySelector(".carousel-track");
const scrollLen = track.scrollWidth - window.innerWidth;
gsap.to(track, {
  x: -scrollLen,
  ease: "none",
  scrollTrigger: {
    trigger: ".carousel",
    pin: true,
    scrub: 0.5,
    end: () => "+=" + scrollLen,
    invalidateOnRefresh: true       // recalcula em resize
  }
});
```

Destaque do card mais próximo do centro: calcule proximidade no `onUpdate` e aplique scale/opacity.

## Counter scrub-driven (reverte ao subir)

```js
const counter = { v: 0 };
scrubSection("#stats", "top 80%", "top 30%", (tl) => {
  tl.to(counter, {
    v: 1287,
    ease: "none",
    onUpdate: () => { el.textContent = Math.round(counter.v).toLocaleString("pt-BR"); }
  });
});
```

Como é scrub, subir o scroll faz o número voltar — comportamento esperado no awwwards.

## CSS Scroll-Driven (prioridade 1, zero JS)

```css
@keyframes reveal { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }

.reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 80%;
}

/* stagger: NÃO use animation-delay (não funciona com scroll timeline).
   Varie o animation-range por posição. */
.reveal:nth-child(2) { animation-range: entry 10% entry 85%; }
.reveal:nth-child(3) { animation-range: entry 20% entry 90%; }

@supports not (animation-timeline: view()) {
  .reveal { opacity: 1; transform: none; }   /* fallback gracioso */
}
```

## Regra de ouro

Prefira CSS Scroll-Driven; suba para GSAP só quando o CSS não cobre. Sempre que houver scroll, deve ser bidirecional. E sempre o bloco `prefers-reduced-motion` desligando tudo (ver `motion-grammar.md`).
