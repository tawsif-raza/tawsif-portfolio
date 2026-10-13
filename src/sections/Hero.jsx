import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Magnetic from "../components/Magnetic";
import RoleCycler from "../components/RoleCycler";
import useReducedMotion from "../hooks/useReducedMotion";

// Full-bleed film hero: a 24 s Veo-generated loop of Tawsif plays muted
// behind the copy. Phones get a lighter 720p file; reduced-motion visitors
// (and iOS Low Power Mode, which blocks autoplay) see the poster frame.
const BASE = import.meta.env.BASE_URL;
const SRC_DESKTOP = `${BASE}hero/hero-1080.mp4`;
const SRC_MOBILE = `${BASE}hero/hero-720.mp4`;
const POSTER = `${BASE}hero/hero-poster.jpg`;
const POSTER_SM = `${BASE}hero/hero-poster-sm.jpg`;

export default function Hero() {
  const rootRef = useRef();
  const videoRef = useRef();
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const userPaused = useRef(false);
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;

  // Entrance sequence for the copy.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-role", { opacity: 0, y: 10, duration: 0.5 })
        .from(".hero-line", { opacity: 0, y: 30, duration: 0.7, stagger: 0.1 }, "-=0.2")
        .from(".hero-sub", { opacity: 0, y: 16, duration: 0.6 }, "-=0.35")
        .from(".hero-cta", { opacity: 0, y: 12, duration: 0.5, stagger: 0.08 }, "-=0.35")
        .from(".hero-meta", { opacity: 0, duration: 0.5 }, "-=0.2");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Play only while the hero is on screen and the tab is visible.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    if (reducedMotion) {
      v.pause();
      return () => {
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
      };
    }
    let onScreen = true;
    const tryPlay = () => {
      if (userPaused.current || !onScreen || document.hidden) return;
      const p = v.play();
      if (p && p.catch) p.catch(() => setPaused(true));
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) tryPlay();
        else v.pause();
      },
      { threshold: 0.05 }
    );
    io.observe(rootRef.current);
    const onVis = () => (document.hidden ? v.pause() : tryPlay());
    document.addEventListener("visibilitychange", onVis);
    tryPlay();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [reducedMotion]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <section
      ref={rootRef}
      id="hero"
      className="hero-film relative isolate flex min-h-[640px] w-full items-end overflow-hidden"
      style={{ height: "min(100svh, 920px)" }}
    >
      <video
        ref={videoRef}
        className="hero-film__video"
        src={isSmall ? SRC_MOBILE : SRC_DESKTOP}
        poster={isSmall ? POSTER_SM : POSTER}
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="hero-film__fade" aria-hidden="true" />

      <div className="hero-copy relative z-10 mx-auto w-full max-w-6xl px-6 pb-14 text-center md:px-16 md:pb-16">
        <div className="hero-role mb-4 flex justify-center opacity-80">
          <RoleCycler />
        </div>

        <h1 className="mx-auto max-w-3xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-paper/85 sm:text-5xl md:text-[3.6rem]">
          <span className="hero-line block">Tawsif Raza Khan builds</span>
          <span className="hero-line block">
            agentic systems that <span className="text-accent/80">run on their own.</span>
          </span>
        </h1>

        <p className="hero-sub mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-paper/60 md:text-base">
          Multi-agent pipelines, RAG systems, and automation that ships for a
          healthcare-tech startup, for clients, and for myself. Not demos.
          Systems that run without me watching them.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <a href="#projects" className="hero-cta btn-pill btn-pill--primary btn-pill--sm">
              See the work
            </a>
          </Magnetic>
          <Magnetic>
            <a href="#contact" className="hero-cta btn-pill btn-pill--glass btn-pill--sm">
              Get in touch
            </a>
          </Magnetic>
        </div>

        <div className="hero-meta mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-paper/50">
          <span className="flex items-center gap-2.5">
            <span className="availability-dot" aria-hidden="true" />
            Available for freelance &amp; full-time
          </span>
          <span>9 systems built · 3 live &amp; shipping</span>
        </div>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        className="hero-film__toggle"
        aria-label={paused ? "Play background video" : "Pause background video"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h3v14H7zM14 5h3v14h-3z" />}
        </svg>
      </button>
    </section>
  );
}
