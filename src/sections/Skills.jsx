import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealText from "../components/RevealText";
import SectionLabel from "../components/SectionLabel";
import SkillGraph3D from "../components/SkillGraph3D";
import useReducedMotion from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Core capabilities. Every tag here is something used in a real project
// on this site; keep it that way when adding to the list.
const GROUPS = [
  {
    id: "agentic",
    title: "Agentic AI",
    desc: "Multi-agent graphs that plan, branch in parallel, and hand off to a human when it matters.",
    tags: ["LangGraph", "Send() fan-out", "Subgraphs", "Checkpointing", "Human-in-the-loop", "Claude MCP"],
    span: "md:col-span-1 lg:col-span-2",
    icon: "M4 12h4m8 0h4M12 4v4m0 8v4M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  },
  {
    id: "llm",
    title: "LLM Systems",
    desc: "The right model for each job, wired in with structured output.",
    tags: ["Gemini", "Groq", "Qwen 2.5", "Prompt design", "Pydantic schemas"],
    span: "",
    icon: "M5 6h14v9H9l-4 4z",
  },
  {
    id: "rag",
    title: "RAG Systems",
    desc: "Answers grounded in real source data, not model memory.",
    tags: ["RAG pipelines", "Retrieval", "PostgreSQL", "Pydantic v2"],
    span: "",
    icon: "M5 5h10v14H5zM15 9h4v10h-4M8 9h4M8 13h4",
  },
  {
    id: "ml",
    title: "ML Engineering",
    desc: "Fine-tuning small open models to do one job well, from dataset to benchmark.",
    tags: ["Python", "QLoRA / LoRA", "Qwen 2.5 0.5B", "4-bit quantization", "Dataset curation"],
    span: "lg:col-span-2",
    icon: "M4 18l5-6 4 3 7-9M15 6h5v5",
  },
  {
    id: "automation",
    title: "Automation",
    desc: "n8n workflows that take manual busywork off someone's plate, end to end.",
    tags: ["n8n", "WhatsApp Cloud API", "Gmail API", "Meta Graph API", "Apollo", "APScheduler"],
    span: "lg:col-span-2",
    icon: "M4 7h6v4H4zM14 13h6v4h-6zM10 9h2a2 2 0 0 1 2 2v4",
  },
  {
    id: "production",
    title: "Production Systems",
    desc: "APIs and containers built to keep running after the demo.",
    tags: ["FastAPI", "Docker", "AWS", "PostgreSQL", "SQLAlchemy", "Vercel"],
    span: "lg:col-span-2",
    icon: "M4 6h16v5H4zM4 13h16v5H4zM7 8.5h.01M7 15.5h.01",
  },
  {
    id: "frontend",
    title: "Frontend",
    desc: "Interfaces for the systems, including this site.",
    tags: ["Next.js", "React", "Tailwind CSS", "Vite", "GSAP", "TypeScript"],
    span: "md:col-span-2 lg:col-span-2",
    icon: "M4 5h16v14H4zM4 9h16M8 13l-2 2 2 2M16 13l2 2-2 2",
  },
];

export default function Skills() {
  const rootRef = useRef();
  const [active, setActive] = useState(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".bento", start: "top 80%", once: true },
      });
      tl.from(".bento-tile", {
        opacity: 0,
        y: 40,
        scale: 0.96,
        filter: "blur(8px)",
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "filter,transform",
      }).from(
        ".bento-tile .skill-pill",
        { opacity: 0, y: 8, duration: 0.4, stagger: 0.015, ease: "power2.out" },
        "-=0.6"
      );
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Spotlight that follows the pointer inside each card.
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section ref={rootRef} id="skills" className="skills-v2 relative mx-auto max-w-6xl px-6 py-28 md:px-12 md:py-36">
      <SectionLabel number="03" title="Skills" />
      <div className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <RevealText
          text="What I actually work with, day to day."
          className="max-w-2xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
        />
        <p className="max-w-xs text-[14px] leading-relaxed text-dim">
          Seven capabilities, each backed by shipped work. Point at a card to light it up in the graph.
        </p>
      </div>

      <div className="bento grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bento-tile bento-graph md:col-span-2 lg:row-span-2">
          <div className="pointer-events-none absolute left-5 top-5 z-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            <span className="live-dot live-dot--sm" aria-hidden="true"><span /></span>
            Skill graph · drag to rotate
          </div>
          <SkillGraph3D groups={GROUPS} activeId={active} className="absolute inset-0 h-full w-full" />
        </div>

        {GROUPS.map((g) => (
          <article
            key={g.id}
            className={`bento-tile bento-card ${g.span} ${active === g.id ? "is-active" : ""}`}
            onPointerMove={onMove}
            onPointerEnter={() => setActive(g.id)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(g.id)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <span className="bento-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d={g.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-paper">{g.title}</h3>
              <span className="ml-auto font-mono text-[10px] text-faint">{String(g.tags.length).padStart(2, "0")}</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-dim">{g.desc}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${g.title} tools`}>
              {g.tags.map((t) => (
                <li key={t} className="skill-pill">{t}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
