import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { StoreContext } from "../lib/store-context";
import {
  STORAGE_KEY,
  StorageFullError,
  loadStore,
  mutateStore,
  type Store,
} from "../lib/storage";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [error, setError] = useState<string | null>(null);

  /**
   * Every write re-reads storage first and applies the change to *that*, not to
   * this tab's React state.
   *
   * Without it a second tab silently destroyed the first tab's entries: tab two
   * loaded the store, tab one added a check-in, and tab two's next save wrote
   * its own stale copy back over the top. Which is exactly the data loss the
   * import merge was written to prevent — the same hole, one layer down. Easy
   * to hit with the app installed on a phone and open on a laptop.
   */
  const update = useCallback((fn: (store: Store) => Store) => {
    try {
      setStore(mutateStore(fn));
      setError(null);
    } catch (caught) {
      // Keep what is actually on disk rather than showing an unsaved change.
      setStore(loadStore());
      setError(
        caught instanceof StorageFullError
          ? "This browser has no storage room left. Export your data, then clear some space."
          : "That change could not be saved to this browser.",
      );
    }
  }, []);

  // Another tab writing should show up here, not wait for a reload.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setStore(loadStore());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ store, update, error, dismissError: () => setError(null) }),
    [store, update, error],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
