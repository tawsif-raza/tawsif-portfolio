import { useEffect, useState } from "react";

// Shared IntersectionObserver visibility-pause hook (replaces the
// hand-rolled observer setup previously duplicated in RoleCycler and
// the dead AgentGraph). Defaults to `true` so callers don't have to
// special-case the brief window before the observer's first callback.
export default function useInViewport(ref, threshold = 0.1) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}
