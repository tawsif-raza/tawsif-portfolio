import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { ChatFailedError, RateLimitedError, confirmLead, streamChat, wakeServer } from "./api";
import { EXAMPLE_QUESTIONS, FALLBACK_CONTACT, MAX_MESSAGE_CHARS, WAKE_NOTICE_MS } from "./config";
import { ContactButtons, DraftConfirm, ProjectCard } from "./ChatParts";
import SafeMarkdown from "./SafeMarkdown";

// Ask Tawsif: a floating chat button (bottom-right) and a chat panel (full screen on phones).
// The conversation lives on the server, keyed by the session_id from the first reply; this component keeps
// only that id and what's on screen, in memory, for this visit.

const WAKING = "Waking up the assistant, this can take up to a minute on the free server...";
const NO_ANSWER = "Sorry, no answer came back. Please try again.";
const UNREACHABLE = "Sorry, I couldn't reach the assistant just now. Please try again in a moment, or reach Tawsif directly:";
const TOO_SLOW = "The assistant took too long to answer. Please try again in a moment, or reach Tawsif directly:";
const WAKE_PING_EVERY_MS = 60000;
const PHONE = "(max-width: 640px)";                // keep in sync with the @media rule in index.css
const FOCUSABLE = "button:not([disabled]), a[href], textarea:not([disabled])";

function formatWait(seconds) {
  if (seconds >= 3600) return `about ${Math.ceil(seconds / 3600)} h`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} min`;
  return `${seconds} s`;
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" />
      <path d="M19 15.5c.25 1.9 1.1 2.75 3 3-1.9.25-2.75 1.1-3 3-.25-1.9-1.1-2.75-3-3 1.9-.25 2.75-1.1 3-3Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function BotMessage({ message, onDraftAction }) {
  const { text, status, waking, streaming, error, limited, cards, draft, contact, ms } = message;
  return (
    <li className="ask-msg ask-msg--bot">
      <div className="ask-bubble">
        {waking && <p className="ask-wake">{WAKING}</p>}
        {streaming && !text && !status && !waking && (
          <span className="ask-typing" aria-label="Thinking">
            <span /><span /><span />
          </span>
        )}
        {text && <div className="ask-md"><SafeMarkdown text={text} /></div>}
        {status && (
          <p className="ask-status">
            <span className="ask-status__dot" aria-hidden="true" />
            {status}
          </p>
        )}
        {limited && <p>{limited.message} You can send again in {formatWait(limited.seconds)}.</p>}
        {error && <p className="ask-error">{error}</p>}
      </div>
      {cards.map((card, n) => <ProjectCard key={`${card.slug ?? card.title}-${n}`} card={card} />)}
      {draft && <DraftConfirm draft={draft} onAction={(action) => onDraftAction(message.id, action)} />}
      {contact && <ContactButtons contact={contact} />}
      {ms > 0 && !streaming && <p className="ask-meta">answered in {(ms / 1000).toFixed(1)} s</p>}
    </li>
  );
}

export default function AskTawsif() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [fullScreen, setFullScreen] = useState(() => window.matchMedia(PHONE).matches);

  const sessionRef = useRef(null);
  const lastIdRef = useRef(0);                     // message ids; a ref, so they never repeat within a visit
  const newId = () => `ask-${++lastIdRef.current}`;
  const lastWakeRef = useRef(0);
  const launcherRef = useRef();
  const panelRef = useRef();
  const inputRef = useRef();
  const logRef = useRef();
  const stickToBottomRef = useRef(true);
  const autoScrollTopRef = useRef(0);
  const panelId = useId();
  const titleId = useId();
  const hintId = useId();

  const waitLeft = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  const blocked = waitLeft > 0;

  const patch = useCallback((id, change) => {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...(typeof change === "function" ? change(m) : change) } : m)));
  }, []);

  const openPanel = () => {
    setOpen(true);
    if (Date.now() - lastWakeRef.current > WAKE_PING_EVERY_MS) {
      lastWakeRef.current = Date.now();
      wakeServer();
    }
  };

  const returnFocusRef = useRef(false);
  const closePanel = () => {
    returnFocusRef.current = true;
    setOpen(false);
  };

  // Typing on a phone pops the keyboard over half the screen, so only a fine pointer gets the textarea focused.
  // On close, focus goes back to the launcher once it's shown again (on phones it's hidden while the panel is open).
  useEffect(() => {
    if (!open) {
      if (returnFocusRef.current) launcherRef.current?.focus();
      returnFocusRef.current = false;
      return;
    }
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
    else panelRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Esc closes from anywhere, not only from inside the panel: a chip that was clicked is disabled while the
  // answer loads, and focus falls back to <body>. A key the command palette already handled is left alone.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      returnFocusRef.current = true;                 // = closePanel(), from stable values only
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const onChange = () => setFullScreen(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Full screen on phones: the page behind mustn't scroll.
  useEffect(() => {
    if (!open || !fullScreen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open, fullScreen]);

  // Full screen, the panel is modal: Tab and Shift+Tab go round inside it, never into the hidden page.
  const onPanelKeyDown = (e) => {
    if (e.key !== "Tab" || !fullScreen) return;
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Rate limited: tick once a second until sending is allowed again.
  useEffect(() => {
    if (!blockedUntil) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= blockedUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [blockedUntil]);

  // Follow new text, unless the visitor scrolled up to read.
  useEffect(() => {
    const log = logRef.current;
    if (log && stickToBottomRef.current) {
      log.scrollTop = log.scrollHeight;
      autoScrollTopRef.current = log.scrollTop;
    }
  }, [messages, open]);

  // The textarea grows with its text, up to about five lines.
  useEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 132)}px`;
  }, [input, open]);

  function handleEvent(id, event) {
    switch (event.type) {
      case "route":
        if (!sessionRef.current && typeof event.session_id === "string") sessionRef.current = event.session_id;
        break;
      case "status":
        patch(id, { status: String(event.text || "Working on it...") });
        break;
      case "token":
        patch(id, (m) => ({ text: m.text + String(event.text ?? ""), status: null }));
        break;
      case "replace":
        patch(id, { text: String(event.text ?? ""), status: null });
        break;
      case "card":
        patch(id, (m) => ({ cards: [...m.cards, event] }));
        break;
      case "contact":
        patch(id, { contact: event });
        break;
      case "confirm":
        if (typeof event.draft_id === "string") {
          patch(id, {
            draft: { draftId: event.draft_id, name: String(event.name ?? ""), email: String(event.email ?? ""),
                     message: String(event.message ?? ""), state: "pending" },
          });
        }
        break;
      case "error":
        patch(id, { error: String(event.text || NO_ANSWER), contact: event.contact ?? FALLBACK_CONTACT, status: null });
        break;
      case "done":
        patch(id, { done: true, status: null });
        break;
      default:
        break;                                     // an event type this widget doesn't know yet: ignore it
    }
  }

  async function send(raw) {
    const message = raw.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!message || busy || blocked) return;
    const botId = newId();
    setInput("");
    setMessages((list) => [
      ...list,
      { id: newId(), role: "user", text: message },
      { id: botId, role: "bot", text: "", status: null, waking: false, streaming: true, error: null, limited: null,
        cards: [], draft: null, contact: null, done: false, ms: 0 },
    ]);
    stickToBottomRef.current = true;
    setBusy(true);

    // "answered in" is what the visitor waited (wake-up included), not the server's own time (done.ms)
    const sentAt = performance.now();
    let started = false;
    const wakeNotice = setTimeout(() => {
      if (!started) patch(botId, { waking: true });
    }, WAKE_NOTICE_MS);
    try {
      await streamChat({
        message,
        sessionId: sessionRef.current,
        onEvent: (event) => {
          if (!started) {
            started = true;
            clearTimeout(wakeNotice);
            patch(botId, { waking: false });
          }
          handleEvent(botId, event);
        },
      });
    } catch (error) {
      if (error instanceof RateLimitedError) {
        setBlockedUntil(Date.now() + error.retryAfter * 1000);
        setNow(Date.now());
        patch(botId, { limited: { message: error.message, seconds: error.retryAfter }, contact: error.contact ?? null });
      } else {
        const timedOut = error instanceof ChatFailedError && error.message === "timeout";
        patch(botId, { error: timedOut ? TOO_SLOW : UNREACHABLE, contact: FALLBACK_CONTACT });
      }
    } finally {
      clearTimeout(wakeNotice);
      const waited = performance.now() - sentAt;
      patch(botId, (m) => ({
        ms: m.done && !m.error ? waited : 0,
        streaming: false,
        waking: false,
        status: null,
        error: m.error ?? (!m.text && !m.limited && !m.cards.length && !m.contact && !m.draft ? NO_ANSWER : null),
      }));
      setBusy(false);
    }
  }

  async function onDraftAction(botId, action) {
    const draft = messages.find((m) => m.id === botId)?.draft;
    if (!draft || !sessionRef.current || draft.state !== "pending") return;
    patch(botId, (m) => ({ draft: { ...m.draft, state: "sending", action, note: null } }));
    const result = await confirmLead({ sessionId: sessionRef.current, draftId: draft.draftId, action });
    if (result.status === "limited") {
      // Not sent, and the draft is still on the server: the buttons stay for a later try.
      const note = `${result.message} Try again in ${formatWait(result.retryAfter ?? 60)}.`;
      patch(botId, (m) => ({ draft: { ...m.draft, state: "pending", note } }));
    } else {
      patch(botId, (m) => ({ draft: { ...m.draft, state: "done", result } }));
    }
  }

  const onInputKeyDown = (e) => {
    // Enter sends, Shift+Enter is a new line; never while an input method (e.g. Hindi typing) is composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const hint = blocked
    ? `Message limit reached. You can send again in ${formatWait(waitLeft)}.`
    : busy
      ? "Answering..."
      : "Enter to send · Shift+Enter for a new line";

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className="ask-launcher"
        data-open={open}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close the Ask Tawsif chat" : "Open the Ask Tawsif chat"}
        onClick={() => (open ? closePanel() : openPanel())}
      >
        {open ? <X size={18} aria-hidden="true" /> : <Sparkle />}
        <span className="ask-launcher__label" aria-hidden="true">Ask Tawsif</span>
      </button>

      {open && (
        <section
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal={fullScreen || undefined}
          aria-labelledby={titleId}
          tabIndex={-1}
          className="ask-panel"
          onKeyDown={onPanelKeyDown}
        >
          <header className="ask-head">
            <div className="ask-head__id">
              <span className="ask-avatar" aria-hidden="true"><Sparkle /></span>
              <div>
                <h2 id={titleId} className="ask-head__title">Ask Tawsif</h2>
                <p className="ask-head__sub">AI assistant · answers from his portfolio</p>
              </div>
            </div>
            <button type="button" className="ask-icon-btn" aria-label="Close chat" onClick={closePanel}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <ol
            ref={logRef}
            className="ask-log"
            role="log"
            aria-live="polite"
            aria-busy={busy}
            aria-label="Conversation"
            onScroll={(e) => {
              // Only the visitor scrolling UP unsticks: while text streams in, the scroll event can arrive after
              // more text was added, so "not at the bottom" alone doesn't mean they scrolled away.
              const log = e.currentTarget;
              if (log.scrollHeight - log.scrollTop - log.clientHeight < 48) stickToBottomRef.current = true;
              else if (log.scrollTop < autoScrollTopRef.current - 8) stickToBottomRef.current = false;
            }}
          >
            <li className="ask-msg ask-msg--bot">
              <div className="ask-bubble">
                <p>Hi! I'm Tawsif's AI assistant. Ask me about his projects, skills and experience, or leave him a message.</p>
              </div>
              <div className="ask-chips" role="group" aria-label="Example questions">
                {EXAMPLE_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="ask-chip"
                    disabled={busy || blocked}
                    onClick={() => {
                      send(question);
                      if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </li>
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="ask-msg ask-msg--user">
                  <span className="sr-only">You said: </span>
                  <div className="ask-bubble">{m.text}</div>
                </li>
              ) : (
                <BotMessage key={m.id} message={m} onDraftAction={onDraftAction} />
              ),
            )}
          </ol>

          <form
            className="ask-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">Your question for Tawsif's assistant</label>
            <textarea
              ref={inputRef}
              id={`${panelId}-input`}
              rows={1}
              value={input}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={blocked ? "Please wait a moment..." : "Ask about Tawsif's work..."}
              aria-describedby={hintId}
              className="ask-input"
            />
            <button type="submit" className="ask-send" disabled={!input.trim() || busy || blocked} aria-label="Send message">
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          </form>
          <p id={hintId} className="ask-hint">
            <span>{hint}</span>
            {input.length > MAX_MESSAGE_CHARS * 0.8 && <span>{input.length}/{MAX_MESSAGE_CHARS}</span>}
          </p>
        </section>
      )}
    </>
  );
}
