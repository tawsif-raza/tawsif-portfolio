import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";

// No fabricated quotes here. This section renders nothing at all
// until at least one real entry exists — an empty testimonials
// section looks worse than no section. Add real ones as:
// { quote: "...", name: "...", role: "Role, Company" }
const TESTIMONIALS = [];

export default function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section
      id="testimonials"
      aria-label="Testimonials"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-32 md:px-12"
    >
      <SectionLabel number="PROOF" title="WHAT PEOPLE SAY" />

      <RevealText
        text="Straight from the people I've worked with."
        className="mb-10 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="glass-card p-6">
            <p className="text-[15px] leading-relaxed text-dim">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 font-mono text-[11px] text-accent">{t.name}</div>
            <div className="font-mono text-[10px] text-faint">{t.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
