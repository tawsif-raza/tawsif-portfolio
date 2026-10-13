import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlassPill from "../components/GlassPill";
import DualVideoBackground from "../components/DualVideoBackground";
import { FLOAT_LOGOS } from "../data/floatLogos";
import useReducedMotion from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Where each logo sits in the field on wide screens (percent of the field),
// plus its own float timing so no two drift in step.
const SPOTS = [
  { x: 9, y: 34, d: 7.2, delay: -1.1, path: "a" },
  { x: 23, y: 74, d: 8.4, delay: -3.4, path: "b" },
  { x: 37, y: 24, d: 6.8, delay: -2.2, path: "c" },
  { x: 51, y: 70, d: 9.1, delay: -0.4, path: "a" },
  { x: 65, y: 28, d: 7.7, delay: -4.6, path: "b" },
  { x: 78, y: 76, d: 8.0, delay: -2.9, path: "c" },
  { x: 91, y: 38, d: 6.6, delay: -1.8, path: "a" },
];

export default function SkillsFloat() {
  const rootRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: rootRef.current, start: "top 70%", once: true } });
      tl.from(".skf-head > *", { opacity: 0, y: -24, duration: 0.8, stagger: 0.12, ease: "power3.out" }).from(
        ".float-logo__pop",
        { opacity: 0, y: 30, scale: 0.6, duration: 0.9, stagger: 0.09, ease: "back.out(1.6)" },
        "-=0.3"
      );
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="skills" className="skf relative isolate overflow-hidden">
      <DualVideoBackground className="absolute inset-0 -z-10" />

      <div className="relative mx-auto flex min-h-[640px] max-w-6xl flex-col justify-center px-6 py-28 md:min-h-[min(100svh,820px)] md:px-12">
        <div className="skf-head mx-auto flex max-w-3xl flex-col items-center text-center">
          <GlassPill>01 · Tech stack</GlassPill>
          <h2 className="mt-6 text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl">
            What I actually work with, <span className="text-accent">day to day.</span>
          </h2>
          <p className="sk-script mt-4">hover a logo to hold it still</p>
        </div>

        <ul className="float-field mt-12 md:mt-6" aria-label="Tech stack">
          {FLOAT_LOGOS.map((l, i) => {
            const s = SPOTS[i % SPOTS.length];
            return (
              <li
                key={l.name}
                className={`float-logo float-logo--${s.path} ${reducedMotion ? "is-still" : ""}`}
                style={{
                  "--x": `${s.x}%`,
                  "--y": `${s.y}%`,
                  "--dur": `${s.d}s`,
                  "--delay": `${s.delay}s`,
                  "--glow": l.glow,
                }}
                tabIndex={0}
              >
                <span className="float-logo__pop">
                  <span
                    className={`float-logo__img ${l.wide ? "is-wide" : ""}`}
                    dangerouslySetInnerHTML={{ __html: l.svg }}
                  />
                  <span className="float-logo__name">{l.name}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
