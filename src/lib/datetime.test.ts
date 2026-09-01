import { describe, expect, it } from "vitest";
import { fromDatetimeLocal, relativeDay, toDatetimeLocal } from "./datetime";

describe("datetime-local round-trip", () => {
  it("formats local wall-clock time, not UTC", () => {
    // 11:30pm local must stay on today's date whatever the offset.
    expect(toDatetimeLocal(new Date(2026, 7, 20, 23, 30))).toBe("2026-08-20T23:30");
    expect(toDatetimeLocal(new Date(2026, 0, 5, 9, 5))).toBe("2026-01-05T09:05");
  });

  it("parses back to the same moment", () => {
    const original = new Date(2026, 7, 20, 23, 30);
    expect(fromDatetimeLocal(toDatetimeLocal(original))!.getTime()).toBe(original.getTime());
  });

  it("rejects nonsense rather than inventing a date", () => {
    expect(fromDatetimeLocal("")).toBeNull();
    expect(fromDatetimeLocal("2026-08-20")).toBeNull();
    expect(fromDatetimeLocal("yesterday")).toBeNull();
  });
});

describe("relative day naming", () => {
  const now = new Date(2026, 7, 20, 12, 0);

  it("names today and yesterday", () => {
    expect(relativeDay(new Date(2026, 7, 20, 1, 0), now)).toBe("Today");
    expect(relativeDay(new Date(2026, 7, 19, 23, 0), now)).toBe("Yesterday");
  });

  it("falls back to a dated label further back", () => {
    expect(relativeDay(new Date(2026, 7, 10), now)).not.toBe("Today");
    expect(relativeDay(new Date(2026, 7, 10), now)).toMatch(/Aug/);
  });

  it("handles crossing a month and year boundary", () => {
    const newYear = new Date(2027, 0, 1, 9, 0);
    expect(relativeDay(new Date(2026, 11, 31, 22, 0), newYear)).toBe("Yesterday");
    expect(relativeDay(new Date(2026, 5, 1), newYear)).toMatch(/2026/);
  });
});
