import { EMOTION_BY_ID } from "../data/emotions";
import { paletteFor } from "../data/colors";
import { pathLabels } from "../lib/tree";

/**
 * A saved feeling, with the family it came from.
 *
 * The trail is the point: read back weeks later, "Sleepy" on its own is thin,
 * where "Sleepy — Bad › Tired" puts you back where you were. Same shape as the
 * selection tray, so a word looks the same everywhere in the app.
 */
export function EmotionChip({ id, size = "md" }: { id: string; size?: "sm" | "md" }) {
  const node = EMOTION_BY_ID.get(id);
  if (!node) return null;

  const trail = pathLabels(id).slice(1).reverse().join(" › ");

  return (
    <span
      className={
        size === "sm"
          ? "inline-flex items-baseline gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
          : "inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium"
      }
      style={{ background: paletteFor(node.coreId).tertiary }}
    >
      {node.label}
      {trail && <span className="text-[10px] font-normal opacity-55">{trail}</span>}
    </span>
  );
}
