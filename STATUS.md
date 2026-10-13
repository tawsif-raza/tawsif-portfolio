# Status

A short, honest log of what's actually been built — kept accurate rather than aspirational.

## What's live

- Core site: Hero, About, Projects, Skills, Services, Contact, Footer, plus supporting sections (Engineering Methodology, Architecture Showcase, Engineering Impact, Tech Stack, Current Focus).
- A reusable 3D "living system" visualization (React Three Fiber), mounted in three places (Hero, Methodology, Architecture) with device-capability gating and a canvas2D fallback.
- Shared accessibility/perf hooks (`useReducedMotion`, `useInViewport`) backfilled across every animated component, replacing several independent one-off implementations.
- Build-time GitHub activity data (no client-side API calls).
- Contact form with real error handling (checks the response, shows a visible error state with a manual email fallback instead of silently redirecting or reporting false success).
- SEO/meta basics: accurate canonical/OG/Twitter URLs, JSON-LD `Person` schema, robots.txt, sitemap.xml, favicon set (SVG + PNG + apple-touch-icon), web manifest, dedicated OG share image.

## Known gaps / deliberately deferred

- No resume download yet — the button was removed rather than left pointing at a missing file. Re-add once a real PDF exists.
- No client testimonials yet — the section exists in code but renders nothing until real quotes are added (no fabricated placeholder content).
- Site is served from an Amplify subdomain, not a custom domain.
- Mobile/cross-browser testing has only been done via build/lint checks and dev-server console logs, not real devices or Safari/Firefox.

## Verification

- `npm run lint` — clean.
- `npm run build` — clean, no unexpected bundle regressions.
