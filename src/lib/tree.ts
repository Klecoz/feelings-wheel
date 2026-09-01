import { EMOTION_BY_ID, type EmotionNode } from "../data/emotions";

export function nodeFor(id: string): EmotionNode | undefined {
  return EMOTION_BY_ID.get(id);
}

/**
 * Path ids encode ancestry, so lineage is a string test rather than a walk.
 * The dot guard matters: "sad" must not count as an ancestor of "sadness.x",
 * and prefix-matching without it would say it does.
 */
export function isAncestorOf(ancestorId: string, descendantId: string): boolean {
  return descendantId.startsWith(`${ancestorId}.`);
}

export function isRelated(a: string, b: string): boolean {
  return a === b || isAncestorOf(a, b) || isAncestorOf(b, a);
}

/** Ancestors nearest-first: "a.b.c" -> ["a.b", "a"]. */
export function ancestorsOf(id: string): string[] {
  const parts = id.split(".");
  const out: string[] = [];
  for (let i = parts.length - 1; i > 0; i--) {
    out.push(parts.slice(0, i).join("."));
  }
  return out;
}

export function coreIdOf(id: string): string {
  return id.split(".")[0] ?? id;
}

/** "Isolated · Lonely · Sad" — the trail that gives a bare word its context. */
export function pathLabels(id: string): string[] {
  const labels: string[] = [];
  const self = nodeFor(id);
  if (self) labels.push(self.label);
  for (const ancestorId of ancestorsOf(id)) {
    const node = nodeFor(ancestorId);
    if (node) labels.push(node.label);
  }
  return labels;
}

export function childrenOf(id: string): EmotionNode[] {
  const out: EmotionNode[] = [];
  for (const node of EMOTION_BY_ID.values()) {
    if (node.parentId === id) out.push(node);
  }
  return out;
}
