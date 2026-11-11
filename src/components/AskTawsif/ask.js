// Lets any part of the page open the Ask Tawsif chat with a question already
// sent, e.g. the "Ask the AI about this" button on a project card.
// The widget listens for this event in AskTawsif.jsx.
export const ASK_EVENT = "ask-tawsif";

export function askTawsif(question) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { question } }));
}
