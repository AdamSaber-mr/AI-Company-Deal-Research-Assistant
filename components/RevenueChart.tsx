"use client";

import { useId, useState } from "react";
import type { DayPoint } from "@/lib/data";
import { euro } from "@/lib/data";
import { monotonePath, tickIndices } from "./chart-utils";
import { useSize } from "./useSize";

const H = 260;
const PAD = { top: 20, right: 76, bottom: 28, left: 10 };

function niceCeil(v: number): number {
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (v <= m * mag) return m * mag;
  }
  return 10 * mag;
}

export function RevenueChart({
  points,
  compare,
  onSelect,
}: {
  points: DayPoint[];
  /** Vorige periode (even lang als points), getekend als stippellijn. */
  compare?: DayPoint[];
  /** Klik op een punt → dagdetail in de pagina. */
  onSelect?: (point: DayPoint) => void;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();

  const w = Math.max(width, 320);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const compareAligned = compare && compare.length === points.length ? compare : null;
  const max = niceCeil(
    Math.max(
      ...points.map((p) => p.value),
      ...(compareAligned ? compareAligned.map((p) => p.value) : [0])
    )
  );
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const baseline = PAD.top + innerH;

  const xs = points.map((_, i) => x(i));
  const line = monotonePath(xs, points.map((p) => y(p.value)));
  const area = `${line}L${x(points.length - 1)},${baseline}L${x(0)},${baseline}Z`;

  const xTicks = tickIndices(points.length, 5);
  const last = points.length - 1;

  // Index rechtstreeks uit de muispositie — ook de klik gebruikt dit,
  // zodat dagdetail óók werkt op touch (waar geen hover aan voorafgaat).
  const indexAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / innerW) * (points.length - 1));
    return Math.max(0, Math.min(points.length - 1, i));
  };

  const hovered = hover !== null ? points[hover] : null;
  const prevDay = hover !== null && hover > 0 ? points[hover - 1] : null;
  const dayDelta =
    hovered && prevDay && prevDay.value > 0
      ? Math.round(((hovered.value - prevDay.value) / prevDay.value) * 100)
      : null;

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg
          width={w}
          height={H}
          onPointerMove={(e) => setHover(indexAt(e))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => onSelect?.(points[indexAt(e)])}
          role="img"
          aria-label="Omzet per dag"
          className={onSelect ? "cursor-pointer" : undefined}
        >
          <defs>
            {/* zachte verticale wash onder de lijn */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* x-as: gelijkmatig verdeelde datumlabels */}
          {xTicks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              fontSize="11"
              fill="var(--ink-muted)"
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            >
              {points[i].label}
            </text>
          ))}

          {/* vorige periode als stippellijn */}
          {compareAligned && (
            <path
              className="anim-fade"
              style={{ animationDelay: "0.35s" }}
              d={monotonePath(xs, compareAligned.map((p) => y(p.value)))}
              fill="none"
              stroke="var(--accent-soft)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeLinejoin="round"
            />
          )}

          {/* gradient-wash + vloeiende lijn die zichzelf tekent */}
          <g key={`line-${points.length}`}>
            <path d={area} className="anim-fade" fill={`url(#${gradientId})`} />
            <path
              d={line}
              pathLength={1}
              className="anim-draw"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>

          {/* crosshair */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={baseline}
              stroke="var(--baseline)"
              strokeWidth="1"
            />
          )}
          {hover !== null && (
            <circle
              cx={x(hover)}
              cy={y(points[hover].value)}
              r="4.5"
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          )}

          {/* eindpunt met surface-ring + direct label, ná het tekenen van de lijn */}
          <g key={`end-${points.length}`} className="anim-fade" style={{ animationDelay: "0.8s" }}>
            <circle cx={x(last)} cy={y(points[last].value)} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
            <text
              x={x(last) + 10}
              y={y(points[last].value) - 8}
              fontSize="12"
              fontWeight="600"
              fill="var(--ink)"
              stroke="var(--surface)"
              strokeWidth="4"
              style={{ paintOrder: "stroke" }}
            >
              {euro.format(points[last].value)}
            </text>
          </g>
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[136px] rounded-xl border border-edge bg-raised/95 px-3 py-2.5 shadow-lg backdrop-blur"
          style={{
            left: Math.min(x(hover) + 14, w - 160),
            top: Math.max(y(hovered.value) - 88, 4),
          }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {hovered.label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-sm font-semibold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {euro.format(hovered.value)}
            </span>
            {dayDelta !== null && (
              <span
                className={`text-[11px] font-medium ${
                  dayDelta >= 0 ? "text-delta-good" : "text-delta-bad"
                }`}
              >
                {dayDelta >= 0 ? "+" : ""}
                {dayDelta}% vs dag ervoor
              </span>
            )}
          </div>
          {compareAligned && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-secondary">
              <span
                className="inline-block h-0.5 w-3 rounded-full"
                style={{ background: "var(--accent-soft)" }}
              />
              Vorige periode · {euro.format(compareAligned[hover].value)}
            </div>
          )}
          {onSelect && (
            <div className="mt-1 text-[10px] text-ink-muted">Klik voor dagdetail</div>
          )}
        </div>
      )}
    </div>
  );
}
