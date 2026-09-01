/**
 * The classic wheel's colour coding — angry red, sad blue, happy yellow — kept
 * so the wheel stays recognisable to anyone who knows the printed poster, but
 * desaturated. The full-strength poster colours are punishing on a bright phone
 * screen, and this gets opened in bad moments.
 *
 * Three shades per core, darkest at the centre, so the ring you are on is
 * readable from brightness alone rather than only from position.
 */

export interface CorePalette {
  core: string;
  secondary: string;
  tertiary: string;
}

const PALETTE: Record<string, CorePalette> = {
  happy: { core: "#C08A2E", secondary: "#E0B45E", tertiary: "#F1DCA8" },
  surprised: { core: "#3F8A87", secondary: "#75B0AE", tertiary: "#BEDCDA" },
  bad: { core: "#5F8A4C", secondary: "#90B27E", tertiary: "#CBDDC0" },
  fearful: { core: "#B86C33", secondary: "#DA9A62", tertiary: "#F0D2B0" },
  angry: { core: "#A94A40", secondary: "#CB7C71", tertiary: "#E9C0B9" },
  disgusted: { core: "#7A5B8E", secondary: "#A489B4", tertiary: "#D6C8DF" },
  sad: { core: "#4E6E96", secondary: "#7F9CBD", tertiary: "#C3D3E4" },
};

const FALLBACK: CorePalette = {
  core: "#6b625b",
  secondary: "#9a9088",
  tertiary: "#e4dcd2",
};

export type Ring = "core" | "secondary" | "tertiary";

export function fillFor(coreId: string, ring: Ring): string {
  return (PALETTE[coreId] ?? FALLBACK)[ring];
}

/**
 * Label colour. Only the innermost ring is dark enough to need light text; the
 * outer two carry the app's normal ink so the whole wheel reads as one thing.
 */
export function textFor(ring: Ring): string {
  return ring === "core" ? "#FFFDFA" : "#2b2724";
}

export function paletteFor(coreId: string): CorePalette {
  return PALETTE[coreId] ?? FALLBACK;
}
