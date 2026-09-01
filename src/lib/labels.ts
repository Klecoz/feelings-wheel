import { EMOTIONS, type EmotionNode } from "../data/emotions";
import type { Layout, WedgeLayout } from "./layout";

/**
 * Fitting 130 words into a wheel is the hardest visual constraint here, and the
 * two layouts want opposite things.
 *
 * In the overview a secondary wedge is about 9 degrees wide — roughly 22px of
 * arc on a phone — but nearly 90px deep, so labels have to run radially, out
 * from the centre. In the focused layout the same words are spread across 280
 * degrees and the rings are thin, so the room is the other way round and the
 * labels want to follow the arc. "Surprised" simply does not fit across a
 * focused core ring at any readable size.
 *
 * So orientation is not a style choice: each group takes whichever direction
 * actually has more space.
 */

const CHAR_WIDTH_EM = 0.52;
const LINE_HEIGHT_EM = 1.15;
const PADDING = 0.84;
const MAX_FONT = 16;
/** Only a floor for wedges that are hidden and therefore have no room at all. */
const FALLBACK_FONT = 8;

export type Orientation = "radial" | "tangential";

/** Only long multi-word labels wrap. "Let down" fits; "Out of control" does not. */
export function labelLines(label: string): string[] {
  if (label.length <= 10 || !label.includes(" ")) return [label];
  const words = label.split(" ");
  // Balance the two lines rather than greedily filling the first.
  let best = { score: Infinity, split: 1 };
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const score = Math.abs(a - b);
    if (score < best.score) best = { score, split: i };
  }
  return [words.slice(0, best.split).join(" "), words.slice(best.split).join(" ")];
}

/** How much room the wedge has along each axis, in real units. */
export function wedgeRoom(wedge: WedgeLayout, radius: number) {
  const depth = (wedge.outerRadius - wedge.innerRadius) * radius;
  const midRadius = ((wedge.innerRadius + wedge.outerRadius) / 2) * radius;
  const arc = Math.abs(wedge.endAngle - wedge.startAngle) * midRadius;
  return { depth, arc };
}

export function orientationFor(wedge: WedgeLayout, radius: number): Orientation {
  const { depth, arc } = wedgeRoom(wedge, radius);
  return arc > depth ? "tangential" : "radial";
}

/**
 * Size the text to the room the wedge actually has. One axis caps how long the
 * word can be, the other caps how tall the type can be — which is which depends
 * on the orientation.
 *
 * There is no lower clamp on purpose. Forcing a minimum would not create space,
 * it would just push the word out over its neighbours; a test instead pins that
 * the result stays readable at phone size, so a layout change that made the
 * wheel illegible would fail rather than quietly overflow.
 */
export function fitFontSize(
  lines: string[],
  wedge: WedgeLayout,
  radius: number,
  orientation: Orientation = "radial",
): number {
  const { depth, arc } = wedgeRoom(wedge, radius);
  const along = (orientation === "radial" ? depth : arc) * PADDING;
  const across = (orientation === "radial" ? arc : depth) * PADDING;

  const longest = Math.max(...lines.map((l) => l.length), 1);
  return Math.min(
    along / (longest * CHAR_WIDTH_EM),
    across / (lines.length * LINE_HEIGHT_EM),
    MAX_FONT,
  );
}

/**
 * Rotation in degrees for SVG. Angle 0 is 12 o'clock, so a radial label at
 * angle t reads outward when rotated t-90, and a tangential one follows the arc
 * at t. Either would be upside down on the left of the wheel, so it flips.
 */
export function labelRotation(midAngle: number, orientation: Orientation = "radial"): number {
  const deg = (midAngle * 180) / Math.PI - (orientation === "radial" ? 90 : 0);
  const normalised = ((deg % 360) + 360) % 360;
  return normalised > 90 && normalised < 270 ? deg + 180 : deg;
}

/**
 * Sizing each wedge on its own makes a ring look ransom-noted: "Empty" comes out
 * twice the size of "Disappointed" beside it. Type is uniform per group, at
 * whatever size the group's most demanding word can take.
 *
 * The focused core is its own group so that opening Sad leaves "Sad" reading
 * large at the centre instead of shrinking to match the narrow collar wedges.
 */
function groupKey(node: EmotionNode, focusedCoreId: string | null): string {
  if (node.ring !== "core") return node.ring;
  return focusedCoreId && node.coreId === focusedCoreId ? "core:focused" : "core:rest";
}

export interface LabelStyle {
  fontSize: number;
  orientation: Orientation;
}

export function labelStylesFor(
  layout: Layout,
  focusedCoreId: string | null,
  radius: number,
  linesById: ReadonlyMap<string, string[]>,
): Map<string, LabelStyle> {
  // A group's orientation is settled by its tightest member, so one wide wedge
  // cannot flip the whole ring into a direction its neighbours have no room for.
  const tightest = new Map<string, WedgeLayout>();
  for (const node of EMOTIONS) {
    const wedge = layout.get(node.id);
    // A parked wedge has no room by definition; letting it vote would drag the
    // whole group to nothing.
    if (!wedge || wedge.opacity <= 0.01) continue;
    const key = groupKey(node, focusedCoreId);
    const held = tightest.get(key);
    if (!held || wedgeRoom(wedge, radius).arc < wedgeRoom(held, radius).arc) {
      tightest.set(key, wedge);
    }
  }

  const orientations = new Map<string, Orientation>();
  for (const [key, wedge] of tightest) {
    orientations.set(key, orientationFor(wedge, radius));
  }

  const smallest = new Map<string, number>();
  for (const node of EMOTIONS) {
    const wedge = layout.get(node.id);
    if (!wedge || wedge.opacity <= 0.01) continue;
    const key = groupKey(node, focusedCoreId);
    const size = fitFontSize(
      linesById.get(node.id) ?? [node.label],
      wedge,
      radius,
      orientations.get(key) ?? "radial",
    );
    smallest.set(key, Math.min(smallest.get(key) ?? Infinity, size));
  }

  const styles = new Map<string, LabelStyle>();
  for (const node of EMOTIONS) {
    const key = groupKey(node, focusedCoreId);
    styles.set(node.id, {
      fontSize: smallest.get(key) ?? FALLBACK_FONT,
      orientation: orientations.get(key) ?? "radial",
    });
  }
  return styles;
}
