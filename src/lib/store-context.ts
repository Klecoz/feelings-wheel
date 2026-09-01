import { createContext, useContext } from "react";
import type { Store } from "./storage";

export interface StoreContextValue {
  store: Store;
  /** Apply a change and persist it. Returns nothing; the state updates. */
  update: (fn: (store: Store) => Store) => void;
  /** Set when the browser refused to save, so screens can say so honestly. */
  error: string | null;
  dismissError: () => void;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}
