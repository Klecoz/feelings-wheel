import { isEntry, parseStore, type Entry, type Store } from "./storage";

/**
 * Moving your record between phone and laptop, by hand. There is no server, so
 * this file is the sync mechanism.
 *
 * It is plain JSON and not encrypted: treat the file like a private document.
 */

export const EXPORT_KIND = "feelings-wheel-export";

export interface ExportFile {
  kind: typeof EXPORT_KIND;
  version: number;
  exportedAt: string;
  entries: Entry[];
  sessions: string[];
}

export function exportJson(store: Store, now: Date = new Date()): string {
  const file: ExportFile = {
    kind: EXPORT_KIND,
    version: store.version,
    exportedAt: now.toISOString(),
    entries: store.entries,
    sessions: store.sessions,
  };
  return JSON.stringify(file, null, 2);
}

export function suggestedFilename(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `feelings-wheel-${stamp}.json`;
}

export interface ImportResult {
  store: Store;
  added: number;
  skipped: number;
  sessionsAdded: number;
}

export class ImportError extends Error {}

/**
 * Merge by id rather than replace. Importing the laptop's file onto the phone
 * must not delete what the phone already holds — that would turn a sync into
 * silent data loss, which is the worst thing this app could do.
 *
 * An id present on both sides keeps the copy already here. Entries are
 * immutable enough that a conflict means "same entry", not "newer version".
 */
export function importJson(text: string, existing: Store): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError("That file isn't valid JSON.");
  }

  if (!raw || typeof raw !== "object") {
    throw new ImportError("That file doesn't look like a feelings wheel export.");
  }

  const file = raw as Partial<ExportFile>;
  if (file.kind !== EXPORT_KIND) {
    throw new ImportError("That file doesn't look like a feelings wheel export.");
  }

  const incoming = parseStore({
    version: existing.version,
    entries: Array.isArray(file.entries) ? file.entries.filter(isEntry) : [],
    sessions: file.sessions,
  });

  const known = new Set(existing.entries.map((entry) => entry.id));
  const fresh = incoming.entries.filter((entry) => !known.has(entry.id));
  const sessions = new Set(existing.sessions);
  const sessionsBefore = sessions.size;
  for (const date of incoming.sessions) sessions.add(date);

  return {
    store: {
      version: existing.version,
      entries: [...existing.entries, ...fresh],
      sessions: [...sessions].sort(),
    },
    added: fresh.length,
    skipped: incoming.entries.length - fresh.length,
    sessionsAdded: sessions.size - sessionsBefore,
  };
}
