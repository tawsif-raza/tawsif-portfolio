import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion";
import useInViewport from "../hooks/useInViewport";

const ROLES = [
  "AI/ML Engineer",
  "Automation Architect",
  "Agentic Systems Builder",
  "Full-Stack Developer",
];

export default function RoleCycler() {
  const [index, setIndex] = useState(0);
  const spanRef = useRef();
  const reducedMotion = useReducedMotion();
  const inView = useInViewport(spanRef, 0.1);

  useEffect(() => {
    if (reducedMotion || !inView || !spanRef.current) return;

    const intervalId = setInterval(() => {
      if (!spanRef.current) return;
      gsap.to(spanRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setIndex((prev) => (prev + 1) % ROLES.length);
          if (spanRef.current) {
            gsap.fromTo(
              spanRef.current,
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
            );
          }
        },
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [reducedMotion, inView]);

  return (
    <span
      ref={spanRef}
      className="inline-block font-mono text-sm tracking-wide text-accent"
    >
      {ROLES[index]}
    </span>
  );
}
