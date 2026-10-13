import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useReducedMotion from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Splits plain text into words, each masked inside an overflow-hidden span,
// and slides them up into place as the heading scrolls into view. This is
// the "let typography be the star" pattern Hero already uses per-line --
// this extends the same idea to a per-word reveal for section headings
// that were previously a flat opacity fade with no motion of their own.
export default function RevealText({ text, as: Tag = "h2", className = "" }) {
  const rootRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(rootRef.current.querySelectorAll(".reveal-word-inner"), {
        yPercent: 110,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.025,
        scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [text, reducedMotion]);

  const words = text.split(" ");

  return (
    <Tag ref={rootRef} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="reveal-word inline-block overflow-hidden align-bottom">
            <span className="reveal-word-inner inline-block">{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
