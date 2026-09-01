import { useStore } from "../lib/store-context";

/**
 * Saving can fail — a full quota, or a browser with storage switched off. The
 * app must say so rather than appear to have saved, because the user would
 * only find out much later that a check-in is missing.
 */
export function StorageBanner() {
  const { error, dismissError } = useStore();
  if (!error) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-[#a94a40] px-4 py-2.5 text-sm text-white"
    >
      <span className="flex-1">{error}</span>
      <button type="button" onClick={dismissError} aria-label="Dismiss" className="font-bold">
        ×
      </button>
    </div>
  );
}
