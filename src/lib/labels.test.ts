import { describe, expect, it } from "vitest";
import {
  fitFontSize,
  labelLines,
  labelRotation,
  labelStylesFor,
  orientationFor,
} from "./labels";
import { EMOTIONS } from "../data/emotions";
import { computeLayout } from "./layout";

const LINES = new Map(EMOTIONS.map((n) => [n.id, labelLines(n.label)]));
const FOCUSES = [null, "happy", "sad", "surprised", "bad", "angry", "disgusted", "fearful"];

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
  it("reads outward on the right half when radial", () => {
    expect(labelRotation(Math.PI / 2, "radial")).toBeCloseTo(0, 9);
  });

  it("follows the arc when tangential", () => {
    expect(labelRotation(0, "tangential")).toBeCloseTo(0, 9);
  });

  it("never leaves a label upside down, in either orientation", () => {
    for (const orientation of ["radial", "tangential"] as const) {
      for (let deg = 0; deg < 360; deg += 3) {
        const rot = labelRotation((deg * Math.PI) / 180, orientation);
        const normalised = ((rot % 360) + 360) % 360;
        expect(normalised > 90.001 && normalised < 269.999).toBe(false);
      }
    }
  });
});

describe("choosing an orientation", () => {
  it("runs labels across the ring where the ring is deep and the wedge narrow", () => {
    // The overview: 9-degree wedges, but rings nearly 90px deep.
    const overview = computeLayout(null);
    expect(orientationFor(overview.get("sad.lonely")!, 188)).toBe("radial");
  });

  it("runs them along the arc where the wedge is wide and the ring thin", () => {
    // The focused core spans 280 degrees; "Surprised" cannot fit across it.
    const focused = computeLayout("surprised");
    expect(orientationFor(focused.get("surprised")!, 188)).toBe("tangential");
  });
});

describe("uniform type per group", () => {
  it("gives every word in a ring the same size", () => {
    // Sizing wedges independently makes a ring look ransom-noted.
    const styles = labelStylesFor(computeLayout(null), null, 188, LINES);
    const sizes = EMOTIONS.filter((n) => n.ring === "secondary").map(
      (n) => styles.get(n.id)!.fontSize,
    );
    expect(new Set(sizes).size).toBe(1);
  });

  it("keeps the focused core large rather than matching the collar", () => {
    const styles = labelStylesFor(computeLayout("sad"), "sad", 188, LINES);
    expect(styles.get("sad")!.fontSize).toBeGreaterThan(styles.get("happy")!.fontSize);
  });

  it("never lets a label overflow the wedge it sits in", () => {
    // The real invariant. If this fails the wheel has words spilling over their
    // neighbours, which is exactly what makes a feelings wheel unreadable.
    for (const radius of [150, 170, 188, 380]) {
      for (const focus of FOCUSES) {
        for (const mode of ["full", "cores"] as const) {
        const layout = computeLayout(focus, mode);
        const styles = labelStylesFor(layout, focus, radius, LINES);
        for (const node of EMOTIONS) {
          const wedge = layout.get(node.id)!;
          if (wedge.opacity <= 0.01) continue;
          const { fontSize, orientation } = styles.get(node.id)!;
          const lines = LINES.get(node.id)!;
          const depth = (wedge.outerRadius - wedge.innerRadius) * radius;
          const mid = ((wedge.innerRadius + wedge.outerRadius) / 2) * radius;
          const arc = Math.abs(wedge.endAngle - wedge.startAngle) * mid;
          const along = (orientation === "radial" ? depth : arc) * 0.84;
          const across = (orientation === "radial" ? arc : depth) * 0.84;
          const longest = Math.max(...lines.map((l) => l.length));

          expect(
            fontSize * longest * 0.52,
            `${node.label} (${node.id}) overflows lengthwise at r=${radius}, focus=${focus}`,
          ).toBeLessThanOrEqual(along + 0.01);
          expect(
            fontSize * lines.length * 1.15,
            `${node.label} (${node.id}) overflows across at r=${radius}, focus=${focus}`,
          ).toBeLessThanOrEqual(across + 0.01);
        }
        }
      }
    }
  });

  it("stays readable on a phone-sized wheel", () => {
    // A wheel whose outer ring drops to 5px is technically laid out and
    // practically useless. 170 is roughly the radius on a 390px-wide phone.
    for (const focus of FOCUSES) {
      for (const mode of ["full", "cores"] as const) {
        const layout = computeLayout(focus, mode);
        const styles = labelStylesFor(layout, focus, 170, LINES);
        for (const node of EMOTIONS) {
          if ((layout.get(node.id)?.opacity ?? 0) <= 0.01) continue;
          expect(
            styles.get(node.id)!.fontSize,
            `${node.label} is too small to read at focus=${focus}, mode=${mode}`,
          ).toBeGreaterThanOrEqual(7);
        }
      }
    }
  });

  it("ignores hidden wedges, which have no room by definition", () => {
    const styles = labelStylesFor(computeLayout(null), null, 188, LINES);
    expect(styles.get("sad.lonely")!.fontSize).toBeGreaterThan(9);
  });

  it("caps type so a wide wedge does not shout", () => {
    const styles = labelStylesFor(computeLayout("sad"), "sad", 188, LINES);
    expect(styles.get("sad")!.fontSize).toBeLessThanOrEqual(16);
  });
});

describe("font fitting", () => {
  it("uses the arc when tangential and the depth when radial", () => {
    // A small radius, so the 16px cap does not hide the difference.
    const wedge = computeLayout("sad").get("sad")!;
    expect(fitFontSize(["Sad"], wedge, 60, "tangential")).toBeGreaterThan(
      fitFontSize(["Sad"], wedge, 60, "radial"),
    );
  });
});
