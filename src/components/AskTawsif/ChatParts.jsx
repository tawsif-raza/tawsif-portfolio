import { Globe, Mail, CalendarDays, ArrowUpRight } from "lucide-react";
import { safeHttpsUrl } from "./links";
import { ExternalLink } from "./SafeMarkdown";

// The structured parts of a bot reply. Every link and address here comes from the event's own fields,
// never from the reply text.

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const STATUS_CLASS = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("live") || s.includes("complete") || s.includes("shipped")) return "status-badge--live";
  if (s.includes("progress") || s.includes("building")) return "status-badge--progress";
  return "status-badge--planning";
};

export function ProjectCard({ card }) {
  const github = safeHttpsUrl(card.github);
  const live = safeHttpsUrl(card.live);
  const stack = Array.isArray(card.stack) ? card.stack.filter((item) => typeof item === "string") : [];
  return (
    <article className="ask-card" aria-label={`Project: ${card.title}`}>
      <div className="ask-card__top">
        <h4 className="ask-card__title">{card.title}</h4>
        {card.status && (
          <span className={`status-badge ${STATUS_CLASS(card.status)}`}>
            <span className="status-dot" aria-hidden="true" />
            {card.status}
          </span>
        )}
      </div>
      {card.summary && <p className="ask-card__summary">{card.summary}</p>}
      {stack.length > 0 && (
        <ul className="ask-card__stack" aria-label="Tech stack">
          {stack.map((item) => <li key={item} className="tech-pill">{item}</li>)}
        </ul>
      )}
      {(github || live) && (
        <div className="ask-actions">
          {github && (
            <ExternalLink href={github} className="ask-btn ask-btn--ghost">
              <GithubIcon /> GitHub
            </ExternalLink>
          )}
          {live && (
            <ExternalLink href={live} className="ask-btn ask-btn--primary">
              Live demo <ArrowUpRight size={15} aria-hidden="true" />
            </ExternalLink>
          )}
        </div>
      )}
    </article>
  );
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[A-Za-z]{2,}$/;

const CONTACT_LINKS = [
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
  { key: "github", label: "GitHub", Icon: GithubIcon },
  { key: "portfolio", label: "Portfolio", Icon: () => <Globe size={15} aria-hidden="true" /> },
  { key: "booking_link", label: "Book a call", Icon: () => <CalendarDays size={15} aria-hidden="true" /> },
];

export function ContactButtons({ contact }) {
  if (!contact || typeof contact !== "object") return null;
  const email = typeof contact.email === "string" && EMAIL.test(contact.email.trim()) ? contact.email.trim() : null;
  const links = CONTACT_LINKS.map((item) => ({ ...item, href: safeHttpsUrl(contact[item.key]) })).filter((item) => item.href);
  if (!email && !links.length) return null;
  return (
    <div className="ask-actions" role="group" aria-label="Contact Tawsif">
      {email && (
        <a href={`mailto:${email}`} className="ask-btn ask-btn--ghost" aria-label={`Email Tawsif at ${email}`}>
          <Mail size={15} aria-hidden="true" /> Email
        </a>
      )}
      {links.map(({ key, label, Icon, href }) => (
        <ExternalLink key={key} href={href} className="ask-btn ask-btn--ghost">
          <Icon /> {label}
        </ExternalLink>
      ))}
    </div>
  );
}

// The drafted message (POST /lead/confirm sends it). state: pending | sending | done
const DRAFT_LABEL = { pending: "Message draft, not sent yet", sent: "Message sent", duplicate: "Already sent", cancelled: "Message cancelled" };

export function DraftConfirm({ draft, onAction }) {
  const busy = draft.state === "sending";
  return (
    <div className="ask-draft" role="group" aria-label="Your message to Tawsif">
      <p className="ask-draft__label">{DRAFT_LABEL[draft.state === "done" ? draft.result.status : "pending"] ?? "Message not sent"}</p>
      <dl className="ask-draft__fields">
        <dt>Name</dt>
        <dd>{draft.name}</dd>
        <dt>Email</dt>
        <dd>{draft.email}</dd>
        <dt>Message</dt>
        <dd className="ask-draft__message">{draft.message}</dd>
      </dl>
      {draft.note && <p className="ask-draft__result" role="status">{draft.note}</p>}
      {draft.state === "done" ? (
        <p className="ask-draft__result" role="status">{draft.result.message}</p>
      ) : (
        <div className="ask-actions">
          <button type="button" className="ask-btn ask-btn--primary" disabled={busy} onClick={() => onAction("send")}>
            {busy && draft.action === "send" ? "Sending..." : "Send to Tawsif"}
          </button>
          <button type="button" className="ask-btn ask-btn--ghost" disabled={busy} onClick={() => onAction("cancel")}>
            Cancel
          </button>
        </div>
      )}
      {draft.state === "done" && <ContactButtons contact={draft.result.contact} />}
    </div>
  );
}
