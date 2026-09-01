import { describe, expect, it } from "vitest";
import { fitFontSize, labelLines, labelRotation } from "./labels";
import { EMOTIONS } from "../data/emotions";
import { computeLayout } from "./layout";

describe("label wrapping", () => {
  it("leaves short labels on one line", () => {
    expect(labelLines("Sad")).toEqual(["Sad"]);
    expect(labelLines("Let down")).toEqual(["Let down"]);
    expect(labelLines("Disillusioned")).toEqual(["Disillusioned"]);
  });

  it("balances long multi-word labels across two lines", () => {
    expect(labelLines("Out of control")).toEqual(["Out of", "control"]);
  });
});

describe("label rotation", () => {
  it("reads outward on the right half", () => {
    expect(labelRotation(Math.PI / 2)).toBeCloseTo(0, 9);
  });

  it("flips on the left half so text is never upside down", () => {
    // 270 degrees round the wheel is the 9 o'clock position.
    const flipped = labelRotation((3 * Math.PI) / 2);
    const normalised = ((flipped % 360) + 360) % 360;
    expect(normalised > 90 && normalised < 270).toBe(false);
  });

  it("never leaves a label upside down anywhere on the wheel", () => {
    for (let deg = 0; deg < 360; deg += 3) {
      const rot = labelRotation((deg * Math.PI) / 180);
      const normalised = ((rot % 360) + 360) % 360;
      expect(normalised > 90.001 && normalised < 269.999).toBe(false);
    }
  });
});

describe("font fitting", () => {
  it("keeps every label within its wedge in both layouts", () => {
    const radius = 190;
    for (const focus of [null, "happy", "sad", "bad"]) {
      const layout = computeLayout(focus);
      for (const node of EMOTIONS) {
        const wedge = layout.get(node.id)!;
        if (wedge.opacity === 0) continue;
        const lines = labelLines(node.label);
        const size = fitFontSize(lines, wedge, radius);
        expect(size).toBeGreaterThanOrEqual(7.5);
        expect(size).toBeLessThanOrEqual(16);
        // the fitted text must actually fit the radial depth it was sized for
        const depth = (wedge.outerRadius - wedge.innerRadius) * radius * 0.84;
        const longest = Math.max(...lines.map((l) => l.length));
        expect(size * longest * 0.52).toBeLessThanOrEqual(depth + 0.01);
      }
    }
  });

  it("gives the outer ring readable type on a phone-sized wheel", () => {
    // 170 is roughly the radius on a 390px-wide phone. The longest tertiary
    // word is the worst case; if it drops below the floor the wheel is unusable.
    const layout = computeLayout("surprised");
    const wedge = layout.get("surprised.confused.disillusioned")!;
    const size = fitFontSize(labelLines("Disillusioned"), wedge, 170);
    expect(size).toBeGreaterThanOrEqual(7.5);
  });
});
