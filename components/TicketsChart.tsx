"use client";

// Tickets als kalender-heatmap: rijen zijn weken, kolommen zijn weekdagen.
// De kleurintensiteit draagt de drukte, piekdagen lichten amber op — zo zie
// je in één oogopslag wéékpatronen (drukke zaterdagen, rustige maandagen)
// die een lijn of staaf nooit laat zien. Bewust een heel andere stijl dan de
// omzetgrafiek.

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { number } from "@/lib/data";
import { DeltaPill } from "./RevenueChart";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 26, right: 8, bottom: 6, left: 44 };

// Dagen die zoveel boven het periodegemiddelde liggen, markeren we als piekdag.
const SPIKE_THRESHOLD = 1.3;

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

// ma=0 … zo=6 (Date.getDay heeft zondag op 0)
const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

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

  const w = Math.max(width, 280);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const avg = values.reduce((a, v) => a + v, 0) / (values.length || 1);

  // Rasterindeling: dag i → kolom = weekdag, rij = weeknummer sinds start.
  const offset = weekdayIndex(points[0].date);
  const rows = Math.ceil((offset + points.length) / 7);
  const col = (i: number) => (offset + i) % 7;
  const row = (i: number) => Math.floor((offset + i) / 7);

  // Compacte rasters bij veel weken (90 dagen), luchtig bij weinig (7/30).
  const gap = rows > 8 ? 3 : 5;
  const cellW = (innerW - gap * 6) / 7;
  const cellH = (innerH - gap * (rows - 1)) / rows;
  const radius = Math.min(6, cellH / 3, cellW / 3);
  const cx = (i: number) => PAD.left + col(i) * (cellW + gap);
  const cy = (i: number) => PAD.top + row(i) * (cellH + gap);

  const spikes = points.filter((p) => p.value >= avg * SPIKE_THRESHOLD).length;
  const isSpike = (v: number) => v >= avg * SPIKE_THRESHOLD;
  // Intensiteit: rustige dagen bijna transparant, drukke dagen vol.
  const heat = (v: number) => 0.18 + 0.82 * ((v - min) / span);

  // Rijlabel: de eerste dag die in die week valt (niet elke rij bij 90 dagen).
  const rowLabelEvery = rows > 8 ? Math.ceil(rows / 6) : 1;
  const rowLabels = Array.from({ length: rows }, (_, r) => {
    if (r % rowLabelEvery !== 0) return null;
    const firstInRow = points.findIndex((_, i) => row(i) === r);
    return firstInRow === -1 ? null : points[firstInRow].label;
  });

  const hovered = hover !== null ? points[hover] : null;
  const avgDelta = hovered ? Math.round(((hovered.value - avg) / avg) * 100) : null;
  const total = values.reduce((a, v) => a + v, 0);

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
            tickets · {hovered.label} ({WEEKDAYS[weekdayIndex(hovered.date)]})
            {avgDelta !== null && <DeltaPill delta={avgDelta} upIsGood={false} />}
            <span className="hidden sm:inline">vs gemiddelde</span>
            {onSelect && <span className="hidden sm:inline">· klik voor dagdetail</span>}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            tickets · afgelopen {points.length} dagen
            {spikes > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-[3px]"
                  style={{ background: "var(--serious)" }}
                />
                {spikes} {spikes === 1 ? "piekdag" : "piekdagen"}
              </span>
            )}
            <span className="ml-1 hidden items-center gap-1 sm:flex" aria-hidden>
              <span className="text-[10px]">rustig</span>
              {[0.2, 0.45, 0.7, 1].map((o) => (
                <span
                  key={o}
                  className="inline-block h-2 w-2 rounded-[3px]"
                  style={{ background: "var(--accent)", opacity: o }}
                />
              ))}
              <span className="text-[10px]">druk</span>
            </span>
          </span>
        )}
      </div>

      {width > 0 && (
        <svg
          width={w}
          height={H}
          role="img"
          aria-label="Tickets per dag (kalender-heatmap)"
          onPointerLeave={() => setHover(null)}
          className={onSelect ? "cursor-pointer" : undefined}
        >
          {/* kolomkoppen: weekdagen */}
          {WEEKDAYS.map((d, c) => (
            <text
              key={d}
              x={PAD.left + c * (cellW + gap) + cellW / 2}
              y={PAD.top - 10}
              fontSize="10.5"
              fill={c >= 5 ? "var(--ink-secondary)" : "var(--ink-muted)"}
              fontWeight={c >= 5 ? 600 : 400}
              textAnchor="middle"
            >
              {d}
            </text>
          ))}

          {/* rijlabels: eerste dag van de week */}
          {rowLabels.map((label, r) =>
            label ? (
              <text
                key={r}
                x={PAD.left - 8}
                y={PAD.top + r * (cellH + gap) + cellH / 2 + 3.5}
                fontSize="10.5"
                fill="var(--ink-muted)"
                textAnchor="end"
              >
                {label}
              </text>
            ) : null
          )}

          {/* cellen: golvende entrance per rij, intensiteit = drukte */}
          {points.map((p, i) => {
            const spike = isSpike(p.value);
            const active = hover === i;
            return (
              <rect
                key={p.date.getTime()}
                x={cx(i)}
                y={cy(i)}
                width={cellW}
                height={cellH}
                rx={radius}
                fill={spike ? "var(--serious)" : "var(--accent)"}
                fillOpacity={spike ? 0.9 : heat(p.value)}
                stroke={active ? "var(--ink)" : "none"}
                strokeWidth={active ? 2 : 0}
                className="anim-fade"
                style={{
                  animationDelay: `${row(i) * 60 + col(i) * 18}ms`,
                  transition: "fill-opacity 0.15s ease",
                }}
                onPointerMove={() => setHover(i)}
                onClick={() => onSelect?.(p)}
              >
                <title>{`${p.label}: ${p.value} tickets`}</title>
              </rect>
            );
          })}
        </svg>
      )}
    </div>
  );
}
