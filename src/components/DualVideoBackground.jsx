import { useEffect, useRef, useState } from "react";
import useReducedMotion from "../hooks/useReducedMotion";

// Two background films that play one after the other and crossfade at each
// hand-off, under a dark overlay. Paste your cloud links into VIDEO_1_URL and
// VIDEO_2_URL; until then they point at the copies in /public/skills.
const BASE = import.meta.env.BASE_URL;
export const VIDEO_1_URL = `${BASE}skills/skills-1.mp4`; // ← paste cloud link for video 1
export const VIDEO_2_URL = `${BASE}skills/skills-2.mp4`; // ← paste cloud link for video 2
const POSTER = `${BASE}skills/skills-poster.jpg`;
const FADE = 1.4; // seconds of overlap between the two films

export default function DualVideoBackground({ className = "" }) {
  const rootRef = useRef();
  const vids = [useRef(), useRef()];
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const els = vids.map((r) => r.current);
    let onScreen = false;
    let switching = false;

    const play = (v) => {
      const p = v?.play();
      if (p && p.catch) p.catch(() => {});
    };

    // Hand off to the other film shortly before the current one ends.
    const onTime = (i) => () => {
      const v = els[i];
      if (i !== activeRef.current || switching || !v.duration) return;
      if (v.currentTime >= v.duration - FADE) {
        const next = els[1 - i];
        if (!next || next.readyState < 2) return; // other film not ready: keep looping this one
        switching = true;
        next.currentTime = 0;
        play(next);
        activeRef.current = 1 - i;
        setActive(1 - i);
        setTimeout(() => {
          v.pause();
          switching = false;
        }, FADE * 1000 + 100);
      }
    };
    const handlers = els.map((v, i) => {
      const h = onTime(i);
      v.addEventListener("timeupdate", h);
      return h;
    });

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen && !document.hidden) play(els[activeRef.current]);
        else els.forEach((v) => v.pause());
      },
      { threshold: 0.05 }
    );
    io.observe(rootRef.current);
    const onVis = () => {
      if (document.hidden) els.forEach((v) => v.pause());
      else if (onScreen) play(els[activeRef.current]);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      els.forEach((v, i) => v.removeEventListener("timeupdate", handlers[i]));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className={`dual-video ${className}`} aria-hidden="true">
      {reducedMotion ? (
        <img className="dual-video__media is-on" src={POSTER} alt="" />
      ) : (
        <>
          <video
            ref={vids[0]}
            className={`dual-video__media ${active === 0 ? "is-on" : ""}`}
            src={VIDEO_1_URL}
            poster={POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          <video
            ref={vids[1]}
            className={`dual-video__media ${active === 1 ? "is-on" : ""}`}
            src={VIDEO_2_URL}
            loop
            muted
            playsInline
            preload="auto"
          />
        </>
      )}
      <div className="dual-video__tint" />
      <div className="dual-video__overlay" />
    </div>
  );
}
