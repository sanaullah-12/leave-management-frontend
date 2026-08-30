import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Drives the whole auth hero animation.
 *
 * Everything the visual does - the entrance sequence, the ambient float, the
 * connector pulses, the drifting metrics - lives here, and nothing here knows
 * anything about authentication. The visual components render markup and tag
 * their elements with `data-hero`; this hook owns the motion, so the two layers
 * can change independently.
 *
 * Cleanup: every tween is created inside a `gsap.matchMedia()` callback scoped
 * to the container. A single `mm.revert()` on unmount kills every tween,
 * timeline and delayed call created inside it *and* restores the inline styles
 * GSAP wrote, so a remount (StrictMode, route change, theme switch) starts from
 * a clean slate with nothing left running.
 *
 * Performance rules this file follows:
 *   - ambient motion only ever touches `transform` and `opacity`
 *   - metric read-outs are written straight to the text node, never to state
 *   - the SVG rings rotate as promoted HTML wrappers, not as SVG geometry
 *   - `prefers-reduced-motion` gets the finished composition with no tweens
 */

const hero = (name: string) => `[data-hero="${name}"]`;

export function useEcosystemTimeline(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;

    /** Scoped query - `gsap.utils.toArray` is global, this never escapes. */
    const q = <T extends Element>(selector: string): T[] =>
      Array.from(root.querySelectorAll<T>(selector));

    const mm = gsap.matchMedia();

    // Both halves of the preference are declared: gsap.matchMedia only invokes
    // the callback while at least one condition matches, so a lone "reduce"
    // query would leave everything unanimated for the majority who have not
    // asked for reduced motion.
    mm.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        full: "(prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const reduced = Boolean(ctx.conditions?.reduced);

        const glow = q<HTMLElement>(hero("glow"));
        const core = q<HTMLElement>(hero("core"));
        const rings = q<HTMLElement>(hero("ring"));
        const ringOuter = q<HTMLElement>('[data-ring="outer"]');
        const ringInner = q<HTMLElement>('[data-ring="inner"]');
        const lines = q<SVGLineElement>(hero("line"));
        const pulses = q<SVGCircleElement>(hero("pulse"));
        const cards = q<HTMLElement>(hero("card"));
        const notification = q<HTMLElement>(hero("notification"));

        const targetOf = (node: HTMLElement) => Number(node.dataset.count ?? 0);
        const write = (node: HTMLElement, n: number) => {
          node.textContent = String(Math.round(n)) + (node.dataset.suffix ?? "");
        };
        const metricIn = (card: HTMLElement) =>
          card.querySelector<HTMLElement>(hero("metric"));

        /* ---- reduced motion: paint the finished composition --------- */

        if (reduced) {
          gsap.set([...glow, ...core, ...rings, ...cards, ...notification], {
            opacity: 1,
            scale: 1,
            y: 0,
          });
          gsap.set(lines, { opacity: 1, strokeDashoffset: 0 });
          gsap.set(pulses, { opacity: 0 });
          cards.forEach((card) => {
            const node = metricIn(card);
            if (node) write(node, targetOf(node));
          });
          return;
        }

        /* ---- starting state (applied before first paint) ------------ */

        gsap.set(glow, { opacity: 0, scale: 0.7 });
        gsap.set(core, { opacity: 0, scale: 0.62 });
        gsap.set(rings, { opacity: 0, scale: 0.78 });
        gsap.set(lines, { opacity: 0, strokeDashoffset: 1 });
        gsap.set(cards, { opacity: 0, y: 18, scale: 0.9 });
        gsap.set(notification, { opacity: 0, y: -10, scale: 0.94 });
        gsap.set(pulses, { opacity: 0 });
        cards.forEach((card) => {
          const node = metricIn(card);
          if (node) write(node, 0);
        });

        /* ---- entrance sequence -------------------------------------- */

        // No `force3D` in the defaults: the timeline also tweens plain proxy
        // objects for the metric read-outs, and GSAP warns about CSS-only
        // properties on non-DOM targets. Its default ("auto") already promotes
        // transforms to 3D for the duration of a tween, which is what we want.
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        intro
          // 1. The Nexora core arrives first - everything hangs off it.
          .to(glow, { opacity: 1, scale: 1, duration: 1.1 })
          .to(
            core,
            { opacity: 1, scale: 1, duration: 0.75, ease: "back.out(1.5)" },
            "<"
          )
          // 2. The platform rings form around it.
          .to(rings, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.1 }, "-=0.45")
          // 3. Connectors draw outward, in module reveal order.
          .to(
            lines,
            {
              opacity: 1,
              strokeDashoffset: 0,
              duration: 0.55,
              stagger: 0.085,
              ease: "power2.out",
            },
            "-=0.3"
          )
          // 4. Modules land one by one along their connector.
          .addLabel("modules", "-=0.5")
          .to(
            cards,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              stagger: 0.085,
              clearProps: "scale",
            },
            "modules"
          );

        // Each metric counts up as its own card settles.
        cards.forEach((card, i) => {
          const node = metricIn(card);
          if (!node) return;
          const proxy = { v: 0 };
          intro.to(
            proxy,
            {
              v: targetOf(node),
              duration: 0.9,
              ease: "power2.out",
              onUpdate: () => write(node, proxy.v),
            },
            `modules+=${(0.3 + i * 0.085).toFixed(3)}`
          );
        });

        // 5. Notifications - the last thing a real workspace shows you.
        intro.to(
          notification,
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" },
          `modules+=${(0.3 + cards.length * 0.085).toFixed(3)}`
        );

        /* ---- ambient life, once the composition has settled ---------- */

        intro.add(() => {
          // Cards breathe on their own rhythm. Transform-only, so this stays on
          // the compositor and never touches layout or paint.
          cards.forEach((card) => {
            gsap.to(card, {
              y: Number(card.dataset.drift ?? 8),
              duration: 4.2 + Math.abs(Number(card.dataset.drift ?? 8)) * 0.18,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          });

          // The core keeps a slow breath so the centre never reads as static.
          gsap.to(core, {
            scale: 1.035,
            duration: 3.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
          gsap.to(glow, {
            opacity: 0.6,
            scale: 1.08,
            duration: 4.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });

          // Rings counter-rotate, very slowly - motion you feel, not watch.
          gsap.to(ringOuter, { rotate: 360, duration: 64, ease: "none", repeat: -1 });
          gsap.to(ringInner, { rotate: -360, duration: 96, ease: "none", repeat: -1 });

          // Data flowing from the core out to each module. Long randomised gaps
          // mean only two or three are ever in flight at once.
          pulses.forEach((dot) => {
            const { x1 = "0", y1 = "0", x2 = "0", y2 = "0" } = dot.dataset;
            gsap
              .timeline({
                repeat: -1,
                repeatDelay: gsap.utils.random(3.5, 8),
                delay: gsap.utils.random(0, 6),
              })
              .set(dot, { attr: { cx: x1, cy: y1 }, opacity: 0 })
              .to(dot, { opacity: 1, duration: 0.25 })
              .to(
                dot,
                { attr: { cx: x2, cy: y2 }, duration: 1.5, ease: "power1.inOut" },
                "<"
              )
              .to(dot, { opacity: 0, duration: 0.35 }, "-=0.35");
          });

          // A couple of metrics keep moving. Values are written straight to the
          // text node - React never re-renders for ambient motion.
          cards.forEach((card) => {
            const node = metricIn(card);
            const range = node?.dataset.range;
            if (!node || !range) return;
            const [min, max] = range.split(",").map(Number);
            const proxy = { v: targetOf(node) };
            gsap.to(proxy, {
              v: () => gsap.utils.random(min, max, 1),
              duration: 1.1,
              ease: "power1.inOut",
              repeat: -1,
              repeatRefresh: true,
              repeatDelay: gsap.utils.random(5, 9),
              delay: gsap.utils.random(2, 5),
              onUpdate: () => write(node, proxy.v),
            });
          });
        });
      },
      root
    );

    return () => mm.revert();
  }, [scope]);
}

export default useEcosystemTimeline;
