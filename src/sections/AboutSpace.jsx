import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlassPill from "../components/GlassPill";
import LiveStatus from "../components/LiveStatus";
import useReducedMotion from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const FACTS = [
  ["15 mo", "all-in on AI/ML"],
  ["12–16 h", "a day of study"],
  ["BCA", "Data Science"],
];

export default function AboutSpace() {
  const rootRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: rootRef.current, start: "top 72%", once: true } });
      tl.from(".ab-left > *", { opacity: 0, y: 36, duration: 0.9, stagger: 0.12, ease: "power3.out" })
        .from(".ab-right", { opacity: 0, y: 60, duration: 1.1, ease: "power3.out" }, "-=0.7");
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="about" className="relative overflow-x-clip">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-16 md:px-12 md:pb-32 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="ab-left">
          <GlassPill>02 · About me</GlassPill>
          <h2 className="mt-6 max-w-xl text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.045em] text-paper md:text-[3.75rem]">
            I didn't take a break from my career. I rebuilt it,{" "}
            <span className="text-accent">deliberately.</span>
          </h2>
          <p className="mt-7 max-w-lg text-[16px] leading-relaxed text-dim md:text-[17px]">
            In May 2025, I stepped away from the day-to-day to go all-in on AI/ML.
            It wasn't a gap. It was the most deliberate thing I've done for my
            career: 15 months on the math, the systems, and the communication
            skills that move a project from idea to production. Everything in the
            Work section is something I built, broke, and rebuilt along the way.
          </p>
          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt className="sr-only">{v}</dt>
                <dd className="text-[1.7rem] font-semibold tracking-[-0.03em] text-paper">{k}</dd>
                <dd aria-hidden="true" className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ab-right relative mx-auto w-full max-w-md">
          <div className="orbit" aria-hidden="true">
            <span className="orbit__ring orbit__ring--a"><i /></span>
            <span className="orbit__ring orbit__ring--b"><i /></span>
          </div>
          <div className={`float-card ${reducedMotion ? "" : "is-floating"}`}>
            <LiveStatus />
          </div>
        </div>
      </div>
    </section>
  );
}
