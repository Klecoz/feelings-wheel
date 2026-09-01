import { describe, expect, it } from "vitest";
import { toggleSelection, wouldReplace } from "./selection";

describe("selecting words", () => {
  it("adds an unrelated word alongside the others", () => {
    const s = toggleSelection(toggleSelection([], "angry.mad.furious"), "sad.guilty.ashamed");
    expect(s).toEqual(["angry.mad.furious", "sad.guilty.ashamed"]);
  });

  it("removes a word when tapped again", () => {
    expect(toggleSelection(["sad"], "sad")).toEqual([]);
  });

  it("replaces an ancestor when you refine it", () => {
    // Tap Sad, then Isolated: you meant to get more specific, not to pick both.
    let s = toggleSelection([], "sad");
    s = toggleSelection(s, "sad.lonely.isolated");
    expect(s).toEqual(["sad.lonely.isolated"]);
  });

  it("replaces a descendant when you widen back out", () => {
    let s = toggleSelection([], "sad.lonely.isolated");
    s = toggleSelection(s, "sad");
    expect(s).toEqual(["sad"]);
  });

  it("replaces a middle relative in either direction", () => {
    expect(toggleSelection(["sad.lonely"], "sad.lonely.isolated")).toEqual([
      "sad.lonely.isolated",
    ]);
    expect(toggleSelection(["sad.lonely.isolated"], "sad.lonely")).toEqual(["sad.lonely"]);
  });

  it("keeps siblings, which are genuinely different feelings", () => {
    const s = toggleSelection(["sad.lonely.isolated"], "sad.lonely.abandoned");
    expect(s).toEqual(["sad.lonely.isolated", "sad.lonely.abandoned"]);
  });

  it("keeps unrelated words under the same core", () => {
    const s = toggleSelection(["sad.lonely"], "sad.guilty");
    expect(s).toEqual(["sad.lonely", "sad.guilty"]);
  });

  it("drops several relatives at once", () => {
    const s = toggleSelection(["sad.lonely.isolated", "sad.guilty", "angry"], "sad");
    expect(s).toEqual(["angry", "sad"]);
  });

  it("reports what a tap would replace, before it happens", () => {
    expect(wouldReplace(["sad"], "sad.lonely.isolated")).toEqual(["sad"]);
    expect(wouldReplace(["angry"], "sad.lonely")).toEqual([]);
    expect(wouldReplace(["sad"], "sad")).toEqual([]);
  });
});
