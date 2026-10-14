import { memo, useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";
import Magnetic from "../components/Magnetic";

const BASE = import.meta.env.BASE_URL;
const GITHUB = "https://github.com/tawsif-raza";

const PROJECTS = [
  {
    title: "AI Outbound Engine",
    category: "Automation pipeline",
    status: "live",
    problem: "Manually prospecting and personalizing outreach doesn't scale.",
    approach:
      "Apollo search + enrichment feeds a dedupe layer, then Groq generates personalized outreach copy, drafted into Gmail for human review before sending.",
    outcome: "Running pipeline, offered as a paid build + retainer service.",
    stack: ["n8n", "Apollo", "Groq", "Gmail API"],
    link: null,
    image: `${BASE}project-outbound.jpg`,
  },
  {
    title: "The Highland Estate",
    category: "Frontend showcase",
    status: "live",
    problem: "Needed a polished frontend/UI-UX showcase beyond backend work.",
    approach:
      "Luxury resort site with a full-bleed video hero, 3D-tilt room cards, and scroll-triggered animation across the amenities section.",
    outcome: "Fully deployed, polished, working end-to-end.",
    stack: ["Next.js", "React", "Tailwind CSS", "Vercel"],
    link: "https://highland-estate.vercel.app/",
    image: `${BASE}project-highland.jpg`,
  },
  {
    title: "Qwen 2.5 AI Assistant",
    category: "AI/ML",
    status: "progress",
    problem: "Can a small fine-tuned model act as a reliable AI assistant for one job?",
    approach:
      "Qwen 2.5 (0.5B) fine-tuned with QLoRA on a curated 1,366-example dataset, served through LangGraph + FastAPI, containerized for AWS deployment.",
    outcome: "Data pipeline + training config complete; model training next.",
    stack: ["Qwen 2.5", "QLoRA", "LangGraph", "FastAPI", "PostgreSQL", "Docker"],
    link: "https://github.com/tawsif-raza/ai-voice-employee",
    image: `${BASE}project-voice.jpg`,
  },
  {
    title: "Vox AI",
    category: "Projects & generated videos",
    status: "live",
    problem: "Wanted a content venture with a distinct, consistent visual identity.",
    approach:
      "Gemini/Veo-generated 3D storytelling shorts with a recurring character, managed in one dashboard and automated toward auto-publishing via n8n + Claude MCP.",
    outcome: "Active on YouTube & Instagram; auto-publish automation underway.",
    stack: ["Gemini", "Veo", "n8n", "MCP"],
    link: "https://github.com/tawsif-raza/ai-auto-post",
    image: `${BASE}project-video.jpg`,
  },
  {
    title: "AI Video Studio",
    category: "Multi-agent system",
    status: "progress",
    problem: "Turning one story idea into a full, consistent video takes a team of specialists.",
    approach:
      "A LangGraph production graph: a Story Planner fans out with Send() to Scene, Character and Environment planners, a Prompt Generator subgraph writes the shots, and interrupt() with a Postgres checkpointer holds for human approval.",
    outcome: "5-node pipeline runs end-to-end; now polishing the final edit (audio ducking, subtitles, Ken Burns).",
    stack: ["LangGraph", "Gemini", "Groq", "PostgreSQL", "Python"],
    link: "https://github.com/tawsif-raza/ai-video-studio",
    image: `${BASE}project-studio.jpg`,
  },
  {
    title: "AI Video Editing Agent",
    category: "Agentic automation",
    status: "progress",
    problem: "Cutting raw footage by hand is slow, and AI edits need a human check before they ship.",
    approach:
      "faster-whisper transcribes locally, Claude proposes an edit plan as JSON, a human approves it, FFmpeg renders, and a QA gate checks black frames, silence and loudness (-14 LUFS). An n8n job queue tracks every clip.",
    outcome: "Full pipeline runs end-to-end and resumes after timeouts; testing on longer real clips next.",
    stack: ["Python", "faster-whisper", "Claude", "FFmpeg", "n8n"],
    link: null,
    image: `${BASE}project-editor.jpg`,
  },
  {
    title: "Daily Learning Digest",
    category: "Automation workflow",
    status: "live",
    problem: "New ML papers and lab announcements are spread across too many sites to follow by hand.",
    approach:
      "A scheduled n8n workflow pulls new arXiv papers and OpenAI, Hugging Face and DeepMind blog feeds, Gemini writes a short summary of each, and Gmail delivers one digest a day.",
    outcome: "Live and running daily, delivered as a single email.",
    stack: ["n8n", "Gemini", "arXiv API", "RSS", "Gmail API"],
    link: null,
    image: `${BASE}project-digest.jpg`,
  },
];

const STATUS = {
  live: { label: "Live", cls: "status-badge--live" },
  progress: { label: "In progress", cls: "status-badge--progress" },
};

const count = (s) => PROJECTS.filter((p) => p.status === s).length;

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="work-arrow">
      <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Shared spring so every scroll-driven value glides and settles with momentum
// instead of stopping dead the moment the wheel stops.
const SPRING = { stiffness: 100, damping: 20, restDelta: 0.001 };

// Each slot is one screen tall, so with N cards the stack's scroll range
// ("start end" -> "end start") is N + 1 screens. Every card's windows are
// slices of that one shared progress value, which means the whole section
// runs off a single scroll listener and a single spring instead of one pair
// per card. All values are MotionValues: nothing here re-renders React.
//
// One slide in the stack.
// - Entry: while its own slot rises from the bottom of the screen to the top,
//   the card starts pitched forward on the X axis and settles flat.
// - Push-back: while the NEXT card slides over it, it scales to 0.95 and fades
//   to ~45%, like a camera racking focus onto the new card.
// - Parallax: the image drifts on Y inside its frame as the slot moves.
// memo(): props are a static project object plus stable MotionValues, so the
// cards stay inert even if something above them re-renders.
const StackCard = memo(function StackCard({ project, index, total, progress, reduce }) {
  const unit = 1 / (total + 1);
  const entryStart = index * unit;
  const entryEnd = entryStart + unit;
  const pushEnd = entryEnd + unit;
  const isLast = index === total - 1;

  const rotateX = useTransform(progress, [entryStart, entryEnd], [index === 0 ? 0 : 16, 0]);
  const entryScale = useTransform(progress, [entryStart, entryEnd], [index === 0 ? 1 : 0.92, 1]);

  const pushScale = useTransform(progress, [entryEnd, pushEnd], [1, isLast ? 1 : 0.95]);
  const opacity = useTransform(progress, [entryEnd, pushEnd], [1, isLast ? 1 : 0.45]);

  const scale = useTransform([entryScale, pushScale], ([a, b]) => a * b);
  const imgY = useTransform(progress, [entryStart, pushEnd], ["-7%", "7%"]);

  const { title, category, status, problem, approach, outcome, stack, link, image } = project;
  const s = STATUS[status];

  const motionStyle = reduce
    ? { top: `${index * 22}px` }
    : {
        top: `${index * 22}px`,
        scale,
        rotateX,
        opacity,
        transformPerspective: 1400,
        willChange: "transform, opacity",
      };

  return (
    <div className="stack-slot">
      <motion.article className="work-card stack-card group" style={motionStyle}>
        <div className="work-card__media stack-card__media">
          <motion.img
            src={image}
            alt={`${title} preview`}
            loading="lazy"
            decoding="async"
            style={reduce ? undefined : { y: imgY, scale: 1.16, willChange: "transform" }}
          />
          <div className="work-card__shade" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <span className={`status-badge ${s.cls}`}>
              <span className="status-dot" aria-hidden="true" />
              {s.label}
            </span>
            <span className="font-mono text-[11px] text-paper/70">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className="work-card__reveal">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">How it's built</p>
            <p className="text-[13px] leading-relaxed text-paper/90">{approach}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 md:p-8">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{category}</p>
          <h3 className="text-2xl font-semibold tracking-[-0.025em] text-paper md:text-3xl">{title}</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-dim md:text-[15px]">{problem}</p>
          <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-dim">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Result</span>
            <span className="text-paper/90">{outcome}</span>
          </p>
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tech stack">
            {stack.map((t) => (
              <li key={t} className="tech-pill">{t}</li>
            ))}
          </ul>
          {link && (
            <a href={link} target="_blank" rel="noreferrer" data-cursor="View" className="work-card__link mt-6">
              {link.includes("github.com") ? "View code" : "View live"} <Arrow />
            </a>
          )}
        </div>
      </motion.article>
    </div>
  );
});

export default function Projects() {
  const stackRef = useRef(null);
  const reduce = useReducedMotion();
  // 0 when the stack's top enters at the bottom of the screen, 1 when its
  // bottom leaves at the top. Shared by every card (see StackCard).
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ["start end", "end start"] });
  const smoothProgress = useSpring(scrollYProgress, SPRING);

  return (
    <section id="projects" className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-28 md:px-12 md:pt-36">
        <SectionLabel number="03" title="Work" />
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <RevealText
              text="Systems I've built, live, in progress, and next."
              className="max-w-2xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
            />
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-dim">
              Scroll through them one at a time. Hover the image to see how each one is built.
            </p>
          </div>
          <dl className="flex gap-8 md:gap-10">
            {[
              [PROJECTS.length, "projects"],
              [count("live"), "live"],
              [count("progress"), "in progress"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-3xl font-semibold tracking-[-0.03em] text-paper md:text-4xl">{String(v).padStart(2, "0")}</dd>
                <dd aria-hidden="true" className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* The stack: each slot is one screen tall; its card sticks at centre. */}
      <div ref={stackRef} className="stack mx-auto max-w-5xl px-4 md:px-12">
        {PROJECTS.map((p, i) => (
          <StackCard key={p.title} project={p} index={i} total={PROJECTS.length} progress={smoothProgress} reduce={reduce} />
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-28 md:px-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[20px] border border-line bg-surface/60 p-6 sm:flex-row sm:items-center md:p-8">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-paper">Need a system like these?</p>
            <p className="mt-1 text-[14px] text-dim">Automation, agents, or a full build. Tell me the problem.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Magnetic>
              <a href="#contact" className="btn-pill btn-pill--primary">Start a project</a>
            </Magnetic>
            <Magnetic>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="btn-pill btn-pill--glass">GitHub</a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
