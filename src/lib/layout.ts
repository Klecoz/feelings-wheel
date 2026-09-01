import { CORES, EMOTIONS, type EmotionNode } from "../data/emotions";
import { TAU, alignAngle, lerp } from "./geometry";

/**
 * Two layouts of the same 130 nodes, and a tween between them.
 *
 * Overview  - all 7 cores plus their secondary ring. 48 wedges, every label
 *             legible on a phone. The tertiary ring is parked at the rim with
 *             zero thickness rather than removed, so the wedge count never
 *             changes and the tween has something to animate into.
 * Focus(x)  - core x expands to 280 degrees and shows its secondary AND
 *             tertiary rings; the other 6 cores compress into the remaining 80
 *             degrees as a collar of full-depth wedges you can tap to switch.
 *
 * Every node appears in every layout, so `computeLayout` always returns the
 * same 130 keys and interpolation is a plain per-field lerp.
 */

export interface WedgeLayout {
  id: string;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  opacity: number;
}

export type Layout = Map<string, WedgeLayout>;

/** Radii as a fraction of the wheel's outer radius. */
const HUB = 0.2;
const RIM = 1;

const OVERVIEW_RINGS = {
  core: [HUB, 0.52],
  secondary: [0.52, RIM],
} as const;

const FOCUS_RINGS = {
  core: [HUB, 0.4],
  secondary: [0.4, 0.68],
  tertiary: [0.68, RIM],
} as const;

/** How much of the circle the focused core claims. */
const FOCUS_SPAN = (280 / 360) * TAU;

const secondaryCount = (coreId: string) =>
  EMOTIONS.filter((n) => n.ring === "secondary" && n.coreId === coreId).length;

/** A collapsed wedge: present in the map, invisible on screen. */
function parked(id: string, angle: number): WedgeLayout {
  return {
    id,
    startAngle: angle,
    endAngle: angle,
    innerRadius: RIM,
    outerRadius: RIM,
    opacity: 0,
  };
}

/**
 * Cores are sized by how many secondary words they hold, not equally. Happy has
 * 9 and Bad has 4; splitting the circle evenly would make Happy's words less
 * than half the width of Bad's. Sizing by weight makes every secondary wedge
 * identical, which is what keeps the outer ring tappable.
 */
function coreAngles(order: EmotionNode[], from: number, span: number) {
  const weights = order.map((c) => secondaryCount(c.id));
  const total = weights.reduce((a, b) => a + b, 0);
  const out = new Map<string, { start: number; end: number }>();
  let cursor = from;
  order.forEach((core, i) => {
    const width = (span * (weights[i] ?? 1)) / total;
    out.set(core.id, { start: cursor, end: cursor + width });
    cursor += width;
  });
  return out;
}

function overviewLayout(): Layout {
  const layout: Layout = new Map();
  const spans = coreAngles(CORES, 0, TAU);

  for (const core of CORES) {
    const span = spans.get(core.id)!;
    layout.set(core.id, {
      id: core.id,
      startAngle: span.start,
      endAngle: span.end,
      innerRadius: OVERVIEW_RINGS.core[0],
      outerRadius: OVERVIEW_RINGS.core[1],
      opacity: 1,
    });

    const seconds = EMOTIONS.filter((n) => n.ring === "secondary" && n.coreId === core.id);
    const width = (span.end - span.start) / seconds.length;
    seconds.forEach((second, i) => {
      const start = span.start + i * width;
      layout.set(second.id, {
        id: second.id,
        startAngle: start,
        endAngle: start + width,
        innerRadius: OVERVIEW_RINGS.secondary[0],
        outerRadius: OVERVIEW_RINGS.secondary[1],
        opacity: 1,
      });
      // Tertiary words fold into the middle of their parent, so opening a core
      // looks like they unfold from it rather than fading in from nowhere.
      for (const third of EMOTIONS.filter((n) => n.parentId === second.id)) {
        layout.set(third.id, parked(third.id, start + width / 2));
      }
    });
  }
  return layout;
}

function focusLayout(focusedId: string): Layout {
  const layout: Layout = new Map();
  const overview = overviewLayout();

  // Keep the focused core centred where it already sits, so it grows out of
  // its own position instead of the wheel spinning to meet it.
  const base = overview.get(focusedId)!;
  const centre = (base.startAngle + base.endAngle) / 2;
  const focusStart = centre - FOCUS_SPAN / 2;
  const focusEnd = centre + FOCUS_SPAN / 2;

  const focused = CORES.find((c) => c.id === focusedId)!;
  const index = CORES.indexOf(focused);
  // The others keep their clockwise order, continuing from the focused core.
  const others = [...CORES.slice(index + 1), ...CORES.slice(0, index)];
  const collar = coreAngles(others, focusEnd, TAU - FOCUS_SPAN);

  for (const core of CORES) {
    if (core.id !== focusedId) {
      const span = collar.get(core.id)!;
      const reference = overview.get(core.id)!;
      const shift = alignAngle(span.start, reference.startAngle) - span.start;
      layout.set(core.id, {
        id: core.id,
        startAngle: span.start + shift,
        endAngle: span.end + shift,
        innerRadius: HUB,
        outerRadius: RIM,
        opacity: 1,
      });
      // Everything under an unfocused core parks at that core's middle.
      const parkAt = (span.start + span.end) / 2 + shift;
      for (const node of EMOTIONS) {
        if (node.coreId === core.id && node.ring !== "core") {
          layout.set(node.id, parked(node.id, parkAt));
        }
      }
      continue;
    }

    layout.set(core.id, {
      id: core.id,
      startAngle: focusStart,
      endAngle: focusEnd,
      innerRadius: FOCUS_RINGS.core[0],
      outerRadius: FOCUS_RINGS.core[1],
      opacity: 1,
    });

    const seconds = EMOTIONS.filter((n) => n.ring === "secondary" && n.coreId === core.id);
    const width = FOCUS_SPAN / seconds.length;
    seconds.forEach((second, i) => {
      const start = focusStart + i * width;
      layout.set(second.id, {
        id: second.id,
        startAngle: start,
        endAngle: start + width,
        innerRadius: FOCUS_RINGS.secondary[0],
        outerRadius: FOCUS_RINGS.secondary[1],
        opacity: 1,
      });
      const thirds = EMOTIONS.filter((n) => n.parentId === second.id);
      const thirdWidth = width / thirds.length;
      thirds.forEach((third, j) => {
        layout.set(third.id, {
          id: third.id,
          startAngle: start + j * thirdWidth,
          endAngle: start + (j + 1) * thirdWidth,
          innerRadius: FOCUS_RINGS.tertiary[0],
          outerRadius: FOCUS_RINGS.tertiary[1],
          opacity: 1,
        });
      });
    });
  }
  return layout;
}

export function computeLayout(focusedCoreId: string | null): Layout {
  return focusedCoreId ? focusLayout(focusedCoreId) : overviewLayout();
}

/**
 * Blend two layouts. Angles are aligned onto the same branch first, so a wedge
 * never takes the scenic route around the wheel to reach its destination.
 */
export function lerpLayout(from: Layout, to: Layout, t: number): Layout {
  const out: Layout = new Map();
  for (const [id, a] of from) {
    const b = to.get(id);
    if (!b) {
      out.set(id, a);
      continue;
    }
    const start = alignAngle(b.startAngle, a.startAngle);
    const end = alignAngle(b.endAngle, a.endAngle);
    out.set(id, {
      id,
      startAngle: lerp(a.startAngle, start, t),
      endAngle: lerp(a.endAngle, end, t),
      innerRadius: lerp(a.innerRadius, b.innerRadius, t),
      outerRadius: lerp(a.outerRadius, b.outerRadius, t),
      opacity: lerp(a.opacity, b.opacity, t),
    });
  }
  return out;
}

export const WHEEL_HUB_RADIUS = HUB;
