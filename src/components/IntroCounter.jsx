import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function IntroCounter({ onComplete }) {
  const numRef = useRef();
  const wrapRef = useRef();
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const finish = () => {
      setDone(true);
      onCompleteRef.current?.();
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      finish();
      return;
    }

    // Hard safety net: never stay stuck for more than 2.5s
    const safety = setTimeout(finish, 2500);

    if (!wrapRef.current) {
      clearTimeout(safety);
      finish();
      return;
    }

    // Skip on click or keypress
    const skipHandler = () => {
      clearTimeout(safety);
      tl.progress(1);
    };

    const counter = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        clearTimeout(safety);
        finish();
      },
    });

    tl.to(counter, {
      val: 100,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.textContent = String(Math.floor(counter.val)).padStart(2, "0");
        }
      },
    }).to(wrapRef.current, { opacity: 0, duration: 0.3 });

    window.addEventListener("click", skipHandler);
    window.addEventListener("keydown", skipHandler);

    return () => {
      clearTimeout(safety);
      tl.kill();
      window.removeEventListener("click", skipHandler);
      window.removeEventListener("keydown", skipHandler);
    };
  }, []); // run exactly once on mount

  if (done) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg"
    >
      <span className="font-display text-xs tracking-[0.2em] text-accent-dim">
        T.R.K
      </span>
      <span ref={numRef} className="font-mono text-sm text-dim">
        00
      </span>
      <span className="mt-2 font-mono text-[9px] tracking-wide text-[#4b5058]">
        click or press any key to skip
      </span>
    </div>
  );
}
