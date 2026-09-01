import { useRef, useState } from "react";
import { longDate } from "../lib/datetime";
import { startOfLocalDay, unmarkSession } from "../lib/sessions";
import { ImportError, exportJson, importJson, suggestedFilename } from "../lib/transfer";
import { useStore } from "../lib/store-context";

export function SettingsScreen() {
  const { store, update } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([exportJson(store)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = suggestedFilename();
    link.click();
    URL.revokeObjectURL(url);
    setProblem(null);
    setMessage(`Exported ${store.entries.length} check-ins.`);
  };

  const readFile = async (file: File) => {
    setMessage(null);
    setProblem(null);
    try {
      const text = await file.text();
      // Merge inside the update so it applies to whatever is actually stored
      // now, not to the copy this tab happened to load.
      let result = importJson(text, store);
      update((current) => {
        result = importJson(text, current);
        return result.store;
      });
      setMessage(
        result.added === 0 && result.sessionsAdded === 0
          ? "Nothing new in that file — everything in it was already here."
          : `Added ${result.added} new check-ins` +
              (result.skipped ? `, skipped ${result.skipped} already here` : "") +
              (result.sessionsAdded ? `, and ${result.sessionsAdded} session dates` : "") +
              ".",
      );
    } catch (error) {
      setProblem(
        error instanceof ImportError
          ? error.message
          : "That file could not be read.",
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-5">
        <h1 className="text-xl font-semibold">Settings</h1>

        <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {store.entries.length} check-ins and {store.sessions.length} session
            dates, held in this browser on this device. Nothing is sent anywhere,
            because there is nowhere for it to go — clearing this browser's data
            erases it, so export if you would mind losing it.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              className="min-h-11 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white"
            >
              Export to a file
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="min-h-11 rounded-xl border border-[var(--color-line)] px-4 text-sm font-medium"
            >
              Import a file
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readFile(file);
                event.target.value = "";
              }}
            />
          </div>

          <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
            Importing adds to what is here — it never replaces it, so carrying the
            file between your phone and laptop cannot delete anything.
          </p>

          {message && <p className="mt-3 text-sm text-[var(--color-accent)]">{message}</p>}
          {problem && <p className="mt-3 text-sm font-medium text-[#a94a40]">{problem}</p>}
        </section>

        <section className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold">Session dates</h2>
          {store.sessions.length === 0 ? (
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              None marked yet. The summary uses these to work out what counts as
              “since last time”.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--color-line)]">
              {[...store.sessions].reverse().map((date) => (
                <li key={date} className="flex items-center gap-3 py-2">
                  <span className="flex-1 text-sm">{longDate(startOfLocalDay(date))}</span>
                  <button
                    type="button"
                    onClick={() => update((current) => unmarkSession(current, date))}
                    className="min-h-9 rounded-lg border border-[var(--color-line)] px-3 text-xs font-medium text-[var(--color-ink-soft)]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5 px-1 pb-4">
          <h2 className="text-sm font-semibold text-[var(--color-ink-soft)]">About</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            The wheel follows Geoffrey Roberts' feelings wheel: 7 core emotions,
            41 more specific words, and 130 in total. You can pick a word at any
            level — sometimes “Bad” is as precise as it gets, and that counts.
          </p>
        </section>
      </div>
    </div>
  );
}
