import { EMOTION_BY_ID } from "../data/emotions";
import type { Entry, Store } from "./storage";
import { coreIdOf } from "./tree";

/** "YYYY-MM-DD" in the user's own timezone, which is the one they live in. */
export function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfLocalDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

export function markSession(store: Store, date: string): Store {
  if (store.sessions.includes(date)) return store;
  return { ...store, sessions: [...store.sessions, date].sort() };
}

export function unmarkSession(store: Store, date: string): Store {
  return { ...store, sessions: store.sessions.filter((s) => s !== date) };
}

/**
 * The most recent session marker at or before `now`. A marker dated in the
 * future is ignored rather than used — otherwise setting a date wrong once
 * would empty the summary and look like lost data.
 */
export function lastSessionBefore(store: Store, now: Date): string | null {
  const today = toLocalDate(now);
  const past = store.sessions.filter((date) => date <= today);
  return past.length ? past[past.length - 1]! : null;
}

export interface SummaryWindow {
  /** null means "everything so far" — you have not marked a session yet. */
  from: Date | null;
  fromDate: string | null;
  entries: Entry[];
}

export function windowSinceLastSession(store: Store, now: Date): SummaryWindow {
  const marker = lastSessionBefore(store, now);
  if (!marker) {
    return { from: null, fromDate: null, entries: [...store.entries] };
  }
  const from = startOfLocalDay(marker);
  return {
    from,
    fromDate: marker,
    entries: store.entries.filter((entry) => Date.parse(entry.at) >= from.getTime()),
  };
}

export interface Tally {
  id: string;
  label: string;
  count: number;
}

export interface Summary {
  total: number;
  byCore: Tally[];
  topWords: Tally[];
  tags: Tally[];
}

export function summarise(entries: readonly Entry[]): Summary {
  const coreCounts = new Map<string, number>();
  const wordCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const entry of entries) {
    for (const id of entry.emotionIds) {
      wordCounts.set(id, (wordCounts.get(id) ?? 0) + 1);
      const core = coreIdOf(id);
      coreCounts.set(core, (coreCounts.get(core) ?? 0) + 1);
    }
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const label = (id: string) => EMOTION_BY_ID.get(id)?.label ?? id;
  const rank = (counts: Map<string, number>, toLabel: (id: string) => string): Tally[] =>
    [...counts.entries()]
      .map(([id, count]) => ({ id, label: toLabel(id), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    total: entries.length,
    byCore: rank(coreCounts, label),
    topWords: rank(wordCounts, label),
    tags: rank(tagCounts, (t) => t),
  };
}
