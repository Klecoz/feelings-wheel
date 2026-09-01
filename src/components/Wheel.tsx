import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { EMOTIONS } from "../data/emotions";
import { arcPath, midAngle, polar } from "../lib/geometry";
import { computeLayout, lerpLayout, type Layout } from "../lib/layout";
import { fitFontSize, labelLines, labelRotation } from "../lib/labels";
import { isRelated } from "../lib/tree";
import { Wedge } from "./Wedge";

const SIZE = 400;
const CENTRE = SIZE / 2;
const RADIUS = 188;
const DURATION = 380;

export interface WheelProps {
  focusedCoreId: string | null;
  selectedIds: string[];
  onFocus: (coreId: string | null) => void;
  onPick: (id: string) => void;
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const prefersReducedMotion = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Wheel({ focusedCoreId, selectedIds, onFocus, onPick }: WheelProps) {
  const paths = useRef(new Map<string, SVGPathElement>());
  const labels = useRef(new Map<string, SVGGElement>());
  const texts = useRef(new Map<string, SVGTextElement>());

  const current = useRef<Layout>(computeLayout(focusedCoreId));
  const frame = useRef<number | null>(null);

  const lines = useMemo(
    () => new Map(EMOTIONS.map((n) => [n.id, labelLines(n.label)])),
    [],
  );

  /** Writes a layout onto the DOM. The tween's only side effect. */
  const paint = useCallback((layout: Layout) => {
    for (const [id, wedge] of layout) {
      const path = paths.current.get(id);
      if (path) {
        path.setAttribute("d", arcPath(CENTRE, CENTRE, wedge));
        // Collapsed wedges must not swallow taps meant for what is beneath.
        path.style.pointerEvents = wedge.opacity < 0.05 ? "none" : "auto";
      }
      const label = labels.current.get(id);
      if (label) {
        const angle = midAngle(wedge);
        const at = polar(
          CENTRE,
          CENTRE,
          ((wedge.innerRadius + wedge.outerRadius) / 2) * RADIUS,
          angle,
        );
        label.setAttribute(
          "transform",
          `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)}) rotate(${labelRotation(angle).toFixed(2)})`,
        );
        label.setAttribute("opacity", wedge.opacity.toFixed(3));
      }
    }
  }, []);

  /**
   * Type is sized from the destination layout and left alone while the wheel
   * moves. Recomputing it every frame makes the words visibly shimmer, and the
   * opacity fade hides any overhang in transit.
   */
  const sizeText = useCallback(
    (layout: Layout) => {
      for (const [id, wedge] of layout) {
        const text = texts.current.get(id);
        if (!text) continue;
        text.setAttribute(
          "font-size",
          fitFontSize(lines.get(id)!, wedge, RADIUS).toFixed(2),
        );
      }
    },
    [lines],
  );

  useEffect(() => {
    const to = computeLayout(focusedCoreId);
    sizeText(to);

    if (prefersReducedMotion()) {
      current.current = to;
      paint(to);
      return;
    }

    // Start from wherever the wheel actually is, so interrupting a zoom
    // half-way redirects it instead of snapping back.
    const from = new Map(current.current);
    const started = performance.now();
    if (frame.current !== null) cancelAnimationFrame(frame.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION);
      const blended = lerpLayout(from, to, easeInOutCubic(t));
      current.current = blended;
      paint(blended);
      frame.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [focusedCoreId, paint, sizeText]);

  // Re-assert geometry after every render. React owns colour and stroke, but
  // not position — without this, selecting a word would reset the zoom.
  useLayoutEffect(() => {
    paint(current.current);
  });

  useLayoutEffect(() => {
    sizeText(computeLayout(focusedCoreId));
    // Only on mount: afterwards the effect above owns sizing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerPath = useCallback((id: string, el: SVGPathElement | null) => {
    if (el) paths.current.set(id, el);
    else paths.current.delete(id);
  }, []);
  const registerLabel = useCallback((id: string, el: SVGGElement | null) => {
    if (el) labels.current.set(id, el);
    else labels.current.delete(id);
  }, []);
  const registerText = useCallback((id: string, el: SVGTextElement | null) => {
    if (el) texts.current.set(id, el);
    else texts.current.delete(id);
  }, []);

  const handlePick = useCallback(
    (id: string) => {
      const node = EMOTIONS.find((n) => n.id === id)!;
      // Tapping a core is how you open it; tapping the one already open is how
      // you choose it as your word.
      if (node.ring === "core" && focusedCoreId !== node.id) {
        onFocus(node.id);
        return;
      }
      onPick(id);
    },
    [focusedCoreId, onFocus, onPick],
  );

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="block h-full w-full touch-manipulation select-none"
      role="group"
      aria-label="Feelings wheel"
    >
      {EMOTIONS.map((node) => (
        <Wedge
          key={node.id}
          node={node}
          lines={lines.get(node.id)!}
          selected={selectedIds.includes(node.id)}
          dimmed={
            selectedIds.length > 0 &&
            !selectedIds.some((selectedId) => isRelated(selectedId, node.id))
          }
          onPick={handlePick}
          registerPath={registerPath}
          registerLabel={registerLabel}
          registerText={registerText}
        />
      ))}

      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RADIUS * 0.2 - 3}
        fill="var(--color-surface)"
        stroke="var(--color-line)"
        strokeWidth={1}
        style={{ cursor: focusedCoreId ? "pointer" : "default" }}
        onClick={() => focusedCoreId && onFocus(null)}
      />
      <text
        x={CENTRE}
        y={CENTRE}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={focusedCoreId ? 13 : 11}
        fill="var(--color-ink-soft)"
        fontWeight={600}
        style={{ pointerEvents: "none" }}
      >
        {focusedCoreId ? "← Back" : "Tap a"}
        {!focusedCoreId && (
          <tspan x={CENTRE} dy="1.2em">
            feeling
          </tspan>
        )}
      </text>
    </svg>
  );
}
