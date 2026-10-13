import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef();

  useEffect(() => {
    // If native CSS animation-timeline: scroll() is supported, let the compositor handle it 100%
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline", "scroll()")) {
      return;
    }

    let ticking = false;
    let maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    const onResize = () => {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    };

    const update = () => {
      ticking = false;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="scroll-progress">
      <div ref={barRef} className="scroll-progress-bar" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
