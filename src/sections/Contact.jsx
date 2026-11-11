import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealText from "../components/RevealText";
import Magnetic from "../components/Magnetic";
import SectionLabel from "../components/SectionLabel";
import { sectionNo } from "../data/experience";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const rootRef = useRef();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Classic entrance: header fades up, then each field rises in turn,
      // then the contact cards slide in from the right one by one.
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
      });
      tl.from(".contact-reveal", { opacity: 0, y: 24, duration: 0.7, stagger: 0.1 })
        .from(".field, .contact-submit", { opacity: 0, y: 26, duration: 0.6, stagger: 0.1 }, "-=0.3")
        .from(".c-card", { opacity: 0, x: 40, duration: 0.6, stagger: 0.12 }, "<0.1");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    try {
      const response = await fetch("https://formspree.io/f/xvgozzwn", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      // fetch only rejects on network-level failure — a rejected
      // submission (4xx/5xx) still resolves, so this must be checked
      // explicitly or a failed send gets shown as "Message sent!".
      if (!response.ok) throw new Error(`Formspree responded with ${response.status}`);
      // A paper plane flies off from the button, then the confirmation shows.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setSubmitted(true);
      } else {
        setLaunching(true);
        setTimeout(() => setSubmitted(true), 1250);
      }
    } catch {
      // Surface the failure instead of silently redirecting to mailto —
      // offer it as a visible, explicit action instead.
      setError({
        mailto: `mailto:tawsifk35@gmail.com?subject=${encodeURIComponent(`Portfolio inquiry from ${name}`)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${email}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      ref={rootRef}
      id="contact"
      className="reading-scrim reading-scrim--center relative mx-auto max-w-6xl overflow-hidden px-6 py-32 md:px-12"
    >
      <SectionLabel number={sectionNo(8)} title="CONTACT" />

      <p className="contact-reveal mb-6 font-mono text-xs text-faint">
        Currently in Bengaluru, working with people anywhere.
      </p>

      <RevealText
        text="Building something worth talking about? Let's talk."
        className="contact-reveal mb-10 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-5xl"
      />

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Contact Form */}
        <div>
          {submitted ? (
            <div className="glass-card sent-card flex flex-col items-center justify-center p-10 text-center" role="status">
              <svg className="sent-check" viewBox="0 0 52 52" width="56" height="56" aria-hidden="true">
                <circle className="sent-check__ring" cx="26" cy="26" r="24" fill="none" />
                <path className="sent-check__tick" fill="none" d="M15 27l7 7 15-16" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-paper">Message sent</h3>
              <p className="mt-2 text-[14px] text-dim">I'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={launching ? "is-launching" : ""}>
              <div className="field">
                <input id="cf-name" type="text" name="name" required placeholder=" " className="field__input" autoComplete="name" />
                <label htmlFor="cf-name" className="field__label">Your name</label>
                <span className="field__line" aria-hidden="true" />
              </div>
              <div className="field">
                <input id="cf-email" type="email" name="email" required placeholder=" " className="field__input" autoComplete="email" />
                <label htmlFor="cf-email" className="field__label">Your email</label>
                <span className="field__line" aria-hidden="true" />
              </div>
              <div className="field">
                <textarea id="cf-message" name="message" required placeholder=" " className="field__input" rows="5" />
                <label htmlFor="cf-message" className="field__label">Tell me about your project</label>
                <span className="field__line" aria-hidden="true" />
              </div>
              {error && (
                <p className="form-error mb-4 text-[13px] leading-relaxed text-[#ff7a6b]" role="alert">
                  Something went wrong sending that — nothing went through. You can try
                  again, or{" "}
                  <a href={error.mailto} className="underline hover:text-accent">
                    email me directly
                  </a>
                  .
                </p>
              )}
              <div className="contact-submit relative">
                {launching && (
                  <span className="plane" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="30" height="30">
                      <path d="M22 2 11 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 2 15 22l-4-9-9-4 20-7Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <Magnetic>
                  <button
                    type="submit"
                    disabled={sending || launching}
                    aria-busy={sending}
                    className="btn-pill btn-pill--primary send-btn disabled:opacity-70"
                  >
                    {launching ? (
                      "Sent"
                    ) : sending ? (
                      <>
                        <span className="send-dots" aria-hidden="true"><i /><i /><i /></span>
                        Sending
                      </>
                    ) : (
                      <>
                        Send message
                        <svg className="send-btn__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          )}
        </div>

        {/* Contact cards */}
        <div className="flex flex-col gap-4">
          <Magnetic>
            <a
              href="mailto:tawsifk35@gmail.com"
              className="glass-card c-card flex items-center gap-4 p-5"
            >
              <svg className="c-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c6f432" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13 2 4" />
              </svg>
              <div>
                <div className="font-mono text-[11px] text-faint">Email</div>
                <div className="text-[14px] text-paper">tawsifk35@gmail.com</div>
              </div>
              <svg className="c-card__arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Magnetic>

          <Magnetic>
            <a
              href="https://github.com/tawsif-raza"
              target="_blank"
              rel="noreferrer"
              className="glass-card c-card flex items-center gap-4 p-5"
            >
              <svg className="c-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="#c6f432">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <div>
                <div className="font-mono text-[11px] text-faint">GitHub</div>
                <div className="text-[14px] text-paper">tawsif-raza</div>
              </div>
              <svg className="c-card__arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Magnetic>

          <Magnetic>
            <a
              href="https://www.linkedin.com/in/tawsif-raza-khan/"
              target="_blank"
              rel="noreferrer"
              className="glass-card c-card flex items-center gap-4 p-5"
            >
              <svg className="c-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="#c6f432">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <div>
                <div className="font-mono text-[11px] text-faint">LinkedIn</div>
                <div className="text-[14px] text-paper">Tawsif Raza Khan</div>
              </div>
              <svg className="c-card__arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
