import { useEffect, useState } from "react";
import { DEMO_RUNS } from "../data/demoRuns";

// "Run a sample task": steps a scripted task through one architecture, stage
// by stage, and stops at the human gate for the visitor to approve or reject.
// It is a simulation on sample data (see data/demoRuns.js); it says so on screen.
//
// `onStage(index)` tells the parent which stage is active, so the pipeline
// and the 3D preview above light up in step. Mount with key={arch.id} so a
// run resets when the architecture changes.

const STAGE_MS = 1150;

export default function AgentRun({ arch, onStage }) {
  const tasks = DEMO_RUNS[arch.id] ?? [];
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | running | waiting | done
  const [finished, setFinished] = useState(0); // how many stages have reported
  const [decision, setDecision] = useState(null); // "approve" | "reject"

  const task = tasks[taskIndex];
  const total = arch.nodes.length;

  useEffect(() => {
    if (phase !== "running") return;
    onStage(finished);
    const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      if (task.steps[finished].gate) setPhase("waiting");
      else if (finished + 1 >= total) {
        setFinished(total);
        setPhase("done");
      } else setFinished(finished + 1);
    }, quick ? 350 : STAGE_MS);
    return () => clearTimeout(timer);
  }, [phase, finished, task, total, onStage]);

  if (!task) return null;

  const start = () => {
    setDecision(null);
    setFinished(0);
    setPhase("running");
  };

  const pickTask = (index) => {
    setTaskIndex(index);
    setDecision(null);
    setFinished(0);
    setPhase("idle");
  };

  const decide = (choice) => {
    setDecision(choice);
    if (finished + 1 >= total) {
      setFinished(total);
      setPhase("done");
    } else {
      setFinished(finished + 1);
      setPhase("running");
    }
  };

  const busy = phase === "running" || phase === "waiting";
  // Stages with something to show: the finished ones, plus the active one.
  const visible = phase === "idle" ? 0 : Math.min(total, finished + (busy ? 1 : 0));

  return (
    <div className="agent-run mb-8 rounded-lg border border-line/50 bg-[#0d0f12] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">Run a sample task</p>
        <p className="font-mono text-[10px] text-faint">Simulation · sample data · nothing is sent</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Sample tasks">
        {tasks.map((t, index) => (
          <button
            key={t.label}
            type="button"
            aria-pressed={index === taskIndex}
            disabled={busy}
            onClick={() => pickTask(index)}
            className={`filter-tab text-left disabled:cursor-default disabled:opacity-50 ${
              index === taskIndex ? "filter-tab--active" : "border-line/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="btn-pill btn-pill--primary mt-4 disabled:cursor-default disabled:opacity-60"
      >
        {phase === "idle" ? "Run it" : busy ? "Running" : "Run again"}
      </button>

      {visible > 0 && (
        <ol className="mt-5 space-y-3 border-t border-line/40 pt-4" aria-live="polite" aria-label="Run log">
          {arch.nodes.slice(0, visible).map((node, index) => {
            const step = task.steps[index];
            const active = busy && index === finished;
            const working = active && phase === "running";
            const atGate = active && phase === "waiting";
            return (
              <li key={node.id} className="agent-run__row flex gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-[7px] h-2 w-2 flex-none rounded-full ${
                    working ? "animate-pulse bg-accent" : atGate ? "bg-[#ffb454]" : "bg-accent/70"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-paper">
                    <span className="text-accent-dim">0{index + 1}</span> {node.label}
                    {working && <span className="ml-2 text-faint">working</span>}
                    {atGate && <span className="ml-2 text-[#ffb454]">waiting for you</span>}
                  </p>
                  {!working &&
                    step.lines.map((line) => (
                      <p key={line} className="mt-1 text-[13px] leading-relaxed text-dim">
                        {line}
                      </p>
                    ))}
                  {atGate && (
                    <div className="mt-3">
                      <p className="text-[13px] text-paper">{step.gate.question}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" className="btn-pill btn-pill--primary" onClick={() => decide("approve")}>
                          Approve
                        </button>
                        <button type="button" className="btn-pill btn-pill--glass" onClick={() => decide("reject")}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                  {step.gate && decision && index < finished && (
                    <p className={`mt-1 text-[13px] leading-relaxed ${decision === "approve" ? "text-accent" : "text-[#ffb454]"}`}>
                      {step.gate[decision]}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {phase === "done" && (
        <p className="mt-4 border-t border-line/40 pt-3 font-mono text-[11px] text-faint">
          Run complete · {total} stages. Click any stage above to see how it works.
        </p>
      )}
    </div>
  );
}
