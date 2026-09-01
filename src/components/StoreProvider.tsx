import { useCallback, useMemo, useState, type ReactNode } from "react";
import { StoreContext } from "../lib/store-context";
import { StorageFullError, loadStore, saveStore, type Store } from "../lib/storage";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((fn: (store: Store) => Store) => {
    setStore((previous) => {
      const next = fn(previous);
      try {
        saveStore(next);
        setError(null);
        return next;
      } catch (caught) {
        // Keep the old state rather than showing a change that was not saved.
        setError(
          caught instanceof StorageFullError
            ? "This browser has no storage room left. Export your data, then clear some space."
            : "That change could not be saved to this browser.",
        );
        return previous;
      }
    });
  }, []);

  const value = useMemo(
    () => ({ store, update, error, dismissError: () => setError(null) }),
    [store, update, error],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
