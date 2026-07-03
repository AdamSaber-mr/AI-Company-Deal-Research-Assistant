"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 16, right: 8, bottom: 26, left: 30 };

export function TicketsChart({ points }: { points: DayPoint[] }) {
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

  const yTicks = [0, Math.round(max / 2 / 5) * 5, Math.round(max / 5) * 5].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );

  const hovered = hover !== null ? points[hover] : null;
  const last = points.length - 1;

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={w} height={H} role="img" aria-label="Tickets per dag" onPointerLeave={() => setHover(null)}>
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

          {/* staven: 4px afgeronde datakant, vlak op de basislijn */}
          {points.map((p, i) => {
            const barH = Math.max(1, PAD.top + innerH - y(p.value));
            const r = Math.min(4, barW / 2, barH);
            const top = y(p.value);
            return (
              <g key={p.date.getTime()}>
                <path
                  d={`M${x(i)},${PAD.top + innerH}v${-(barH - r)}q0,${-r} ${r},${-r}h${barW - 2 * r}q${r},0 ${r},${r}v${barH - r}z`}
                  fill="var(--accent)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
                {/* hit-target groter dan de staaf zelf */}
                <rect
                  x={PAD.left + i * band}
                  y={PAD.top}
                  width={band}
                  height={innerH}
                  fill="transparent"
                  onPointerMove={() => setHover(i)}
                />
              </g>
            );
          })}

          {/* referentielijn: 12-weeks gemiddelde */}
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={y(avg)}
            y2={y(avg)}
            stroke="var(--ink-muted)"
            strokeWidth="1"
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

          <text x={PAD.left} y={H - 8} fontSize="11" fill="var(--ink-muted)">
            {points[0].label}
          </text>
          <text x={PAD.left + innerW} y={H - 8} fontSize="11" fill="var(--ink-muted)" textAnchor="end">
            {points[last].label}
          </text>
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-edge bg-raised px-3 py-2 shadow-sm"
          style={{
            left: Math.min(Math.max(x(hover) - 40, 0), w - 130),
            top: y(hovered.value) - 60,
          }}
        >
          <div className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {hovered.value} tickets
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-secondary">
            <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: "var(--accent)" }} />
            {hovered.label}
          </div>
        </div>
      )}
    </div>
  );
}
