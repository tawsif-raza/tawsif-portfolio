import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";

const CURRENT_ITEMS = [
  {
    status: "In Progress",
    domain: "Model Adaptation",
    title: "Qwen 2.5 (0.5B) QLoRA Fine-Tuning",
    summary:
      "Evaluating parameter-efficient fine-tuning with 4-bit quantization on a custom 1,366-sample conversational dataset. Benchmarking inference latency and memory footprints under local runtime environments.",
    focus: "Hyperparameter tuning (r=16, lora_alpha=32, target_modules=q_proj,v_proj)",
  },
  {
    status: "Prototyping",
    title: "Model Context Protocol (MCP) Custom Servers",
    domain: "Agent Tooling",
    summary:
      "Designing standardized MCP servers in Python to bridge LangGraph agents with local database introspection and file system operations without brittle ad-hoc API wrappers.",
    focus: "JSON-RPC 2.0 transport over standard IO and SSE streams",
  },
  {
    status: "Benchmarking",
    domain: "Graph Architecture",
    title: "Multi-Agent Consensus & Critic Networks",
    summary:
      "Testing cyclic LangGraph subgraphs where a dedicated Critic agent evaluates output consistency against Pydantic schemas before state commits, reducing hallucination rates in edge cases.",
    focus: "State reconciliation algorithms and maximum cycle cutoff safeguards",
  },
];

export default function CurrentFocus() {
  return (
    <section
      id="exploring"
      aria-label="Currently Building and Exploring"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-20 sm:py-24 md:px-12"
    >
      <SectionLabel number="LAB" title="CURRENTLY EXPLORING & BUILDING" />

      <RevealText
        text="Active research on the workbench."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <p className="mb-10 max-w-xl text-[15px] leading-relaxed text-dim">
        Continuous engineering experimentation ensures my production systems leverage
        the latest advances in local inference, agent protocols, and evaluation.
      </p>

      {/* Grid of Active Research Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {CURRENT_ITEMS.map((item) => (
          <div
            key={item.title}
            className="glass-card flex flex-col justify-between p-6 transition-all duration-200"
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent-dim">
                  {item.domain}
                </span>
                <span className="status-badge status-badge--progress">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item.status}
                </span>
              </div>

              <h3 className="font-display text-base font-medium text-paper">
                {item.title}
              </h3>

              <p className="mt-3 text-[13px] leading-relaxed text-dim">
                {item.summary}
              </p>
            </div>

            <div className="mt-6 border-t border-line/50 pt-3">
              <span className="font-mono text-[10px] text-faint uppercase block">
                Technical Focus
              </span>
              <span className="font-mono text-[11px] text-paper/80 mt-1 block">
                {item.focus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
