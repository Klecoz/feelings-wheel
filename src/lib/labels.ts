import type { WedgeLayout } from "./layout";

/**
 * Fitting 130 words into a wheel is the hardest visual constraint here.
 * Labels run radially (pointing out from the centre) because the rings are much
 * deeper than the wedges are wide: a secondary wedge in the overview is about
 * 9 degrees, which is roughly 19px of arc on a phone, but nearly 80px deep.
 */

const CHAR_WIDTH_EM = 0.52;
const LINE_HEIGHT_EM = 1.15;
const MIN_FONT = 7.5;
const MAX_FONT = 16;

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

/**
 * Size the text to whatever room the wedge actually has. Radial depth caps the
 * word's length; the wedge's arc width caps how tall the type can be.
 */
export function fitFontSize(lines: string[], wedge: WedgeLayout, radius: number): number {
  const depth = (wedge.outerRadius - wedge.innerRadius) * radius * 0.84;
  const midRadius = ((wedge.innerRadius + wedge.outerRadius) / 2) * radius;
  const width = Math.abs(wedge.endAngle - wedge.startAngle) * midRadius * 0.86;

  const longest = Math.max(...lines.map((l) => l.length), 1);
  const byLength = depth / (longest * CHAR_WIDTH_EM);
  const byHeight = width / (lines.length * LINE_HEIGHT_EM);

  return clamp(Math.min(byLength, byHeight), MIN_FONT, MAX_FONT);
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Radial rotation in degrees for SVG. Angle 0 is 12 o'clock, so a label at
 * angle t reads outward when rotated t-90. On the left half that would leave it
 * upside down, so it flips.
 */
export function labelRotation(midAngle: number): number {
  const deg = (midAngle * 180) / Math.PI - 90;
  const normalised = ((deg % 360) + 360) % 360;
  return normalised > 90 && normalised < 270 ? deg + 180 : deg;
}
