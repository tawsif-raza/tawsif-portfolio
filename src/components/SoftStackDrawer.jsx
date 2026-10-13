import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ─── Edit your Soft Stack here ───────────────────────────────────────────
const BELIEFS = [
  { title: "Systems over motivation", note: "Motivation runs out. A routine that runs without me watching doesn't." },
  { title: "Build, break, rebuild", note: "I learn fastest by shipping something, finding where it fails, and fixing it." },
  { title: "Not demos, systems", note: "If it only works on stage, it isn't finished." },
  { title: "Constraints make better architecture", note: "Free tiers and small models force cleaner, cheaper designs." },
];
const SKILLS = [
  { title: "Technical communication", note: "Explaining agent systems to people who will never read the code." },
  { title: "Self-directed learning", note: "15 months of 12–16 hour days, with no syllabus but my own." },
  { title: "Customer empathy", note: "Working on the support side taught me what users actually feel." },
  { title: "Breaking problems down", note: "Big build, small steps: one milestone, one test, then the next." },
];
// Replace with what you're actually reading.
const READING = [
  { title: "Atomic Habits", author: "James Clear" },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann" },
  { title: "Deep Work", author: "Cal Newport" },
];
// ─────────────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1];
const list = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } } };
const item = { hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } } };

function Group({ index, title, children }) {
  return (
    <motion.section variants={item} className="border-t border-line pt-6">
      <p className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
        <span className="text-faint">{index}</span>
        {title}
      </p>
      {children}
    </motion.section>
  );
}

export default function SoftStackDrawer({ label = "[ Read my Soft Stack ]" }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Esc closes, Tab stays inside the drawer, page behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll("a, button");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open, close]);

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[70] bg-[#050607]/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.aside
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="soft-stack-title"
            className="soft-drawer fixed right-0 top-0 z-[71] flex h-full w-[min(460px,92vw)] flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32, mass: 0.9 }}
          >
            <div className="flex items-start justify-between gap-4 px-7 pb-2 pt-7">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Soft Stack · v1</p>
                <h2 id="soft-stack-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-paper">
                  My operating system
                </h2>
                <p className="mt-1.5 text-[13px] text-dim">The non-technical parts that make the technical parts work.</p>
              </div>
              <button ref={closeRef} type="button" onClick={close} className="soft-drawer__close" aria-label="Close">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <motion.div
              className="flex-1 space-y-8 overflow-y-auto px-7 pb-10 pt-6"
              variants={list}
              initial={reduce ? "show" : "hidden"}
              animate="show"
            >
              <Group index="01" title="Core beliefs">
                <ul className="space-y-4">
                  {BELIEFS.map((b) => (
                    <li key={b.title}>
                      <p className="text-[15px] font-medium text-paper">{b.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{b.note}</p>
                    </li>
                  ))}
                </ul>
              </Group>

              <Group index="02" title="Soft skills">
                <ul className="space-y-4">
                  {SKILLS.map((s) => (
                    <li key={s.title}>
                      <p className="text-[15px] font-medium text-paper">{s.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{s.note}</p>
                    </li>
                  ))}
                </ul>
              </Group>

              <Group index="03" title="Currently reading">
                <ul className="space-y-3">
                  {READING.map((r) => (
                    <li key={r.title} className="flex items-baseline gap-3">
                      <span className="mt-1 h-3 w-[2px] shrink-0 rounded bg-accent/70" aria-hidden="true" />
                      <p className="text-[14px] leading-snug text-paper">
                        <span className="italic">{r.title}</span>
                        <span className="text-dim"> · {r.author}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </Group>
            </motion.div>

            <div className="border-t border-line px-7 py-4 font-mono text-[10px] text-faint">
              Esc or click outside to close
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="soft-trigger"
      >
        {label}
      </button>
      {typeof document !== "undefined" && createPortal(drawer, document.body)}
    </>
  );
}
