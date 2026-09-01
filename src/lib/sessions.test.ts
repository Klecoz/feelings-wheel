import { describe, expect, it } from "vitest";
import {
  lastSessionBefore,
  markSession,
  startOfLocalDay,
  summarise,
  toLocalDate,
  unmarkSession,
  windowSinceLastSession,
} from "./sessions";
import { emptyStore, type Entry, type Store } from "./storage";

const at = (iso: string, ids: string[], tags: string[] = []): Entry => ({
  id: iso + ids.join(),
  at: iso,
  emotionIds: ids,
  tags,
  createdAt: iso,
});

/** Build an ISO stamp for a local time, so tests do not depend on the runner's zone. */
const local = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h).toISOString();

const store = (over: Partial<Store> = {}): Store => ({ ...emptyStore(), ...over });

describe("session markers", () => {
  it("records a date once, however many times you press it", () => {
    let s = markSession(emptyStore(), "2026-08-01");
    s = markSession(s, "2026-08-01");
    expect(s.sessions).toEqual(["2026-08-01"]);
  });

  it("keeps markers sorted whatever order they arrive in", () => {
    let s = markSession(emptyStore(), "2026-08-20");
    s = markSession(s, "2026-08-01");
    expect(s.sessions).toEqual(["2026-08-01", "2026-08-20"]);
  });

  it("can remove a marker set by mistake", () => {
    const s = unmarkSession(markSession(emptyStore(), "2026-08-01"), "2026-08-01");
    expect(s.sessions).toEqual([]);
  });

  it("formats today's date in the timezone you live in", () => {
    // Late-evening local time must not roll over to tomorrow's UTC date.
    expect(toLocalDate(new Date(2026, 7, 20, 23, 30))).toBe("2026-08-20");
    expect(startOfLocalDay("2026-08-20").getHours()).toBe(0);
  });
});

describe("the since-last-session window", () => {
  it("covers everything when you have never marked a session", () => {
    const s = store({ entries: [at(local(2026, 8, 1), ["sad"]), at(local(2026, 8, 20), ["happy"])] });
    const w = windowSinceLastSession(s, new Date(2026, 7, 25));
    expect(w.fromDate).toBeNull();
    expect(w.entries).toHaveLength(2);
  });

  it("starts at the most recent marker", () => {
    const s = store({
      sessions: ["2026-08-01", "2026-08-15"],
      entries: [
        at(local(2026, 8, 10), ["sad"]),
        at(local(2026, 8, 16), ["happy"]),
        at(local(2026, 8, 20), ["angry"]),
      ],
    });
    const w = windowSinceLastSession(s, new Date(2026, 7, 25));
    expect(w.fromDate).toBe("2026-08-15");
    expect(w.entries).toHaveLength(2);
  });

  it("includes entries made on the session day itself", () => {
    const s = store({
      sessions: ["2026-08-15"],
      entries: [at(local(2026, 8, 15, 0), ["sad"]), at(local(2026, 8, 14, 23), ["happy"])],
    });
    const w = windowSinceLastSession(s, new Date(2026, 7, 20));
    expect(w.entries).toHaveLength(1);
    expect(w.entries[0]!.emotionIds).toEqual(["sad"]);
  });

  it("ignores a marker dated in the future", () => {
    // Mistyping next year must not silently blank the summary.
    const s = store({
      sessions: ["2026-08-01", "2027-01-01"],
      entries: [at(local(2026, 8, 10), ["sad"])],
    });
    const w = windowSinceLastSession(s, new Date(2026, 7, 20));
    expect(w.fromDate).toBe("2026-08-01");
    expect(w.entries).toHaveLength(1);
  });

  it("returns nothing when every marker is in the future", () => {
    const s = store({ sessions: ["2030-01-01"], entries: [at(local(2026, 8, 10), ["sad"])] });
    expect(lastSessionBefore(s, new Date(2026, 7, 20))).toBeNull();
  });
});

describe("summarising a window", () => {
  const entries = [
    at(local(2026, 8, 16), ["sad.lonely.isolated", "angry.mad.furious"], ["work"]),
    at(local(2026, 8, 17), ["sad.lonely.isolated"], ["work", "sleep"]),
    at(local(2026, 8, 18), ["sad.guilty.ashamed"], []),
  ];

  it("counts check-ins, not words", () => {
    expect(summarise(entries).total).toBe(3);
  });

  it("rolls words up to their core emotion", () => {
    const byCore = summarise(entries).byCore;
    expect(byCore.find((t) => t.id === "sad")!.count).toBe(3);
    expect(byCore.find((t) => t.id === "angry")!.count).toBe(1);
    expect(byCore[0]!.label).toBe("Sad");
  });

  it("ranks your most-used words first", () => {
    const top = summarise(entries).topWords;
    expect(top[0]!.label).toBe("Isolated");
    expect(top[0]!.count).toBe(2);
  });

  it("counts tags across entries", () => {
    const tags = summarise(entries).tags;
    expect(tags[0]).toEqual({ id: "work", label: "work", count: 2 });
  });

  it("handles an empty window without dividing by zero", () => {
    expect(summarise([])).toEqual({ total: 0, byCore: [], topWords: [], tags: [] });
  });
});
