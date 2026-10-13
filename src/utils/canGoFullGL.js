// Synchronous, cheap capability probe (design doc §19.5/§19.6). Decides
// whether a visitor gets the full R3F "living system" or falls back to
// the existing canvas2D HeroScene. Evaluated once per session and
// cached — never re-probed on scroll/interaction, and the check itself
// never triggers the three.js/@react-three/fiber download on its own.
let cached = null;

export function canGoFullGL() {
  if (cached !== null) return cached;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return (cached = false);
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  if (reducedMotion) {
    return (cached = false);
  }

  let webgl2 = false;
  try {
    webgl2 = !!document.createElement("canvas").getContext("webgl2");
  } catch {
    webgl2 = false;
  }
  if (!webgl2) {
    return (cached = false);
  }

  // These APIs aren't universally supported — absence isn't treated as
  // a failure, only a value below the threshold is.
  const cores = navigator.hardwareConcurrency;
  const coresOk = cores === undefined || cores >= 4;

  const memory = navigator.deviceMemory;
  const memoryOk = memory === undefined || memory >= 4;

  return (cached = coresOk && memoryOk);
}
