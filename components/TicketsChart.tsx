"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { tickIndices } from "./chart-utils";
import { useSize } from "./useSize";

const H = 260;
const PAD = { top: 24, right: 8, bottom: 30, left: 8 };

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

  const max = Math.max(...points.map((p) => p.value)) * 1.12;
  const avg = points.reduce((a, p) => a + p.value, 0) / points.length;

  const band = innerW / points.length;
  // Ruime tussenruimte (Revolut-achtig): staaf vult ~62% van de band.
  const barW = Math.min(26, Math.max(3, band * 0.62));
  const x = (i: number) => PAD.left + i * band + (band - barW) / 2;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const baseline = PAD.top + innerH;

  const xTicks = tickIndices(points.length, 5);
  const last = points.length - 1;

  // Eén staaf springt eruit: die onder de muis, anders de meest recente dag.
  const focus = hover !== null ? hover : last;

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

  // Volledig afgeronde top (pill), begrensd door staafbreedte en -hoogte.
  const barPath = (i: number, v: number) => {
    const barH = Math.max(2, baseline - y(v));
    const r = Math.min(barW / 2, barH);
    return `M${x(i)},${baseline}v${-(barH - r)}q0,${-r} ${r},${-r}h${barW - 2 * r}q${r},0 ${r},${r}v${barH - r}z`;
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
          {/* referentielijn: 12-weeks gemiddelde — heel subtiel, geen grid */}
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

          {/* staven: rustige tint, alleen de focus-staaf in vol accent */}
          <g
            key={`bars-${points.length}`}
            className="anim-grow"
            style={{ transformOrigin: `0px ${baseline}px` }}
          >
            {points.map((p, i) => (
              <path
                key={p.date.getTime()}
                d={barPath(i, p.value)}
                fill={i === focus ? "var(--accent)" : "var(--accent-soft)"}
                opacity={hover === null || i === focus ? 1 : 0.5}
                style={{ transition: "opacity 0.18s ease, fill 0.18s ease" }}
              />
            ))}
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
          className="anim-pop pointer-events-none absolute z-10 min-w-[132px] rounded-xl border border-edge bg-raised/95 px-3 py-2.5 shadow-lg backdrop-blur"
          style={{
            left: Math.min(Math.max(x(hover) + barW / 2 - 66, 0), w - 152),
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
