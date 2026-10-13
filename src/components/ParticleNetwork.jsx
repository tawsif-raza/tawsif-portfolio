import { useEffect, useRef } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import { resizeCanvasToDisplaySize } from "../utils/canvasSize";

// DPR capped lower than the shared helper's default (2) specifically
// for this component: it's the highest particle-count, most
// expensive canvas in the app (up to 170 particles, O(n^2) pairwise
// connection checks + a glow blit per particle, every frame), so a
// stricter cap keeps the added high-DPI fill-rate cost bounded.
const MAX_DPR = 1.5;

// Two focal zones matching the CSS atmosphere glows (top-right, bottom-left),
// so the network has real directorial emphasis instead of uniform density --
// this is what makes it read as "designed" rather than "randomly scattered."
const FOCAL_ZONES = [
  { xFrac: 0.82, yFrac: 0.08, weight: 0.42, spread: 0.42 },
  { xFrac: 0.1, yFrac: 0.92, weight: 0.36, spread: 0.4 },
];

// Section-aware "energy" -- the ambient computational environment should
// feel alive and responsive to where the visitor is, not fight the content.
// Hero gets full energy; reading-heavy or closing sections calm down.
// This drives three things per frame: how many particles read as visible
// (density), how bright they are (opacity), and how fast they drift
// (motion speed) -- see `visibility` below and the intensity scalars in
// drawFrame()/step().
const SECTION_INTENSITY = {
  hero: 1,
  about: 0.4,
  projects: 0.45,
  skills: 0.4,
  services: 0.45,
  contact: 0.3,
};
const SECTION_IDS = Object.keys(SECTION_INTENSITY);
const REFERENCE_LINE = 160;

function gaussianOffset(spread) {
  // Box-Muller, clamped -- gives a soft cluster falloff rather than a hard-edged blob.
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-1, Math.min(1, n * spread));
}

function pickViewportTuning(width) {
  if (width < 640) return { count: 70, connectDist: 130, mouseDist: 150 };
  if (width < 1024) return { count: 110, connectDist: 170, mouseDist: 190 };
  return { count: 170, connectDist: 210, mouseDist: 220 };
}

export default function ParticleNetwork() {
  const canvasRef = useRef();
  const reducedMotionPref = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = reducedMotionPref;

    let width, height, particles, tuning;
    let mouse = { x: -9999, y: -9999 };
    let rafId = null;
    let isHidden = false;

    // Pre-render a reusable glow sprite to eliminate 10,000+ CanvasGradient
    // and color stop allocations per second from the render loop.
    const SPRITE_SIZE = 64;
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = SPRITE_SIZE;
    glowCanvas.height = SPRITE_SIZE;
    const glowCtx = glowCanvas.getContext("2d");
    if (glowCtx) {
      const grad = glowCtx.createRadialGradient(
        SPRITE_SIZE / 2,
        SPRITE_SIZE / 2,
        0,
        SPRITE_SIZE / 2,
        SPRITE_SIZE / 2,
        SPRITE_SIZE / 2
      );
      grad.addColorStop(0, "rgba(198,244,50,1)");
      grad.addColorStop(1, "rgba(198,244,50,0)");
      glowCtx.fillStyle = grad;
      glowCtx.beginPath();
      glowCtx.arc(SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE / 2, 0, Math.PI * 2);
      glowCtx.fill();
    }

    // Current is eased toward target every frame so a section change
    // reads as a graceful dim/brighten rather than a jump cut. Both live
    // in refs (not React state) since this is a pure imperative rAF loop.
    const intensity = { current: 1, target: 1 };

    // Cached section offsets to eliminate forced synchronous reflows on scroll
    let cachedSectionOffsets = [];
    let cachedScrollHeight = 0;

    function updateCachedOffsets() {
      cachedScrollHeight = document.documentElement.scrollHeight;
      cachedSectionOffsets = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        let top = 0;
        let curr = el;
        while (curr) {
          top += curr.offsetTop || 0;
          curr = curr.offsetParent;
        }
        return { id, top };
      }).filter(Boolean);
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      resizeCanvasToDisplaySize(canvas, ctx, width, height, { maxDPR: MAX_DPR });
      tuning = pickViewportTuning(width);
      updateCachedOffsets();
    }

    function spawnPoint() {
      if (Math.random() < 0.55) {
        const roll = Math.random();
        let acc = 0;
        for (const zone of FOCAL_ZONES) {
          acc += zone.weight;
          if (roll <= acc) {
            const x = zone.xFrac * width + gaussianOffset(zone.spread) * width;
            const y = zone.yFrac * height + gaussianOffset(zone.spread) * height;
            return {
              x: Math.max(0, Math.min(width, x)),
              y: Math.max(0, Math.min(height, y)),
              depth: 0.55 + Math.random() * 0.45,
            };
          }
        }
      }
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        depth: 0.15 + Math.random() * 0.55,
      };
    }

    function init() {
      particles = Array.from({ length: tuning.count }, () => {
        const p = spawnPoint();
        return {
          ...p,
          vx: (Math.random() - 0.5) * 0.3 * p.depth,
          vy: (Math.random() - 0.5) * 0.3 * p.depth,
          r: 1 + p.depth * 2.8,
          prominence: Math.random(),
        };
      });
    }

    function visibilityOf(p) {
      return Math.max(0, Math.min(1, 1 - (p.prominence - intensity.current) * 2.5));
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      const connectDist = tuning.connectDist;
      const connectDistSq = connectDist * connectDist;
      const mouseDist = tuning.mouseDist;
      const mouseDistSq = mouseDist * mouseDist;
      const hasMouse = mouse.x > -1000;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const visA = visibilityOf(a);
        if (visA > 0.01) {
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            if (dx > connectDist || dx < -connectDist) continue;
            const dy = a.y - b.y;
            if (dy > connectDist || dy < -connectDist) continue;

            const distSq = dx * dx + dy * dy;
            if (distSq < connectDistSq) {
              const visB = visibilityOf(b);
              if (visB <= 0.01) continue;

              const d = Math.sqrt(distSq);
              const depthPair = (a.depth + b.depth) * 0.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(150,160,150,${
                0.22 * depthPair * (1 - d / connectDist) * Math.min(visA, visB)
              })`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Mouse-follow line
        if (hasMouse) {
          const dmx = a.x - mouse.x;
          if (dmx <= mouseDist && dmx >= -mouseDist) {
            const dmy = a.y - mouse.y;
            if (dmy <= mouseDist && dmy >= -mouseDist) {
              const dmSq = dmx * dmx + dmy * dmy;
              if (dmSq < mouseDistSq) {
                const dm = Math.sqrt(dmSq);
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(198,244,50,${0.6 * (1 - dm / mouseDist)})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
              }
            }
          }
        }
      }

      // Draw particle halos (via pre-rendered offscreen sprite) and dots
      for (const p of particles) {
        const vis = visibilityOf(p);
        if (vis <= 0.01) continue;

        // Blit pre-rendered sprite for halo (0 allocations, GPU texture blit)
        const haloR = p.r * 5;
        ctx.globalAlpha = 0.14 * p.depth * vis;
        ctx.drawImage(glowCanvas, p.x - haloR, p.y - haloR, haloR * 2, haloR * 2);
        ctx.globalAlpha = 1;

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,232,222,${(0.25 + 0.4 * p.depth) * vis})`;
        ctx.fill();
      }
    }

    function step() {
      if (isHidden) return;
      intensity.current += (intensity.target - intensity.current) * 0.04;
      const speed = 0.5 + 0.5 * intensity.current;
      for (const p of particles) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      drawFrame();
      rafId = requestAnimationFrame(step);
    }

    const handleMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        init();
        drawFrame();
      }, 150);
    };

    // Cached scroll-spy: uses cached offsets, avoiding getBoundingClientRect reflows during scroll
    let scrollTicking = false;
    const updateIntensityTarget = () => {
      scrollTicking = false;
      if (!cachedSectionOffsets.length) return;
      const scrollY = window.scrollY;
      let current = cachedSectionOffsets[0].id;
      for (const s of cachedSectionOffsets) {
        if (s.top - scrollY <= REFERENCE_LINE) current = s.id;
      }
      const atBottom = scrollY + window.innerHeight >= cachedScrollHeight - 4;
      if (atBottom) current = cachedSectionOffsets[cachedSectionOffsets.length - 1].id;
      intensity.target = SECTION_INTENSITY[current] ?? 1;
    };

    const onScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateIntensityTarget);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHidden = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        isHidden = false;
        if (!reduceMotion && !rafId) {
          rafId = requestAnimationFrame(step);
        }
      }
    };

    resize();
    init();
    drawFrame();
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!reduceMotion) {
      window.addEventListener("mousemove", handleMove, { passive: true });
      window.addEventListener("mouseout", handleLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      updateIntensityTarget();
      intensity.current = intensity.target;
      rafId = requestAnimationFrame(step);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseout", handleLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotionPref]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -2,
        pointerEvents: "none",
      }}
    />
  );
}
