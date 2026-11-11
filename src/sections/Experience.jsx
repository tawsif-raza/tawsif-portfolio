import SectionLabel from "../components/SectionLabel";
import RevealText from "../components/RevealText";
import Magnetic from "../components/Magnetic";
import { EXPERIENCE, EDUCATION, CERTIFICATIONS } from "../data/experience";
import { RESUME_URL, RESUME_FILENAME } from "../data/site";

// Work history as a timeline, then education and certifications.
// Renders nothing until src/data/experience.js has at least one role, the
// same rule Testimonials follows: no section beats an empty one.
export default function Experience() {
  if (EXPERIENCE.length === 0) return null;

  return (
    <section
      id="experience"
      aria-label="Experience"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-24 md:px-12 md:py-32"
    >
      <SectionLabel number="03" title="EXPERIENCE" />

      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <RevealText
          text="Where I've worked, and what I did there."
          className="max-w-2xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
        />
        {RESUME_URL && (
          <Magnetic>
            <a href={RESUME_URL} download={RESUME_FILENAME} className="btn-pill btn-pill--glass shrink-0">
              Download resume
            </a>
          </Magnetic>
        )}
      </div>

      <ol className="xp-timeline">
        {EXPERIENCE.map((job) => (
          <li key={`${job.company}-${job.start}`} className="xp-item">
            <span className="xp-item__dot" aria-hidden="true" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              {job.start} – {job.end}
              {job.location ? ` · ${job.location}` : ""}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-paper md:text-2xl">{job.role}</h3>
            <p className="mt-1 text-[15px] text-accent">{job.company}</p>
            {job.points?.length > 0 && (
              <ul className="mt-4 flex max-w-2xl flex-col gap-2 text-[14px] leading-relaxed text-dim">
                {job.points.map((point) => (
                  <li key={point} className="xp-point">
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {(EDUCATION.length > 0 || CERTIFICATIONS.length > 0) && (
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {EDUCATION.map((e) => (
            <div key={`${e.degree}-${e.school}`} className="glass-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Education · {e.years}</p>
              <h3 className="mt-2 text-lg font-medium text-paper">{e.degree}</h3>
              <p className="mt-1 text-[14px] text-dim">{e.school}</p>
              {e.note && <p className="mt-3 text-[13px] leading-relaxed text-dim">{e.note}</p>}
            </div>
          ))}
          {CERTIFICATIONS.length > 0 && (
            <div className="glass-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Certifications</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-[14px] text-dim">
                {CERTIFICATIONS.map((c) => (
                  <li key={c.name}>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noreferrer" className="text-paper underline-offset-4 hover:text-accent hover:underline">
                        {c.name}
                      </a>
                    ) : (
                      <span className="text-paper">{c.name}</span>
                    )}
                    <span className="text-faint"> · {[c.issuer, c.year].filter(Boolean).join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
