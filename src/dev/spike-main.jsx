import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// Dynamic import so Vite code-splits three.js/@react-three/fiber into
// their own chunk, mirroring how the real Phase 3 integration will
// lazy-load this behind a capability check. Lets us measure the real
// async chunk gzip size via `npm run build`. Previews the real,
// permanent src/components/LivingSystemScene.jsx (Phase 2) — this
// dev-only page is just a harness, not a separate implementation.
const LivingSystemScene = lazy(() => import("../components/LivingSystemScene.jsx"));

createRoot(document.getElementById("spike-root")).render(
  <StrictMode>
    <Suspense fallback={<div style={{ color: "#f2f3ef", padding: 24, fontFamily: "monospace" }}>Loading 3D spike…</div>}>
      <LivingSystemScene />
    </Suspense>
  </StrictMode>
);
