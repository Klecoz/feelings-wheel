/**
 * The only thing in the app that touches persistent storage.
 *
 * localStorage rather than IndexedDB on purpose: an entry is about 200 bytes,
 * so years of daily use stays well under a megabyte, and synchronous reads keep
 * every screen trivial. Everything funnels through here so swapping the backing
 * store later is a one-file change.
 *
 * Nothing is ever sent anywhere. There is no server to send it to.
 */

export const STORAGE_KEY = "feelings-wheel/v1";
export const SCHEMA_VERSION = 1;

export interface Entry {
  id: string;
  /** When you felt it. Defaults to now, but you can back-date it. */
  at: string;
  emotionIds: string[];
  tags: string[];
  /** When the entry was actually written. Never edited. */
  createdAt: string;
}

export interface Store {
  version: number;
  entries: Entry[];
  /** Local dates ("YYYY-MM-DD") you marked as a therapy session. */
  sessions: string[];
}

export const emptyStore = (): Store => ({
  version: SCHEMA_VERSION,
  entries: [],
  sessions: [],
});

const isString = (v: unknown): v is string => typeof v === "string";

/**
 * Anything that is not a well-formed entry is dropped rather than trusted.
 * A half-written record is worse than a missing one when the whole point is
 * being able to believe your own history.
 */
export function parseStore(raw: unknown): Store {
  if (!raw || typeof raw !== "object") return emptyStore();
  const candidate = raw as Partial<Store>;

  const entries = Array.isArray(candidate.entries)
    ? candidate.entries.filter(isEntry)
    : [];
  const sessions = Array.isArray(candidate.sessions)
    ? candidate.sessions.filter(isIsoDate)
    : [];

  return {
    version: SCHEMA_VERSION,
    entries,
    sessions: [...new Set(sessions)].sort(),
  };
}

export function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<Entry>;
  return (
    isString(e.id) &&
    e.id.length > 0 &&
    isString(e.at) &&
    !Number.isNaN(Date.parse(e.at)) &&
    Array.isArray(e.emotionIds) &&
    e.emotionIds.length > 0 &&
    e.emotionIds.every(isString) &&
    Array.isArray(e.tags) &&
    e.tags.every(isString) &&
    isString(e.createdAt)
  );
}

export function isIsoDate(value: unknown): value is string {
  return isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return parseStore(JSON.parse(raw));
  } catch {
    // Private mode, disabled storage, or corrupt JSON. Start clean rather than
    // crash — a wheel that still works is better than a white screen.
    return emptyStore();
  }
}

export class StorageFullError extends Error {
  constructor() {
    super("There is no room left in this browser's storage.");
    this.name = "StorageFullError";
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    if (isQuotaError(error)) throw new StorageFullError();
    throw error;
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read the current store, apply a change to *that*, and write it back.
 *
 * The read matters. Applying a change to a copy the tab loaded earlier and
 * writing the whole thing back silently destroys anything saved in between —
 * which is what a second tab, or the installed app open alongside a browser
 * tab, will do to you. Same failure the import merge guards against, one layer
 * down.
 */
export function mutateStore(fn: (store: Store) => Store): Store {
  const fresh = loadStore();
  const next = fn(fresh);
  saveStore(next);
  return next;
}
