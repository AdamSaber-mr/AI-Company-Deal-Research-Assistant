"use client";

// Tickets als lollipop-tijdlijn: een dun steeltje met een bol per dag.
// Luchtig en direct leesbaar (tijd van links naar rechts), en bewust een
// ander karakter dan de vloeiende omzetlijn. Piekdagen — opvallend boven het
// periodegemiddelde — kleuren amber zodat je meteen ziet wáár het druk was.

import { useState } from "react";
import type { DayPoint } from "@/lib/data";
import { number } from "@/lib/data";
import { tickIndices } from "./chart-utils";
import { DeltaPill } from "./RevenueChart";
import { useSize } from "./useSize";

const H = 240;
const PAD = { top: 18, right: 10, bottom: 28, left: 10 };

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

  const w = Math.max(width, 280);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = points.map((p) => p.value);
  const max = Math.max(...values) * 1.15;
  const avg = values.reduce((a, v) => a + v, 0) / (values.length || 1);
  const isSpike = (v: number) => v >= avg * SPIKE_THRESHOLD;
  const spikes = values.filter(isSpike).length;

  const band = innerW / points.length;
  const x = (i: number) => PAD.left + i * band + band / 2;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const baseline = PAD.top + innerH;

  // Maten schalen mee met de dichtheid: luchtig bij 7 dagen, fijn bij 90.
  const dotR = Math.max(2.5, Math.min(5.5, band * 0.24));
  const stemW = Math.max(1.5, Math.min(3, band * 0.11));

  const xTicks = tickIndices(points.length, 5);
  const last = points.length - 1;

  // Kolomindex rechtstreeks uit de muispositie, zodat de klik ook zonder
  // voorafgaande hover werkt (touch).
  const indexAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    return Math.max(0, Math.min(points.length - 1, Math.floor(px / band)));
  };

  const hovered = hover !== null ? points[hover] : null;
  const avgDelta = hovered ? Math.round(((hovered.value - avg) / avg) * 100) : null;
  const total = values.reduce((a, v) => a + v, 0);

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
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--serious)" }}
                />
                {spikes} {spikes === 1 ? "piekdag" : "piekdagen"}
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
          aria-label="Tickets per dag"
          onPointerMove={(e) => setHover(indexAt(e))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => onSelect?.(points[indexAt(e)])}
          className={onSelect ? "cursor-pointer" : undefined}
        >
          {/* referentielijn: periodegemiddelde — subtiel, geen grid */}
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

          {/* basislijn */}
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={baseline}
            y2={baseline}
            stroke="var(--grid)"
            strokeWidth="1"
          />

          {/* steeltjes groeien vanaf de basislijn */}
          <g
            key={`stems-${points.length}`}
            className="anim-grow"
            style={{ transformOrigin: `0px ${baseline}px` }}
          >
            {points.map((p, i) => {
              const spike = isSpike(p.value);
              const active = hover === i;
              const dim = hover !== null && !active;
              return (
                <line
                  key={p.date.getTime()}
                  x1={x(i)}
                  x2={x(i)}
                  y1={baseline}
                  y2={y(p.value) + dotR}
                  stroke={spike ? "var(--serious)" : "var(--accent)"}
                  strokeWidth={stemW}
                  strokeLinecap="round"
                  opacity={dim ? 0.18 : spike ? 0.55 : 0.35}
                  style={{ transition: "opacity 0.15s ease" }}
                />
              );
            })}
          </g>

          {/* bollen op de waarde, ná het groeien van de steeltjes */}
          <g
            key={`dots-${points.length}`}
            className="anim-fade"
            style={{ animationDelay: "0.45s" }}
          >
            {points.map((p, i) => {
              const spike = isSpike(p.value);
              const active = hover === i;
              const dim = hover !== null && !active;
              return (
                <circle
                  key={p.date.getTime()}
                  cx={x(i)}
                  cy={y(p.value)}
                  r={active ? dotR + 1.5 : dotR}
                  fill={spike ? "var(--serious)" : "var(--accent)"}
                  stroke="var(--surface)"
                  strokeWidth={active ? 2 : 1.25}
                  opacity={dim ? 0.35 : 1}
                  style={{ transition: "opacity 0.15s ease, r 0.15s ease" }}
                />
              );
            })}
          </g>

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
        </svg>
      )}
    </div>
  );
}
