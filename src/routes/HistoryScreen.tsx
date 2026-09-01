import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteEntry, groupByDay } from "../lib/entries";
import { relativeDay, timeOfDay } from "../lib/datetime";
import { useStore } from "../lib/store-context";
import { EmotionChip } from "../components/EmotionChip";
import { EmptyState } from "../components/EmptyState";

export function HistoryScreen() {
  const { store, update } = useStore();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<string | null>(null);

  const days = useMemo(() => groupByDay(store.entries), [store.entries]);
  const sessionDates = useMemo(() => new Set(store.sessions), [store.sessions]);

  if (days.length === 0) {
    return (
      <EmptyState
        title="No check-ins yet"
        body="Whatever you tap on the wheel is saved here, newest first, so you can look back over a week without having to remember it."
        action={{ to: "/", label: "Open the wheel" }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8">
        {days.map((group) => (
          <section key={group.isoDay}>
            <h2 className="mt-6 mb-2 flex items-baseline gap-2 text-sm font-semibold text-[var(--color-ink-soft)] first:mt-0">
              {relativeDay(new Date(group.entries[0]!.at))}
              <span className="font-normal text-[var(--color-ink-faint)]">
                {group.entries.length} {group.entries.length === 1 ? "check-in" : "check-ins"}
              </span>
              {sessionDates.has(group.isoDay) && (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
                  session
                </span>
              )}
            </h2>

            {group.entries.map((entry) => (
              <article
                key={entry.id}
                className="mb-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.emotionIds.map((id) => (
                    <EmotionChip key={id} id={id} />
                  ))}
                </div>

                <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                  <span className="tabular-nums">{timeOfDay(new Date(entry.at))}</span>
                  {entry.tags.length > 0 && (
                    <span className="truncate">· {entry.tags.join(" · ")}</span>
                  )}
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/?edit=${encodeURIComponent(entry.id)}`)}
                      className="min-h-8 rounded-lg px-2 font-medium text-[var(--color-ink-soft)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(entry.id)}
                      aria-label="Delete this check-in"
                      className="min-h-8 rounded-lg px-2 text-[var(--color-ink-faint)]"
                    >
                      Delete
                    </button>
                  </span>
                </div>

                {confirming === entry.id && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--color-ground)] p-2 text-sm">
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
                      className="min-h-9 rounded-lg bg-[#a94a40] px-3 text-xs font-semibold text-white"
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
