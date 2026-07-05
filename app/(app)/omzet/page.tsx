"use client";

import { useState } from "react";
import { useRangeSetting } from "@/lib/useSettings";
import {
  RANGES,
  revenue90,
  revenue365,
  lastDays,
  sum,
  periodDelta,
  euro,
  type DayPoint,
  type RangeKey,
} from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { RangeFilter } from "@/components/RangeFilter";
import { StatTile } from "@/components/StatTile";
import { RevenueChart } from "@/components/RevenueChart";
import { Switch } from "@/components/Switch";
import { ExportCsvButton } from "@/components/ExportCsv";
import { DayDetail } from "@/components/DayDetail";

export default function OmzetPage() {
  const [range, setRange] = useRangeSetting();
  const [compareOn, setCompareOn] = useState(false);
  const [selected, setSelected] = useState<DayPoint | null>(null);
  const days = RANGES.find((r) => r.key === range)!.days;

  const revenue = lastDays(revenue90, days);
  const total = sum(revenue);
  const best = revenue.reduce((a, p) => (p.value > a.value ? p : a));

  // Vorige periode van gelijke lengte uit de jaarreeks.
  const previous = revenue365.slice(-days * 2, -days);

  const changeRange = (key: RangeKey) => {
    setSelected(null);
    setRange(key);
  };

  return (
    <div className="stagger mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Omzet"
        subtitle="Dagelijkse omzet, vergeleken met de vorige periode."
      />
      <RangeFilter value={range} onChange={changeRange} />

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Omzet per dag</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-ink-secondary">
              {compareOn && (
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, var(--accent-soft) 0 4px, transparent 4px 7px)",
                  }}
                />
              )}
              Vergelijk vorige periode
              <Switch
                checked={compareOn}
                onChange={setCompareOn}
                label="Vergelijk met vorige periode"
              />
            </label>
            <ExportCsvButton
              filename={`omzet-${days}-dagen.csv`}
              header={["datum", "omzet"]}
              rows={revenue.map((p) => [p.label, p.value])}
            />
          </div>
        </div>
        <div className="mt-3">
          <RevenueChart
            points={revenue}
            compare={compareOn ? previous : undefined}
            onSelect={setSelected}
          />
        </div>
        {selected ? (
          <DayDetail
            point={selected}
            series={revenue365}
            periodAvg={total / days}
            format={(v) => euro.format(v)}
            onClose={() => setSelected(null)}
          />
        ) : (
          <p className="mt-3 text-xs text-ink-muted">
            Tip: klik op een punt in de grafiek voor het dagdetail.
          </p>
        )}
      </section>
    </div>
  );
}
