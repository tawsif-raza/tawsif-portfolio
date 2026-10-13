import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion";

// ─── Shared Data Model ───
// Node types: orchestrator, agent, rag, tool, gateway, output
// Positions are in a conceptual 3D space: [x, y, z]
// x: -3 to 3, y: -3 to 3, z: -3 to 0 (negative z = further from camera)

const NODES = [
  { id: "gateway", type: "gateway", label: "API Gateway", pos: [-2.4, 0, -0.3], radius: 6 },
  { id: "orchestrator", type: "orchestrator", label: "Orchestrator", pos: [0, 0, 0], radius: 9 },
  { id: "planner", type: "agent", label: "Planner", pos: [-1.2, -1.8, -1.2], radius: 6 },
  { id: "retriever", type: "agent", label: "Retriever", pos: [0.6, -1.9, -0.9], radius: 6 },
  { id: "critic", type: "agent", label: "Critic", pos: [2.0, -1.0, -1.0], radius: 6 },
  { id: "rag", type: "rag", label: "RAG Engine", pos: [-0.5, 1.8, -1.5], radius: 7 },
  { id: "mcp", type: "tool", label: "MCP Server", pos: [1.8, 1.5, -1.8], radius: 5 },
  { id: "output", type: "output", label: "Response", pos: [2.8, 0, -0.5], radius: 7 },
];

const EDGES = [
  { from: "gateway", to: "orchestrator", type: "data" },
  { from: "orchestrator", to: "planner", type: "data" },
  { from: "orchestrator", to: "retriever", type: "data" },
  { from: "orchestrator", to: "critic", type: "data" },
  { from: "retriever", to: "rag", type: "data" },
  { from: "planner", to: "mcp", type: "decision" },
  { from: "critic", to: "output", type: "data" },
  { from: "orchestrator", to: "rag", type: "data" },
];

// Color palette matching the design system
const NODE_COLORS = {
  orchestrator: { fill: "#c6f432", glow: "rgba(198,244,50,0.3)", ring: "rgba(198,244,50,0.35)" },
  agent: { fill: "#c6f432", glow: "rgba(198,244,50,0.2)", ring: "rgba(198,244,50,0.25)" },
  rag: { fill: "#8fb82a", glow: "rgba(143,184,42,0.2)", ring: "rgba(143,184,42,0.25)" },
  tool: { fill: "#5b7a1c", glow: "rgba(91,122,28,0.15)", ring: "rgba(91,122,28,0.2)" },
  gateway: { fill: "#f2f3ef", glow: "rgba(242,243,239,0.15)", ring: "rgba(242,243,239,0.2)" },
  output: { fill: "#3ad6c3", glow: "rgba(58,214,195,0.15)", ring: "rgba(58,214,195,0.2)" },
};

// ─── Perspective Projection ───

function project(x3d, y3d, z3d, cx, cy, fov, rotY, rotX) {
  // Apply Y rotation
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  let rx = x3d * cosY - z3d * sinY;
  let rz = x3d * sinY + z3d * cosY;

  // Apply X rotation
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  let ry = y3d * cosX - rz * sinX;
  rz = y3d * sinX + rz * cosX;

  // Perspective divide
  const perspective = fov / (fov + rz + 4); // +4 to keep everything in front of camera
  const sx = cx + rx * perspective * 100;
  const sy = cy + ry * perspective * 100;

  return { x: sx, y: sy, scale: perspective, z: rz };
}

// ─── Data Packet (traveling along edges) ───

function createPacket(fromNode, toNode) {
  return {
    from: fromNode,
    to: toNode,
    t: 0, // 0..1 progress along edge
    speed: 0.008 + Math.random() * 0.006,
    alive: true,
  };
}

export default function HeroScene() {
  const canvasRef = useRef();
  const wrapRef = useRef();
  const rafRef = useRef();
  const stateRef = useRef({
    rotY: 0,
    rotX: 0,
    targetRotY: 0,
    targetRotX: 0,
    nodeOpacity: 0, // animated 0→1 during assembly
    edgeProgress: 0, // animated 0→1 during assembly
    packets: [],
    hovered: null,
    projectedNodes: [],
    time: 0,
    isVisible: true,
    assembled: false,
  });
  const labelRefs = useRef({});
  const reducedMotionPref = useReducedMotion();

  // ─── Mouse Interaction ───

  const handleMouseMove = useCallback((e) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const s = stateRef.current;
    s.targetRotY = px * 0.25; // subtle tilt: max ~14°
    s.targetRotX = -py * 0.18;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const s = stateRef.current;
    s.targetRotY = 0;
    s.targetRotX = 0;
    s.hovered = null;
  }, []);

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const s = stateRef.current;
    let closest = null;
    let closestDist = 30; // hit radius in canvas pixels

    for (const pn of s.projectedNodes) {
      const dx = pn.x - mx;
      const dy = pn.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pn.id;
      }
    }

    s.hovered = closest;
  }, []);

  // ─── Main Render Loop ───

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = reducedMotionPref;
    const isTouch = !window.matchMedia("(hover: hover)").matches;

    // DPR-aware sizing
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Visibility observer — pause when not in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        stateRef.current.isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(wrap);

    // Tab visibility
    const onVisibility = () => {
      if (document.hidden) stateRef.current.isVisible = false;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Mouse listeners (desktop only)
    if (!isTouch) {
      wrap.addEventListener("mousemove", handleMouseMove, { passive: true });
      wrap.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("mousemove", handleCanvasMouseMove, { passive: true });
    }

    // ─── Assembly Animation ───
    const s = stateRef.current;

    if (reduceMotion) {
      s.nodeOpacity = 1;
      s.edgeProgress = 1;
      s.assembled = true;
    } else {
      gsap.to(s, {
        nodeOpacity: 1,
        duration: 0.8,
        delay: 0.2,
        ease: "power2.out",
      });
      gsap.to(s, {
        edgeProgress: 1,
        duration: 1.0,
        delay: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          s.assembled = true;
        },
      });
    }

    // ─── Render Frame ───
    const nodeMap = {};
    NODES.forEach((n) => {
      nodeMap[n.id] = n;
    });

    function render() {
      if (!stateRef.current.isVisible && stateRef.current.assembled) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const cx = w * 0.5;
      const cy = h * 0.5;
      const fov = 4.5;

      ctx.clearRect(0, 0, w, h);

      s.time += 0.016;

      // Lerp rotation toward target
      s.rotY += (s.targetRotY - s.rotY) * 0.04;
      s.rotX += (s.targetRotX - s.rotX) * 0.04;

      // Add slow idle rotation
      const idleRotY = reduceMotion ? 0 : Math.sin(s.time * 0.12) * 0.03;
      const effectiveRotY = s.rotY + idleRotY;
      const effectiveRotX = s.rotX;

      // ─── Project Nodes ───
      const projected = NODES.map((n) => {
        const p = project(n.pos[0], n.pos[1], n.pos[2], cx, cy, fov, effectiveRotY, effectiveRotX);
        return { ...n, x: p.x, y: p.y, scale: p.scale, z: p.z };
      });

      // Sort by z for painter's algorithm (farthest first)
      projected.sort((a, b) => b.z - a.z);
      s.projectedNodes = projected;

      // ─── Draw Edges ───
      for (const edge of EDGES) {
        const fromP = projected.find((n) => n.id === edge.from);
        const toP = projected.find((n) => n.id === edge.to);
        if (!fromP || !toP) continue;

        const depthAlpha = Math.min(fromP.scale, toP.scale);
        const baseAlpha = edge.type === "decision" ? 0.12 : 0.2;
        const hoverBoost =
          s.hovered === edge.from || s.hovered === edge.to ? 0.3 : 0;

        ctx.save();
        ctx.globalAlpha = (baseAlpha + hoverBoost) * depthAlpha * s.edgeProgress;

        if (edge.type === "decision") {
          ctx.setLineDash([4, 4]);
        }

        // Draw partial edge based on assembly progress
        const ex = fromP.x + (toP.x - fromP.x) * s.edgeProgress;
        const ey = fromP.y + (toP.y - fromP.y) * s.edgeProgress;

        ctx.beginPath();
        ctx.moveTo(fromP.x, fromP.y);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "#c6f432";
        ctx.lineWidth = 1.2 * depthAlpha;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ─── Draw Data Packets ───
      if (s.assembled && !reduceMotion) {
        // Spawn new packets occasionally
        if (Math.random() < 0.012 && s.packets.length < 4) {
          const edge = EDGES[Math.floor(Math.random() * EDGES.length)];
          if (edge.type === "data") {
            s.packets.push(createPacket(nodeMap[edge.from], nodeMap[edge.to]));
          }
        }

        for (let i = s.packets.length - 1; i >= 0; i--) {
          const pkt = s.packets[i];
          pkt.t += pkt.speed;
          if (pkt.t >= 1) {
            s.packets.splice(i, 1);
            continue;
          }

          const px3 = pkt.from.pos[0] + (pkt.to.pos[0] - pkt.from.pos[0]) * pkt.t;
          const py3 = pkt.from.pos[1] + (pkt.to.pos[1] - pkt.from.pos[1]) * pkt.t;
          const pz3 = pkt.from.pos[2] + (pkt.to.pos[2] - pkt.from.pos[2]) * pkt.t;
          const pp = project(px3, py3, pz3, cx, cy, fov, effectiveRotY, effectiveRotX);

          ctx.save();
          ctx.globalAlpha = 0.8 * pp.scale;
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, 2.5 * pp.scale, 0, Math.PI * 2);
          ctx.fillStyle = "#c6f432";
          ctx.fill();

          // Glow
          ctx.globalAlpha = 0.25 * pp.scale;
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, 6 * pp.scale, 0, Math.PI * 2);
          ctx.fillStyle = "#c6f432";
          ctx.fill();

          ctx.restore();
        }
      }

      // ─── Draw Nodes ───
      for (const pn of projected) {
        const colors = NODE_COLORS[pn.type] || NODE_COLORS.agent;
        const isHovered = s.hovered === pn.id;
        const baseRadius = pn.radius * pn.scale;
        const hoverScale = isHovered ? 1.3 : 1;
        const r = baseRadius * hoverScale;

        // Pulse animation
        const pulse = reduceMotion
          ? 1
          : 0.85 + 0.15 * Math.sin(s.time * 1.2 + NODES.indexOf(NODES.find((n) => n.id === pn.id)) * 1.1);

        ctx.save();
        ctx.globalAlpha = s.nodeOpacity * pn.scale;

        // Glow halo
        if (r > 2) {
          ctx.globalAlpha = s.nodeOpacity * pn.scale * (isHovered ? 0.4 : 0.15) * pulse;
          ctx.beginPath();
          ctx.arc(pn.x, pn.y, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = colors.glow;
          ctx.fill();
        }

        // Outer ring
        ctx.globalAlpha = s.nodeOpacity * pn.scale * (isHovered ? 0.6 : 0.3) * pulse;
        ctx.beginPath();
        ctx.arc(pn.x, pn.y, r * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ring;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Core circle
        ctx.globalAlpha = s.nodeOpacity * pn.scale * pulse;
        ctx.beginPath();
        ctx.arc(pn.x, pn.y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors.fill;
        ctx.fill();

        ctx.restore();

        // ─── Update DOM Labels ───
        const labelEl = labelRefs.current[pn.id];
        if (labelEl) {
          if (isHovered) {
            labelEl.style.left = `${pn.x}px`;
            labelEl.style.top = `${pn.y + r + 14}px`;
            labelEl.classList.add("hero-scene-label--visible");
          } else {
            labelEl.classList.remove("hero-scene-label--visible");
          }
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      if (!isTouch) {
        wrap.removeEventListener("mousemove", handleMouseMove);
        wrap.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("mousemove", handleCanvasMouseMove);
      }
    };
  }, [reducedMotionPref, handleMouseMove, handleMouseLeave, handleCanvasMouseMove]);

  return (
    <div ref={wrapRef} className="hero-scene-wrap">
      <canvas
        ref={canvasRef}
        className="hero-scene-canvas"
        aria-hidden="true"
      />
      <div className="hero-scene-labels">
        {NODES.map((n) => (
          <span
            key={n.id}
            ref={(el) => {
              labelRefs.current[n.id] = el;
            }}
            className="hero-scene-label"
          >
            {n.label}
          </span>
        ))}
      </div>
    </div>
  );
}
