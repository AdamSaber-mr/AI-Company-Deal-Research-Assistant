"use client";

import { useState } from "react";
import {
  RANGES,
  type RangeKey,
  revenue90,
  lastDays,
  sum,
  periodDelta,
  euro,
} from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { RangeFilter } from "@/components/RangeFilter";
import { StatTile } from "@/components/StatTile";
import { RevenueChart } from "@/components/RevenueChart";

export default function OmzetPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)!.days;

  const revenue = lastDays(revenue90, days);
  const total = sum(revenue);
  const best = revenue.reduce((a, p) => (p.value > a.value ? p : a));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Omzet"
        subtitle="Dagelijkse omzet, vergeleken met de vorige periode."
      />
      <RangeFilter value={range} onChange={setRange} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Totale omzet"
          value={euro.format(total)}
          delta={periodDelta(revenue90, days)}
          deltaLabel="vs vorige periode"
          trend={lastDays(revenue90, 12).map((p) => p.value)}
        />
        <StatTile label="Gemiddeld per dag" value={euro.format(Math.round(total / days))} />
        <StatTile label="Beste dag" value={euro.format(best.value)} />
        <StatTile label="Datum beste dag" value={best.label} />
      </div>

      <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Omzet per dag</h2>
          <span className="text-xs text-ink-muted">in euro&apos;s</span>
        </div>
        <div className="mt-3">
          <RevenueChart points={revenue} />
        </div>
      </section>
    </div>
  );
}
