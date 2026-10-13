// Keep this genuinely current -- update NOW_TEXT and NOW_UPDATED whenever
// what you're actively building changes.
const NOW_TEXT =
  "Training the Qwen 2.5 QLoRA fine-tune for AI Voice Employee — data pipeline and training config are done, model training is next.";
const NOW_UPDATED = "Sep 2026";

export default function NowPanel() {
  return (
    <div className="relative mx-auto max-w-6xl px-6 pt-12 md:px-12">
      <div className="glass-card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px]">
          <span className="flex items-center gap-2 font-medium text-accent">
            <span className="h-2 w-2 rounded-full bg-accent pulse-dot" aria-hidden="true" />
            NOW
          </span>
          <span className="text-dim">{NOW_TEXT}</span>
        </div>
        <span className="font-mono text-[10px] text-faint whitespace-nowrap">
          Updated {NOW_UPDATED}
        </span>
      </div>
    </div>
  );
}
