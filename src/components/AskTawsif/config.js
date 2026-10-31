// Ask Tawsif: the portfolio's chat assistant (backend: the portfolio-agent repo, hosted on Render).
//
// The widget's ONE backend setting. The browser never holds a key: the server has them all, and it
// limits each visitor itself (429 + Retry-After).
export const ASK_TAWSIF_API = "https://ask-tawsif.onrender.com";

// What the server accepts (portfolio-agent app/main.py ChatRequest): longer messages get a 422.
export const MAX_MESSAGE_CHARS = 1000;

// The free server sleeps after 15 idle minutes and takes up to a minute to wake.
export const WAKE_NOTICE_MS = 4000;
// No new bytes on the stream for this long -> give up (a sleeping server answers well within it).
export const STREAM_IDLE_MS = 90000;

export const EXAMPLE_QUESTIONS = [
  "Which projects use LangGraph?",
  "Show me the Highland Estate",
  "I'd like to leave a message for Tawsif",
];

// Only for a reply that never reached the server (offline, timeout), so it carried no contact data of its own.
// Same keys and values as the server's config/contact.json.
export const FALLBACK_CONTACT = {
  email: "tawsifk35@gmail.com",
  linkedin: "https://www.linkedin.com/in/tawsif-raza-khan/",
  github: "https://github.com/tawsif-raza",
  portfolio: "https://main.dahjkchabvbri.amplifyapp.com/",
};
