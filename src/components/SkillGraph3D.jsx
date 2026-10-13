import { useEffect, useRef } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import { resizeCanvasToDisplaySize } from "../utils/canvasSize";

// A rotating 3D graph: each capability is a hub on a sphere, its tools orbit
// around it, and hubs are wired to each other. Drag to spin it. The hub named
// by `activeId` (the bento card under the pointer) lights up with its tools.
const LIME = "198,244,50";
const TIDE = "58,214,195";
const PAPER = "242,243,239";

function buildNodes(groups) {
  const nodes = [];
  const edges = [];
  groups.forEach((g, gi) => {
    // hubs ride a tilted ring, alternating above and below it
    const ang = (gi / groups.length) * Math.PI * 2;
    const hub = [Math.cos(ang) * 0.82, (gi % 2 ? 0.3 : -0.3) + Math.sin(ang * 2) * 0.1, Math.sin(ang) * 0.82];
    const hubIndex = nodes.length;
    nodes.push({ id: g.id, label: g.title, pos: hub, hub: true, group: g.id });
    g.tags.forEach((t, ti) => {
      // scatter tools around their hub, pushed outward a little
      const a = (ti / g.tags.length) * Math.PI * 2 + gi;
      const off = [Math.cos(a) * 0.32, Math.sin(a) * 0.32, Math.sin(a * 1.7) * 0.22];
      const p = hub.map((v, k) => v * 1.22 + off[k]);
      const len = Math.hypot(...p);
      const s = Math.min(1, 1.1 / len);
      nodes.push({ id: `${g.id}:${t}`, label: t, pos: p.map((v) => v * s), hub: false, group: g.id });
      edges.push([hubIndex, nodes.length - 1, g.id]);
    });
  });
  const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
  hubs.forEach((a, i) => hubs.forEach((b, j) => { if (j > i) edges.push([a, b, null]); }));
  return { nodes, edges };
}

export default function SkillGraph3D({ groups, activeId, className = "" }) {
  const canvasRef = useRef();
  const activeRef = useRef(activeId);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { nodes, edges } = buildNodes(groups);
    let w = 0, h = 0, raf = 0, visible = false, last = 0, born = 0;
    let rotY = 0.6, rotX = -0.42, velY = 0.18, velX = 0;
    let dragging = false, px = 0, py = 0;
    const glow = {}; // per-group highlight 0..1, eased
    groups.forEach((g) => (glow[g.id] = 0));

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      resizeCanvasToDisplaySize(canvas, ctx, w, h, { maxDPR: 2 });
    };

    const project = (p, scale) => {
      const [x0, y0, z0] = p;
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const x1 = x0 * cy + z0 * sy, z1 = -x0 * sy + z0 * cy;
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
      const y2 = y0 * cx - z1 * sx, z2 = y0 * sx + z1 * cx;
      const R = Math.min(w * 0.34, h * 0.38) * scale;
      const persp = 2.6 / (2.6 + z2);
      return { x: w * 0.46 + x1 * R * persp, y: h * 0.55 + y2 * R * persp, z: z2, s: persp };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const intro = Math.min(1, born / 1.4);
      const scale = 1 - Math.pow(1 - intro, 3);
      const act = activeRef.current;
      groups.forEach((g) => (glow[g.id] += ((act === g.id ? 1 : 0) - glow[g.id]) * 0.12));
      const P = nodes.map((n) => project(n.pos, scale));

      // edges
      for (const [a, b, gid] of edges) {
        const pa = P[a], pb = P[b];
        const depth = (2 - (pa.z + pb.z) / 2) / 3;
        const g = gid ? glow[gid] : 0;
        const alpha = (gid ? 0.16 : 0.07) * depth * scale + g * 0.5;
        ctx.strokeStyle = `rgba(${gid ? LIME : TIDE},${alpha})`;
        ctx.lineWidth = gid ? 0.8 + g : 0.6;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }

      // nodes, back to front
      const order = P.map((p, i) => i).sort((i, j) => P[j].z - P[i].z);
      ctx.textBaseline = "middle";
      for (const i of order) {
        const n = nodes[i], p = P[i];
        const front = (1 - p.z) / 2; // 0 back .. 1 front
        const g = glow[n.group];
        if (n.hub) {
          const r = (5 + 3 * front) * p.s + g * 3;
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          halo.addColorStop(0, `rgba(${LIME},${0.35 * front + g * 0.4})`);
          halo.addColorStop(1, `rgba(${LIME},0)`);
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(${LIME},${0.55 + 0.45 * front})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.font = `600 ${Math.round(12 + 2 * front)}px Geist, ui-sans-serif, system-ui, sans-serif`;
          ctx.fillStyle = `rgba(${PAPER},${(0.35 + 0.65 * front) * scale})`;
          ctx.fillText(n.label, p.x + r + 7, p.y);
        } else {
          const r = (1.6 + 1.6 * front) * p.s + g * 1.5;
          ctx.fillStyle = `rgba(${g > 0.05 ? LIME : PAPER},${(0.25 + 0.6 * front) * scale + g * 0.3})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
          const show = front > 0.72 || g > 0.3;
          if (show) {
            ctx.font = `400 ${10 + Math.round(front)}px "Geist Mono", ui-monospace, monospace`;
            ctx.fillStyle = `rgba(${g > 0.3 ? LIME : PAPER},${Math.min(1, Math.max(0, (front - 0.68) * 1.6) + g * 0.8) * scale})`;
            ctx.fillText(n.label, p.x + r + 5, p.y);
          }
        }
      }
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; born += dt;
      if (!dragging) {
        velY += (0.18 - velY) * 0.02;
        velX += (0 - velX) * 0.05;
        rotX += ((-0.42) - rotX) * 0.01;
      }
      rotY += velY * dt;
      rotX += velX * dt;
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };

    const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (reducedMotion) { born = 2; draw(); return; }
      if (visible) start(); else cancelAnimationFrame(raf);
    }, { threshold: 0.05 });

    const down = (e) => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      rotY += dx * 0.008; rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.006));
      velY = dx * 0.4; velX = 0;
      if (reducedMotion) draw();
    };
    const up = () => { dragging = false; };

    resize();
    io.observe(canvas);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [groups, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`touch-pan-y cursor-grab active:cursor-grabbing ${className}`}
      role="img"
      aria-label={`3D graph of skills: ${groups.map((g) => g.title).join(", ")}`}
    />
  );
}
