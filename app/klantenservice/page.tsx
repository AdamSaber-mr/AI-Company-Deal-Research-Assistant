"use client";

import { useState } from "react";
import { useRangeSetting } from "@/lib/useSettings";
import {
  RANGES,
  tickets90,
  tickets365,
  lastDays,
  sum,
  periodDelta,
  number,
  ticketCategories,
  type DayPoint,
  type RangeKey,
} from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { RangeFilter } from "@/components/RangeFilter";
import { StatTile } from "@/components/StatTile";
import { TicketsChart } from "@/components/TicketsChart";
import { SeverityIcon } from "@/components/severity";
import { ExportCsvButton } from "@/components/ExportCsv";
import { DayDetail } from "@/components/DayDetail";

export default function KlantenservicePage() {
  const [range, setRange] = useRangeSetting();
  const [selected, setSelected] = useState<DayPoint | null>(null);
  const days = RANGES.find((r) => r.key === range)!.days;

  const changeRange = (key: RangeKey) => {
    setSelected(null);
    setRange(key);
  };

  const tickets = lastDays(tickets90, days);

  const baseline = tickets90.slice(0, -7);
  const avgBase = sum(baseline) / baseline.length;
  const avgWeek = sum(lastDays(tickets90, 7)) / 7;
  const spike = Math.round(((avgWeek - avgBase) / avgBase) * 100);

  const maxCat = Math.max(...ticketCategories.map((c) => c.count));

  return (
    <div className="stagger mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Klantenservice"
        subtitle="Binnengekomen tickets en waar ze over gaan."
      />
      <RangeFilter value={range} onChange={changeRange} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Tickets deze periode"
          value={number.format(sum(tickets))}
          delta={periodDelta(tickets90, days)}
          deltaLabel="vs vorige periode"
          upIsGood={false}
          trend={lastDays(tickets90, 12).map((p) => p.value)}
        />
        <StatTile label="Gemiddeld per dag" value={number.format(Math.round(sum(tickets) / days))} />
        <StatTile
          label="Piek deze week"
          value={`+${spike}%`}
          deltaLabel="t.o.v. 12-weeks gemiddelde"
        />
        <StatTile label="Openstaande bezorgklachten" value="12" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Tickets per dag</h2>
            <div className="flex items-center gap-3">
              {spike >= 15 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                  <SeverityIcon severity="serious" size={13} />
                  +{spike}% deze week
                </span>
              )}
              <ExportCsvButton
                filename={`tickets-${days}-dagen.csv`}
                header={["datum", "tickets"]}
                rows={tickets.map((p) => [p.label, p.value])}
              />
            </div>
          </div>
          <div className="mt-3">
            <TicketsChart points={tickets} onSelect={setSelected} />
          </div>
          {selected && (
            <DayDetail
              point={selected}
              series={tickets365}
              periodAvg={sum(tickets) / days}
              format={(v) => `${number.format(v)} tickets`}
              upIsGood={false}
              onClose={() => setSelected(null)}
            />
          )}
        </section>

        <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Onderwerpen deze week</h2>
            <span className="text-xs text-ink-muted">aantal tickets</span>
          </div>
          <ul className="mt-4 flex flex-col gap-3.5">
            {ticketCategories.map((c) => {
              const elevated = c.deltaVsNormal >= 25;
              return (
                <li key={c.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      {elevated && <SeverityIcon severity="serious" size={13} />}
                      {c.name}
                    </span>
                    <span
                      className="text-xs text-ink-secondary"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {c.count} ·{" "}
                      <span className={elevated ? "font-semibold" : ""}>
                        {c.deltaVsNormal >= 0 ? "+" : ""}
                        {c.deltaVsNormal}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-track">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.count / maxCat) * 100}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
