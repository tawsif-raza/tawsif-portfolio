import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Magnetic from "../components/Magnetic";
import RevealText from "../components/RevealText";
import SectionLabel from "../components/SectionLabel";
import { sectionNo } from "../data/experience";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    title: "Agentic AI systems",
    desc:
      "Multi-agent pipelines built on LangGraph — planning, fan-out, human-in-the-loop approval, the works. Built to run in production, not as a demo.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="#c6f432" strokeWidth="1.2">
        <circle cx="8" cy="12" r="2" />
        <circle cx="8" cy="20" r="2" />
        <circle cx="8" cy="28" r="2" />
        <circle cx="20" cy="16" r="2" />
        <circle cx="20" cy="24" r="2" />
        <circle cx="32" cy="20" r="2.5" fill="#c6f432" />
        <path d="M10 12l8 4M10 20l8-4M10 20l8 4M10 28l8-4" opacity="0.5" />
        <path d="M22 16l8 4M22 24l8-4" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Automation pipelines",
    desc:
      "n8n-based workflows that replace manual busywork — lead-gen, outreach, content publishing, monitoring — wired to the tools you already use.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="#c6f432" strokeWidth="1.2">
        <circle cx="8" cy="20" r="3" />
        <path d="M11 20h8" />
        <path d="M17 17l3 3-3 3" />
        <circle cx="22" cy="20" r="3" />
        <path d="M25 20h8" />
        <path d="M31 17l3 3-3 3" strokeDasharray="2 2" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Custom model deployment",
    desc:
      "Fine-tuned small models for a specific job, served through a real API — not a wrapper around someone else's endpoint.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="#c6f432" strokeWidth="1.2">
        <rect x="6" y="8" width="28" height="24" rx="2" />
        <path d="M12 18l4 4-4 4" />
        <path d="M20 26h8" opacity="0.5" />
      </svg>
    ),
  },
];

// How an engagement runs, start to finish.
const STEPS = [
  {
    title: "Scope",
    desc: "You tell me the problem and the tools you already use. I come back with what I'd build and the build fee.",
  },
  {
    title: "Build",
    desc: "I build it against your real accounts and data, with a human approval step wherever something gets sent or published.",
  },
  {
    title: "Run",
    desc: "You get the working system and a walkthrough. Add a monthly retainer if you want it kept running and improved.",
  },
];

export default function Services() {
  const rootRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".service-card-anim", {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="services"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-32 md:px-12"
    >
      <SectionLabel number={sectionNo(4)} title="SERVICES" />

      <RevealText
        text="If you need one of these built, that's what I do."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />
      <p className="mb-14 max-w-md text-[15px] text-dim">
        Build fee up front, then a monthly retainer if you want it kept
        running and improved.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {SERVICES.map((s, i) => (
          <div key={s.title} className="service-card-anim">
            <div className="service-card">
              <span className="mb-4 block font-mono text-xs text-accent-dim">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mb-4" aria-hidden="true">
                {s.icon}
              </div>
              <h3 className="font-display mb-3 text-xl font-medium text-paper">{s.title}</h3>
              <p className="text-[14px] leading-relaxed text-dim">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 border-t border-line pt-8">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">How it works</p>
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <p className="font-mono text-xs text-accent-dim">Step {i + 1}</p>
              <h3 className="font-display mt-2 text-lg font-medium text-paper">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-dim">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>

      <Magnetic>
        <a
          href="#contact"
          className="btn-pill btn-pill--primary mt-12"
        >
          Start a project
        </a>
      </Magnetic>
    </section>
  );
}
