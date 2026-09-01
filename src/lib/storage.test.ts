import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  emptyStore,
  isEntry,
  loadStore,
  mutateStore,
  parseStore,
  saveStore,
  type Entry,
  type Store,
} from "./storage";
import { markSession } from "./sessions";
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
    const store: Store = { version: 1, entries: [entry()], sessions: ["2026-08-01"], overview: "full" };
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

describe("writing without clobbering another writer", () => {
  beforeEach(() => localStorage.clear());

  it("applies the change to what is stored now, not to a stale copy", () => {
    // The multi-tab bug: tab two loads the store, tab one saves an entry, then
    // tab two saves and wipes it out. Reading fresh on every write is the fix.
    saveStore({ ...emptyStore(), entries: [entry({ id: "first" })] });
    const stale = loadStore();

    // Another tab adds one behind our back.
    saveStore({ ...stale, entries: [...stale.entries, entry({ id: "from-other-tab" })] });

    const result = mutateStore((current) => addEntry(current, entry({ id: "mine" })));
    expect(result.entries.map((e) => e.id).sort()).toEqual([
      "first",
      "from-other-tab",
      "mine",
    ]);
    expect(loadStore().entries).toHaveLength(3);
  });

  it("does not resurrect an entry another writer deleted", () => {
    saveStore({ ...emptyStore(), entries: [entry({ id: "a" }), entry({ id: "b" })] });
    const stale = loadStore();
    saveStore({ ...stale, entries: stale.entries.filter((e) => e.id !== "a") });

    const result = mutateStore((current) => addEntry(current, entry({ id: "c" })));
    expect(result.entries.map((e) => e.id).sort()).toEqual(["b", "c"]);
  });

  it("merges session marks from another writer too", () => {
    saveStore({ ...emptyStore(), sessions: ["2026-08-01"] });
    const stale = loadStore();
    saveStore({ ...stale, sessions: ["2026-08-01", "2026-08-20"] });

    const result = mutateStore((current) => markSession(current, "2026-09-01"));
    expect(result.sessions).toEqual(["2026-08-01", "2026-08-20", "2026-09-01"]);
  });
});


describe("the wheel-view preference", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to the wheel the app has always shown", () => {
    // Data written before this setting existed must not silently change what
    // the user sees when they next open the app.
    expect(emptyStore().overview).toBe("full");
    expect(parseStore({ entries: [], sessions: [] }).overview).toBe("full");
    expect(loadStore().overview).toBe("full");
  });

  it("keeps the choice across a reload", () => {
    saveStore({ ...emptyStore(), overview: "cores" });
    expect(loadStore().overview).toBe("cores");
  });

  it("falls back rather than trusting a nonsense value", () => {
    expect(parseStore({ overview: "sideways" }).overview).toBe("full");
    expect(parseStore({ overview: 7 }).overview).toBe("full");
    expect(parseStore({ overview: null }).overview).toBe("full");
  });

  it("survives an unrelated change to the store", () => {
    saveStore({ ...emptyStore(), overview: "cores" });
    const after = mutateStore((current) => addEntry(current, entry()));
    expect(after.overview).toBe("cores");
  });
});
