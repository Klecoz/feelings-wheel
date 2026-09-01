import { useState } from "react";
import { paletteFor } from "../data/colors";
import { longDate } from "../lib/datetime";
import { markSession, summarise, toLocalDate, windowSinceLastSession } from "../lib/sessions";
import { useStore } from "../lib/store-context";
import { pathLabels } from "../lib/tree";

/** A horizontal bar, sized against the largest count in its group. */
function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  return (
    <li className="flex items-center gap-3 py-1">
      <span className="w-28 shrink-0 truncate text-sm">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-ground)]">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(4, (count / max) * 100)}%`, background: color }}
        />
      </span>
      <span className="w-6 shrink-0 text-right text-sm tabular-nums text-[var(--color-ink-faint)]">
        {count}
      </span>
    </li>
  );
}

export function SummaryScreen() {
  const { store, update } = useStore();
  const [justMarked, setJustMarked] = useState(false);

  // Not memoised: both are a single pass over a few hundred entries, and the
  // window depends on the current time as much as on the store, which is
  // exactly the thing a memo cannot track.
  const now = new Date();
  const window = windowSinceLastSession(store, now);
  const summary = summarise(window.entries);

  const today = toLocalDate(now);
  const alreadyMarkedToday = store.sessions.includes(today);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-5">
        <header>
          <h1 className="text-xl font-semibold">
            {window.fromDate ? "Since your last session" : "Everything so far"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {window.fromDate
              ? `From ${longDate(window.from!)} to today — ${summary.total} ${
                  summary.total === 1 ? "check-in" : "check-ins"
                }.`
              : `${summary.total} ${summary.total === 1 ? "check-in" : "check-ins"}. Mark a session below and this will cover just the time since.`}
          </p>
        </header>

        {summary.total === 0 ? (
          <p className="mt-8 text-[var(--color-ink-soft)]">
            Nothing logged in this stretch yet.
          </p>
        ) : (
          <>
            <section className="mt-7">
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                Which feelings, broadly
              </h2>
              <ul>
                {summary.byCore.map((tally) => (
                  <Bar
                    key={tally.id}
                    label={tally.label}
                    count={tally.count}
                    max={summary.byCore[0]!.count}
                    color={paletteFor(tally.id).core}
                  />
                ))}
              </ul>
            </section>

            <section className="mt-7">
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                Your most-used words
              </h2>
              <ul>
                {summary.topWords.slice(0, 12).map((tally) => (
                  <Bar
                    key={tally.id}
                    label={tally.label}
                    count={tally.count}
                    max={summary.topWords[0]!.count}
                    color={paletteFor(tally.id.split(".")[0]!).secondary}
                  />
                ))}
              </ul>
              {summary.topWords.length > 12 && (
                <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
                  and {summary.topWords.length - 12} more.
                </p>
              )}
            </section>

            {summary.tags.length > 0 && (
              <section className="mt-7">
                <h2 className="mb-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                  What was going on
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {summary.tags.map((tally) => (
                    <li
                      key={tally.id}
                      className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm"
                    >
                      {tally.label}
                      <span className="ml-1.5 text-[var(--color-ink-faint)] tabular-nums">
                        {tally.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-7">
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                Everything, in order
              </h2>
              <ul className="text-sm text-[var(--color-ink-soft)]">
                {summary.topWords.map((tally) => (
                  <li key={tally.id} className="py-0.5">
                    {pathLabels(tally.id).reverse().join(" › ")}
                    {tally.count > 1 && ` ×${tally.count}`}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section className="mt-9 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <h2 className="text-sm font-semibold">Had a session?</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Marking it starts a fresh window, so next time this page covers only
            what happened since.
          </p>
          <button
            type="button"
            disabled={alreadyMarkedToday}
            onClick={() => {
              update((current) => markSession(current, today));
              setJustMarked(true);
            }}
            className="mt-3 min-h-11 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:bg-[var(--color-accent-soft)] disabled:text-[var(--color-accent)]"
          >
            {alreadyMarkedToday ? "Session marked for today" : "Mark a session today"}
          </button>
          {justMarked && !alreadyMarkedToday && (
            <p className="mt-2 text-sm text-[var(--color-accent)]">Marked.</p>
          )}
        </section>
      </div>
    </div>
  );
}
