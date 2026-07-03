"use client";

import { useState } from "react";
import {
  RANGES,
  type RangeKey,
  revenue90,
  tickets90,
  lastDays,
  sum,
  periodDelta,
  euro,
  number,
  inventory,
  staffing,
} from "@/lib/data";
import { StatTile } from "./StatTile";
import { RevenueChart } from "./RevenueChart";
import { TicketsChart } from "./TicketsChart";
import { SeverityIcon } from "./severity";

export function Dashboard() {
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)!.days;

  const revenue = lastDays(revenue90, days);
  const tickets = lastDays(tickets90, days);

  const revenueDelta = periodDelta(revenue90, days);
  const ticketsDelta = periodDelta(tickets90, days);

  const criticalStock = inventory.filter((p) => p.daysLeft <= 7).length;
  const present = staffing.reduce((a, d) => a + d.present, 0);
  const planned = staffing.reduce((a, d) => a + d.planned, 0);

  // Piek-detectie: deze week vergeleken met de baseline vóór deze week
  const baseline = tickets90.slice(0, -7);
  const avgBase = sum(baseline) / baseline.length;
  const avgWeek = sum(lastDays(tickets90, 7)) / 7;
  const spike = Math.round(((avgWeek - avgBase) / avgBase) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Filterrij: één rij, links uitgelijnd, boven alles wat hij scopet */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Periode">
        {RANGES.map((r) => {
          const active = r.key === range;
          return (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
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

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Omzet"
          value={euro.format(sum(revenue))}
          delta={revenueDelta}
          deltaLabel="vs vorige periode"
          trend={lastDays(revenue90, 12).map((p) => p.value)}
        />
        <StatTile
          label="Klantenservice-tickets"
          value={number.format(sum(tickets))}
          delta={ticketsDelta}
          deltaLabel="vs vorige periode"
          upIsGood={false}
          trend={lastDays(tickets90, 12).map((p) => p.value)}
        />
        <StatTile
          label="Voorraad kritiek"
          value={`${criticalStock} producten`}
          delta={undefined}
        />
        <StatTile label="Bezetting vandaag" value={`${present} / ${planned}`} />
      </div>

      {/* Grafieken */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Omzet per dag</h2>
            <span className="text-xs text-ink-muted">in euro&apos;s</span>
          </div>
          <div className="mt-3">
            <RevenueChart points={revenue} />
          </div>
        </section>

        <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Tickets per dag</h2>
            {spike >= 15 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <SeverityIcon severity="serious" size={13} />
                +{spike}% deze week
              </span>
            )}
          </div>
          <div className="mt-3">
            <TicketsChart points={tickets} />
          </div>
        </section>
      </div>
    </div>
  );
}
