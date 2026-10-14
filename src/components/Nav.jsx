import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const LOGO = `${import.meta.env.BASE_URL}logo.png`;
// Show the shortcut the visitor's keyboard actually has.
const IS_MAC =
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);
const MOD_KEY = IS_MAC ? "⌘" : "Ctrl";

const LINKS = [
  { href: "#skills", label: "Skills", id: "skills" },
  { href: "#about", label: "About", id: "about" },
  { href: "#projects", label: "Work", id: "projects" },
  { href: "#services", label: "Services", id: "services" },
  { href: "#contact", label: "Contact", id: "contact" },
];

// Scroll position never goes through React state here: the scroll handler
// writes the header's data-scrolled flag and each link's aria-current/accent
// straight to the DOM, so scrolling the page never re-renders Nav.
function markActive(root, id) {
  if (!root) return;
  root.querySelectorAll("a[data-nav-id]").forEach((a) => {
    const on = a.dataset.navId === id;
    a.classList.toggle("text-accent", on);
    if (a.classList.contains("mobile-nav-link")) a.classList.toggle("text-paper", !on);
    if (on) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef();
  const mobileMenuRef = useRef();
  const activeRef = useRef(null);

  useEffect(() => {
    const REFERENCE_LINE = 160;
    let cachedOffsets = [];
    let cachedScrollHeight = 0;
    let ticking = false;

    function computeOffsets() {
      cachedScrollHeight = document.documentElement.scrollHeight;
      cachedOffsets = LINKS.map((l) => {
        const el = document.getElementById(l.id);
        if (!el) return null;
        let top = 0;
        let curr = el;
        while (curr) {
          top += curr.offsetTop || 0;
          curr = curr.offsetParent;
        }
        return { id: l.id, top };
      }).filter(Boolean);
    }

    computeOffsets();
    if (!cachedOffsets.length) return;

    let prevScrolled = false;
    let prevActive = null;

    const update = () => {
      ticking = false;
      const scrollY = window.scrollY;
      const isScrolled = scrollY > 40;
      if (isScrolled !== prevScrolled) {
        prevScrolled = isScrolled;
        if (headerRef.current) headerRef.current.dataset.scrolled = String(isScrolled);
      }

      let current = cachedOffsets[0].id;
      for (const s of cachedOffsets) {
        if (s.top - scrollY <= REFERENCE_LINE) current = s.id;
      }

      const atBottom = scrollY + window.innerHeight >= cachedScrollHeight - 4;
      if (atBottom) current = cachedOffsets[cachedOffsets.length - 1].id;

      if (current !== prevActive) {
        prevActive = current;
        activeRef.current = current;
        markActive(headerRef.current, current);
        markActive(mobileMenuRef.current, current);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        computeOffsets();
        update();
      }, 150);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Escape closes mobile menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // GSAP stagger animation for mobile menu
  useEffect(() => {
    if (!open || !mobileMenuRef.current) return;
    markActive(mobileMenuRef.current, activeRef.current);
    const links = mobileMenuRef.current.querySelectorAll(".mobile-nav-link");
    gsap.fromTo(
      links,
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power3.out" }
    );
  }, [open]);

  return (
    <>
      {/* Solid fill once scrolled. A backdrop-blur on a fixed bar re-blurs
          whatever scrolls under it on every frame, including the videos. */}
      <header
        ref={headerRef}
        data-scrolled="false"
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-transparent px-6 py-5 transition-colors duration-300 data-[scrolled=true]:bg-bg/95 md:px-16 lg:px-24"
      >
        {/* Home link. The 32px logo is pulled in by -my-1.5 so the bar keeps
            the height the old 20px "T.R.K" text gave it. width/height
            reserve the box before the image loads, so nothing shifts. */}
        <a
          href="#hero"
          className="group -my-1.5 inline-flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <img
            src={LOGO}
            alt="Tawsif Raza Khan logo"
            width={182}
            height={128}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="h-8 w-auto select-none transition duration-300 ease-out group-hover:drop-shadow-[0_0_8px_rgba(26,255,58,0.45)] group-focus-visible:drop-shadow-[0_0_8px_rgba(26,255,58,0.45)] motion-safe:group-hover:scale-105"
          />
          <span className="sr-only">, back to top</span>
        </a>

        <div className="flex items-center gap-5">
          <nav className="hidden gap-7 font-mono text-[11px] tracking-wide text-dim sm:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} data-nav-id={l.id} className="nav-link transition hover:text-accent">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Command palette trigger: the way in for touch users and anyone
              who doesn't know the shortcut. */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="group flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-dim transition hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Open command palette"
            aria-keyshortcuts={IS_MAC ? "Meta+K" : "Control+K"}
            title={`Command palette (${MOD_KEY} K)`}
          >
            <span aria-hidden="true" className="text-faint transition group-hover:text-accent/70">[</span>
            <kbd aria-hidden="true" className="font-mono">{MOD_KEY}</kbd>
            <kbd aria-hidden="true" className="font-mono">K</kbd>
            <span aria-hidden="true" className="text-faint transition group-hover:text-accent/70">]</span>
          </button>

          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-[11px] tracking-wide text-dim transition hover:text-accent sm:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "close" : "menu"}
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {open && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 z-30 flex flex-col items-start justify-center gap-6 bg-bg/[0.97] px-6 sm:hidden"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              data-nav-id={l.id}
              className="mobile-nav-link font-display text-3xl font-medium text-paper transition hover:text-accent"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-1 font-mono text-[10px] text-faint md:flex">
        <span>FOR INQUIRIES</span>
        <a href="mailto:tawsifk35@gmail.com" className="text-dim transition hover:text-accent">
          tawsifk35@gmail.com
        </a>
      </div>
    </>
  );
}
