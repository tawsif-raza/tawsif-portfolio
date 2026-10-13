import { useEffect, useMemo, useRef, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "Go to top" },
  { id: "about", label: "Go to About" },
  { id: "projects", label: "Go to Work" },
  { id: "skills", label: "Go to Skills" },
  { id: "services", label: "Go to Services" },
  { id: "contact", label: "Go to Contact" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const inputRef = useRef();
  const listRef = useRef();
  const lastFocusedRef = useRef(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const actions = useMemo(() => {
    // `label` is what's shown (and can change, e.g. copy-success feedback);
    // `searchLabel` is what typed filtering matches against and never
    // changes. Filtering on the dynamic label was the bug: the moment
    // "Copy email address" became "Copied ...", it stopped matching
    // whatever the user had already typed and the row vanished right as
    // it was supposed to show success -- confirmed via a real headless
    // run (label was found via clipboard content check but the option
    // itself had disappeared from the filtered list).
    const nav = SECTIONS.map((s) => ({
      id: `nav-${s.id}`,
      label: s.label,
      searchLabel: s.label,
      hint: "section",
      run: () => {
        document.getElementById(s.id)?.scrollIntoView({
          behavior: reduceMotionRef.current ? "auto" : "smooth",
        });
        close();
      },
    }));

    return [
      ...nav,
      {
        id: "copy-email",
        label: copiedEmail ? "Copied tawsifk35@gmail.com" : "Copy email address",
        searchLabel: "Copy email address",
        hint: "clipboard",
        run: async () => {
          try {
            await navigator.clipboard.writeText("tawsifk35@gmail.com");
            setCopiedEmail(true);
          } catch {
            // Clipboard permission denied or unavailable -- fall back to a
            // mailto so the action still does something useful.
            window.location.href = "mailto:tawsifk35@gmail.com";
          }
        },
      },
      {
        id: "mailto",
        label: "Send an email",
        searchLabel: "Send an email",
        hint: "mailto",
        run: () => {
          window.location.href = "mailto:tawsifk35@gmail.com";
          close();
        },
      },
      {
        id: "github",
        label: "Open GitHub",
        searchLabel: "Open GitHub",
        hint: "↗",
        run: () => {
          window.open("https://github.com/tawsif-raza", "_blank", "noopener,noreferrer");
          close();
        },
      },
      {
        id: "linkedin",
        label: "Open LinkedIn",
        searchLabel: "Open LinkedIn",
        hint: "↗",
        run: () => {
          window.open("https://linkedin.com/in/tawsif-khan-34952336b", "_blank", "noopener,noreferrer");
          close();
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ];
  }, [copiedEmail]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.searchLabel.toLowerCase().includes(q));
  }, [actions, query]);

  function openPalette() {
    lastFocusedRef.current = document.activeElement;
    setQuery("");
    setSelected(0);
    setCopiedEmail(false);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    // Return focus to whatever triggered the palette (the visible trigger
    // button, or nothing if opened purely via keyboard) rather than
    // leaving focus stranded on a now-unmounted element.
    if (lastFocusedRef.current instanceof HTMLElement) {
      lastFocusedRef.current.focus();
    }
  }

  // Global Cmd/Ctrl+K opens the palette from anywhere on the page.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The visible trigger button (rendered in Nav) dispatches this instead of
  // requiring prop-drilling into Nav's own state -- keeps Nav's already
  // -verified scroll-spy/menu logic completely untouched.
  useEffect(() => {
    const onOpenEvent = () => openPalette();
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => window.removeEventListener("open-command-palette", onOpenEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Keep the selected row scrolled into view as arrow keys move past the
  // visible list -- otherwise selection silently moves off-screen.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children?.[selected];
    el?.scrollIntoView({ block: "nearest" });
  }, [selected, open]);

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selected]?.run();
    }
  }

  if (!open) return null;

  const listboxId = "command-palette-listbox";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#0a0a0a]/70 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-md border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="font-mono text-xs text-faint" aria-hidden="true">
            ⌘K
          </span>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={filtered[selected] ? `cmdk-${filtered[selected].id}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section, or copy contact info..."
            className="w-full bg-transparent font-mono text-sm text-paper placeholder:text-faint focus:outline-none"
          />
          <span className="hidden font-mono text-[10px] text-faint sm:block" aria-hidden="true">
            esc
          </span>
        </div>

        <ul id={listboxId} role="listbox" ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-3 font-mono text-xs text-faint">No matches.</li>
          )}
          {filtered.map((a, i) => (
            <li
              key={a.id}
              id={`cmdk-${a.id}`}
              role="option"
              aria-selected={i === selected}
              onMouseEnter={() => setSelected(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                a.run();
              }}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 font-mono text-[13px] transition-colors ${
                i === selected ? "bg-accent-dim/20 text-accent" : "text-dim"
              }`}
            >
              <span>{a.label}</span>
              <span className="text-[10px] text-faint">{a.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
