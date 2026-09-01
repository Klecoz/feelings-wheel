import { registerSW } from "virtual:pwa-register";

/**
 * Apply a new version on the next open, rather than the one after that.
 *
 * With the auto-injected registration script, an installed app kept serving the
 * cached old build on the first reload and only picked up a new deploy on the
 * second — measurably, not in theory. For an app whose whole point is being
 * offline-first, "your fix arrives eventually" is a bug: a shipped fix has to
 * reach the person who hit the thing it fixes.
 *
 * Reloading is safe here because everything the user has typed is already in
 * localStorage by the time it could fire; there is no unsaved buffer to lose.
 */
export function keepUpToDate(): void {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // A phone keeps this app open for days at a time; without a periodic
      // check it would never notice a new version while it stays open.
      setInterval(() => void registration.update(), 60 * 60 * 1000);
      // And check whenever it comes back to the foreground.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") void registration.update();
      });
    },
  });
}
