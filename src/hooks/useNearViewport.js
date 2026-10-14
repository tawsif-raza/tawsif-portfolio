import { useEffect, useState } from "react";

// One-shot "is this about to scroll into view?" flag for deferring heavy
// mounts (lazy chunks, WebGL contexts) until they are actually needed.
// Flips to true once the element comes within `rootMargin` of the viewport
// and stays true, so the mounted content is never torn down again.
export default function useNearViewport(ref, rootMargin = "600px 0px") {
  // No IntersectionObserver (very old browsers): just mount immediately.
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, near]);

  return near;
}
