import { monotonePath } from "./chart-utils";

type StatTileProps = {
  label: string;
  value: string;
  delta?: number; // % t.o.v. vorige periode
  deltaLabel?: string;
  upIsGood?: boolean;
  trend?: number[]; // 12 punten
};

function Sparkline({ points }: { points: number[] }) {
  const w = 96;
  const h = 28;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const xs = points.map((_, i) => x(i));
  const line = monotonePath(xs, points.map(y));
  const last = points.length - 1;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {/* één strakke, vloeiende accent-lijn met een subtiel eindpunt */}
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(last)}
        cy={y(points[last])}
        r="2.4"
        fill="var(--accent)"
        stroke="var(--surface)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function StatTile({ label, value, delta, deltaLabel, upIsGood = true, trend }: StatTileProps) {
  const up = (delta ?? 0) >= 0;
  const good = delta === undefined ? true : up === upIsGood;
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 flex flex-col gap-3">
      <div className="text-sm text-ink-secondary">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-[1.75rem] leading-none font-semibold tracking-tight">{value}</div>
        {trend && <Sparkline points={trend} />}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-flex items-center gap-0.5 font-semibold"
            style={{ color: good ? "var(--delta-good)" : "var(--delta-bad)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path
                d={up ? "M5 1.5v7M2 4.5l3-3 3 3" : "M5 1.5v7M2 5.5l3 3 3-3"}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {up ? "+" : ""}
            {delta.toLocaleString("nl-NL")}%
          </span>
          <span className="text-ink-muted">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
