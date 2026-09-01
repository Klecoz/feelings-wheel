import { isRelated } from "./tree";

/**
 * Selecting a word drops any ancestor or descendant of it that was already
 * chosen. Tap Sad, then Isolated, and you get one refined choice rather than
 * three overlapping ones — otherwise the summary would count the same feeling
 * at three levels and every history entry would be noisy.
 *
 * Unrelated words stack freely: angry AND ashamed AND relieved is a normal
 * afternoon.
 */
export function toggleSelection(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((s) => s !== id);
  return [...selected.filter((s) => !isRelated(s, id)), id];
}

/** What tapping `id` would replace, so the UI can say so before it happens. */
export function wouldReplace(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) return [];
  return selected.filter((s) => isRelated(s, id));
}
