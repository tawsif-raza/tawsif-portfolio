// The one check every link in the chat goes through: only https:// survives (no javascript:, data:, http:).
export function safeHttpsUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
