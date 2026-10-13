# Tawsif Raza Khan — Portfolio

Personal portfolio of **Tawsif Raza Khan**, an AI/ML engineer building agentic systems, LangGraph multi-agent pipelines, RAG systems and automation workflows. It's a dark, motion-heavy single-page site built with React.

**Live:** https://main.d31cxcwox3ykwe.amplifyapp.com/

## Stack

| Layer | Tools |
| :--- | :--- |
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS 4 (tokens in `src/index.css` `@theme`, mirrored in `tailwind.config.js`) |
| Animation | Framer Motion 12, GSAP 3 + ScrollTrigger |
| 3D | three.js, @react-three/fiber |
| Icons | lucide-react, plus inline SVG brand logos (devicon / Simple Icons) |
| Lint | oxlint |
| Hosting | AWS Amplify |

## Features

- **Hero:** a full-bleed film background with adaptive 1080p/720p sources, a poster fallback and a play/pause toggle.
- **Animated Skills:** a crossfading dual-video background with free-floating tech logos that pause and glow on hover.
- **About:** a fade-up split layout with a floating, live "NOW" status card (pulsing dot and log replay) inside orbit rings over a starfield.
- **Sticky Projects:** a Framer Motion card stack with seven projects:
  - spring-smoothed scroll;
  - a 3D tilt on entry;
  - depth-of-field dimming and blur on older cards;
  - image parallax inside each card.
- **Soft Stack:** a glassmorphism slide-out drawer opened from the footer, covering beliefs, soft skills and reading. It has a focus trap, closes on Esc and locks page scroll.
- **Contact:** floating-label fields and a paper-plane send animation, wired to Formspree.
- **Accessibility:** every animation respects `prefers-reduced-motion`, and videos pause when they're off-screen or the tab is hidden.

## Getting started

```bash
git clone https://github.com/tawsif-raza/tawsif-portfolio.git
cd tawsif-portfolio
npm install
npm run dev
```

| Script | What it does |
| :--- | :--- |
| `npm run dev` | Start the dev server |
| `npm run build` | Refresh GitHub activity data, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

## Structure

```
├── index.html            # Entry HTML, meta tags, fonts
├── public/               # Videos (hero/, skills/), project images, icons
├── scripts/              # Build-time GitHub activity fetch
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx           # Section order
    ├── index.css         # Design tokens + component styles
    ├── sections/         # Hero, SkillsFloat, AboutSpace, Projects, Contact, Footer, …
    ├── components/       # DualVideoBackground, Starfield, LiveStatus, SoftStackDrawer, …
    ├── data/             # Logos, system graph, GitHub activity
    ├── hooks/            # useReducedMotion, useInViewport
    └── utils/
```

## License

MIT. See [LICENSE](LICENSE).
