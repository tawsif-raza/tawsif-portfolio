import SectionLabel from "../components/SectionLabel";
import { sectionNo } from "../data/experience";
import RevealText from "../components/RevealText";
import { PROJECTS, countByStatus } from "../data/projects";

// Every figure here is stated on a project card in the Work section; the
// live count is read from the same data, so the two can't disagree.
const PROOF_POINTS = [
  {
    metric: `${countByStatus("live")} of ${PROJECTS.length}`,
    label: "Systems live and running",
    desc: "The rest are in progress, and each card in the Work section says exactly how far along it is.",
    tag: "Shipping",
  },
  {
    metric: "1,366",
    label: "Curated training examples",
    desc: "Curated, deduplicated and schema-checked for the Qwen 2.5 QLoRA fine-tune, so the model trains on clean data.",
    tag: "Data",
  },
  {
    metric: "5-node",
    label: "LangGraph pipeline, end to end",
    desc: "AI Video Studio plans a story, fans out to specialist agents, then pauses for human approval before anything is produced.",
    tag: "Orchestration",
  },
  {
    metric: "-14 LUFS",
    label: "QA gate on every rendered clip",
    desc: "The video editing agent checks each render for black frames, silence and loudness before a clip is allowed out.",
    tag: "Quality",
  },
];

export default function EngineeringImpact() {
  return (
    <section
      id="impact"
      aria-label="Proof"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-16 sm:py-20 md:px-12"
    >
      <SectionLabel number={sectionNo(7)} title="PROOF" />

      <RevealText
        text="Numbers you can check against the work."
        className="mb-4 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <p className="mb-10 max-w-xl text-[15px] leading-relaxed text-dim">
        No vanity metrics. Each figure comes straight from a system in the Work section.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {PROOF_POINTS.map((item) => (
          <div key={item.label} className="glass-card p-6 sm:p-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-2xl font-semibold text-accent sm:text-3xl">{item.metric}</span>
              <span className="rounded border border-line/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                {item.tag}
              </span>
            </div>
            <h3 className="font-display text-base font-medium text-paper sm:text-lg">{item.label}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-dim">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
