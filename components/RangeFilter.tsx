"use client";

import { RANGES, type RangeKey } from "@/lib/data";

export function RangeFilter({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Periode">
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-ink text-page"
                : "text-ink-secondary hover:bg-accent-track/60"
            }`}
            aria-pressed={active}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
