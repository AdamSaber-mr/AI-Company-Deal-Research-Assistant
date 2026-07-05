"use client";

// Tickets als dikke lollipop-tijdlijn: een stevige afgeronde steel met een
// bol erop. Bij langere periodes bundelen we dagen (30 dagen → per 2 dagen,
// 90 dagen → per week) zodat er minder, veel dikkere lollipops staan — direct
// leesbaar. Piekmomenten kleuren amber.

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { number } from "@/lib/data";
import { tickIndices } from "./chart-utils";
import { DeltaPill } from "./RevenueChart";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 18, right: 10, bottom: 28, left: 10 };

// Dagen die zoveel boven het periodegemiddelde liggen, markeren we als piek.
const SPIKE_THRESHOLD = 1.3;

type Bucket = {
  label: string;
  value: number; // totaal tickets in de bucket
  days: number;
  peak: DayPoint; // drukste dag — doel van de dagdetail-klik
  spike: boolean;
};

// Bundel de dagen tot maximaal ~16 lollipops: 1, 2 of 7 dagen per stuk.
function bucketize(points: DayPoint[], avg: number): Bucket[] {
  const size = points.length <= 16 ? 1 : points.length <= 42 ? 2 : 7;
  const buckets: Bucket[] = [];
  for (let start = 0; start < points.length; start += size) {
    const slice = points.slice(start, start + size);
    const peak = slice.reduce((a, b) => (b.value > a.value ? b : a));
    buckets.push({
      label:
        slice.length === 1
          ? slice[0].label
          : `${slice[0].label} – ${slice[slice.length - 1].label}`,
      value: slice.reduce((a, p) => a + p.value, 0),
      days: slice.length,
      peak,
      spike: peak.value >= avg * SPIKE_THRESHOLD,
    });
  }
  return buckets;
}

export function TicketsChart({
  points,
  onSelect,
}: {
  points: DayPoint[];
  /** Klik op een lollipop → dagdetail van de drukste dag erin. */
  onSelect?: (point: DayPoint) => void;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 280);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = points.map((p) => p.value);
  const avg = values.reduce((a, v) => a + v, 0) / (values.length || 1);
  const total = values.reduce((a, v) => a + v, 0);
  const spikeDays = values.filter((v) => v >= avg * SPIKE_THRESHOLD).length;

  const buckets = bucketize(points, avg);
  const n = buckets.length;
  const max = Math.max(...buckets.map((b) => b.value)) * 1.12;

  const band = innerW / n;
  const x = (i: number) => PAD.left + i * band + band / 2;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const baseline = PAD.top + innerH;

  // Dik en stevig: de steel vult een flink deel van de band.
  const stemW = Math.max(8, Math.min(22, band * 0.42));
  const dotR = stemW * 0.78;

  const xTicks = tickIndices(n, Math.min(5, n));
  const last = n - 1;

  // Kolomindex rechtstreeks uit de muispositie, zodat de klik ook zonder
  // voorafgaande hover werkt (touch).
  const indexAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    return Math.max(0, Math.min(n - 1, Math.floor(px / band)));
  };

  const hovered = hover !== null ? buckets[hover] : null;
  // Delta t.o.v. het gemiddelde over hetzelfde aantal dagen.
  const hoverDelta = hovered
    ? Math.round(((hovered.value - avg * hovered.days) / (avg * hovered.days)) * 100)
    : null;

  const unitLabel =
    buckets[0].days === 1 ? "per dag" : buckets[0].days === 2 ? "per 2 dagen" : "per week";

  return (
    <div ref={ref} className="relative">
      {/* Kop (Revolut-patroon): groot aantal dat live meebeweegt met de muis */}
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
            {hoverDelta !== null && <DeltaPill delta={hoverDelta} upIsGood={false} />}
            <span className="hidden sm:inline">vs gemiddelde</span>
            {onSelect && <span className="hidden sm:inline">· klik voor dagdetail</span>}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            tickets · afgelopen {points.length} dagen · {unitLabel}
            {spikeDays > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--serious)" }}
                />
                {spikeDays} {spikeDays === 1 ? "piekdag" : "piekdagen"}
              </span>
            )}
          </span>
        )}
      </div>

      {width > 0 && (
        <svg
          width={w}
          height={H}
          role="img"
          aria-label={`Tickets ${unitLabel}`}
          onPointerMove={(e) => setHover(indexAt(e))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => onSelect?.(buckets[indexAt(e)].peak)}
          className={onSelect ? "cursor-pointer" : undefined}
        >
          {/* basislijn */}
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={baseline}
            y2={baseline}
            stroke="var(--grid)"
            strokeWidth="1"
          />

          {/* stelen groeien vanaf de basislijn */}
          <g
            key={`stems-${n}`}
            className="anim-grow"
            style={{ transformOrigin: `0px ${baseline}px` }}
          >
            {buckets.map((b, i) => {
              const active = hover === i;
              const dim = hover !== null && !active;
              return (
                <line
                  key={b.label}
                  x1={x(i)}
                  x2={x(i)}
                  y1={baseline}
                  y2={y(b.value) + dotR * 0.4}
                  stroke={b.spike ? "var(--serious)" : "var(--accent)"}
                  strokeWidth={stemW}
                  strokeLinecap="round"
                  opacity={dim ? 0.25 : b.spike ? 0.8 : 0.55}
                  style={{ transition: "opacity 0.15s ease" }}
                />
              );
            })}
          </g>

          {/* bollen op de waarde, ná het groeien van de stelen */}
          <g
            key={`dots-${n}`}
            className="anim-fade"
            style={{ animationDelay: "0.45s" }}
          >
            {buckets.map((b, i) => {
              const active = hover === i;
              const dim = hover !== null && !active;
              return (
                <circle
                  key={b.label}
                  cx={x(i)}
                  cy={y(b.value)}
                  r={active ? dotR + 2 : dotR}
                  fill={b.spike ? "var(--serious)" : "var(--accent)"}
                  stroke="var(--surface)"
                  strokeWidth="2.5"
                  opacity={dim ? 0.4 : 1}
                  style={{ transition: "opacity 0.15s ease" }}
                />
              );
            })}
          </g>

          {/* x-as: gelijkmatig verdeelde labels (eerste dag van de bucket) */}
          {xTicks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              fontSize="11"
              fill="var(--ink-muted)"
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            >
              {buckets[i].label.split(" – ")[0]}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
