import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const STATUS_LINES = [
  "Initializing system",
  "Loading agents",
  "Connecting pipelines",
  "System online",
];

export default function IntroSequence({ onComplete }) {
  const wrapRef = useRef();
  const barRef = useRef();
  const statusRef = useRef();
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

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      finish();
      return;
    }

    // Hard safety net: never stay stuck longer than 3.5s
    const safety = setTimeout(finish, 3500);

    if (!wrapRef.current || !barRef.current || !statusRef.current) {
      clearTimeout(safety);
      finish();
      return;
    }

    // Skip on click or keypress
    const skipHandler = () => {
      clearTimeout(safety);
      tl.progress(1);
    };

    const tl = gsap.timeline({
      onComplete: () => {
        clearTimeout(safety);
        finish();
      },
    });

    // Step through status lines while progressing the bar
    const stepDuration = 0.5;
    const statusEl = statusRef.current;

    STATUS_LINES.forEach((line, i) => {
      const progress = ((i + 1) / STATUS_LINES.length) * 100;
      tl.call(
        () => {
          if (statusEl) statusEl.textContent = line;
        },
        null,
        i * stepDuration
      ).to(
        barRef.current,
        {
          width: `${progress}%`,
          duration: stepDuration * 0.85,
          ease: "power2.inOut",
        },
        i * stepDuration
      );
    });

    // Final fade out
    tl.to(wrapRef.current, {
      opacity: 0,
      duration: 0.35,
      delay: 0.15,
    });

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
    <div ref={wrapRef} className="intro-sequence">
      <span className="intro-sequence__brand">T.R.K</span>
      <div className="intro-sequence__bar-track">
        <div ref={barRef} className="intro-sequence__bar-fill" />
      </div>
      <span ref={statusRef} className="intro-sequence__status">
        {STATUS_LINES[0]}
      </span>
      <span className="intro-sequence__skip">
        click or press any key to skip
      </span>
    </div>
  );
}
