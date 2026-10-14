import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EMAIL = "tawsifk35@gmail.com";
const GITHUB = "https://github.com/tawsif-raza";
const LINKEDIN = "https://linkedin.com/in/tawsif-khan-34952336b";
// Drop the PDF at public/resume.pdf and set this to `${import.meta.env.BASE_URL}resume.pdf`.
// While it's null the "Download resume" command is simply not listed, so the
// palette never offers a link to a file that doesn't exist (see STATUS.md).
const RESUME_URL = null;

const SECTIONS = [
  { id: "hero", label: "Go to Home" },
  { id: "skills", label: "Go to Skills" },
  { id: "about", label: "Go to About" },
  { id: "projects", label: "Go to Projects" },
  { id: "services", label: "Go to Services" },
  { id: "contact", label: "Go to Contact" },
];

const GROUPS = ["Navigation", "Actions", "Social"];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  // Placeholder: nothing on the site plays audio yet. The toggle and its
  // label are wired so a future sound layer only has to read this value.
  const [soundOn, setSoundOn] = useState(false);

  const inputRef = useRef();
  const listRef = useRef();
  const lastFocusedRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const openPalette = () => {
    lastFocusedRef.current = document.activeElement;
    setQuery("");
    setSelected(0);
    setCopiedEmail(false);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    // Hand focus back to whatever opened the palette (e.g. the nav button)
    // instead of leaving it on an element that is about to unmount.
    if (lastFocusedRef.current instanceof HTMLElement) lastFocusedRef.current.focus();
  };

  // Kept in a ref so the window listeners below are attached once and still
  // see the current open state.
  const toggleRef = useRef();
  toggleRef.current = () => (open ? close() : openPalette());

  const actions = useMemo(() => {
    const go = (id) => () => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      close();
    };
    const external = (url) => () => {
      window.open(url, "_blank", "noopener,noreferrer");
      close();
    };

    // `label` is what's shown and can change (copy feedback, sound state);
    // `search` is what typing filters on and never changes, so a row can't
    // vanish from under the cursor the moment its label updates.
    const list = [
      ...SECTIONS.map((s) => ({ id: `nav-${s.id}`, group: "Navigation", label: s.label, search: s.label, hint: "↵", run: go(s.id) })),
      RESUME_URL && {
        id: "resume",
        group: "Actions",
        label: "Download resume",
        search: "Download resume CV",
        hint: "pdf",
        run: () => {
          const a = document.createElement("a");
          a.href = RESUME_URL;
          a.download = "Tawsif-Raza-Khan-Resume.pdf";
          a.click();
          close();
        },
      },
      {
        id: "copy-email",
        group: "Actions",
        label: copiedEmail ? `Copied ${EMAIL}` : "Copy email address",
        search: "Copy email address",
        hint: copiedEmail ? "✓" : "clipboard",
        run: async () => {
          try {
            await navigator.clipboard.writeText(EMAIL);
            setCopiedEmail(true);
          } catch {
            // Clipboard blocked or unavailable: a mailto still gets them there.
            window.location.href = `mailto:${EMAIL}`;
          }
        },
      },
      {
        id: "sound",
        group: "Actions",
        label: `Toggle sound (${soundOn ? "on" : "off"})`,
        search: "Toggle sound audio",
        hint: "soon",
        run: () => setSoundOn((v) => !v),
      },
      { id: "github", group: "Social", label: "Open GitHub", search: "Open GitHub", hint: "↗", run: external(GITHUB) },
      { id: "linkedin", group: "Social", label: "Open LinkedIn", search: "Open LinkedIn", hint: "↗", run: external(LINKEDIN) },
    ];
    return list.filter(Boolean);
    // close/openPalette only touch state setters and refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copiedEmail, soundOn, reduceMotion]);

  // Flat, filtered list in group order: arrow keys walk straight across
  // group boundaries, and `selected` is an index into this array.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = q ? actions.filter((a) => a.search.toLowerCase().includes(q)) : actions;
    return GROUPS.flatMap((g) => hits.filter((a) => a.group === g));
  }, [actions, query]);

  // Cmd+K (Mac) / Ctrl+K (Windows, Linux) toggles from anywhere on the page.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The nav's visible trigger dispatches this, so Nav needs no shared state.
  useEffect(() => {
    const onOpenEvent = () => toggleRef.current();
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => window.removeEventListener("open-command-palette", onOpenEvent);
  }, []);

  // Lock page scroll while open, so the wheel doesn't move the site behind it.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Keep the highlighted row in view as the arrows move past the fold.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected, open]);

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selected]?.run();
    } else if (e.key === "Tab") {
      // The input is the dialog's only focus stop; keep focus inside it.
      e.preventDefault();
    }
  }

  const listboxId = "command-palette-listbox";
  const active = filtered[selected];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmdk-backdrop"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            // without this the browser's own mousedown focus runs after
            // close() and drops focus on <body> instead of the trigger
            e.preventDefault();
            close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="shrink-0 text-faint">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                autoFocus
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-activedescendant={active ? `cmdk-${active.id}` : undefined}
                aria-autocomplete="list"
                aria-label="Search commands"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search..."
                className="w-full border-0 bg-transparent text-[15px] text-paper caret-accent outline-none placeholder:text-faint"
              />
              <kbd className="hidden shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
                esc
              </kbd>
            </div>

            <ul id={listboxId} role="listbox" aria-label="Commands" ref={listRef} className="max-h-[min(60vh,360px)] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <li role="presentation" className="px-4 py-6 text-center font-mono text-xs text-faint">
                  No results for “{query}”
                </li>
              )}
              {filtered.map((a, i) => (
                <GroupedOption
                  key={a.id}
                  action={a}
                  index={i}
                  heading={i === 0 || filtered[i - 1].group !== a.group ? a.group : null}
                  selected={i === selected}
                  onHover={() => setSelected(i)}
                />
              ))}
            </ul>

            <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 font-mono text-[10px] text-faint">
              <span><kbd className="text-dim">↑↓</kbd> navigate</span>
              <span><kbd className="text-dim">↵</kbd> select</span>
              <span><kbd className="text-dim">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GroupedOption({ action, index, heading, selected, onHover }) {
  return (
    <>
      {heading && (
        <li role="presentation" className="px-4 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint first:pt-1">
          {heading}
        </li>
      )}
      <li
        id={`cmdk-${action.id}`}
        role="option"
        aria-selected={selected}
        data-index={index}
        onMouseMove={onHover}
        onMouseDown={(e) => {
          // keep focus in the input so the arrows keep working afterwards
          e.preventDefault();
          action.run();
        }}
        className={`mx-2 flex cursor-pointer items-center justify-between rounded-md border-l-2 px-3 py-2.5 text-[14px] transition-colors duration-100 ${
          selected ? "border-accent bg-white/[0.07] text-paper" : "border-transparent text-dim"
        }`}
      >
        <span>{action.label}</span>
        <span className={`font-mono text-[10px] ${selected ? "text-accent" : "text-faint"}`}>{action.hint}</span>
      </li>
    </>
  );
}
