/**
 * Tiny id generator. Prefers the platform's crypto.randomUUID when present
 * (browsers, modern Node), with a deterministic-friendly fallback.
 */
export function createId(prefix = ""): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } })
    .crypto;
  const uuid =
    typeof cryptoObj?.randomUUID === "function"
      ? cryptoObj.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}
