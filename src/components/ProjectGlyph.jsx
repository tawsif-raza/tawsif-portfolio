// Small, hand-drawn-feeling line glyphs, one per project category.
// Not stock icons -- each is a distinct 40x40 mark in the amber/parchment
// palette, meant to stand in for a screenshot when the project has no UI.

export default function ProjectGlyph({ category }) {
  const common = {
    "aria-hidden": true,
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "#c6f432",
    strokeWidth: 1.2,
  };

  switch (category) {
    case "Automation":
      // Flow: three nodes chained with directional arrows
      return (
        <svg {...common}>
          <circle cx="8" cy="20" r="3" />
          <path d="M11 20h8" />
          <path d="M17 17l3 3-3 3" />
          <circle cx="22" cy="20" r="3" />
          <path d="M25 20h8" />
          <path d="M31 17l3 3-3 3" strokeDasharray="2 2" opacity="0.5" />
        </svg>
      );
    case "AI/ML":
      // Layered network: input layer -> hidden -> output
      return (
        <svg {...common}>
          <circle cx="8" cy="12" r="2" />
          <circle cx="8" cy="20" r="2" />
          <circle cx="8" cy="28" r="2" />
          <circle cx="20" cy="16" r="2" />
          <circle cx="20" cy="24" r="2" />
          <circle cx="32" cy="20" r="2.5" fill="#c6f432" />
          <path d="M10 12l8 4M10 20l8-4M10 20l8 4M10 28l8-4" opacity="0.5" />
          <path d="M22 16l8 4M22 24l8-4" opacity="0.5" />
        </svg>
      );
    case "Showcase":
      // Framed viewport
      return (
        <svg {...common}>
          <rect x="6" y="9" width="28" height="22" rx="1" />
          <path d="M6 15h28" opacity="0.5" />
          <circle cx="10" cy="12" r="0.8" fill="#c6f432" stroke="none" />
        </svg>
      );
    case "Content":
      // Play frame with motion lines
      return (
        <svg {...common}>
          <rect x="6" y="10" width="28" height="20" rx="1" />
          <path d="M17 15l8 5-8 5z" fill="#c6f432" stroke="none" />
        </svg>
      );
    case "Tooling":
      // Grid / dashboard
      return (
        <svg {...common}>
          <rect x="6" y="8" width="12" height="10" />
          <rect x="22" y="8" width="12" height="10" />
          <rect x="6" y="22" width="12" height="10" />
          <rect x="22" y="22" width="12" height="10" opacity="0.4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="10" />
        </svg>
      );
  }
}
