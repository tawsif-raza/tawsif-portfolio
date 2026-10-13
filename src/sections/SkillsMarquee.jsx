import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlassPill from "../components/GlassPill";
import { TECH_LOGOS } from "../data/techLogos";
import useReducedMotion from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Second, slower row runs the other way with the rest of the toolkit.
// Every name here is used in a project on this site.
const MORE_TOOLS = [
  "n8n", "PostgreSQL", "Groq", "Gemini", "Qwen 2.5", "QLoRA", "Pydantic v2",
  "SQLAlchemy", "Claude MCP", "React", "Tailwind CSS", "GSAP", "Vercel", "WhatsApp Cloud API",
];

function LogoCard({ name, svg }) {
  return (
    <li className="tech-card">
      <span className="tech-card__logo" dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="tech-card__name">{name}</span>
    </li>
  );
}

export default function SkillsMarquee() {
  const rootRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true } });
      tl.from(".sk-head > *", { opacity: 0, y: -24, duration: 0.8, stagger: 0.12, ease: "power3.out" })
        .from(".marquee", { opacity: 0, y: 40, duration: 0.9, stagger: 0.15, ease: "power3.out" }, "-=0.4")
        .from(".sk-horizon", { opacity: 0, scale: 0.9, duration: 1.4, ease: "power2.out" }, "<");
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Two copies of each row make the loop seamless (the track slides by half).
  const logos = [...TECH_LOGOS, ...TECH_LOGOS];
  const tools = [...MORE_TOOLS, ...MORE_TOOLS];

  return (
    <section ref={rootRef} id="skills" className="sk relative overflow-hidden pb-14 pt-24 md:pb-20 md:pt-32">
      <div className="sk-horizon" aria-hidden="true" />

      <div className="sk-head relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <GlassPill>01 · Tech stack</GlassPill>
        <h2 className="mt-6 text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl">
          What I actually work with, <span className="text-accent">day to day.</span>
        </h2>
        <p className="sk-script mt-4">hover to pause the orbit</p>
      </div>

      <div className="relative mt-14 grid gap-5">
        <div className={`marquee ${reducedMotion ? "is-static" : ""}`} aria-label="Core tech stack">
          <ul className="marquee__track">
            {logos.map((l, i) => (
              <LogoCard key={`${l.name}-${i}`} {...l} />
            ))}
          </ul>
        </div>
        <div className={`marquee marquee--reverse ${reducedMotion ? "is-static" : ""}`} aria-label="More tools">
          <ul className="marquee__track">
            {tools.map((t, i) => (
              <li key={`${t}-${i}`} className="tool-chip">
                <span className="tool-chip__dot" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
