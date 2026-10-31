import { ASK_TAWSIF_API, STREAM_IDLE_MS } from "./config";

// Talking to the Ask Tawsif server. The request body is ONLY {message, session_id}: the server keeps the
// conversation itself and rejects a client-sent history (422), so nobody can feed it a fake one.

export class RateLimitedError extends Error {
  constructor(message, retryAfter, contact) {
    super(message);
    this.retryAfter = retryAfter;
    this.contact = contact;
  }
}

export class ChatFailedError extends Error {}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Seconds to wait: the Retry-After header (the server exposes it to the browser), else the body's own number.
function retryAfterSeconds(response, body) {
  const header = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
  if (header > 0) return header;
  const fromBody = Math.ceil(Number(body?.retry_after_seconds));
  return fromBody > 0 ? fromBody : 60;
}

function rateLimited(response, body) {
  return new RateLimitedError(
    typeof body?.message === "string" ? body.message : "You've sent a lot of messages. Please wait a few minutes.",
    retryAfterSeconds(response, body),
    body?.contact,
  );
}

// Fire and forget: a sleeping free server starts waking while the visitor is still typing.
export function wakeServer() {
  fetch(`${ASK_TAWSIF_API}/health`, { cache: "no-store" }).catch(() => {});
}

/**
 * POST /chat and hand each Server-Sent Event ({type, ...}) to onEvent as it arrives. EventSource can't POST,
 * so the stream is read by hand: events are "data: <json>" blocks separated by a blank line.
 * Throws RateLimitedError on a 429 and ChatFailedError on anything else that isn't a stream.
 */
export async function streamChat({ message, sessionId, onEvent, signal }) {
  const controller = new AbortController();
  signal?.addEventListener("abort", () => controller.abort());
  let idle;
  const stillAlive = () => {
    clearTimeout(idle);
    idle = setTimeout(() => controller.abort(), STREAM_IDLE_MS);
  };

  stillAlive();
  try {
    const response = await fetch(`${ASK_TAWSIF_API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionId ? { message, session_id: sessionId } : { message }),
      signal: controller.signal,
    });
    if (response.status === 429) throw rateLimited(response, await readJson(response));
    if (!response.ok || !response.body) throw new ChatFailedError(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      stillAlive();
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");
      let end;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = block
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^ /, ""))
          .join("\n");
        if (!data) continue;
        let event;
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }
        if (event && typeof event.type === "string") onEvent(event);
      }
    }
  } catch (error) {
    if (error instanceof RateLimitedError || error instanceof ChatFailedError) throw error;
    throw new ChatFailedError(error?.name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(idle);
  }
}

/**
 * The visitor's Send / Cancel click on a drafted message: POST /lead/confirm. This is the ONLY way a message
 * reaches Tawsif. Resolves to {ok, status, message, contact, retryAfter}; never throws.
 */
export async function confirmLead({ sessionId, draftId, action }) {
  try {
    const response = await fetch(`${ASK_TAWSIF_API}/lead/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, draft_id: draftId, action }),
    });
    const body = await readJson(response);
    if (response.status === 429) {
      const limited = rateLimited(response, body);
      return { ok: false, status: "limited", message: limited.message, contact: limited.contact, retryAfter: limited.retryAfter };
    }
    return {
      ok: Boolean(body?.ok),
      status: body?.status ?? "error",
      message: typeof body?.message === "string" ? body.message : "Sorry, that didn't work. You can reach Tawsif directly:",
      contact: body?.contact,
    };
  } catch {
    return { ok: false, status: "error", message: "Sorry, the message couldn't be sent just now. You can reach Tawsif directly:" };
  }
}
