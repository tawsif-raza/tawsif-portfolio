import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitialValue() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

// Shared prefers-reduced-motion hook. Unlike a one-time
// `matchMedia(...).matches` read (the pattern this replaces across
// ParticleNetwork/RevealText/RoleCycler/HeroScene), this subscribes to
// the query's `change` event so toggling the OS setting mid-session
// takes effect immediately, with no page reload required.
export default function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia(QUERY);
    const onChange = (event) => setReducedMotion(event.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return reducedMotion;
}
