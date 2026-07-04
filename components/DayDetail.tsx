"use client";

import { longDate, type DayPoint } from "@/lib/data";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Detailkaart voor één aangeklikte dag in een grafiek (drill-down). */
export function DayDetail({
  point,
  series,
  periodAvg,
  format,
  upIsGood = true,
  onClose,
}: {
  point: DayPoint;
  /** Volledige reeks (90 dagen) voor de week-eerder-vergelijking. */
  series: DayPoint[];
  periodAvg: number;
  format: (value: number) => string;
  upIsGood?: boolean;
  onClose: () => void;
}) {
  const weekEarlier = series.find(
    (p) => p.date.getTime() === point.date.getTime() - 7 * DAY_MS
  );
  const vsAvg =
    periodAvg > 0 ? Math.round(((point.value - periodAvg) / periodAvg) * 100) : 0;
  const vsWeek =
    weekEarlier && weekEarlier.value > 0
      ? Math.round(((point.value - weekEarlier.value) / weekEarlier.value) * 100)
      : null;

  const deltaClass = (delta: number) =>
    (delta >= 0) === upIsGood ? "text-delta-good" : "text-delta-bad";
  const fmtDelta = (delta: number) => `${delta > 0 ? "+" : ""}${delta}%`;

  return (
    <div className="mt-4 rounded-xl border border-edge bg-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold capitalize">
          {longDate.format(point.date)}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dagdetail sluiten"
          title="Sluiten"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-accent-track/40 hover:text-ink"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-ink-muted">Waarde</div>
          <div
            className="mt-0.5 text-sm font-semibold"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {format(point.value)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">t.o.v. periodegemiddelde</div>
          <div className={`mt-0.5 text-sm font-semibold ${deltaClass(vsAvg)}`}>
            {fmtDelta(vsAvg)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">t.o.v. week eerder</div>
          <div
            className={`mt-0.5 text-sm font-semibold ${
              vsWeek === null ? "text-ink-muted" : deltaClass(vsWeek)
            }`}
          >
            {vsWeek === null ? "—" : fmtDelta(vsWeek)}
          </div>
        </div>
      </div>
    </div>
  );
}
