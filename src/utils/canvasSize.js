// Shared DPR-aware canvas resize helper. Scales the canvas's backing
// store for crisp rendering on high-DPI screens while keeping all draw
// calls in plain CSS-pixel coordinates (via ctx.setTransform), so
// existing drawing code needs no changes to benefit from it. Mirrors
// the resize logic already proven in HeroScene.jsx, generalized so
// other canvas consumers don't reinvent (or skip) it.
export function resizeCanvasToDisplaySize(canvas, ctx, width, height, { maxDPR = 2 } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}
