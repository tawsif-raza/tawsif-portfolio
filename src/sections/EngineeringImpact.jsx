import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";

const IMPACT_POINTS = [
  {
    metric: "1,366",
    label: "Curated Dataset Pairs",
    subtitle: "Dataset Hygiene & Format Control",
    desc: "Engineered and verified a domain-specific conversational dataset formatted for QLoRA fine-tuning. Enforced strict JSONL schema validation and deduplication to ensure clean training convergence.",
    tag: "Data Engineering",
  },
  {
    metric: "Zero",
    label: "Runtime Client API Dependencies",
    subtitle: "Build-Time Static Hydration",
    desc: "Third-party platform telemetry (such as GitHub activity) is fetched and verified during the static build phase. Visitors encounter zero client-side API rate limits and zero external network latency.",
    tag: "Architecture",
  },
  {
    metric: "Guarded",
    label: "Human-in-the-Loop Safeguards",
    subtitle: "Pre-Transmission Verification",
    desc: "Outbound lead generation pipelines draft personalized outreach directly into Gmail for human verification before sending. No unreviewed automated messages ever transmit without explicit sign-off.",
    tag: "Safety",
  },
  {
    metric: "Isolated",
    label: "Stateful Subgraph Boundaries",
    subtitle: "Fault-Tolerant Topologies",
    desc: "LangGraph pipelines employ asynchronous Send() fan-out and isolated subgraph boundaries. If an individual specialized agent encounters an upstream timeout, the broader workflow handles it gracefully.",
    tag: "Orchestration",
  },
];

export default function EngineeringImpact() {
  return (
    <section
      id="impact"
      aria-label="Engineering Standards and Outcomes"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-16 sm:py-20 md:px-12"
    >
      <SectionLabel number="IMPACT" title="ENGINEERING RIGOR & SAFEGUARDS" />

      <RevealText
        text="Production standards anchored in verifiable systems."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <p className="mb-10 max-w-xl text-[15px] leading-relaxed text-dim">
        Engineering quality is measured by operational reliability, clean data pipelines,
        and deterministic safeguards rather than unverified claims.
      </p>

      {/* 4-Quadrant Card Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {IMPACT_POINTS.map((item) => (
          <div key={item.label} className="glass-card flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-2xl sm:text-3xl font-semibold text-accent">
                  {item.metric}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-faint border border-line/60 rounded px-2 py-0.5">
                  {item.tag}
                </span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-medium text-paper">
                {item.label}
              </h3>
              <div className="mt-1 font-mono text-xs text-accent-dim">
                {item.subtitle}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-dim">
                {item.desc}
              </p>
            </div>
            <div className="mt-5 border-t border-line/40 pt-3 font-mono text-[10px] text-faint">
              VERIFIED IN CODEBASE
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
