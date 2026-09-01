/**
 * Asking the browser not to throw your record away.
 *
 * Everything lives in this browser's storage, which browsers treat as
 * discardable by default — evictable when space runs low, and on Safari capped
 * at seven days without interaction for a site that has not been installed to
 * the home screen. For a log of how you felt, "the browser tidied it up" is the
 * worst possible failure, so we ask for the durable tier and then tell the user
 * plainly what the answer was.
 *
 * Support is uneven and the request can be refused, so this is insurance, not a
 * guarantee. The export file remains the only real backup.
 */

export type Durability = "persisted" | "best-effort" | "unknown";

export async function requestPersistentStorage(): Promise<Durability> {
  try {
    if (!navigator.storage?.persist) return "unknown";
    // Already granted? Asking again is harmless but pointless.
    if (await navigator.storage.persisted?.()) return "persisted";
    return (await navigator.storage.persist()) ? "persisted" : "best-effort";
  } catch {
    return "unknown";
  }
}

export async function storageDurability(): Promise<Durability> {
  try {
    if (!navigator.storage?.persisted) return "unknown";
    return (await navigator.storage.persisted()) ? "persisted" : "best-effort";
  } catch {
    return "unknown";
  }
}
