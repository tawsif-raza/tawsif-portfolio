// Shared node/edge data for the "living system" visualization.
// Topology 1 (Hub & Spoke) from the design doc §10 — same shape
// already proven in src/components/HeroScene.jsx, kept here as the
// single source of truth so the R3F scene and any future Tier-2/3
// fallback (design doc §19.4) render the same system.

export const NODES = [
  {
    id: "gateway",
    type: "gateway",
    label: "API Gateway",
    pos: [-2.4, 0, -0.3],
    role: "Validates and authenticates incoming requests before they reach the orchestrator.",
    tech: "FastAPI, Pydantic",
    fallback: "Rejects malformed requests early — no bad input reaches the model layer.",
  },
  {
    id: "orchestrator",
    type: "orchestrator",
    label: "Orchestrator",
    pos: [0, 0, 0],
    role: "Routes each request to the right agent, tool, or retrieval path based on intent.",
    tech: "LangGraph state machine",
    fallback: "Falls back to a clarification step if intent is ambiguous.",
  },
  {
    id: "planner",
    type: "agent",
    label: "Planner",
    pos: [-1.2, -1.8, -1.2],
    role: "Breaks a request into ordered steps before any tool runs.",
    tech: "LangGraph subgraph",
    fallback: "Defers back to the orchestrator if planning stalls.",
  },
  {
    id: "retriever",
    type: "agent",
    label: "Retriever",
    pos: [0.6, -1.9, -0.9],
    role: "Pulls the specific context a request actually needs.",
    tech: "Hybrid dense + BM25 retrieval",
    fallback: "Falls back to dense-only search if the sparse index is unavailable.",
  },
  {
    id: "critic",
    type: "agent",
    label: "Critic",
    pos: [2.0, -1.0, -1.0],
    role: "Reviews agent output before it's treated as final.",
    tech: "Secondary LLM pass",
    fallback: "Escalates to human review on low confidence.",
  },
  {
    id: "rag",
    type: "rag",
    label: "RAG Engine",
    pos: [-0.5, 1.8, -1.5],
    role: "Serves grounded, source-backed context to the agents.",
    tech: "Vector store + reranker",
    fallback: "Returns no context rather than a guess if retrieval fails.",
  },
  {
    id: "mcp",
    type: "tool",
    label: "MCP Server",
    pos: [1.8, 1.5, -1.8],
    role: "Executes real actions and tool calls on the agents' behalf.",
    tech: "MCP server",
    fallback: "Actions are scoped and logged; nothing destructive runs unsupervised.",
  },
  {
    id: "output",
    type: "output",
    label: "Response",
    pos: [2.8, 0, -0.5],
    role: "Delivers the final, reviewed response back to the caller.",
    tech: "Streamed response",
    fallback: "Retries once on delivery failure, then surfaces an error state.",
  },
];

export const EDGES = [
  { from: "gateway", to: "orchestrator", type: "data" },
  { from: "orchestrator", to: "planner", type: "data" },
  { from: "orchestrator", to: "retriever", type: "data" },
  { from: "orchestrator", to: "critic", type: "data" },
  { from: "retriever", to: "rag", type: "data" },
  { from: "planner", to: "mcp", type: "decision" },
  { from: "critic", to: "output", type: "data" },
  { from: "orchestrator", to: "rag", type: "data" },
];

export const NODE_COLORS = {
  orchestrator: "#c98a3b",
  agent: "#d69e5a",
  rag: "#a87a3a",
  tool: "#8a6a2e",
  gateway: "#ede6d6",
  output: "#4ade80",
};

export const NODE_RADIUS = {
  orchestrator: 0.34,
  agent: 0.22,
  rag: 0.26,
  tool: 0.18,
  gateway: 0.24,
  output: 0.24,
};

export const NODE_MAP = NODES.reduce((map, node) => {
  map[node.id] = node;
  return map;
}, {});

export const DATA_EDGES = EDGES.filter((edge) => edge.type === "data");

// A thinned version of the default topology for touch/mobile (design
// doc §16: "~5 nodes rather than the full 8" — a deliberately
// different tier, not a shrunk desktop scene). Only applies to this
// illustrative hub-and-spoke system; ArchitectureShowcase's per-project
// pipelines always keep every real node, since dropping a step there
// would misrepresent how that specific system actually works (§12).
const MOBILE_NODE_IDS = ["orchestrator", "retriever", "critic", "output"];
export const NODES_MOBILE = NODES.filter((n) => MOBILE_NODE_IDS.includes(n.id));
export const EDGES_MOBILE = EDGES.filter(
  (e) => MOBILE_NODE_IDS.includes(e.from) && MOBILE_NODE_IDS.includes(e.to)
);
