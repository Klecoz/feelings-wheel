import { describe, expect, it } from "vitest";
import { ImportError, exportJson, importJson, suggestedFilename } from "./transfer";
import { emptyStore, type Entry, type Store } from "./storage";

const entry = (id: string, at = "2026-08-20T10:00:00.000Z"): Entry => ({
  id,
  at,
  emotionIds: ["sad.lonely.isolated"],
  tags: ["work"],
  createdAt: at,
});

const store = (over: Partial<Store> = {}): Store => ({ ...emptyStore(), ...over });

describe("export and import", () => {
  it("round-trips a store losslessly", () => {
    const original = store({ entries: [entry("a"), entry("b")], sessions: ["2026-08-01"] });
    const result = importJson(exportJson(original), emptyStore());
    expect(result.store.entries).toEqual(original.entries);
    expect(result.store.sessions).toEqual(original.sessions);
    expect(result.added).toBe(2);
  });

  it("merges rather than replaces, so a sync never deletes", () => {
    // The important one. Importing the laptop's file onto the phone must keep
    // what the phone already had.
    const phone = store({ entries: [entry("phone-only")], sessions: ["2026-07-01"] });
    const laptop = store({ entries: [entry("laptop-only")], sessions: ["2026-08-01"] });
    const merged = importJson(exportJson(laptop), phone).store;
    expect(merged.entries.map((e) => e.id).sort()).toEqual(["laptop-only", "phone-only"]);
    expect(merged.sessions).toEqual(["2026-07-01", "2026-08-01"]);
  });

  it("does not duplicate entries when you import the same file twice", () => {
    const original = store({ entries: [entry("a")], sessions: ["2026-08-01"] });
    const json = exportJson(original);
    const once = importJson(json, emptyStore()).store;
    const twice = importJson(json, once);
    expect(twice.store.entries).toHaveLength(1);
    expect(twice.added).toBe(0);
    expect(twice.skipped).toBe(1);
  });

  it("reports what it actually did", () => {
    const existing = store({ entries: [entry("a")], sessions: ["2026-08-01"] });
    const incoming = store({ entries: [entry("a"), entry("b")], sessions: ["2026-08-01", "2026-09-01"] });
    const result = importJson(exportJson(incoming), existing);
    expect(result).toMatchObject({ added: 1, skipped: 1, sessionsAdded: 1 });
  });

  it("refuses a file that is not an export of this app", () => {
    expect(() => importJson("{}", emptyStore())).toThrow(ImportError);
    expect(() => importJson('{"kind":"something-else"}', emptyStore())).toThrow(ImportError);
    expect(() => importJson("not json at all", emptyStore())).toThrow(ImportError);
  });

  it("drops malformed entries out of an otherwise valid file", () => {
    const json = JSON.stringify({
      kind: "feelings-wheel-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: [entry("good"), { id: "bad", at: "nope" }],
      sessions: ["2026-08-01"],
    });
    const result = importJson(json, emptyStore());
    expect(result.store.entries.map((e) => e.id)).toEqual(["good"]);
  });

  it("names the file by date so backups sort themselves", () => {
    expect(suggestedFilename(new Date("2026-08-31T12:00:00Z"))).toBe(
      "feelings-wheel-2026-08-31.json",
    );
  });
});
