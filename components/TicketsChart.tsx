"use client";

import { useId, useState } from "react";
import type { DayPoint } from "@/lib/data";
import { number } from "@/lib/data";
import { monotonePath, tickIndices } from "./chart-utils";
import { DeltaPill } from "./RevenueChart";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 10 };

// Dagen die zoveel boven het periodegemiddelde liggen, markeren we als piekdag.
const SPIKE_THRESHOLD = 1.3;

export function TicketsChart({
  points,
  onSelect,
}: {
  points: DayPoint[];
  /** Klik op een dag → dagdetail in de pagina. */
  onSelect?: (point: DayPoint) => void;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();

  const w = Math.max(width, 280);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...points.map((p) => p.value)) * 1.15;
  const avg = points.reduce((a, p) => a + p.value, 0) / points.length;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const baseline = PAD.top + innerH;

  const xs = points.map((_, i) => x(i));
  const line = monotonePath(xs, points.map((p) => y(p.value)));
  const area = `${line}L${x(points.length - 1)},${baseline}L${x(0)},${baseline}Z`;

  const xTicks = tickIndices(points.length, 5);
  const last = points.length - 1;

  // Piekdagen: opvallend boven het gemiddelde → amberkleurige stip.
  const spikes = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.value >= avg * SPIKE_THRESHOLD);

  // Index rechtstreeks uit de muispositie — ook de klik gebruikt dit,
  // zodat dagdetail óók werkt op touch (waar geen hover aan voorafgaat).
  const indexAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / innerW) * (points.length - 1));
    return Math.max(0, Math.min(points.length - 1, i));
  };

  const hovered = hover !== null ? points[hover] : null;
  const avgDelta = hovered ? Math.round(((hovered.value - avg) / avg) * 100) : null;

  // Kop boven de grafiek (Revolut-patroon): groot aantal dat live meebeweegt
  // met de muis; zonder hover het periodetotaal + aantal piekdagen.
  const total = points.reduce((a, p) => a + p.value, 0);

  return (
    <div ref={ref} className="relative">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
        <span
          className="text-[1.6rem] font-semibold leading-none tracking-tight"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {number.format(hovered ? hovered.value : total)}
        </span>
        {hovered ? (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            tickets · {hovered.label}
            {avgDelta !== null && <DeltaPill delta={avgDelta} upIsGood={false} />}
            <span className="hidden sm:inline">vs gemiddelde</span>
            {onSelect && <span className="hidden sm:inline">· klik voor dagdetail</span>}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            tickets · afgelopen {points.length} dagen
            {spikes.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--serious)" }}
                />
                {spikes.length} {spikes.length === 1 ? "piekdag" : "piekdagen"}
              </span>
            )}
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
          aria-label="Tickets per dag"
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

          {/* referentielijn: periodegemiddelde — heel subtiel, geen grid */}
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={y(avg)}
            y2={y(avg)}
            stroke="var(--baseline)"
            strokeWidth="1"
            strokeDasharray="2 5"
            strokeLinecap="round"
          />

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

          {/* piekdagen: amber stip met surface-ring, ná het tekenen van de lijn */}
          <g key={`spikes-${points.length}`} className="anim-fade" style={{ animationDelay: "0.85s" }}>
            {spikes.map(({ p, i }) => (
              <circle
                key={p.date.getTime()}
                cx={x(i)}
                cy={y(p.value)}
                r="4"
                fill="var(--serious)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            ))}
          </g>

          {/* crosshair + punt op de gehoverde dag */}
          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={baseline}
                stroke="var(--baseline)"
                strokeWidth="1"
              />
              <circle
                cx={x(hover)}
                cy={y(points[hover].value)}
                r="4.5"
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            </>
          )}

          {/* eindpunt met surface-ring */}
          <g key={`end-${points.length}`} className="anim-fade" style={{ animationDelay: "0.8s" }}>
            <circle
              cx={x(last)}
              cy={y(points[last].value)}
              r="4.5"
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          </g>
        </svg>
      )}
    </div>
  );
}
