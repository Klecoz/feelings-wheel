/**
 * Draws the app icon: a miniature of the wheel itself, in the same softened
 * core colours, so the home-screen icon is recognisably this app.
 *
 * Run with `npm run icons`. Output is committed, so a normal build does not
 * need sharp.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const CORES = [
  { id: "happy", weight: 9, color: "#C08A2E", ring: "#E0B45E" },
  { id: "surprised", weight: 4, color: "#3F8A87", ring: "#75B0AE" },
  { id: "bad", weight: 4, color: "#5F8A4C", ring: "#90B27E" },
  { id: "fearful", weight: 6, color: "#B86C33", ring: "#DA9A62" },
  { id: "angry", weight: 8, color: "#A94A40", ring: "#CB7C71" },
  { id: "disgusted", weight: 4, color: "#7A5B8E", ring: "#A489B4" },
  { id: "sad", weight: 6, color: "#4E6E96", ring: "#7F9CBD" },
];

const TAU = Math.PI * 2;
const polar = (c, r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)];

function wedge(centre, a0, a1, rInner, rOuter) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(centre, rOuter, a0);
  const [x1, y1] = polar(centre, rOuter, a1);
  const [x2, y2] = polar(centre, rInner, a1);
  const [x3, y3] = polar(centre, rInner, a0);
  return `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3} Z`;
}

/** `padding` leaves the safe area a maskable icon needs for its mask. */
function svg(size, padding) {
  const centre = size / 2;
  const outer = centre * (1 - padding);
  const total = CORES.reduce((sum, c) => sum + c.weight, 0);

  let angle = 0;
  const parts = [];
  for (const core of CORES) {
    const width = (TAU * core.weight) / total;
    parts.push(
      `<path d="${wedge(centre, angle, angle + width, outer * 0.52, outer)}" fill="${core.ring}"/>`,
      `<path d="${wedge(centre, angle, angle + width, outer * 0.2, outer * 0.52)}" fill="${core.color}"/>`,
    );
    angle += width;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#f7f3ee"/>
  <g stroke="#fffdfa" stroke-width="${size * 0.006}">${parts.join("")}</g>
  <circle cx="${centre}" cy="${centre}" r="${outer * 0.2}" fill="#fffdfa"/>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, padding: 0.04 },
  { file: "icon-512.png", size: 512, padding: 0.04 },
  // Maskable icons get cropped to a circle or squircle by the launcher, so the
  // artwork has to sit inside the middle 80%.
  { file: "icon-maskable-512.png", size: 512, padding: 0.14 },
];

for (const { file, size, padding } of targets) {
  await sharp(Buffer.from(svg(size, padding))).png().toFile(join(OUT, file));
  console.log("wrote", file);
}

writeFileSync(join(OUT, "favicon.svg"), svg(64, 0.02));
console.log("wrote favicon.svg");
