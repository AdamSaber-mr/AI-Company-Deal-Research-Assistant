"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { euro } from "@/lib/data";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 16, right: 72, bottom: 26, left: 8 };

function niceCeil(v: number): number {
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (v <= m * mag) return m * mag;
  }
  return 10 * mag;
}

export function RevenueChart({ points }: { points: DayPoint[] }) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 320);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = niceCeil(Math.max(...points.map((p) => p.value)));
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join("");
  const area = `${line}L${x(points.length - 1)},${PAD.top + innerH}L${x(0)},${PAD.top + innerH}Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const last = points.length - 1;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / innerW) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const hovered = hover !== null ? points[hover] : null;

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg
          width={w}
          height={H}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Omzet per dag"
        >
          {/* gridlijnen + y-as ticks */}
          {ticks.map((t) => (
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
                x={w - PAD.right + 8}
                y={y(t) + 3.5}
                fontSize="11"
                fill="var(--ink-muted)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t >= 1000 ? `${(t / 1000).toLocaleString("nl-NL")}K` : t}
              </text>
            </g>
          ))}

          {/* x-as: eerste en laatste datum */}
          <text x={PAD.left} y={H - 8} fontSize="11" fill="var(--ink-muted)">
            {points[0].label}
          </text>
          <text x={PAD.left + innerW} y={H - 8} fontSize="11" fill="var(--ink-muted)" textAnchor="end">
            {points[last].label}
          </text>

          {/* vlakvulling als wash + 2px lijn */}
          <path d={area} fill="var(--accent)" opacity="0.1" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* crosshair */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--baseline)"
              strokeWidth="1"
            />
          )}
          {hover !== null && (
            <circle cx={x(hover)} cy={y(points[hover].value)} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
          )}

          {/* eindpunt met surface-ring + direct label */}
          <circle cx={x(last)} cy={y(points[last].value)} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
          <text
            x={x(last) + 10}
            y={y(points[last].value) - 8}
            fontSize="12"
            fontWeight="600"
            fill="var(--ink)"
          >
            {euro.format(points[last].value)}
          </text>
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-edge bg-raised px-3 py-2 shadow-sm"
          style={{
            left: Math.min(x(hover) + 12, w - 150),
            top: y(hovered.value) - 56,
          }}
        >
          <div className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {euro.format(hovered.value)}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-secondary">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: "var(--accent)" }} />
            Omzet · {hovered.label}
          </div>
        </div>
      )}
    </div>
  );
}
