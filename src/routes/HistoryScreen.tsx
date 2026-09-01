import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paletteFor } from "../data/colors";
import { EMOTION_BY_ID } from "../data/emotions";
import { deleteEntry, groupByDay } from "../lib/entries";
import { relativeDay, timeOfDay } from "../lib/datetime";
import { pathLabels } from "../lib/tree";
import { useStore } from "../lib/store-context";

export function HistoryScreen() {
  const { store, update } = useStore();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<string | null>(null);

  const days = useMemo(() => groupByDay(store.entries), [store.entries]);
  const sessionDates = useMemo(() => new Set(store.sessions), [store.sessions]);

  if (days.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-[var(--color-ink-soft)]">Nothing logged yet.</p>
        <Link
          to="/"
          className="min-h-11 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
        >
          Open the wheel
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8">
        {days.map((group) => (
          <section key={group.isoDay}>
            <h2 className="mt-6 mb-2 flex items-baseline gap-2 text-sm font-semibold text-[var(--color-ink-soft)] first:mt-0">
              {relativeDay(new Date(group.entries[0]!.at))}
              {sessionDates.has(group.isoDay) && (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
                  session
                </span>
              )}
            </h2>

            {group.entries.map((entry) => (
              <article
                key={entry.id}
                className="mb-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.emotionIds.map((id) => {
                    const node = EMOTION_BY_ID.get(id);
                    if (!node) return null;
                    return (
                      <span
                        key={id}
                        title={pathLabels(id).reverse().join(" › ")}
                        className="rounded-full px-2.5 py-1 text-sm font-medium"
                        style={{ background: paletteFor(node.coreId).tertiary }}
                      >
                        {node.label}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-faint)]">
                  <span>{timeOfDay(new Date(entry.at))}</span>
                  {entry.tags.length > 0 && <span>{entry.tags.join(" · ")}</span>}
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => navigate(`/?edit=${encodeURIComponent(entry.id)}`)}
                    className="min-h-8 px-1 font-medium text-[var(--color-ink-soft)] underline-offset-2 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(entry.id)}
                    className="min-h-8 px-1 font-medium text-[var(--color-ink-soft)] underline-offset-2 hover:underline"
                  >
                    Delete
                  </button>
                </div>

                {confirming === entry.id && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--color-ground)] p-2 text-sm">
                    <span className="flex-1">Delete this permanently?</span>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="min-h-9 rounded-lg border border-[var(--color-line)] px-3 text-xs font-medium"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        update((current) => deleteEntry(current, entry.id));
                        setConfirming(null);
                      }}
                      className="min-h-9 rounded-lg bg-[var(--color-accent)] px-3 text-xs font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
        ))}
      </div>

    </div>
  );
}
