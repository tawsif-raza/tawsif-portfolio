import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { canGoFullGL } from "../utils/canGoFullGL";

// Edit the words here. The last word of each beat is shown in the accent colour.
const BEATS = ["ONE ENGINEER.", "MANY AGENTS.", "ZERO BABYSITTING."];
const NAME_LINES = ["TAWSIF", "RAZA KHAN"];
const TAGLINE = "AGENTIC SYSTEMS THAT RUN ON THEIR OWN";
const AGENTS = 12; // keep in step with AGENT_COUNT in introPlanet.js
const SEEN_KEY = "trk-intro-seen";

// Run `cb` once the main thread is free (or after `timeout` ms at most).
function whenIdle(cb, timeout) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(cb, 300);
  return () => clearTimeout(id);
}

// Cinematic startup sequence, played once per browser session (~6.5 s):
//   1. a photographic Earth falls into frame and lands with a shockwave
//   2. three text beats play while a network of agent nodes wires itself up
//      across the surface
//   3. the planet breaks apart into grains that swarm together and spell
//      the name
//   4. the site mounts underneath, then the name rushes past the camera
//
// The 3D scene (introPlanet.js + three.js) is loaded lazily and only on
// capable devices; everyone else gets the same text sequence without it.
// Mounting the whole page is a burst of main-thread work, so the exit waits
// for the browser to go idle before it animates; otherwise it would stutter.
export default function IntroSequence({ onReveal, onComplete }) {
  const wrapRef = useRef();
  const canvasRef = useRef();
  const [done, setDone] = useState(false);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onCompleteRef.current = onComplete;
  }, [onReveal, onComplete]);

  useEffect(() => {
    let cancelled = false;
    let revealed = false;
    let finished = false;
    let exiting = false;
    let planet = null;
    let tl = null;
    let out = null;
    let cancelIdle = null;

    const revealOnce = () => {
      if (revealed) return;
      revealed = true;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* storage blocked: the intro just plays again next time */
      }
      onRevealRef.current?.();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      revealOnce();
      planet?.dispose();
      planet = null;
      setDone(true);
      onCompleteRef.current?.();
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const wrap = wrapRef.current;
    if (reduceMotion || !wrap) {
      finish();
      return;
    }

    // Hard safety net: never stay stuck on the intro.
    const safety = setTimeout(finish, 12000);

    const q = (sel) => wrap.querySelectorAll(sel);
    const nameEl = wrap.querySelector(".intro-cine__name");
    const chars = q(".intro-cine__char");
    const beats = q(".intro-cine__beat-inner");
    const counterEl = wrap.querySelector(".intro-cine__counter");
    const agentsEl = wrap.querySelector(".intro-cine__agents");
    const flash = wrap.querySelector(".intro-cine__flash");
    const layers = q(".intro-cine__canvas, .intro-cine__beats, .intro-cine__hud, .intro-cine__name, .intro-cine__bar");

    // Leave: mount the site under the overlay, wait for the main thread to
    // settle, then fly through the name and fade the overlay away.
    const exit = (fast) => {
      if (exiting) return;
      exiting = true;
      tl?.pause();
      const go = () => {
        revealOnce();
        const S = planet?.state;
        cancelIdle = whenIdle(() => {
          out = gsap
            .timeline({
              onComplete: () => {
                clearTimeout(safety);
                finish();
              },
            })
            .to(nameEl, { scale: 3.6, opacity: 0, duration: 0.7, ease: "power3.in" }, 0)
            .to(q(".intro-cine__hud, .intro-cine__bar"), { opacity: 0, duration: 0.3 }, 0)
            .to(wrap, { opacity: 0, duration: 0.55, ease: "power2.in" }, 0.3);
          // the particle name rushes past the camera
          if (S) out.to(S, { out: 1, duration: 0.85, ease: "power2.in" }, 0);
        }, 1200);
      };
      if (fast) gsap.to(layers, { opacity: 0, duration: 0.2, overwrite: true, onComplete: go });
      else go();
    };

    const start = () => {
      if (cancelled || exiting) return;
      wrap.classList.toggle("intro-cine--flat", !planet);
      // Without the 3D scene the tweens below still run, on a stand-in object.
      const S = planet
        ? planet.state
        : { y: 0, glow: 1, shock: 0, shake: 0, squash: 1, spin: 0, agents: 0, explode: 0, form: 0, out: 0, warp: 0, camZ: 6 };
      const count = { pct: 0 };

      // fromTo with explicit start AND end values throughout: StrictMode runs
      // this effect twice in dev, and .from() would capture the first run's
      // hidden state as its end state.
      tl = gsap.timeline();

      // HUD + letterbox bars
      tl.fromTo(q(".intro-cine__bar"), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "power3.out" }, 0)
        .fromTo(q(".intro-cine__hud"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.1)
        .to(count, {
          pct: 100,
          duration: 3.25,
          ease: "power1.inOut",
          onUpdate: () => {
            counterEl.textContent = `${String(Math.round(count.pct)).padStart(3, "0")}%`;
          },
        }, 0);

      // 1. Earth falls into frame and lands
      tl.to(S, { y: 0.35, duration: 0.95, ease: "power2.in" }, 0)
        .to(S, { spin: 1.6, duration: 3.3, ease: "power2.out" }, 0)
        .fromTo(S, { shake: 1 }, { shake: 0, duration: 0.55, ease: "power2.out", immediateRender: false }, 0.95)
        .fromTo(S, { squash: 0.86 }, { squash: 1, duration: 0.9, ease: "elastic.out(1, 0.4)", immediateRender: false }, 0.95)
        .to(S, { shock: 1, duration: 1, ease: "power2.out" }, 0.95);

      // 2. text beats; the agent network wires up during the second one
      tl.set(q(".intro-cine__beats"), { visibility: "visible" }, 0);
      beats.forEach((el, i) => {
        const at = 1.05 + i * 0.72;
        tl.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: "power4.out" }, at)
          .to(el, { yPercent: -110, duration: 0.25, ease: "power3.in" }, at + 0.5);
      });
      tl.to(S, {
        agents: 1,
        duration: 0.95,
        ease: "power1.inOut",
        onUpdate: () => {
          agentsEl.textContent = `${Math.round(S.agents * AGENTS)}/${AGENTS}`;
        },
      }, 1.75);

      // 3. dive in and burst
      tl.set(q(".intro-cine__beats"), { visibility: "hidden" }, 3.2)
        .to(S, { camZ: 4.3, duration: 0.3, ease: "power2.in" }, 2.95)
        .to(S, { glow: 0, duration: 0.15 }, 3.1)
        .to(S, { explode: 1, duration: 1, ease: "none" }, 3.25)
        .to(S, { warp: 1, duration: 1.15, ease: "power2.in" }, 3.25)
        .to(S, { camZ: 6, duration: 1.1, ease: "power3.out" }, 3.25)
        .fromTo(S, { shake: 0.8 }, { shake: 0, duration: 0.5, immediateRender: false }, 3.25)
        .fromTo(flash, { opacity: 0.75 }, { opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, 3.25);

      if (planet) {
        // 4a. the grains of the planet swarm together and spell the name
        tl.to(S, { form: 1, duration: 1.4, ease: "power2.inOut" }, 3.8)
          .fromTo(q(".intro-cine__tagline"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 5.0)
          .call(() => exit(false), null, 5.8);
      } else {
        // 4b. text-only fallback: the name slams in out of a blur
        tl.fromTo(chars,
          { opacity: 0, scale: 2.4, filter: "blur(12px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "power4.out", stagger: { each: 0.03, from: "random" } },
          3.32)
          .fromTo(q(".intro-cine__tagline"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 3.85)
          .call(() => exit(false), null, 4.55);
      }
    };

    // Load the 3D scene on capable devices; fall back to text-only if it
    // can't be created or takes too long to arrive. The particle name is laid
    // out by the DOM (hidden) and measured, so it lands exactly where the
    // page would have drawn it.
    let abandoned = false;
    const loadPlanet = async () => {
      const [m] = await Promise.all([
        import("./introPlanet.js"),
        document.fonts?.load('400 100px "Bebas Neue"').catch(() => {}),
      ]);
      const cs = getComputedStyle(nameEl);
      const lines = [...q(".intro-cine__line")].map((el) => {
        const r = el.getBoundingClientRect();
        return { text: el.textContent.replace(/\u00a0/g, " "), cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
      const p = await m.createIntroPlanet(canvasRef.current, {
        assetBase: import.meta.env.BASE_URL,
        text: {
          lines,
          fontPx: parseFloat(cs.fontSize),
          fontFamily: cs.fontFamily,
          fontWeight: cs.fontWeight,
          spacingPx: parseFloat(cs.letterSpacing) || 0,
        },
      });
      if (abandoned) {
        p.dispose();
        return null;
      }
      return p;
    };
    const load = canGoFullGL()
      ? Promise.race([
          loadPlanet(),
          new Promise((_, reject) =>
            setTimeout(() => {
              abandoned = true;
              reject(new Error("timeout"));
            }, 6000)
          ),
        ])
      : Promise.resolve(null);

    load
      .catch(() => null)
      .then((p) => {
        if (cancelled || exiting) {
          p?.dispose();
          return;
        }
        planet = p;
        start();
      });

    // Skip on click or keypress.
    const skipHandler = () => exit(true);
    window.addEventListener("click", skipHandler);
    window.addEventListener("keydown", skipHandler);

    return () => {
      cancelled = true;
      abandoned = true;
      clearTimeout(safety);
      cancelIdle?.();
      out?.kill();
      tl?.revert();
      gsap.killTweensOf(layers);
      planet?.dispose();
      window.removeEventListener("click", skipHandler);
      window.removeEventListener("keydown", skipHandler);
    };
  }, []); // run exactly once on mount

  if (done) return null;

  return (
    <div ref={wrapRef} className="intro-cine" role="status">
      <span className="sr-only">Loading Tawsif Raza Khan's portfolio</span>

      <canvas ref={canvasRef} className="intro-cine__canvas" aria-hidden="true" />
      <div className="intro-cine__flash" aria-hidden="true" />

      <div className="intro-cine__beats" aria-hidden="true">
        {BEATS.map((beat) => {
          const cut = beat.lastIndexOf(" ");
          return (
            <p key={beat} className="intro-cine__beat">
              <span className="intro-cine__beat-inner">
                {beat.slice(0, cut + 1)}
                <em>{beat.slice(cut + 1)}</em>
              </span>
            </p>
          );
        })}
      </div>

      <div className="intro-cine__name" aria-hidden="true">
        {NAME_LINES.map((line) => (
          <span key={line} className="intro-cine__line">
            {[...line].map((ch, i) => (
              <span key={i} className="intro-cine__char">
                {ch === " " ? " " : ch}
              </span>
            ))}
          </span>
        ))}
        <span className="intro-cine__tagline">{TAGLINE}</span>
      </div>

      <div className="intro-cine__bar intro-cine__bar--top" aria-hidden="true" />
      <div className="intro-cine__bar intro-cine__bar--bottom" aria-hidden="true" />

      <span className="intro-cine__hud intro-cine__hud--tl" aria-hidden="true">
        TRK <i>//</i> SYSTEM BOOT
      </span>
      <span className="intro-cine__hud intro-cine__hud--tr intro-cine__counter" aria-hidden="true">
        000%
      </span>
      <span className="intro-cine__hud intro-cine__hud--bl" aria-hidden="true">
        click or press any key to skip
      </span>
      <span className="intro-cine__hud intro-cine__hud--br" aria-hidden="true">
        AGENTS ONLINE <b className="intro-cine__agents">0/{AGENTS}</b>
      </span>
    </div>
  );
}
