import { memo } from "react";
import type { EmotionNode } from "../data/emotions";
import { fillFor, textFor } from "../data/colors";

/**
 * One wedge. Geometry is deliberately NOT a React prop — the wheel writes `d`,
 * `transform` and `font-size` straight onto these nodes during the zoom, so a
 * re-render for something unrelated (selecting a word) must not reset them.
 * Only the things that genuinely change with state live here.
 */

export interface WedgeProps {
  node: EmotionNode;
  lines: string[];
  selected: boolean;
  dimmed: boolean;
  onPick: (id: string) => void;
  registerPath: (id: string, el: SVGPathElement | null) => void;
  registerLabel: (id: string, el: SVGGElement | null) => void;
  registerText: (id: string, el: SVGTextElement | null) => void;
}

function WedgeImpl({
  node,
  lines,
  selected,
  dimmed,
  onPick,
  registerPath,
  registerLabel,
  registerText,
}: WedgeProps) {
  const fill = fillFor(node.coreId, node.ring);
  return (
    <g>
      <path
        ref={(el) => registerPath(node.id, el)}
        data-emotion={node.id}
        fill={fill}
        stroke={selected ? "#2b2724" : "#fffdfa"}
        strokeWidth={selected ? 2.5 : 0.8}
        strokeLinejoin="round"
        opacity={dimmed ? 0.55 : 1}
        style={{ cursor: "pointer", transition: "opacity 160ms ease" }}
        onClick={() => onPick(node.id)}
      >
        <title>{`${node.label} — ${node.gloss}`}</title>
      </path>
      <g
        ref={(el) => registerLabel(node.id, el)}
        data-label={node.id}
        style={{ pointerEvents: "none" }}
      >
        <text
          ref={(el) => registerText(node.id, el)}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textFor(node.ring)}
          fontWeight={node.ring === "core" ? 700 : 500}
        >
          {lines.map((line, i) => (
            <tspan key={line + i} x={0} dy={i === 0 ? `${-0.55 * (lines.length - 1)}em` : "1.1em"}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    </g>
  );
}

export const Wedge = memo(WedgeImpl);
