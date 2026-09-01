import { EMOTION_BY_ID } from "../data/emotions";
import { paletteFor } from "../data/colors";
import { pathLabels } from "../lib/tree";

export interface SelectionTrayProps {
  selectedIds: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onSave: () => void;
}

export function SelectionTray({ selectedIds, onRemove, onClear, onSave }: SelectionTrayProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <div className="mb-3 flex flex-wrap gap-2">
        {selectedIds.map((id) => {
          const node = EMOTION_BY_ID.get(id);
          if (!node) return null;
          const trail = pathLabels(id).slice(1).reverse().join(" › ");
          return (
            <button
              key={id}
              type="button"
              onClick={() => onRemove(id)}
              aria-label={`Remove ${node.label}`}
              className="flex items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3 text-sm font-medium"
              style={{
                background: paletteFor(node.coreId).tertiary,
                color: "var(--color-ink)",
              }}
            >
              <span>{node.label}</span>
              {trail && (
                <span className="text-[11px] opacity-60">{trail}</span>
              )}
              <span aria-hidden className="pl-0.5 text-base leading-none opacity-50">
                ×
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 rounded-xl border border-[var(--color-line)] px-4 text-sm font-medium text-[var(--color-ink-soft)]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onSave}
          className="min-h-11 flex-1 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white"
        >
          Save {selectedIds.length === 1 ? "this feeling" : `these ${selectedIds.length}`}
        </button>
      </div>
    </div>
  );
}
