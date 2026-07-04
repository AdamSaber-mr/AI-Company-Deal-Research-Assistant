"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { tickIndices } from "./chart-utils";
import { useSize } from "./useSize";

const H = 260;
const PAD = { top: 20, right: 10, bottom: 28, left: 32 };

export function TicketsChart({
  points,
  onSelect,
}: {
  points: DayPoint[];
  /** Klik op een staaf → dagdetail in de pagina. */
  onSelect?: (point: DayPoint) => void;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 280);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...points.map((p) => p.value)) * 1.15;
  const avg = points.reduce((a, p) => a + p.value, 0) / points.length;

  const band = innerW / points.length;
  const barW = Math.min(24, Math.max(2, band - 2)); // 2px surface-gap tussen staven
  const x = (i: number) => PAD.left + i * band + (band - barW) / 2;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const baseline = PAD.top + innerH;

  const yTicks = [0, Math.round(max / 2 / 5) * 5, Math.round(max / 5) * 5].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );
  const xTicks = tickIndices(points.length, 5);
  const last = points.length - 1;

  const hovered = hover !== null ? points[hover] : null;
  const avgDelta = hovered ? Math.round(((hovered.value - avg) / avg) * 100) : null;

  // Kolomindex rechtstreeks uit de muispositie, zodat de klik ook zonder
  // voorafgaande hover werkt (touch).
  const indexAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    if (px < 0 || px > innerW) return null;
    return Math.max(0, Math.min(points.length - 1, Math.floor(px / band)));
  };

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg
          width={w}
          height={H}
          role="img"
          aria-label="Tickets per dag"
          onPointerLeave={() => setHover(null)}
          onClick={(e) => {
            const i = indexAt(e);
            if (i !== null) onSelect?.(points[i]);
          }}
          className={onSelect ? "cursor-pointer" : undefined}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? "var(--baseline)" : "var(--grid)"}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 3.5}
                fontSize="11"
                fill="var(--ink-muted)"
                textAnchor="end"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t}
              </text>
            </g>
          ))}

          {/* zachte band achter de kolom waar de muis staat */}
          {hover !== null && (
            <rect
              x={PAD.left + hover * band}
              y={PAD.top}
              width={band}
              height={innerH}
              rx="6"
              fill="var(--accent)"
              opacity="0.08"
            />
          )}

          {/* staven: 4px afgeronde datakant, groeien vanaf de basislijn */}
          <g
            key={`bars-${points.length}`}
            className="anim-grow"
            style={{ transformOrigin: `0px ${baseline}px` }}
          >
            {points.map((p, i) => {
              const barH = Math.max(1, baseline - y(p.value));
              const r = Math.min(4, barW / 2, barH);
              return (
                <path
                  key={p.date.getTime()}
                  d={`M${x(i)},${baseline}v${-(barH - r)}q0,${-r} ${r},${-r}h${barW - 2 * r}q${r},0 ${r},${r}v${barH - r}z`}
                  fill="var(--accent)"
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              );
            })}
          </g>

          {/* hit-targets los van de geanimeerde staven, zodat hover meteen klopt */}
          {points.map((p, i) => (
            <rect
              key={p.date.getTime()}
              x={PAD.left + i * band}
              y={PAD.top}
              width={band}
              height={innerH}
              fill="transparent"
              onPointerMove={() => setHover(i)}
            />
          ))}

          {/* referentielijn: 12-weeks gemiddelde (gestippeld = drempel, geen grid) */}
          <g className="anim-fade" style={{ animationDelay: "0.55s" }}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={y(avg)}
              y2={y(avg)}
              stroke="var(--ink-muted)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <text
              x={PAD.left + innerW - 4}
              y={y(avg) - 5}
              fontSize="10.5"
              fill="var(--ink-muted)"
              textAnchor="end"
              stroke="var(--surface)"
              strokeWidth="3"
              style={{ paintOrder: "stroke" }}
            >
              gemiddelde
            </text>
          </g>

          {/* x-as: gelijkmatig verdeelde datumlabels */}
          {xTicks.map((i) => (
            <text
              key={i}
              x={x(i) + barW / 2}
              y={H - 8}
              fontSize="11"
              fill="var(--ink-muted)"
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            >
              {points[i].label}
            </text>
          ))}
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[136px] rounded-xl border border-edge bg-raised/95 px-3 py-2.5 shadow-lg backdrop-blur"
          style={{
            left: Math.min(Math.max(x(hover) - 48, 0), w - 156),
            top: Math.max(y(hovered.value) - 84, 4),
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
              {hovered.value} tickets
            </span>
            {avgDelta !== null && (
              <span
                className={`text-[11px] font-medium ${
                  avgDelta <= 0 ? "text-delta-good" : "text-delta-bad"
                }`}
              >
                {avgDelta >= 0 ? "+" : ""}
                {avgDelta}% vs gemiddelde
              </span>
            )}
          </div>
          {onSelect && (
            <div className="mt-1 text-[10px] text-ink-muted">Klik voor dagdetail</div>
          )}
        </div>
      )}
    </div>
  );
}
