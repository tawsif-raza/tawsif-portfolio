const STATUS = {
  live: { label: "Live", cls: "status-badge--live" },
  progress: { label: "In progress", cls: "status-badge--progress" },
  planning: { label: "Planning", cls: "status-badge--planning" },
};

const linkLabel = (link) => (link.includes("github.com") ? "View code" : "View live");

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="work-arrow">
      <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Featured project: image on top, "how it's built" + stack slide up over the
// image on hover (pointer devices). Touch devices see that panel inline.
export function ProjectCard({ project, index }) {
  const { title, category, status, problem, approach, outcome, stack, link, image } = project;
  const stackItems = stack.split(",").map((s) => s.trim());
  const s = STATUS[status];

  const body = (
    <article className="work-card group">
      <div className="work-card__media">
        {image ? (
          <img src={image} alt={`${title} preview`} loading="lazy" decoding="async" />
        ) : (
          <div className="work-card__placeholder" aria-hidden="true" />
        )}
        <div className="work-card__shade" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className={`status-badge ${s.cls}`}>
            <span className="status-dot" aria-hidden="true" />
            {s.label}
          </span>
          <span className="font-mono text-[11px] text-paper/70">{String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="work-card__reveal">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">How it's built</p>
          <p className="text-[13px] leading-relaxed text-paper/90">{approach}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech stack">
            {stackItems.map((t) => (
              <li key={t} className="tech-pill">{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{category}</p>
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-paper md:text-2xl">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-dim">{problem}</p>
        <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-dim">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Result</span>
          <span className="text-paper/90">{outcome}</span>
        </p>
        {link && (
          <span className="work-card__link mt-5">
            {linkLabel(link)} <Arrow />
          </span>
        )}
      </div>
    </article>
  );

  if (!link) return body;
  return (
    <a href={link} target="_blank" rel="noreferrer" data-cursor="View" className="block h-full rounded-[20px]">
      {body}
    </a>
  );
}

// Smaller project: one tidy row in the "also in motion" list.
export function ProjectRow({ project, index, className = "" }) {
  const { title, category, status, problem, stack, link } = project;
  const s = STATUS[status];
  const inner = (
    <div className="work-row group">
      <span className="hidden font-mono text-[11px] text-faint sm:block">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0">
        <h4 className="flex items-center gap-2 text-[15px] font-medium text-paper">
          {title}
          {link && <Arrow />}
        </h4>
        <p className="mt-1 text-[13px] leading-relaxed text-dim">{problem}</p>
        <p className="mt-2 font-mono text-[10px] text-faint">
          {category} · {stack}
        </p>
      </div>
      <span className={`status-badge ${s.cls} self-start`}>
        <span className="status-dot" aria-hidden="true" />
        {s.label}
      </span>
    </div>
  );
  return (
    <li className={className}>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" data-cursor="View" className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}

export default ProjectCard;
