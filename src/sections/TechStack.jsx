import { useState } from "react";
import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";

const STACK_CATEGORIES = [
  {
    name: "Languages & Runtimes",
    description: "Core languages used for backend services, agent graphs, and client interfaces.",
    items: [
      { name: "Python 3.11+", detail: "Primary language for LangGraph pipelines, fine-tuning scripts, and FastAPI" },
      { name: "JavaScript / ESNext", detail: "Modern frontend logic, Vite build tooling, and browser APIs" },
      { name: "TypeScript", detail: "Typed API contracts, frontend interfaces, and schema definitions" },
      { name: "SQL", detail: "Relational queries, schema design, and state persistence with PostgreSQL" },
      { name: "Bash / Shell", detail: "Container entrypoints, environment setup, and deployment automation" },
    ],
  },
  {
    name: "AI & Agent Frameworks",
    description: "Model fine-tuning, multi-agent orchestration, and prompt execution.",
    items: [
      { name: "LangGraph", detail: "Cyclic multi-agent topologies with Send() branching and checkpointing" },
      { name: "Qwen 2.5 (0.5B)", detail: "Target base open model fine-tuned on custom conversational dataset" },
      { name: "QLoRA / LoRA", detail: "Parameter-efficient 4-bit quantized adapter fine-tuning" },
      { name: "Groq Cloud API", detail: "Low-latency Llama 3 inference for real-time outreach generation" },
      { name: "Gemini / Veo", detail: "Multimodal asset and structured story generation pipelines" },
      { name: "Claude MCP", detail: "Model Context Protocol for connecting agents to local toolsets" },
    ],
  },
  {
    name: "Backend & Data Storage",
    description: "Production API services, data validation, and persistent state management.",
    items: [
      { name: "FastAPI", detail: "High-performance asynchronous REST endpoints with Pydantic validation" },
      { name: "PostgreSQL", detail: "Relational database housing agent thread state and session memories" },
      { name: "SQLAlchemy / asyncpg", detail: "Asynchronous ORM mapping and connection pooling" },
      { name: "Pydantic v2", detail: "Strict type enforcement and runtime validation on LLM output schemas" },
      { name: "Flask", detail: "Lightweight utility backends for personal dashboards and trackers" },
    ],
  },
  {
    name: "Workflow & Cloud Infrastructure",
    description: "Unattended event orchestration, containerization, and hosting.",
    items: [
      { name: "n8n Automation", detail: "Self-hosted workflows wiring webhooks, filters, and scheduled cron jobs" },
      { name: "Docker", detail: "Multi-stage container packaging for reproducible cloud deployments" },
      { name: "AWS (EC2 / ECS)", detail: "Target cloud infrastructure for containerized FastAPI microservices" },
      { name: "Google Workspace API", detail: "Authenticated Gmail API integration for drafting personalized outreach" },
      { name: "Git / GitHub", detail: "Version control, automated build actions, and open-source releases" },
      { name: "Vercel", detail: "Edge deployment and hosting for production frontend interfaces" },
    ],
  },
];

export default function TechStack() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section
      id="tech-stack"
      aria-label="Technology Stack"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-20 sm:py-24 md:px-12"
    >
      <SectionLabel number="STACK" title="TECHNOLOGY MATRIX" />

      <RevealText
        text="A curated stack designed for production resilience."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <p className="mb-10 max-w-xl text-[15px] leading-relaxed text-dim">
        Organized by architectural responsibility. Every technology listed is actively
        used in real systems across my codebase.
      </p>

      {/* Category Pills */}
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Technology categories">
        {STACK_CATEGORIES.map((cat, idx) => {
          const isActive = activeCategory === idx;
          return (
            <button
              key={cat.name}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(idx)}
              className={`filter-tab ${
                isActive ? "filter-tab--active font-medium" : ""
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Stack Details Container */}
      <div className="glass-card p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-line/50 pb-4">
          <div>
            <h3 className="font-display text-lg font-medium text-paper">
              {STACK_CATEGORIES[activeCategory].name}
            </h3>
            <p className="mt-1 text-xs text-dim">
              {STACK_CATEGORIES[activeCategory].description}
            </p>
          </div>
          <span className="font-mono text-[10px] text-accent-dim uppercase tracking-wider">
            {STACK_CATEGORIES[activeCategory].items.length} Production Technologies
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STACK_CATEGORIES[activeCategory].items.map((item) => (
            <div
              key={item.name}
              className="group flex flex-col justify-between rounded-lg border border-line/50 bg-surface/40 p-3.5 transition-all hover:border-accent-dim hover:bg-surface/70"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                  <span className="font-mono text-[12px] font-medium text-paper transition-colors group-hover:text-accent">
                    {item.name}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-dim">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
