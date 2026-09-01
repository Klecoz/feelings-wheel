import { EMOTION_BY_ID } from "../data/emotions";
import {
  loadStore,
  newId,
  saveStore,
  type Entry,
  type Store,
} from "./storage";

export interface DraftEntry {
  emotionIds: string[];
  tags: string[];
  at: Date;
}

export function createEntry(draft: DraftEntry): Entry {
  return {
    id: newId(),
    at: draft.at.toISOString(),
    emotionIds: [...draft.emotionIds],
    tags: normaliseTags(draft.tags),
    createdAt: new Date().toISOString(),
  };
}

/** Tags are free text, so they need taming or "Work", "work " and "work" split. */
export function normaliseTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, " ").toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/** Newest first — the order the history screen reads in. */
export function sortEntries(entries: readonly Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const diff = Date.parse(b.at) - Date.parse(a.at);
    // Two entries at the same minute still need a stable order, or editing one
    // makes the list jump around.
    return diff !== 0 ? diff : Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function addEntry(store: Store, entry: Entry): Store {
  return { ...store, entries: [...store.entries, entry] };
}

export function updateEntry(store: Store, id: string, patch: Partial<Omit<Entry, "id" | "createdAt">>): Store {
  return {
    ...store,
    entries: store.entries.map((entry) =>
      entry.id === id
        ? { ...entry, ...patch, tags: patch.tags ? normaliseTags(patch.tags) : entry.tags }
        : entry,
    ),
  };
}

export function deleteEntry(store: Store, id: string): Store {
  return { ...store, entries: store.entries.filter((entry) => entry.id !== id) };
}

/** Every tag you have used, most-used first, for the tag suggestions. */
export function knownTags(entries: readonly Entry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

/**
 * Emotion ids that no longer exist in the dataset are skipped when displaying.
 * They should never occur — ids are permanent — but an imported file from a
 * future version could carry one, and dropping it beats rendering "undefined".
 */
export function resolveEmotions(entry: Entry) {
  return entry.emotionIds
    .map((id) => EMOTION_BY_ID.get(id))
    .filter((node): node is NonNullable<typeof node> => node !== undefined);
}

export function readStore(): Store {
  return loadStore();
}

export function commit(store: Store): Store {
  saveStore(store);
  return store;
}

export interface DayGroup {
  /** Local calendar day, "YYYY-MM-DD" — stable regardless of how it is labelled. */
  isoDay: string;
  entries: Entry[];
}

/**
 * History reads as days, not as a flat list. Grouping up front keeps the render
 * a pure map over the result rather than a loop carrying a running "was the
 * last one a different day?" variable.
 */
export function groupByDay(entries: readonly Entry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of sortEntries(entries)) {
    const at = new Date(entry.at);
    const isoDay =
      `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}` +
      `-${String(at.getDate()).padStart(2, "0")}`;
    const last = groups[groups.length - 1];
    if (last && last.isoDay === isoDay) last.entries.push(entry);
    else groups.push({ isoDay, entries: [entry] });
  }
  return groups;
}
