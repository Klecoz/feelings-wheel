import { useEffect, useRef, useState } from "react";
import { EMOTION_BY_ID } from "../data/emotions";
import { toDatetimeLocal, fromDatetimeLocal } from "../lib/datetime";
import { normaliseTags } from "../lib/entries";

export interface SaveSheetProps {
  title: string;
  selectedIds: string[];
  initialAt: Date;
  initialTags: string[];
  knownTags: string[];
  onCancel: () => void;
  onSave: (at: Date, tags: string[]) => void;
}

/**
 * Everything here except the feelings themselves is optional. The whole sheet
 * is one tap from done — a check-in you have to fill in is a check-in you stop
 * making.
 */
export function SaveSheet({
  title,
  selectedIds,
  initialAt,
  initialTags,
  knownTags,
  onCancel,
  onSave,
}: SaveSheetProps) {
  const [when, setWhen] = useState(() => toDatetimeLocal(initialAt));
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const addTag = (raw: string) => {
    const [tag] = normaliseTags([raw]);
    if (!tag || tags.includes(tag)) {
      setDraft("");
      return;
    }
    setTags([...tags, tag]);
    setDraft("");
  };

  const parsed = fromDatetimeLocal(when);
  const suggestions = knownTags.filter((tag) => !tags.includes(tag)).slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-[var(--color-surface)] p-5 sm:max-w-md sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>

        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {selectedIds
            .map((id) => EMOTION_BY_ID.get(id)?.label)
            .filter(Boolean)
            .join(", ")}
        </p>

        <label className="mt-5 block text-sm font-medium">
          When
          <input
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            className="mt-1.5 block min-h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ground)] px-3 text-base"
          />
        </label>
        {!parsed && (
          <p className="mt-1 text-xs text-[var(--color-accent)]">
            That date is not valid, so it cannot be saved yet.
          </p>
        )}

        <div className="mt-5">
          <span className="text-sm font-medium">
            Tags <span className="text-[var(--color-ink-faint)]">(optional)</span>
          </span>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  aria-label={`Remove tag ${tag}`}
                  className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm"
                >
                  {tag} <span aria-hidden className="opacity-50">×</span>
                </button>
              ))}
            </div>
          )}

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(draft);
              }
            }}
            onBlur={() => draft && addTag(draft)}
            placeholder="work, family, sleep…"
            className="mt-2 block min-h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ground)] px-3 text-base"
          />

          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)]"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-xl border border-[var(--color-line)] px-5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsed}
            onClick={() => parsed && onSave(parsed, tags)}
            className="min-h-12 flex-1 rounded-xl bg-[var(--color-accent)] px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
