import { lazy, Suspense, useMemo, useRef, useState } from "react";
import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";
import { canGoFullGL } from "../utils/canGoFullGL";
import useNearViewport from "../hooks/useNearViewport";

const LivingSystemScene = lazy(() => import("../components/LivingSystemScene"));

// Maps this section's own human-readable node types onto the living
// system's palette keys (src/data/systemGraph.js NODE_COLORS/RADIUS) so
// both real architectures render with the same visual language as
// Hero and Methodology — unmapped types fall back to "agent".
const TYPE_TO_SYSTEM_TYPE = {
  Gateway: "gateway",
  Orchestrator: "orchestrator",
  "Inference Engine": "agent",
  Persistence: "tool",
  "Safety Boundary": "tool",
  Scheduler: "gateway",
  "Data Processing": "agent",
  "LLM Copy Generator": "agent",
  Guardrail: "tool",
  "Output API": "output",
};

const ARCHITECTURES = [
  {
    id: "voice-employee",
    name: "AI Voice Employee",
    category: "Agentic / Fine-Tuned LLM",
    description:
      "A domain-fine-tuned assistant architecture operating on LangGraph state machines with persistent checkpointer and human-in-the-loop validation.",
    nodes: [
      {
        id: "ingest",
        label: "FastAPI Ingestion",
        type: "Gateway",
        tech: "FastAPI, Pydantic v2",
        execution: "Asynchronous / Non-blocking",
        role: "Validates incoming payload schemas, authenticates caller, and initializes state dictionary with unique session thread ID.",
        fallback: "Rejects malformed payloads with 422; circuit breaker prevents cascading downstream errors.",
      },
      {
        id: "router",
        label: "LangGraph Router",
        type: "Orchestrator",
        tech: "LangGraph, Python 3.11",
        execution: "State Machine Traversal",
        role: "Evaluates intent and state context to determine whether to branch into direct answer, tool invocation, or escalation subgraphs.",
        fallback: "Routes to a conservative clarification node if intent routing is ambiguous.",
      },
      {
        id: "model",
        label: "Qwen 2.5 (QLoRA)",
        type: "Inference Engine",
        tech: "Qwen 2.5 0.5B, LoRA adapter, vLLM",
        execution: "Local GPU Inference (LoRA)",
        role: "Generates domain-grounded responses fine-tuned on curated company interactions. Adheres strictly to system instructions.",
        fallback: "Falls back to cached responses or secondary base model if local GPU endpoint times out.",
      },
      {
        id: "db",
        label: "PostgreSQL State Checkpoint",
        type: "Persistence",
        tech: "PostgreSQL, SQLAlchemy, asyncpg",
        execution: "Async Connection Pool",
        role: "Stores thread conversation history, state snapshots, and rollback checkpoints for multi-turn sessions.",
        fallback: "In-memory LRU cache maintains read state during database connection pool recovery.",
      },
      {
        id: "gate",
        label: "Human Review Gate",
        type: "Safety Boundary",
        tech: "LangGraph Interrupt, Webhook",
        execution: "Asynchronous Interrupt",
        role: "Pauses graph execution whenever high-stakes actions are triggered, awaiting explicit human approval before committing changes.",
        fallback: "Halts automated transmission until manual review is confirmed.",
      },
    ],
  },
  {
    id: "outbound-engine",
    name: "AI Outbound Engine",
    category: "Autonomous Workflow",
    description:
      "A resilient lead prospecting and contextual personalization pipeline running unattended on n8n with Groq acceleration and Gmail draft gates.",
    nodes: [
      {
        id: "trigger",
        label: "Trigger & Ingestion",
        type: "Scheduler",
        tech: "n8n Cron, Webhooks",
        execution: "Scheduled Cron / Webhook",
        role: "Runs scheduled prospecting queries across Apollo API matching defined ICP criteria (industry, head count, location).",
        fallback: "Logs execution state; exponential backoff on third-party API rate limits.",
      },
      {
        id: "enrich",
        label: "Enrichment & Dedupe",
        type: "Data Processing",
        tech: "n8n Data Tables, Fuzzy Matching",
        execution: "In-Memory Deduplication",
        role: "Enriches company telemetry, scrubs existing CRM contacts, and discards leads contacted within the retention window.",
        fallback: "Skips duplicates silently and records an audit trace in data store.",
      },
      {
        id: "reason",
        label: "Groq Llama 3 Reasoning",
        type: "LLM Copy Generator",
        tech: "Groq Cloud API, Llama 3 70B",
        execution: "Streaming Cloud Inference",
        role: "Analyzes company value proposition and crafts customized, concise outreach angles matching the prospect's role.",
        fallback: "Retries with 8B model if 70B model capacity threshold is reached.",
      },
      {
        id: "quality",
        label: "Quality & Tone Gate",
        type: "Guardrail",
        tech: "Regex & Heuristic Filter",
        execution: "Deterministic Heuristic",
        role: "Evaluates copy for banned spam keywords, length constraints (max 120 words), and valid variable substitutions.",
        fallback: "Flags drafts failing scoring for manual review rather than queuing for email creation.",
      },
      {
        id: "draft",
        label: "Gmail Draft Creator",
        type: "Output API",
        tech: "Google Workspace Gmail API",
        execution: "Authenticated REST Call",
        role: "Creates completed draft emails inside Gmail for human review before any outbound send occurs. Zero blind auto-sending.",
        fallback: "Stores generated copy in fallback CSV if Google OAuth token requires refresh.",
      },
    ],
  },
];

export default function ArchitectureShowcase() {
  const [selectedArchIndex, setSelectedArchIndex] = useState(0);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);

  const [fullGL] = useState(canGoFullGL);
  const sceneRef = useRef();
  const sceneNear = useNearViewport(sceneRef);
  const currentArch = ARCHITECTURES[selectedArchIndex];
  const currentNode = currentArch.nodes[selectedNodeIndex] || currentArch.nodes[0];

  const handleArchChange = (index) => {
    setSelectedArchIndex(index);
    setSelectedNodeIndex(0);
  };

  // A simple left-to-right pipeline layout — this section's own
  // architectures are genuinely sequential, so a hub-and-spoke shape
  // (Hero/Methodology's topology) would misrepresent how they work.
  // Per design doc §12: let topology follow the real architecture.
  const sceneNodes = useMemo(
    () =>
      currentArch.nodes.map((n, idx, arr) => ({
        id: n.id,
        label: n.label,
        type: TYPE_TO_SYSTEM_TYPE[n.type] ?? "agent",
        role: n.role,
        tech: n.tech,
        pos: [(idx - (arr.length - 1) / 2) * 1.3, idx % 2 === 0 ? 0 : 0.35, -idx * 0.15],
      })),
    [currentArch]
  );
  const sceneEdges = useMemo(
    () =>
      currentArch.nodes.slice(0, -1).map((n, idx) => ({
        from: n.id,
        to: currentArch.nodes[idx + 1].id,
        type: "data",
      })),
    [currentArch]
  );

  return (
    <section
      id="architecture"
      aria-label="AI System Architectures"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-20 md:px-12"
    >
      <SectionLabel number="06" title="SYSTEM ARCHITECTURE" />

      <RevealText
        text="Interactive blueprints of systems currently in production."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <p className="mb-10 max-w-xl text-[15px] leading-relaxed text-dim">
        Click any node in the pipeline below to inspect its operational role,
        tech stack, execution mode, and fault-tolerance safeguards.
      </p>

      {/* Architecture Toggle Tabs */}
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Architecture blueprints">
        {ARCHITECTURES.map((arch, idx) => {
          const isSelected = selectedArchIndex === idx;
          return (
            <button
              key={arch.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleArchChange(idx)}
              className={`filter-tab ${
                isSelected ? "filter-tab--active font-medium" : ""
              }`}
            >
              {arch.name}
              <span className="ml-2 text-[10px] text-accent-dim">
                [{arch.category}]
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Architecture Inspector Card */}
      <div className="glass-card p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-4">
          <div>
            <h3 className="font-display text-xl font-medium text-paper">
              {currentArch.name}
            </h3>
            <p className="mt-1 text-xs text-dim max-w-lg">
              {currentArch.description}
            </p>
          </div>
          <span className="font-mono text-[10px] text-accent uppercase tracking-wider">
            {currentArch.nodes.length} Stages · Interactive Schematic
          </span>
        </div>

        {/* Live 3D preview of this exact architecture's real nodes,
            highlighting whichever stage is selected below. Same
            component as Hero/Methodology, different data — the 2D
            pipeline nav + detail panel underneath still work exactly
            as before and remain the primary, always-available way to
            read this section. */}
        {fullGL && (
          <div ref={sceneRef} className="mb-8 h-48 overflow-hidden rounded-lg border border-line/50 bg-[#0d0f12] sm:h-56">
            {sceneNear && (
              <Suspense fallback={null}>
                <LivingSystemScene
                  nodes={sceneNodes}
                  edges={sceneEdges}
                  highlightIds={[currentNode.id]}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Pipeline Step Navigator - 2.5D Visualization */}
        <div className="mb-12 w-full overflow-x-auto pb-10 pt-6 hide-scrollbar relative">
          <div className="flex min-w-[600px] items-center px-4 justify-between relative">
            {currentArch.nodes.map((node, idx) => {
              const isSelected = selectedNodeIndex === idx;
              const isPast = idx < selectedNodeIndex;
              return (
                <div key={node.id} className="relative flex items-center flex-1 last:flex-none">
                  {/* Node Button */}
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedNodeIndex(idx)}
                    className={`node-2d-block relative z-10 w-28 shrink-0 cursor-pointer ${
                      isSelected ? "is-active" : isPast ? "is-past" : ""
                    }`}
                  >
                    <div className="node-2d-top"></div>
                    <div className="node-2d-front"></div>
                    <div className="node-2d-right"></div>
                    
                    <div className="node-2d-content absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                      <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-[#0b0c0e]' : 'text-accent'}`}>
                        0{idx + 1}
                      </span>
                      <span className={`mt-1 font-mono text-[9px] uppercase tracking-wide truncate w-full px-1 ${isSelected ? 'text-[#0b0c0e]' : 'text-paper/80'}`}>
                        {node.type}
                      </span>
                    </div>
                  </button>
                  
                  {/* Connecting Edge */}
                  {idx < currentArch.nodes.length - 1 && (
                    <div className="edge-2d relative h-[2px] flex-1 mx-2 overflow-hidden bg-line/40 rounded-full mt-[-10px]">
                      <div className={`absolute left-0 top-0 h-full bg-accent transition-all duration-700 ease-out ${isPast || isSelected ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Details */}
        <div className="rounded-lg border border-line/50 bg-[#0d0f12] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 pb-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm font-medium text-paper">{currentNode.label}</span>
              <span className="text-xs text-faint">({currentNode.type})</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-dim">
                Mode: <span className="text-accent">{currentNode.execution}</span>
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-faint block mb-1">
                System Role & Execution
              </span>
              <p className="text-[13px] leading-relaxed text-dim">
                {currentNode.role}
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent-dim block mb-1">
                Fault Tolerance & Error Boundary
              </span>
              <p className="text-[13px] leading-relaxed text-dim">
                {currentNode.fallback}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-line/30 pt-3 font-mono text-[11px]">
            <span className="text-faint uppercase text-[10px]">Stack:</span>
            <span className="text-accent/90">{currentNode.tech}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
