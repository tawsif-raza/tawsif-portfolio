import { useEffect, useRef } from "react";
import gsap from "gsap";

// A hand-built node graph, not a decorative particle field.
// Root node fans out into three parallel branches (mirrors how the
// real LangGraph pipelines described in the portfolio actually run:
// one planning node -> Send() fan-out -> parallel agents -> merge).
const NODES = [
  { id: "root", x: 60, y: 220, label: "input" },
  { id: "a", x: 260, y: 90, label: "agent" },
  { id: "b", x: 260, y: 220, label: "agent" },
  { id: "c", x: 260, y: 350, label: "agent" },
  { id: "merge", x: 460, y: 220, label: "output" },
];

const EDGES = [
  { from: "root", to: "a" },
  { from: "root", to: "b" },
  { from: "root", to: "c" },
  { from: "a", to: "merge" },
  { from: "b", to: "merge" },
  { from: "c", to: "merge" },
];

function findNode(id) {
  return NODES.find((n) => n.id === id);
}

export default function AgentGraph() {
  const svgRef = useRef();
  const wrapRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      tl.set(".graph-node", { scale: 0, transformOrigin: "center" })
        .set(".graph-edge", { strokeDashoffset: 200 })
        .to(".node-root", { scale: 1, duration: 0.4, ease: "back.out(2)" })
        .to(
          [".edge-root-a", ".edge-root-b", ".edge-root-c"],
          { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.08 },
          "-=0.1"
        )
        .to(
          [".node-a", ".node-b", ".node-c"],
          { scale: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.08 },
          "-=0.3"
        )
        .to(
          [".edge-a-merge", ".edge-b-merge", ".edge-c-merge"],
          { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.08 },
          "-=0.1"
        )
        .to(".node-merge", { scale: 1, duration: 0.4, ease: "back.out(2)" }, "-=0.2")
        .to(".node-merge circle", {
          opacity: 0.4,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
    }, svgRef);

    // Subtle parallax tilt following the cursor using gsap.quickTo and cached rects
    // Viewport-aware via IntersectionObserver: only active when hero is visible.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrapEl = wrapRef.current;
    if (!reduceMotion && window.matchMedia("(hover: hover)").matches && wrapEl) {
      gsap.set(svgRef.current, { transformPerspective: 800 });
      const quickRotateY = gsap.quickTo(svgRef.current, "rotationY", {
        duration: 0.6,
        ease: "power2.out",
      });
      const quickRotateX = gsap.quickTo(svgRef.current, "rotationX", {
        duration: 0.6,
        ease: "power2.out",
      });

      let cachedRect = null;
      const getRect = () => {
        if (!cachedRect && wrapEl) {
          cachedRect = wrapEl.getBoundingClientRect();
        }
        return cachedRect;
      };

      const handleMove = (e) => {
        const rect = getRect();
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        quickRotateY(px * 8);
        quickRotateX(-py * 8);
      };

      const reset = () => {
        quickRotateY(0);
        quickRotateX(0);
      };

      const clearRect = () => {
        cachedRect = null;
      };

      let isObserving = false;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (!isObserving) {
              isObserving = true;
              cachedRect = null;
              window.addEventListener("mousemove", handleMove, { passive: true });
              window.addEventListener("scroll", clearRect, { passive: true });
              window.addEventListener("resize", clearRect, { passive: true });
              wrapEl.addEventListener("mouseleave", reset);
            }
          } else {
            if (isObserving) {
              isObserving = false;
              reset();
              window.removeEventListener("mousemove", handleMove);
              window.removeEventListener("scroll", clearRect);
              window.removeEventListener("resize", clearRect);
              wrapEl.removeEventListener("mouseleave", reset);
            }
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(wrapEl);

      return () => {
        ctx.revert();
        observer.disconnect();
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("scroll", clearRect);
        window.removeEventListener("resize", clearRect);
        wrapEl.removeEventListener("mouseleave", reset);
      };
    }

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} style={{ maxWidth: 560, width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 520 440"
        className="h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
      {EDGES.map((e) => {
        const from = findNode(e.from);
        const to = findNode(e.to);
        return (
          <line
            key={`${e.from}-${e.to}`}
            className={`graph-edge edge-${e.from}-${e.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#3d5214"
            strokeWidth="1.5"
            strokeDasharray="200"
          />
        );
      })}

      {NODES.map((n) => (
        <g
          key={n.id}
          className={`graph-node node-${n.id}`}
          style={{ transformBox: "fill-box" }}
        >
          <circle
            cx={n.x}
            cy={n.y}
            r={n.id === "merge" || n.id === "root" ? 7 : 5.5}
            fill={n.id === "merge" ? "#c6f432" : "#c6f432"}
            opacity={n.id === "merge" ? 1 : 0.85}
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.id === "merge" || n.id === "root" ? 14 : 11}
            fill="none"
            stroke="#c6f432"
            strokeWidth="1"
            opacity="0.35"
          />
          <text
            x={n.x}
            y={n.y + 28}
            textAnchor="middle"
            fill="#a0a6af"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="10"
            letterSpacing="0.5"
          >
            {n.label}
          </text>
        </g>
      ))}
      </svg>
    </div>
  );
}
