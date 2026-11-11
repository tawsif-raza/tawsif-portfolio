import { memo, useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import SectionLabel from "../components/SectionLabel";
import { sectionNo } from "../data/experience";
import RevealText from "../components/RevealText";
import Magnetic from "../components/Magnetic";
import { PROJECTS, countByStatus } from "../data/projects";

import { askTawsif } from "../components/AskTawsif/ask";

const GITHUB = "https://github.com/tawsif-raza";

const askAbout = (title) => askTawsif(`Tell me about the ${title} project: what it does and how it's built.`);

const STATUS = {
  live: { label: "Live", cls: "status-badge--live" },
  progress: { label: "In progress", cls: "status-badge--progress" },
};

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

  const { title, category, status, problem, approach, outcome, stack, link, links, demo, image } = project;
  const s = STATUS[status];
  const cardLinks = [
    ...(links ?? (link ? [{ label: link.includes("github.com") ? "View code" : "View live", href: link }] : [])),
    ...(demo ? [{ label: "Watch demo", href: demo }] : []),
  ];

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
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {cardLinks.length > 0 ? (
              cardLinks.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="work-card__link">
                  {l.label} <Arrow />
                </a>
              ))
            ) : (
              <a href="#contact" className="work-card__link">
                Private build · ask for a walkthrough <Arrow />
              </a>
            )}
            {/* Opens the Ask Tawsif chat with a question about this project already sent. */}
            <button type="button" className="work-card__link cursor-pointer" onClick={() => askAbout(title)}>
              Ask the AI about this <Arrow />
            </button>
          </div>
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
        <SectionLabel number={sectionNo(3)} title="Work" />
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
              [countByStatus("live"), "live"],
              [countByStatus("progress"), "in progress"],
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
