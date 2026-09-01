import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  emptyStore,
  isEntry,
  loadStore,
  parseStore,
  saveStore,
  type Entry,
} from "./storage";
import { addEntry, createEntry, deleteEntry, groupByDay, knownTags, normaliseTags, sortEntries, updateEntry } from "./entries";

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: "e1",
  at: "2026-08-20T10:00:00.000Z",
  emotionIds: ["sad.lonely.isolated"],
  tags: [],
  createdAt: "2026-08-20T10:00:00.000Z",
  ...over,
});

describe("storage round-trip", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(loadStore()).toEqual(emptyStore());
  });

  it("saves and reloads exactly what it was given", () => {
    const store = { version: 1, entries: [entry()], sessions: ["2026-08-01"] };
    saveStore(store);
    expect(loadStore()).toEqual(store);
  });

  it("degrades to empty rather than crashing on corrupt data", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadStore()).toEqual(emptyStore());
  });

  it("drops malformed entries instead of trusting them", () => {
    const parsed = parseStore({
      entries: [entry(), { id: "bad" }, null, { ...entry({ id: "e2" }), at: "nonsense" }],
      sessions: ["2026-08-01", "nope", "2026-08-01"],
    });
    expect(parsed.entries.map((e) => e.id)).toEqual(["e1"]);
    expect(parsed.sessions).toEqual(["2026-08-01"]);
  });

  it("rejects an entry with no feelings in it", () => {
    // An entry that records nothing is a bug, not a memory.
    expect(isEntry(entry({ emotionIds: [] }))).toBe(false);
  });
});

describe("entry handling", () => {
  it("keeps history newest first", () => {
    const older = entry({ id: "old", at: "2026-08-01T09:00:00.000Z" });
    const newer = entry({ id: "new", at: "2026-08-30T09:00:00.000Z" });
    expect(sortEntries([older, newer]).map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("orders same-moment entries stably by when they were written", () => {
    const a = entry({ id: "a", createdAt: "2026-08-20T10:00:00.000Z" });
    const b = entry({ id: "b", createdAt: "2026-08-20T11:00:00.000Z" });
    expect(sortEntries([a, b]).map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("tames tag spelling so one tag does not become three", () => {
    expect(normaliseTags([" Work ", "work", "WORK", "", "  "])).toEqual(["work"]);
    expect(normaliseTags(["family  call"])).toEqual(["family call"]);
  });

  it("adds, edits and deletes without touching the rest", () => {
    let store = emptyStore();
    store = addEntry(store, entry({ id: "a" }));
    store = addEntry(store, entry({ id: "b" }));
    store = updateEntry(store, "a", { tags: ["Work"] });
    expect(store.entries.find((e) => e.id === "a")!.tags).toEqual(["work"]);
    expect(store.entries.find((e) => e.id === "b")!.tags).toEqual([]);
    store = deleteEntry(store, "a");
    expect(store.entries.map((e) => e.id)).toEqual(["b"]);
  });

  it("never rewrites createdAt on an edit", () => {
    let store = addEntry(emptyStore(), entry({ id: "a", createdAt: "2020-01-01T00:00:00.000Z" }));
    store = updateEntry(store, "a", { at: "2026-01-01T00:00:00.000Z" });
    expect(store.entries[0]!.createdAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("ranks known tags by how often you use them", () => {
    const entries = [
      entry({ id: "1", tags: ["work", "sleep"] }),
      entry({ id: "2", tags: ["work"] }),
      entry({ id: "3", tags: ["work", "money"] }),
    ];
    expect(knownTags(entries)).toEqual(["work", "money", "sleep"]);
  });

  it("stamps a new entry with a unique id", () => {
    const a = createEntry({ emotionIds: ["sad"], tags: [], at: new Date() });
    const b = createEntry({ emotionIds: ["sad"], tags: [], at: new Date() });
    expect(a.id).not.toBe(b.id);
  });
});

describe("grouping history by day", () => {
  it("puts entries from the same local day together, newest day first", () => {
    const groups = groupByDay([
      entry({ id: "a", at: new Date(2026, 7, 20, 9).toISOString() }),
      entry({ id: "b", at: new Date(2026, 7, 21, 9).toISOString() }),
      entry({ id: "c", at: new Date(2026, 7, 20, 18).toISOString() }),
    ]);
    expect(groups.map((g) => g.isoDay)).toEqual(["2026-08-21", "2026-08-20"]);
    expect(groups[1]!.entries.map((e) => e.id)).toEqual(["c", "a"]);
  });

  it("groups by local day, not UTC day", () => {
    // 11pm local on the 20th belongs to the 20th even when UTC calls it the 21st.
    const groups = groupByDay([entry({ id: "late", at: new Date(2026, 7, 20, 23, 30).toISOString() })]);
    expect(groups[0]!.isoDay).toBe("2026-08-20");
  });

  it("returns nothing for no entries", () => {
    expect(groupByDay([])).toEqual([]);
  });
});
