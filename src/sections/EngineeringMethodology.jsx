import { lazy, Suspense, useRef, useState } from "react";
import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";
import { canGoFullGL } from "../utils/canGoFullGL";
import useNearViewport from "../hooks/useNearViewport";

const LivingSystemScene = lazy(() => import("../components/LivingSystemScene"));

// Which "living system" nodes light up for each phase below — not a
// 1:1 mapping for every phase (phase 01 is deliberately pre-architecture,
// so nothing highlights), but real correspondences where they exist
// (e.g. phase 04 literally mentions RAG + MCP in its own description).
const PHASE_HIGHLIGHTS = [
  [],
  ["orchestrator"],
  ["planner", "retriever", "critic"],
  ["rag", "mcp"],
  ["gateway", "orchestrator"],
  ["output"],
];

const PHASES = [
  {
    step: "01",
    title: "Problem & Boundary Definition",
    headline: "Evaluating whether an LLM is truly required vs. deterministic code.",
    description:
      "Not every problem needs generative AI. I first audit whether traditional deterministic algorithms, rule-based heuristics, or lightweight classical ML can solve the bottleneck with lower latency, zero hallucination risk, and zero inference costs.",
    deliverable: "Technical specification, boundary constraints, latency & cost targets",
    safeguard: "Strict ROI and latency feasibility audit before writing agent logic.",
  },
  {
    step: "02",
    title: "Architecture & Graph Design",
    headline: "Designing stateful execution topologies with clear checkpoints.",
    description:
      "Rather than fragile linear prompt chains that fail silently mid-stream, I design state machines using LangGraph. Workflows are modeled with explicit state transitions, parallel fan-out (Send), cycle limits, and human-in-the-loop review nodes.",
    deliverable: "Stateful graph blueprints, shared state schemas, cycle guardrails",
    safeguard: "Cycle limits and deadlock prevention on all cyclic agent loops.",
  },
  {
    step: "03",
    title: "Agent Orchestration & Prompts",
    headline: "Decomposing complex objectives across isolated, specialized agents.",
    description:
      "Single massive prompts fail on edge cases. I decompose systems into focused sub-agents (e.g. planner, retriever, extractor, reviewer). Each operates with minimal context, strict Pydantic schemas, and calibrated few-shot examples.",
    deliverable: "Role-constrained system prompts, Pydantic schemas, benchmark tests",
    safeguard: "Format validation enforcement; malformed outputs trigger targeted self-correction.",
  },
  {
    step: "04",
    title: "Tools & Context Engineering",
    headline: "Grounding agents in authoritative data via RAG and standardized protocols.",
    description:
      "Hallucination occurs when models lack authoritative data. I implement hybrid retrieval pipelines (vector embeddings combined with BM25 keyword search) and integrate external systems via standardized protocols like Model Context Protocol (MCP) and authenticated REST APIs.",
    deliverable: "Hybrid retrieval indexes, embedding pipelines, MCP tool servers",
    safeguard: "Retrieval score thresholds preventing generation on ungrounded context.",
  },
  {
    step: "05",
    title: "Backend Hardening & Fallbacks",
    headline: "Treating model outputs as untrusted input with strict boundaries.",
    description:
      "LLM APIs experience latency spikes and rate limits. I wrap every model call inside asynchronous FastAPI services with exponential-backoff retries, fallback endpoints, circuit breakers, and deterministic fallbacks if inference fails.",
    deliverable: "FastAPI endpoints, retry budgets, circuit breakers, error boundaries",
    safeguard: "Graceful degradation ensures the application functions even during upstream provider outages.",
  },
  {
    step: "06",
    title: "Deployment & Observability",
    headline: "Packaging into reproducible containers with end-to-end tracing.",
    description:
      "Systems must run reliably without manual oversight. I package services into multi-stage Docker containers for AWS deployment, wiring up structured JSON telemetry, token cost tracking, and execution logs so state transitions are fully auditable.",
    deliverable: "Multi-stage Dockerfiles, AWS configs, latency & token telemetry",
    safeguard: "Continuous health checks and automated restart policies.",
  },
];

export default function EngineeringMethodology() {
  const [activeStep, setActiveStep] = useState(0);
  const [fullGL] = useState(canGoFullGL);
  // The three.js chunk (~240 kB gzip) and its WebGL context load only once
  // this box is within ~a screen of view, not at page load.
  const sceneRef = useRef();
  const sceneNear = useNearViewport(sceneRef);

  return (
    <section
      id="methodology"
      aria-label="How I Build AI Systems"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-20 sm:py-24 md:px-12"
    >
      <SectionLabel number="METHOD" title="HOW I BUILD AI SYSTEMS" />

      <RevealText
        text="From problem formulation to production hardening."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <p className="mb-10 max-w-xl text-[15px] leading-relaxed text-dim">
        Anyone can prototype with a raw API key. Building resilient AI requires
        treating models as untrusted components inside a disciplined software architecture.
      </p>

      {/* Live preview of the same system this portfolio's Hero shows,
          highlighting whichever nodes the selected phase touches. Only
          rendered for visitors capable of the full 3D experience —
          plain-text content above and below already fully explains
          every phase without it. */}
      {fullGL && (
        <div ref={sceneRef} className="mb-10 h-48 overflow-hidden rounded-lg border border-line/50 bg-[#0d0f12] sm:h-56">
          {sceneNear && (
            <Suspense fallback={null}>
              <LivingSystemScene highlightIds={PHASE_HIGHLIGHTS[activeStep]} />
            </Suspense>
          )}
        </div>
      )}

      {/* Process Flow Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Step Navigation Sidebar */}
        <div
          className="flex flex-col gap-2 lg:col-span-5"
          role="tablist"
          aria-label="Engineering phases"
        >
          {PHASES.map((p, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={p.step}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveStep(idx)}
                className={`group flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-accent/60 bg-surface/80 shadow-[0_0_20px_rgba(198,244,50,0.06)]"
                    : "border-line/60 bg-surface/30 hover:border-line hover:bg-surface/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs transition-colors ${
                      isActive ? "text-accent font-medium" : "text-faint group-hover:text-dim"
                    }`}
                  >
                    {p.step}
                  </span>
                  <span
                    className={`font-mono text-xs transition-colors ${
                      isActive ? "text-paper font-medium" : "text-dim group-hover:text-paper"
                    }`}
                  >
                    {p.title}
                  </span>
                </div>
                <span
                  className={`text-xs transition-transform duration-200 ${
                    isActive ? "translate-x-0.5 text-accent" : "text-[#4b5058] group-hover:text-dim"
                  }`}
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            );
          })}
        </div>

        {/* Deep Dive Panel */}
        <div className="lg:col-span-7">
          <div className="glass-card flex h-full flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-accent">
                  Phase {PHASES[activeStep].step}
                </span>
                <span className="font-mono text-[10px] text-faint uppercase tracking-wider">
                  Engineering Standard
                </span>
              </div>

              <h3 className="font-display text-lg font-medium text-paper sm:text-xl">
                {PHASES[activeStep].title}
              </h3>

              <p className="mt-1.5 font-mono text-xs text-accent-dim">
                {PHASES[activeStep].headline}
              </p>

              <div className="my-4 h-px w-full bg-line/70" />

              <p className="text-[13px] leading-relaxed text-dim">
                {PHASES[activeStep].description}
              </p>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-line/60 pt-4 font-mono text-[11px]">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-faint uppercase tracking-wider shrink-0 text-[10px]">Deliverable:</span>
                <span className="text-paper/90">{PHASES[activeStep].deliverable}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-accent-dim uppercase tracking-wider shrink-0 text-[10px]">Guardrail:</span>
                <span className="text-dim">{PHASES[activeStep].safeguard}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
