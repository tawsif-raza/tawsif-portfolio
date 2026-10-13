import { useEffect, useRef } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import { resizeCanvasToDisplaySize } from "../utils/canvasSize";

// A slowly turning sphere of stars seen from inside, drawn on a 2D canvas.
// Most stars are white; a few carry the accent and tide colours so the field
// belongs to this site. Pauses when off screen; still frame for reduced motion.
export default function Starfield({ className = "" }) {
  const canvasRef = useRef();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const COUNT = window.innerWidth < 640 ? 650 : 1500;
    const stars = Array.from({ length: COUNT }, () => {
      // uniform point inside a sphere
      let x, y, z;
      do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; } while (x * x + y * y + z * z > 1);
      const roll = Math.random();
      return {
        x, y, z,
        c: roll < 0.08 ? "198,244,50" : roll < 0.13 ? "58,214,195" : "242,243,239",
        tw: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.1,
      };
    });
    let w = 0, h = 0, raf = 0, visible = false, last = 0, t = 0;
    let rx = 0, ry = 0;

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      resizeCanvasToDisplaySize(canvas, ctx, w, h, { maxDPR: 1.5 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
      const R = Math.max(w, h) * 0.75;
      for (const st of stars) {
        const x1 = st.x * cy + st.z * sy;
        const z1 = -st.x * sy + st.z * cy;
        const y2 = st.y * cx - z1 * sx;
        const z2 = st.y * sx + z1 * cx;
        const p = 1.4 / (1.6 - z2 * 0.6);
        const px = w / 2 + x1 * R * p * 0.7;
        const py = h / 2 + y2 * R * p * 0.7;
        if (px < 0 || px > w || py < 0 || py > h) continue;
        const twinkle = 0.65 + 0.35 * Math.sin(t * 1.6 + st.tw);
        const a = (0.25 + 0.6 * ((z2 + 1) / 2)) * twinkle;
        ctx.fillStyle = `rgba(${st.c},${a})`;
        const size = st.s * p;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      }
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; t += dt;
      rx -= dt / 30;
      ry -= dt / 45;
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (reducedMotion) { draw(); return; }
      if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }, { threshold: 0 });

    resize();
    io.observe(canvas);
    const onResize = () => { resize(); draw(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
