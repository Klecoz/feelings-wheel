/**
 * Polar maths for the wheel. Pure functions over numbers — no React, no DOM —
 * so the layout can be tested for gaps and overlaps without rendering anything.
 *
 * Angles are in radians, 0 points at 12 o'clock, and they increase clockwise.
 * They are deliberately NOT normalised into [0, 2pi): a wedge that straddles the
 * top of the wheel keeps a continuous span, so interpolating between two
 * layouts never takes the long way round the circle.
 */

export const TAU = Math.PI * 2;

export interface Point {
  x: number;
  y: number;
}

export interface Arc {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  return {
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  };
}

/** Where a wedge's label sits: the middle of its arc, halfway through its ring. */
export function arcCentroid(cx: number, cy: number, arc: Arc): Point {
  return polar(
    cx,
    cy,
    (arc.innerRadius + arc.outerRadius) / 2,
    (arc.startAngle + arc.endAngle) / 2,
  );
}

export function midAngle(arc: Arc): number {
  return (arc.startAngle + arc.endAngle) / 2;
}

/**
 * An annular sector as an SVG path. Zero-width and zero-thickness arcs return
 * an empty path rather than a degenerate one: collapsed wedges are how a ring
 * that is not currently shown parks itself, and browsers render a stray "M0 0Z"
 * as a visible dot.
 */
export function arcPath(cx: number, cy: number, arc: Arc): string {
  const { startAngle, endAngle, innerRadius, outerRadius } = arc;
  const sweep = endAngle - startAngle;

  if (Math.abs(sweep) < 1e-6 || outerRadius - innerRadius < 1e-6) return "";

  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  const outerStart = polar(cx, cy, outerRadius, startAngle);
  const outerEnd = polar(cx, cy, outerRadius, endAngle);
  const innerEnd = polar(cx, cy, innerRadius, endAngle);
  const innerStart = polar(cx, cy, innerRadius, startAngle);

  return [
    `M ${round(outerStart.x)} ${round(outerStart.y)}`,
    `A ${round(outerRadius)} ${round(outerRadius)} 0 ${largeArc} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}`,
    `L ${round(innerEnd.x)} ${round(innerEnd.y)}`,
    `A ${round(innerRadius)} ${round(innerRadius)} 0 ${largeArc} 0 ${round(innerStart.x)} ${round(innerStart.y)}`,
    "Z",
  ].join(" ");
}

const round = (n: number) => Math.round(n * 100) / 100;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Shift `angle` by whole turns so it lands nearest `reference`. This is what
 * stops a wedge spinning 300 degrees the wrong way when its two layouts happen
 * to sit on opposite sides of the 0/2pi seam.
 */
export function alignAngle(angle: number, reference: number): number {
  return angle + Math.round((reference - angle) / TAU) * TAU;
}

/** How wide a wedge is at a given radius — used to decide if a label fits. */
export function arcLength(radius: number, sweep: number): number {
  return Math.abs(sweep) * radius;
}
