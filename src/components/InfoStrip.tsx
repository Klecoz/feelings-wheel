import { EMOTION_BY_ID } from "../data/emotions";
import { paletteFor } from "../data/colors";
import { pathLabels } from "../lib/tree";

/**
 * There are no hover tooltips anywhere in this app, because a phone has no
 * hover. Touching a wedge both selects it and explains it here, so reading and
 * choosing are the same gesture on both devices.
 */
export function InfoStrip({ id }: { id: string | null }) {
  const node = id ? EMOTION_BY_ID.get(id) : undefined;

  if (!node) {
    return (
      <div className="flex min-h-20 items-center justify-center px-4 text-center text-sm text-[var(--color-ink-faint)]">
        Touch any word to see what it means.
      </div>
    );
  }

  const trail = pathLabels(node.id).slice(1).reverse();

  return (
    <div className="flex min-h-20 flex-col justify-center gap-1 px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: paletteFor(node.coreId).core }}
        />
        <h2 className="text-lg leading-tight font-semibold">{node.label}</h2>
        {trail.length > 0 && (
          <span className="truncate text-xs text-[var(--color-ink-faint)]">
            {trail.join(" › ")}
          </span>
        )}
      </div>
      <p className="text-sm leading-snug text-[var(--color-ink-soft)]">{node.gloss}</p>
    </div>
  );
}
