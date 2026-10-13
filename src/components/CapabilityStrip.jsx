const CAPABILITIES = [
  "Agentic AI",
  "RAG Systems",
  "LLM Systems",
  "Automation",
  "ML Engineering",
  "Production Systems",
];

export default function CapabilityStrip() {
  return (
    <section
      aria-label="Core Capabilities"
      className="relative mx-auto max-w-6xl px-6 pt-4 pb-12 md:px-12"
    >
      <div className="rounded-xl border border-line/70 bg-surface/40 px-6 py-5 backdrop-blur-sm sm:px-8 sm:py-6">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
              AI Engineering
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            Core Capabilities
          </span>
        </div>

        {/* Hairline Divider */}
        <div className="my-3.5 h-px w-full bg-line/80" />

        {/* Desktop & Tablet: Structured 3-Column Grid with Thin Dividers */}
        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-y-3.5">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={cap}
              className={`flex items-center gap-2.5 ${
                idx % 3 !== 0 ? "border-l border-line/50 pl-6" : ""
              }`}
            >
              <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden="true" />
              <span className="font-mono text-[12px] tracking-wide text-paper/90 transition-colors duration-200 hover:text-accent md:text-[13px]">
                {cap}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile: Natural Wrap with Dot Separators (Prevents Any Overflow) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:hidden">
          {CAPABILITIES.map((cap, i) => (
            <span key={cap} className="inline-flex items-center gap-3">
              <span className="font-mono text-[12px] tracking-wide text-paper/90">
                {cap}
              </span>
              {i < CAPABILITIES.length - 1 && (
                <span className="text-accent/50 select-none text-[10px]" aria-hidden="true">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
