import { afterEach, describe, expect, it, vi } from "vitest";
import { requestPersistentStorage, storageDurability } from "./persistence";

/**
 * jsdom's navigator has no `storage` at all, so it has to be defined rather
 * than spied on — which is also a fair simulation of a browser without it.
 */
const withStorage = (impl: unknown) =>
  Object.defineProperty(navigator, "storage", { value: impl, configurable: true });

afterEach(() => {
  Reflect.deleteProperty(navigator, "storage");
  vi.restoreAllMocks();
});

describe("asking the browser to keep the record", () => {
  it("reports success when the browser agrees", async () => {
    withStorage({ persisted: async () => false, persist: async () => true });
    expect(await requestPersistentStorage()).toBe("persisted");
  });

  it("reports plainly when the browser refuses", async () => {
    // Not an error: most browsers decline until the app is installed. The user
    // is told, rather than being left to assume their entries are safe.
    withStorage({ persisted: async () => false, persist: async () => false });
    expect(await requestPersistentStorage()).toBe("best-effort");
  });

  it("does not ask again once already granted", async () => {
    const persist = vi.fn(async () => true);
    withStorage({ persisted: async () => true, persist });
    expect(await requestPersistentStorage()).toBe("persisted");
    expect(persist).not.toHaveBeenCalled();
  });

  it("says nothing rather than guessing where the API is missing", async () => {
    // Safari has historically not implemented this at all.
    withStorage(undefined);
    expect(await requestPersistentStorage()).toBe("unknown");
    expect(await storageDurability()).toBe("unknown");
  });

  it("never throws, whatever the browser does", async () => {
    withStorage({
      persisted: async () => { throw new Error("nope"); },
      persist: async () => { throw new Error("nope"); },
    });
    expect(await requestPersistentStorage()).toBe("unknown");
    expect(await storageDurability()).toBe("unknown");
  });
});
