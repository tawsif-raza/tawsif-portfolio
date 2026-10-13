import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealText from "../components/RevealText";
import SectionLabel from "../components/SectionLabel";
import LiveStatus from "../components/LiveStatus";
import DotWave from "../components/DotWave";
import useReducedMotion from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// The May 2025 story, told in order. `now: true` marks the live end of the line.
const TIMELINE = [
  {
    date: "2024",
    title: "First production builds",
    desc: "Started building and breaking real systems. Everything in the Work section comes from this point on.",
  },
  {
    date: "May 2025",
    title: "Stepped away to go all-in on AI/ML",
    desc: "It wasn't a gap. It was the most deliberate thing I've done for my career.",
    tag: "The pivot",
  },
  {
    date: "May 2025 – Aug 2026",
    title: "15 months, 12–16 hours a day",
    desc: "The math, the systems, and the communication skills that move a project from idea to production.",
    stats: [
      ["15 mo", "self-directed"],
      ["12–16 h", "a day"],
    ],
  },
  {
    date: "2025",
    title: "BCA, Data Science specialization",
    desc: "Enrolled at Amity University Online, pairing formal study with hands-on building.",
  },
  {
    date: "Sep 2026",
    title: "Shipping agentic systems",
    desc: "Building AI systems for clients, plus a customer-facing role at a healthcare-tech startup while I move into ML engineering.",
    now: true,
  },
];

export default function About() {
  const rootRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      // The rail draws itself as you read down the story.
      gsap.fromTo(
        ".tl-rail__fill",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: ".tl", start: "top 70%", end: "bottom 60%", scrub: 0.6 },
        }
      );
      gsap.utils.toArray(".tl-item").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          x: 28,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true, onEnter: () => el.classList.add("is-lit") },
        });
      });
      gsap.from(".about-intro > *", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: ".about-intro", start: "top 80%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="about" className="about-v2 relative overflow-hidden">
      <div className="about-v2__bg" aria-hidden="true">
        <div className="sticky top-0 h-screen w-full">
          <DotWave className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-28 md:px-12 md:py-36 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        {/* Left: headline + live status, pinned while the story scrolls */}
        <div className="about-intro self-start lg:sticky lg:top-28">
          <SectionLabel number="01" title="About" />
          <RevealText
            text="I didn't take a break from my career. I rebuilt it, deliberately."
            className="max-w-xl text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.04em] text-paper md:text-[3.4rem]"
          />
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-dim">
            AI/ML engineer in Bengaluru. I build agentic systems and the
            automation around them, and I learned it the long way.
          </p>
          <div className="mt-10">
            <LiveStatus />
          </div>
        </div>

        {/* Right: the story as a vertical timeline */}
        <ol className="tl relative" aria-label="Career timeline">
          <span className="tl-rail" aria-hidden="true">
            <span className="tl-rail__fill" />
          </span>
          {TIMELINE.map((t) => (
            <li key={t.title} className={`tl-item ${t.now ? "tl-item--now" : ""} ${reducedMotion ? "is-lit" : ""}`}>
              <span className="tl-node" aria-hidden="true" />
              <div className="tl-card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-dim">{t.date}</span>
                  {t.tag && <span className="tl-tag">{t.tag}</span>}
                  {t.now && (
                    <span className="tl-tag tl-tag--now">
                      <span className="status-dot" aria-hidden="true" /> Now
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-paper">{t.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-dim">{t.desc}</p>
                {t.stats && (
                  <div className="mt-4 flex gap-6">
                    {t.stats.map(([k, v]) => (
                      <div key={k}>
                        <div className="text-2xl font-semibold tracking-[-0.03em] text-paper">{k}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
