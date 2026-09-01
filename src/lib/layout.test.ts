import { describe, expect, it } from "vitest";
import { CORES, EMOTIONS } from "../data/emotions";
import { computeLayout, lerpLayout, type Layout } from "./layout";
import { TAU, alignAngle, arcPath, polar } from "./geometry";

const visible = (layout: Layout, ring: "core" | "secondary" | "tertiary", coreId?: string) =>
  EMOTIONS.filter(
    (n) => n.ring === ring && (!coreId || n.coreId === coreId) && (layout.get(n.id)?.opacity ?? 0) > 0,
  ).map((n) => layout.get(n.id)!);

/** Total angular width of a set of wedges. */
const totalSweep = (wedges: { startAngle: number; endAngle: number }[]) =>
  wedges.reduce((sum, w) => sum + (w.endAngle - w.startAngle), 0);

function expectNoOverlap(wedges: { id: string; startAngle: number; endAngle: number }[]) {
  const sorted = [...wedges].sort((a, b) => a.startAngle - b.startAngle);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    expect(
      curr.startAngle - prev.endAngle,
      `${prev.id} overlaps ${curr.id}`,
    ).toBeGreaterThan(-1e-9);
  }
}

describe("overview layout", () => {
  const layout = computeLayout(null);

  it("places every one of the 130 nodes", () => {
    expect(layout.size).toBe(130);
    for (const node of EMOTIONS) expect(layout.has(node.id)).toBe(true);
  });

  it("tiles the full circle with the core ring, with no gaps or overlaps", () => {
    const cores = visible(layout, "core");
    expect(cores).toHaveLength(7);
    expect(totalSweep(cores)).toBeCloseTo(TAU, 9);
    expectNoOverlap(cores);
  });

  it("tiles the full circle with the secondary ring too", () => {
    const seconds = visible(layout, "secondary");
    expect(seconds).toHaveLength(41);
    expect(totalSweep(seconds)).toBeCloseTo(TAU, 9);
    expectNoOverlap(seconds);
  });

  it("makes every secondary wedge the same width", () => {
    // This is the point of weighting cores by child count: Happy has 9 words
    // and Bad has 4, and every one of them should be equally tappable.
    const widths = visible(layout, "secondary").map((w) => w.endAngle - w.startAngle);
    const first = widths[0]!;
    for (const width of widths) expect(width).toBeCloseTo(first, 9);
    expect(first).toBeCloseTo(TAU / 41, 9);
  });

  it("keeps each secondary inside its own core's slice", () => {
    for (const core of CORES) {
      const parent = layout.get(core.id)!;
      for (const child of visible(layout, "secondary", core.id)) {
        expect(child.startAngle).toBeGreaterThanOrEqual(parent.startAngle - 1e-9);
        expect(child.endAngle).toBeLessThanOrEqual(parent.endAngle + 1e-9);
      }
    }
  });

  it("hides the tertiary ring rather than dropping it", () => {
    const shown = visible(layout, "tertiary");
    expect(shown).toHaveLength(0);
    // still present, so the tween has 130 stable keys to work with
    for (const node of EMOTIONS.filter((n) => n.ring === "tertiary")) {
      expect(layout.get(node.id)!.opacity).toBe(0);
    }
  });

  it("stacks the rings outward without overlapping radially", () => {
    const core = layout.get("sad")!;
    const second = layout.get("sad.lonely")!;
    expect(core.outerRadius).toBeCloseTo(second.innerRadius, 9);
    expect(core.innerRadius).toBeGreaterThan(0);
  });
});

describe("focus layout", () => {
  const layout = computeLayout("sad");

  it("gives the focused core 280 degrees", () => {
    const sad = layout.get("sad")!;
    expect(sad.endAngle - sad.startAngle).toBeCloseTo((280 / 360) * TAU, 9);
  });

  it("still tiles the whole circle across all 7 cores", () => {
    const cores = visible(layout, "core");
    expect(cores).toHaveLength(7);
    // Collar cores are aligned onto their overview branch, so normalise before
    // measuring the total.
    const normalised = cores.map((w) => ({
      ...w,
      startAngle: alignAngle(w.startAngle, 0),
      endAngle: alignAngle(w.startAngle, 0) + (w.endAngle - w.startAngle),
    }));
    expect(totalSweep(normalised)).toBeCloseTo(TAU, 9);
  });

  it("shows all three rings for the focused core and none for the others", () => {
    expect(visible(layout, "secondary", "sad")).toHaveLength(6);
    expect(visible(layout, "tertiary", "sad")).toHaveLength(12);
    for (const core of CORES) {
      if (core.id === "sad") continue;
      expect(visible(layout, "secondary", core.id)).toHaveLength(0);
      expect(visible(layout, "tertiary", core.id)).toHaveLength(0);
    }
  });

  it("splits the focused core's span evenly and nests tertiary inside secondary", () => {
    const sad = layout.get("sad")!;
    const seconds = visible(layout, "secondary", "sad");
    expect(totalSweep(seconds)).toBeCloseTo(sad.endAngle - sad.startAngle, 9);
    expectNoOverlap(seconds);

    const lonely = layout.get("sad.lonely")!;
    const kids = [layout.get("sad.lonely.isolated")!, layout.get("sad.lonely.abandoned")!];
    expect(totalSweep(kids)).toBeCloseTo(lonely.endAngle - lonely.startAngle, 9);
    expect(kids[0]!.startAngle).toBeCloseTo(lonely.startAngle, 9);
    expect(kids[1]!.endAngle).toBeCloseTo(lonely.endAngle, 9);
  });

  it("gives collar cores the full radial depth so they stay tappable", () => {
    const happy = layout.get("happy")!;
    expect(happy.outerRadius - happy.innerRadius).toBeGreaterThan(0.7);
  });

  it("grows the focused core from where it already sat", () => {
    // Same centre angle in both layouts: the wheel must not spin to meet it.
    const before = computeLayout(null).get("sad")!;
    const after = layout.get("sad")!;
    const centre = (w: { startAngle: number; endAngle: number }) =>
      (w.startAngle + w.endAngle) / 2;
    expect(centre(after)).toBeCloseTo(centre(before), 9);
  });

  it("works for every core, not just sad", () => {
    for (const core of CORES) {
      const l = computeLayout(core.id);
      expect(l.size).toBe(130);
      const focused = l.get(core.id)!;
      expect(focused.endAngle - focused.startAngle).toBeCloseTo((280 / 360) * TAU, 9);
      expectNoOverlap(visible(l, "secondary", core.id));
      expectNoOverlap(visible(l, "tertiary", core.id));
    }
  });
});

describe("tweening between layouts", () => {
  const from = computeLayout(null);
  const to = computeLayout("sad");

  it("returns the endpoints exactly at t=0 and t=1", () => {
    const start = lerpLayout(from, to, 0);
    expect(start.get("sad")!.startAngle).toBeCloseTo(from.get("sad")!.startAngle, 9);
    const end = lerpLayout(from, to, 1);
    expect(end.get("sad")!.endAngle).toBeCloseTo(to.get("sad")!.endAngle, 9);
  });

  it("never lets a wedge take the long way round the circle", () => {
    // Every wedge should travel less than half a turn to reach its destination.
    for (const core of CORES) {
      const a = computeLayout(null);
      const b = computeLayout(core.id);
      for (const [id, wedge] of a) {
        const target = b.get(id)!;
        const travel = Math.abs(alignAngle(target.startAngle, wedge.startAngle) - wedge.startAngle);
        expect(travel, `${id} spins too far focusing ${core.id}`).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });

  it("keeps wedges in order and non-overlapping part-way through", () => {
    for (const t of [0.25, 0.5, 0.75]) {
      const mid = lerpLayout(from, to, t);
      const cores = EMOTIONS.filter((n) => n.ring === "core").map((n) => mid.get(n.id)!);
      for (const wedge of cores) {
        expect(wedge.endAngle).toBeGreaterThanOrEqual(wedge.startAngle - 1e-9);
        expect(wedge.outerRadius).toBeGreaterThanOrEqual(wedge.innerRadius - 1e-9);
      }
    }
  });

  it("fades the tertiary ring in rather than popping it", () => {
    expect(lerpLayout(from, to, 0.5).get("sad.lonely.isolated")!.opacity).toBeCloseTo(0.5, 9);
  });
});

describe("arc paths", () => {
  it("draws a closed annular sector", () => {
    const d = arcPath(0, 0, { startAngle: 0, endAngle: 1, innerRadius: 10, outerRadius: 20 });
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("A 20 20");
    expect(d).toContain("A 10 10");
  });

  it("returns nothing for a collapsed wedge", () => {
    // Parked wedges are zero-width; a degenerate path renders as a visible dot.
    expect(arcPath(0, 0, { startAngle: 1, endAngle: 1, innerRadius: 10, outerRadius: 20 })).toBe("");
    expect(arcPath(0, 0, { startAngle: 0, endAngle: 1, innerRadius: 20, outerRadius: 20 })).toBe("");
  });

  it("sets the large-arc flag past a half turn", () => {
    const small = arcPath(0, 0, { startAngle: 0, endAngle: 1, innerRadius: 5, outerRadius: 10 });
    const large = arcPath(0, 0, { startAngle: 0, endAngle: 4, innerRadius: 5, outerRadius: 10 });
    expect(small).toContain("0 0 1");
    expect(large).toContain("0 1 1");
  });

  it("puts angle 0 at twelve o'clock and runs clockwise", () => {
    const top = polar(0, 0, 10, 0);
    expect(top.x).toBeCloseTo(0, 9);
    expect(top.y).toBeCloseTo(-10, 9);
    const right = polar(0, 0, 10, Math.PI / 2);
    expect(right.x).toBeCloseTo(10, 9);
    expect(right.y).toBeCloseTo(0, 9);
  });

  it("aligns angles onto the nearest branch", () => {
    expect(alignAngle(0.1, TAU - 0.1)).toBeCloseTo(TAU + 0.1, 9);
    expect(alignAngle(TAU - 0.1, 0.1)).toBeCloseTo(-0.1, 9);
  });
});
