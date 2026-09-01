import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CORE_IDS } from "../data/emotions";
import { Wheel } from "../components/Wheel";
import { InfoStrip } from "../components/InfoStrip";
import { SelectionTray } from "../components/SelectionTray";
import { SaveSheet } from "../components/SaveSheet";
import { toggleSelection } from "../lib/selection";
import { addEntry, createEntry, knownTags, updateEntry } from "../lib/entries";
import { relativeDay } from "../lib/datetime";
import { useStore } from "../lib/store-context";

/**
 * Keying the screen on the edit target is what lets the selection be seeded
 * straight from the entry: changing which entry you are editing remounts the
 * screen instead of leaving stale words behind.
 */
export function WheelRoute() {
  const [params] = useSearchParams();
  return <WheelScreen key={params.get("edit") ?? "new"} />;
}

function WheelScreen() {
  const { coreId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { store, update } = useStore();

  // Editing an existing check-in reuses this whole screen, so you can change
  // which feelings it holds — not just its date and tags. The id rides in the
  // query string rather than router state so a refresh does not lose it.
  const editingId = params.get("edit");
  const editing = editingId
    ? store.entries.find((entry) => entry.id === editingId)
    : undefined;

  // Seeded once from the entry being edited. WheelRoute keys this component on
  // the edit id, so switching to a different entry remounts and reseeds rather
  // than needing an effect to reconcile the two.
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => editing?.emotionIds ?? [],
  );
  const [touched, setTouched] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const focusedCoreId = coreId && CORE_IDS.includes(coreId) ? coreId : null;

  // Focus lives in the URL, so the phone's back button closes a core for free.
  // The edit id has to survive that trip.
  const suffix = editingId ? `?edit=${encodeURIComponent(editingId)}` : "";

  const onFocus = useCallback(
    (next: string | null) => {
      setTouched(next);
      navigate(next ? `/c/${next}${suffix}` : `/${suffix}`);
    },
    [navigate, suffix],
  );

  const onPick = useCallback((id: string) => {
    setTouched(id);
    setSelectedIds((current) => toggleSelection(current, id));
  }, []);

  const tags = useMemo(() => knownTags(store.entries), [store.entries]);

  const save = (at: Date, chosenTags: string[]) => {
    const count = selectedIds.length;
    if (editing) {
      const id = editing.id;
      const words = [...selectedIds];
      update((current) =>
        updateEntry(current, id, {
          at: at.toISOString(),
          tags: chosenTags,
          emotionIds: words,
        }),
      );
      setSaving(false);
      setSelectedIds([]);
      navigate("/history");
      return;
    }
    update((current) =>
      addEntry(current, createEntry({ emotionIds: selectedIds, tags: chosenTags, at })),
    );
    setSaving(false);
    setSelectedIds([]);
    setSaved(`Saved ${count} ${count === 1 ? "feeling" : "feelings"}.`);
    window.setTimeout(() => setSaved(null), 2600);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* The SVG has a square viewBox and the default xMidYMid meet, so it
          sizes itself to the smaller of this box's two dimensions. Forcing a
          square wrapper instead made the wheel take its size from the taller
          axis and overflow the width of a phone. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {editing && (
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-2 text-sm">
            <span className="flex-1 text-[var(--color-accent)]">
              Editing your check-in from {relativeDay(new Date(editing.at)).toLowerCase()}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                navigate("/history");
              }}
              className="min-h-9 rounded-lg border border-[var(--color-accent)] px-3 text-xs font-medium text-[var(--color-accent)]"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
          <Wheel
            focusedCoreId={focusedCoreId}
            selectedIds={selectedIds}
            onFocus={onFocus}
            onPick={onPick}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col border-t border-[var(--color-line)] bg-[var(--color-surface)] lg:w-84 lg:border-t-0 lg:border-l">
        <InfoStrip id={touched} />
        <SelectionTray
          selectedIds={selectedIds}
          saveLabel={editing ? "Save changes" : undefined}
          onRemove={(id) => setSelectedIds((c) => c.filter((s) => s !== id))}
          onClear={() => setSelectedIds([])}
          onSave={() => setSaving(true)}
        />
        {saved && (
          <p
            role="status"
            className="px-4 pb-3 text-sm font-medium text-[var(--color-accent)]"
          >
            {saved}
          </p>
        )}
      </div>

      {saving && (
        <SaveSheet
          title={editing ? "Save your changes" : "Save this check-in"}
          selectedIds={selectedIds}
          initialAt={editing ? new Date(editing.at) : new Date()}
          initialTags={editing ? editing.tags : []}
          knownTags={tags}
          onCancel={() => setSaving(false)}
          onSave={save}
        />
      )}
    </div>
  );
}
