import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CORE_IDS } from "../data/emotions";
import { Wheel } from "../components/Wheel";
import { InfoStrip } from "../components/InfoStrip";
import { SelectionTray } from "../components/SelectionTray";
import { SaveSheet } from "../components/SaveSheet";
import { toggleSelection } from "../lib/selection";
import { addEntry, createEntry, knownTags } from "../lib/entries";
import { useStore } from "../lib/store-context";

export function WheelScreen() {
  const { coreId } = useParams();
  const navigate = useNavigate();
  const { store, update } = useStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [touched, setTouched] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  // Focus lives in the URL, so the phone's back button closes a core for free.
  const focusedCoreId = coreId && CORE_IDS.includes(coreId) ? coreId : null;

  const onFocus = useCallback(
    (next: string | null) => {
      setTouched(next);
      navigate(next ? `/c/${next}` : "/");
    },
    [navigate],
  );

  const onPick = useCallback((id: string) => {
    setTouched(id);
    setSelectedIds((current) => toggleSelection(current, id));
  }, []);

  const tags = useMemo(() => knownTags(store.entries), [store.entries]);

  const save = (at: Date, chosenTags: string[]) => {
    update((current) =>
      addEntry(current, createEntry({ emotionIds: selectedIds, tags: chosenTags, at })),
    );
    setSaving(false);
    setSelectedIds([]);
    setSaved(`Saved ${selectedIds.length} ${selectedIds.length === 1 ? "feeling" : "feelings"}.`);
    window.setTimeout(() => setSaved(null), 2600);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* The SVG has a square viewBox and the default xMidYMid meet, so it
          sizes itself to the smaller of this box's two dimensions. Forcing a
          square wrapper instead made the wheel take its size from the taller
          axis and overflow the width of a phone. */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
        <Wheel
          focusedCoreId={focusedCoreId}
          selectedIds={selectedIds}
          onFocus={onFocus}
          onPick={onPick}
        />
      </div>

      <div className="flex shrink-0 flex-col border-t border-[var(--color-line)] bg-[var(--color-surface)] lg:w-84 lg:border-t-0 lg:border-l">
        <InfoStrip id={touched} />
        <SelectionTray
          selectedIds={selectedIds}
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
          title="Save this check-in"
          selectedIds={selectedIds}
          initialAt={new Date()}
          initialTags={[]}
          knownTags={tags}
          onCancel={() => setSaving(false)}
          onSave={save}
        />
      )}
    </div>
  );
}
