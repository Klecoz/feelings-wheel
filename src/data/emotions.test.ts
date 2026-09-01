import { describe, expect, it } from "vitest";
import { CORES, EMOTIONS, EMOTION_BY_ID } from "./emotions";
import { fillFor, paletteFor, textFor } from "./colors";
import { ancestorsOf, coreIdOf, isAncestorOf, isRelated, pathLabels } from "../lib/tree";

describe("the wheel dataset", () => {
  it("has the Roberts wheel's shape: 7 core, 41 secondary, 82 tertiary", () => {
    const byRing = { core: 0, secondary: 0, tertiary: 0 };
    for (const node of EMOTIONS) byRing[node.ring]++;
    expect(byRing).toEqual({ core: 7, secondary: 41, tertiary: 82 });
    expect(EMOTIONS).toHaveLength(130);
  });

  it("gives every node a unique id", () => {
    const ids = new Set(EMOTIONS.map((n) => n.id));
    expect(ids.size).toBe(EMOTIONS.length);
  });

  it("keeps duplicated labels as distinct nodes", () => {
    // The whole reason ids are path-based. If these ever collapse into one
    // node, saved history silently merges two different feelings.
    for (const label of ["Embarrassed", "Disappointed", "Inferior", "Overwhelmed"]) {
      const matches = EMOTIONS.filter((n) => n.label === label);
      expect(matches.length, `${label} should appear more than once`).toBeGreaterThan(1);
      expect(new Set(matches.map((n) => n.id)).size).toBe(matches.length);
      expect(new Set(matches.map((n) => n.coreId)).size).toBe(matches.length);
    }
  });

  it("resolves every parentId to a real node one ring up", () => {
    const ringAbove = { secondary: "core", tertiary: "secondary" } as const;
    for (const node of EMOTIONS) {
      if (node.ring === "core") {
        expect(node.parentId).toBeUndefined();
        expect(node.id).toBe(node.coreId);
        continue;
      }
      expect(node.parentId).toBeDefined();
      const parent = EMOTION_BY_ID.get(node.parentId!);
      expect(parent, `${node.id} has a dangling parent`).toBeDefined();
      expect(parent!.ring).toBe(ringAbove[node.ring]);
      expect(parent!.coreId).toBe(node.coreId);
      expect(node.id.startsWith(`${node.parentId}.`)).toBe(true);
    }
  });

  it("gives every one of the 130 words a real gloss", () => {
    for (const node of EMOTIONS) {
      expect(node.gloss.length, `${node.id} has no gloss`).toBeGreaterThan(15);
      expect(node.gloss.trim()).toBe(node.gloss);
      expect(node.gloss.endsWith(".")).toBe(true);
    }
  });

  it("writes a distinct gloss for every word", () => {
    // Two words with the same gloss teach nothing about the difference
    // between them, which is the entire point of having glosses.
    const seen = new Map<string, string>();
    for (const node of EMOTIONS) {
      const clash = seen.get(node.gloss);
      expect(clash, `${node.id} reuses the gloss from ${clash}`).toBeUndefined();
      seen.set(node.gloss, node.id);
    }
  });

  it("gives each core exactly two tertiary words per secondary", () => {
    for (const node of EMOTIONS) {
      if (node.ring !== "secondary") continue;
      const kids = EMOTIONS.filter((n) => n.parentId === node.id);
      expect(kids, `${node.id} should have 2 tertiary words`).toHaveLength(2);
    }
  });

  it("orders cores clockwise as the printed wheel does", () => {
    expect(CORES.map((c) => c.id)).toEqual([
      "happy",
      "surprised",
      "bad",
      "fearful",
      "angry",
      "disgusted",
      "sad",
    ]);
  });

  it("has a palette for every core", () => {
    for (const core of CORES) {
      const palette = paletteFor(core.id);
      expect(palette.core).toMatch(/^#[0-9A-F]{6}$/i);
      expect(fillFor(core.id, "secondary")).toBe(palette.secondary);
      expect(fillFor(core.id, "tertiary")).toBe(palette.tertiary);
    }
    expect(textFor("core")).not.toBe(textFor("tertiary"));
  });
});

describe("tree helpers", () => {
  it("reads ancestry off the path id", () => {
    expect(isAncestorOf("sad", "sad.lonely.isolated")).toBe(true);
    expect(isAncestorOf("sad.lonely", "sad.lonely.isolated")).toBe(true);
    expect(isAncestorOf("sad.lonely.isolated", "sad")).toBe(false);
    expect(isAncestorOf("sad", "sad")).toBe(false);
  });

  it("does not treat a shared prefix as ancestry", () => {
    // "sad" must not swallow "sadness"; without the dot guard it would.
    expect(isAncestorOf("sad", "sadness.x")).toBe(false);
    expect(isRelated("sad", "sadness")).toBe(false);
  });

  it("counts a node as related to itself and to both directions", () => {
    expect(isRelated("sad", "sad")).toBe(true);
    expect(isRelated("sad", "sad.lonely.isolated")).toBe(true);
    expect(isRelated("sad.lonely.isolated", "sad")).toBe(true);
    expect(isRelated("sad.lonely", "sad.guilty")).toBe(false);
  });

  it("lists ancestors nearest first", () => {
    expect(ancestorsOf("sad.lonely.isolated")).toEqual(["sad.lonely", "sad"]);
    expect(ancestorsOf("sad")).toEqual([]);
  });

  it("builds a readable trail for a bare word", () => {
    expect(pathLabels("sad.lonely.isolated")).toEqual(["Isolated", "Lonely", "Sad"]);
    expect(pathLabels("sad")).toEqual(["Sad"]);
  });

  it("finds the core of any id", () => {
    expect(coreIdOf("sad.lonely.isolated")).toBe("sad");
    expect(coreIdOf("happy")).toBe("happy");
  });
});
