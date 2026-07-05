"use client";

import { useId, useState } from "react";
import type { DayPoint } from "@/lib/data";
import { euro } from "@/lib/data";
import { monotonePath, tickIndices } from "./chart-utils";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 10 };

/** Delta-pill zoals Revolut: kleine capsule met percentage. */
export function DeltaPill({ delta, upIsGood = true }: { delta: number; upIsGood?: boolean }) {
  const good = delta >= 0 === upIsGood;
  const tone = good ? "var(--delta-good)" : "var(--delta-bad)";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{
        color: tone,
        background: "color-mix(in srgb, currentColor 12%, transparent)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
        <path
          d={delta >= 0 ? "M5 1.5v7M2 4.5l3-3 3 3" : "M5 1.5v7M2 5.5l3 3 3-3"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {delta >= 0 ? "+" : ""}
      {delta.toLocaleString("nl-NL")}%
    </span>
  );
}

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

  // Kop boven de grafiek (Revolut-patroon): groot bedrag dat live meebeweegt
  // met de muis; zonder hover het periodetotaal met delta t.o.v. de vorige
  // periode. Vervangt de zwevende tooltip.
  const total = points.reduce((a, p) => a + p.value, 0);
  const compareTotal = compareAligned
    ? compareAligned.reduce((a, p) => a + p.value, 0)
    : null;
  const periodPct =
    compareTotal && compareTotal > 0
      ? Math.round(((total - compareTotal) / compareTotal) * 100)
      : null;

  return (
    <div ref={ref} className="relative">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
        <span
          className="text-[1.6rem] font-semibold leading-none tracking-tight"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {euro.format(hovered ? hovered.value : total)}
        </span>
        {hovered ? (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            {hovered.label}
            {dayDelta !== null && <DeltaPill delta={dayDelta} />}
            {compareAligned && hover !== null && (
              <span className="text-ink-muted">
                vorige periode {euro.format(compareAligned[hover].value)}
              </span>
            )}
            {onSelect && <span className="hidden sm:inline">· klik voor dagdetail</span>}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            totaal · afgelopen {points.length} dagen
            {periodPct !== null && <DeltaPill delta={periodPct} />}
          </span>
        )}
      </div>
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

          {/* eindpunt met surface-ring, ná het tekenen van de lijn (de waarde
              staat groot in de kop, dus geen tekstlabel meer nodig) */}
          <g key={`end-${points.length}`} className="anim-fade" style={{ animationDelay: "0.8s" }}>
            <circle cx={x(last)} cy={y(points[last].value)} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
          </g>
        </svg>
      )}
    </div>
  );
}
