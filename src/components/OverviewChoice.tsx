import { CORES } from "../data/emotions";
import { paletteFor } from "../data/colors";
import { arcPath } from "../lib/geometry";
import { computeLayout, scaleWedge, type OverviewMode } from "../lib/layout";

const OPTIONS: { value: OverviewMode; label: string; blurb: string }[] = [
  {
    value: "full",
    label: "The whole wheel",
    blurb: "All 7 core feelings and their 41 more specific words, at a glance.",
  },
  {
    value: "cores",
    label: "Core feelings first",
    blurb: "Just the 7, much bigger. Tap one to open its words.",
  },
];

/**
 * A real miniature of each option rather than a description of it — drawn from
 * the same layout code as the wheel itself, so what you pick is what you get.
 */
function Thumb({ mode, active }: { mode: OverviewMode; active: boolean }) {
  const size = 74;
  const centre = size / 2;
  const radius = centre - 1;
  const layout = computeLayout(null, mode);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {[...layout.entries()]
        .filter(([, wedge]) => wedge.opacity > 0)
        .map(([id, wedge]) => {
          const d = arcPath(centre, centre, scaleWedge(wedge, radius));
          if (!d) return null;
          const coreId = id.split(".")[0]!;
          const palette = paletteFor(coreId);
          return (
            <path
              key={id}
              d={d}
              fill={id.includes(".") ? palette.secondary : palette.core}
              stroke="var(--color-surface)"
              strokeWidth={0.6}
              opacity={active ? 1 : 0.5}
            />
          );
        })}
      <circle cx={centre} cy={centre} r={radius * 0.2} fill="var(--color-surface)" />
    </svg>
  );
}

export function OverviewChoice({
  value,
  onChange,
}: {
  value: OverviewMode;
  onChange: (mode: OverviewMode) => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              "flex items-center gap-3 rounded-xl border p-3 text-left",
              active
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                : "border-[var(--color-line)] bg-[var(--color-ground)]",
            ].join(" ")}
          >
            <Thumb mode={option.value} active={active} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {option.label}
                {CORES.length > 0 && active && (
                  <span className="text-[var(--color-accent)]">✓</span>
                )}
              </span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
                {option.blurb}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
