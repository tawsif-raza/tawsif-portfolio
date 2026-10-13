import { useEffect, useRef } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import { resizeCanvasToDisplaySize } from "../utils/canvasSize";

// A slow 3D field of points rolling like a signal surface, seen from a low
// camera. Colour runs from accent lime on the left to tide on the right,
// fading with depth. Only animates while on screen; reduced motion gets a
// single still frame.
export default function DotWave({ className = "" }) {
  const canvasRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, raf = 0, visible = false, t = 0, last = 0, born = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const COLS = window.innerWidth < 640 ? 34 : 64;
    const ROWS = window.innerWidth < 640 ? 18 : 28;

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      resizeCanvasToDisplaySize(canvas, ctx, w, h, { maxDPR: 1.5 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const intro = Math.min(1, born / 1.6); // grows in over ~1.6s
      const ease = 1 - Math.pow(1 - intro, 3);
      const camY = 2.2, camZ = -3.2, focal = Math.min(w, 900) * 0.9;
      const tilt = (mouse.y - 0.5) * 0.25;
      for (let r = 0; r < ROWS; r++) {
        const z = (r / (ROWS - 1)) * 9; // depth 0..9
        for (let c = 0; c < COLS; c++) {
          const xn = c / (COLS - 1);
          const x = (xn - 0.5) * 14 + (mouse.x - 0.5) * 1.2;
          const y =
            (Math.sin(x * 0.55 + t * 0.9) * 0.45 +
              Math.sin(z * 0.7 - t * 0.7) * 0.35 +
              Math.sin((x + z) * 0.3 + t * 0.4) * 0.25) * ease;
          const dz = z - camZ;
          const px = w / 2 + (x * focal) / dz;
          const py = h * 0.4 + ((camY - y + tilt * z) * focal) / dz - (1 - ease) * 40;
          if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;
          const depth = 1 - z / 9;
          const lift = (y + 1) / 2;
          const a = (0.16 + 0.7 * depth * depth) * (0.5 + 0.5 * lift) * ease;
          const rr = Math.round(198 + (58 - 198) * xn);
          const gg = Math.round(244 + (214 - 244) * xn);
          const bb = Math.round(50 + (195 - 50) * xn);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${a})`;
          const s = 0.6 + 1.6 * depth;
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; t += dt; born += dt;
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reducedMotion) { last = performance.now(); raf = requestAnimationFrame(loop); }
      else if (reducedMotion) { born = 2; draw(); }
    }, { threshold: 0 });

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
    };

    resize();
    io.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
