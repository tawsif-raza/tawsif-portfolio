import { useEffect, useRef, useState } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import useInViewport from "../hooks/useInViewport";

// The "NOW" card. Keep it honest: update STAGES, LOG and UPDATED whenever
// the work moves. Nothing here is a fake live metric -- the motion is the
// pulse and the log replay, the facts are the real state of the project.
const UPDATED = "Sep 2026";
const STAGES = [
  { label: "Dataset", detail: "1,366 pairs curated", state: "done" },
  { label: "Config", detail: "QLoRA, 4-bit", state: "done" },
  { label: "Training", detail: "next run", state: "active" },
  { label: "Eval + serve", detail: "LangGraph + FastAPI", state: "queued" },
];
const LOG = [
  "dataset  1,366 conversational pairs validated (JSONL)",
  "config   r=16  lora_alpha=32  target=q_proj,v_proj",
  "base     Qwen 2.5 0.5B, 4-bit quantized",
  "next     training run, then latency + memory benchmarks",
];

export default function LiveStatus() {
  const rootRef = useRef();
  const inView = useInViewport(rootRef, 0.2);
  const reducedMotion = useReducedMotion();
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(reducedMotion ? LOG[0].length : 0);

  // Replays the log one line at a time, typed out, while on screen.
  useEffect(() => {
    if (reducedMotion || !inView) return;
    const text = LOG[line];
    if (chars < text.length) {
      const id = setTimeout(() => setChars((c) => c + 1), 22);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setLine((l) => (l + 1) % LOG.length);
      setChars(0);
    }, 2200);
    return () => clearTimeout(id);
  }, [chars, line, inView, reducedMotion]);

  const shown = reducedMotion ? LOG[line] : LOG[line].slice(0, chars);

  return (
    <div ref={rootRef} className="live-card" aria-label="What I'm building right now">
      <div className="live-card__scan" aria-hidden="true" />
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          <span className="live-dot" aria-hidden="true">
            <span />
          </span>
          Now building
        </span>
        <span className="font-mono text-[10px] text-faint">Updated {UPDATED}</span>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-paper">
        Training the Qwen 2.5 QLoRA fine-tune
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-dim">
        For AI Voice Employee. The data pipeline and training config are done; model training is next.
      </p>

      <ol className="live-stages mt-5" aria-label="Progress">
        {STAGES.map((s) => (
          <li key={s.label} className={`live-stage live-stage--${s.state}`}>
            <span className="live-stage__bar" aria-hidden="true" />
            <span className="mt-2 block text-[12px] font-medium text-paper">{s.label}</span>
            <span className="block font-mono text-[10px] text-faint">{s.detail}</span>
            <span className="sr-only">{s.state === "done" ? "done" : s.state === "active" ? "in progress" : "queued"}</span>
          </li>
        ))}
      </ol>

      <div className="live-log mt-5" aria-live="off">
        <span className="text-accent">$</span> <span>{shown}</span>
        <span className="live-caret" aria-hidden="true" />
      </div>
    </div>
  );
}
