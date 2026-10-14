import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, Object3D, Vector3 } from "three";
import {
  NODES as DEFAULT_NODES,
  EDGES as DEFAULT_EDGES,
  NODES_MOBILE,
  EDGES_MOBILE,
  NODE_COLORS,
  NODE_RADIUS,
} from "../data/systemGraph";
import useReducedMotion from "../hooks/useReducedMotion";
import useInViewport from "../hooks/useInViewport";

// The real, reusable "living system" scene (design doc §20, Phases
// 2/4/5/6/7 — final state). Self-contained: owns its own
// reduced-motion/in-viewport gating and touch/mobile tuning so every
// mount site (Hero, Methodology, ArchitectureShowcase) gets the same
// behavior for free, with no shared parent to coordinate.
//
// Contract for reuse: pass `nodes`/`edges` (same shape as
// src/data/systemGraph.js's NODES/EDGES) to visualize any topology
// with the same node-type visual language and interaction model; pass
// `highlightIds` to have a parent (e.g. a phase/step selector) light up
// specific nodes externally, independent of hover/click. Omitting
// `nodes`/`edges` renders the default hub-and-spoke system, and on
// touch devices automatically swaps to NODES_MOBILE/EDGES_MOBILE (§16)
// — that substitution only ever applies to this default topology,
// never to explicitly-passed data, since thinning a real per-project
// architecture would misrepresent it (§12).
//
// This is deliberately three independent instances, not one global
// persistent canvas (a documented deviation from the design doc's
// "one global canvas" ideal, §19.2) — promoting it to a page-spanning
// fixed background is a much bigger visual decision than "add a
// diagram," and wasn't something to decide unilaterally mid-build.
// There is no shared "mode store"; each instance's state (hover, pin,
// highlight) is entirely local to itself.
export default function LivingSystemScene({ nodes: nodesProp, edges: edgesProp, highlightIds = [] }) {
  const wrapRef = useRef();
  const pointerRef = useRef({ x: 0, y: 0 });
  const labelRefs = useRef({});
  const reducedMotion = useReducedMotion();
  const inView = useInViewport(wrapRef, 0.1);
  const [isTouch] = useState(() => !window.matchMedia("(hover: hover)").matches);
  const active = !reducedMotion && inView;

  // Mobile/touch subset only ever substitutes for the *default*
  // topology — a caller that passes its own nodes/edges (Methodology,
  // ArchitectureShowcase) always gets exactly that data, unreduced.
  const nodes = nodesProp ?? (isTouch ? NODES_MOBILE : DEFAULT_NODES);
  const edges = edgesProp ?? (isTouch ? EDGES_MOBILE : DEFAULT_EDGES);

  const nodeMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);
  const dataEdges = useMemo(() => edges.filter((e) => e.type === "data"), [edges]);
  const highlightSet = useMemo(() => new Set(highlightIds), [highlightIds]);
  const maxPackets = isTouch ? 2 : 4;

  const [hoveredId, setHoveredId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const displayedId = pinnedId ?? hoveredId;
  const displayedNode = displayedId ? nodeMap[displayedId] : null;

  const handleActivate = (id) => setHoveredId(id);
  const handleDeactivate = (id) => setHoveredId((cur) => (cur === id ? null : cur));
  const handleToggleSelect = (id) => setPinnedId((cur) => (cur === id ? null : id));

  const handlePointerMove = (e) => {
    if (isTouch) return;
    const rect = wrapRef.current.getBoundingClientRect();
    pointerRef.current.x = (e.clientX - rect.left) / rect.width - 0.5;
    pointerRef.current.y = (e.clientY - rect.top) / rect.height - 0.5;
  };
  const handlePointerLeave = () => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPinnedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <div aria-hidden="true" style={{ width: "100%", height: "100%" }}>
        {/* frameloop: R3F's default "always" keeps drawing the scene every
            frame even when `active` has frozen the animation and the canvas
            is off-screen. Off-screen it now draws nothing at all. */}
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} frameloop={inView ? "always" : "never"}>
          <Scene
            nodes={nodes}
            edges={edges}
            dataEdges={dataEdges}
            maxPackets={maxPackets}
            active={active}
            isTouch={isTouch}
            pointerRef={pointerRef}
            labelRefs={labelRefs}
            activeId={displayedId}
            highlightSet={highlightSet}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onToggleSelect={handleToggleSelect}
          />
        </Canvas>
      </div>

      <div className="living-system-labels" aria-hidden="false">
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            ref={(el) => {
              labelRefs.current[node.id] = el;
            }}
            className={`living-system-node-label ${
              displayedId === node.id ? "living-system-node-label--visible" : ""
            }`}
            aria-label={`${node.label} — ${node.role ?? ""}`}
            onFocus={() => handleActivate(node.id)}
            onBlur={() => handleDeactivate(node.id)}
            onClick={() => handleToggleSelect(node.id)}
          >
            {node.label}
          </button>
        ))}
      </div>

      <div
        className={`living-system-detail ${displayedNode ? "living-system-detail--visible" : ""}`}
        aria-live="polite"
      >
        {displayedNode && (
          <>
            <span className="living-system-detail__title">{displayedNode.label}</span>
            {displayedNode.role ? (
              <>
                {" — "}
                {displayedNode.role}
              </>
            ) : null}
            {displayedNode.tech ? <span className="living-system-detail__tech"> · {displayedNode.tech}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

function Node({ node, active, activeId, highlighted, onActivate, onDeactivate, onToggleSelect }) {
  const meshRef = useRef();
  const color = NODE_COLORS[node.type] ?? NODE_COLORS.agent;
  const radius = NODE_RADIUS[node.type] ?? 0.2;
  const phase = node.pos[0] + node.pos[1];
  const isActive = activeId === node.id;

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = active ? 0.88 + 0.12 * Math.sin(state.clock.elapsedTime * 1.2 + phase) : 1;
    const boost = isActive ? 1.35 : highlighted ? 1.15 : 1;
    meshRef.current.scale.setScalar(pulse * boost);
  });

  return (
    <mesh
      ref={meshRef}
      position={node.pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        onActivate(node.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onDeactivate(node.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggleSelect(node.id);
      }}
    >
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={(node.type === "orchestrator" ? 0.9 : 0.45) + (isActive ? 0.35 : highlighted ? 0.2 : 0)}
        roughness={0.45}
        metalness={0.15}
      />
    </mesh>
  );
}

function Edge({ edge, nodeMap }) {
  const lineRef = useRef();
  const geometry = useMemo(() => {
    const from = nodeMap[edge.from];
    const to = nodeMap[edge.to];
    return new BufferGeometry().setFromPoints([
      new Vector3(...from.pos),
      new Vector3(...to.pos),
    ]);
  }, [edge, nodeMap]);

  useEffect(() => {
    // computeLineDistances() lives on the Line object, not the raw
    // BufferGeometry — it reads the object's own geometry attribute
    // and writes the per-vertex distances dashed materials need.
    if (edge.type === "decision" && lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  }, [edge, geometry]);

  if (edge.type === "decision") {
    return (
      <line ref={lineRef} geometry={geometry}>
        <lineDashedMaterial color="#c6f432" dashSize={0.08} gapSize={0.07} transparent opacity={0.28} />
      </line>
    );
  }

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#c6f432" transparent opacity={0.4} />
    </line>
  );
}

// One InstancedMesh shared across every in-flight packet, per the
// design doc §19.1's case for instancing over per-object draw calls.
function Packets({ active, nodes, dataEdges, maxPackets }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const nodeVectors = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = new Vector3(...n.pos);
    });
    return map;
  }, [nodes]);
  const packets = useMemo(
    () =>
      Array.from({ length: maxPackets }, () => ({
        active: false,
        fromId: null,
        toId: null,
        t: 0,
        speed: 0,
      })),
    [maxPackets]
  );

  useFrame((_state, delta) => {
    if (!meshRef.current || dataEdges.length === 0) return;

    if (active) {
      const liveCount = packets.filter((p) => p.active).length;
      if (liveCount < maxPackets && Math.random() < 0.02) {
        const free = packets.find((p) => !p.active);
        if (free) {
          const edge = dataEdges[Math.floor(Math.random() * dataEdges.length)];
          free.active = true;
          free.fromId = edge.from;
          free.toId = edge.to;
          free.t = 0;
          free.speed = 0.3 + Math.random() * 0.2; // ~2.5-3.3s per edge
        }
      }
    }

    packets.forEach((p, i) => {
      if (active && p.active) {
        p.t += p.speed * delta;
        if (p.t >= 1) p.active = false;
      }

      if (p.active && nodeVectors[p.fromId] && nodeVectors[p.toId]) {
        dummy.position.lerpVectors(nodeVectors[p.fromId], nodeVectors[p.toId], p.t);
        dummy.scale.setScalar(1);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh key={maxPackets} ref={meshRef} args={[null, null, maxPackets]}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshBasicMaterial color="#dcff7a" />
    </instancedMesh>
  );
}

// Projects each node's world-space position (after the group's own
// rotation) to screen pixels every frame, and writes it directly onto
// the DOM label refs passed in from outside the Canvas — same
// imperative-ref pattern HeroScene already uses, just driven by a real
// three.js camera projection instead of manual trig.
function NodeLabels({ groupRef, labelRefs, nodes }) {
  const { camera, size } = useThree();
  const tempVec = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (!groupRef.current) return;
    nodes.forEach((node) => {
      const el = labelRefs.current[node.id];
      if (!el) return;
      tempVec.set(node.pos[0], node.pos[1], node.pos[2]);
      groupRef.current.localToWorld(tempVec);
      tempVec.project(camera);
      const x = (tempVec.x * 0.5 + 0.5) * size.width;
      const y = (-tempVec.y * 0.5 + 0.5) * size.height;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    });
  });

  return null;
}

function Scene({
  nodes,
  edges,
  dataEdges,
  maxPackets,
  active,
  isTouch,
  pointerRef,
  labelRefs,
  activeId,
  highlightSet,
  onActivate,
  onDeactivate,
  onToggleSelect,
}) {
  const groupRef = useRef();
  const nodeMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (active) {
      const idle = Math.sin(state.clock.elapsedTime * 0.12) * 0.12;
      const targetY = idle + (isTouch ? 0 : pointerRef.current.x * 0.35);
      const targetX = isTouch ? 0 : -pointerRef.current.y * 0.2;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
    }
    // Forces matrixWorld to reflect this frame's rotation immediately,
    // so NodeLabels' projection below never lags a frame behind
    // regardless of useFrame subscription order between components.
    groupRef.current.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 4]} intensity={30} color="#c6f432" />
      <pointLight position={[-3, -2, -2]} intensity={8} color="#3d5214" />
      <group ref={groupRef}>
        {edges.map((edge) => (
          <Edge key={`${edge.from}-${edge.to}`} edge={edge} nodeMap={nodeMap} />
        ))}
        <Packets active={active} nodes={nodes} dataEdges={dataEdges} maxPackets={maxPackets} />
        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            active={active}
            activeId={activeId}
            highlighted={highlightSet.has(node.id)}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </group>
      <NodeLabels groupRef={groupRef} labelRefs={labelRefs} nodes={nodes} />
    </>
  );
}
