import Magnetic from "../components/Magnetic";
import SoftStackDrawer from "../components/SoftStackDrawer";

const SOCIAL = [
  {
    label: "GitHub",
    href: "https://github.com/tawsif-raza",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/tawsif-khan-34952336b",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#services", label: "Services" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative mx-auto max-w-6xl px-6 pb-12 pt-20 md:px-12">
      {/* Gradient border */}
      <div className="footer-gradient-border mb-12" />

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        {/* Brand */}
        <div>
          <a href="#hero" className="font-display text-lg font-medium text-paper">
            T.R.K
          </a>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-dim">
            Building agentic AI systems, automation pipelines, and production ML —
            from Bengaluru, working with people anywhere.
          </p>
          <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-faint">
            <span className="availability-dot" aria-hidden="true" />
            <span>Available for work</span>
          </div>
          <div className="mt-5">
            <SoftStackDrawer />
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-faint">
            Navigation
          </h4>
          <nav className="flex flex-col gap-2.5">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[12px] text-dim transition hover:text-accent"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Connect */}
        <div>
          <h4 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-faint">
            Connect
          </h4>
          <div className="flex flex-col gap-3">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 text-dim transition hover:text-accent"
              >
                {s.icon}
                <span className="font-mono text-[12px]">{s.label}</span>
              </a>
            ))}
            <a
              href="mailto:tawsifk35@gmail.com"
              className="flex items-center gap-2.5 text-dim transition hover:text-accent"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13 2 4" />
              </svg>
              <span className="font-mono text-[12px]">tawsifk35@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="font-mono text-[10px] text-[#4b5058]">
          &copy; {new Date().getFullYear()} Tawsif Raza Khan. Built with React, GSAP &amp; Tailwind.
        </p>
        <Magnetic>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 font-mono text-[10px] text-dim transition hover:text-accent"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </Magnetic>
      </div>
    </footer>
  );
}
