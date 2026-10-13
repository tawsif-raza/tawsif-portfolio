import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef();
  const ringRef = useRef();
  const [label, setLabel] = useState("");

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring || window.matchMedia("(hover: none)").matches) return;

    // Fast response for dot, smooth trailing for ring
    const quickDotX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power2.out" });
    const quickDotY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power2.out" });
    const quickRingX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const quickRingY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    const move = (e) => {
      quickDotX(e.clientX);
      quickDotY(e.clientY);
      quickRingX(e.clientX);
      quickRingY(e.clientY);
    };

    const onOver = (e) => {
      const target = e.target.closest?.("a, button, [role='button'], input, textarea");
      if (!target) return;
      const cursorLabel = target.getAttribute("data-cursor");

      if (cursorLabel) {
        gsap.to(dot, {
          width: 56,
          height: 56,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(ring, {
          scale: 2,
          opacity: 0.6,
          borderColor: "var(--color-accent)",
          duration: 0.3,
          overwrite: "auto",
        });
        setLabel(cursorLabel);
      } else {
        gsap.to(dot, {
          width: 16,
          height: 16,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(ring, {
          scale: 1.33,
          opacity: 0.5,
          duration: 0.25,
          overwrite: "auto",
        });
      }
    };

    const onOut = (e) => {
      const target = e.target.closest?.("a, button, [role='button'], input, textarea");
      if (!target) return;
      gsap.to(dot, { width: 10, height: 10, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      gsap.to(ring, { scale: 1, opacity: 0.3, duration: 0.3, overwrite: "auto" });
      setLabel("");
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring pointer-events-none" />
      <div ref={dotRef} className="cursor-dot flex items-center justify-center pointer-events-none">
        {label && (
          <span className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-wider text-[#0b0c0e]">
            {label}
          </span>
        )}
      </div>
    </>
  );
}
