"use client";

import {
  ANCHOR_DATE,
  longDate,
  revenue365,
  tickets365,
  lastDays,
  sum,
  periodDelta,
  euro,
  number,
  inventory,
  staffing,
  briefing,
  productCount,
} from "@/lib/data";
import { useAiBriefing, useAiReport } from "@/lib/useAi";
import { useStoredSettings } from "@/lib/useSettings";
import { Markdown } from "@/components/chat/Markdown";
import { StatTile } from "@/components/StatTile";
import { RevenueChart } from "@/components/RevenueChart";
import { TicketsChart } from "@/components/TicketsChart";
import { AlertsFeed } from "@/components/AlertsFeed";
import { InventoryPanel } from "@/components/InventoryPanel";
import { StaffingPanel } from "@/components/StaffingPanel";

export default function RapportPage() {
  const { companyName } = useStoredSettings();
  // AI-samenvatting zodra er een API-key is; anders de demo-briefing.
  const aiBriefing = useAiBriefing();
  const aiReport = useAiReport();

  const rev7 = sum(lastDays(revenue365, 7));
  const tick7 = sum(lastDays(tickets365, 7));
  const criticalStock = inventory.filter((p) => p.daysLeft <= 7).length;
  const present = staffing.reduce((a, d) => a + d.present, 0);
  const planned = staffing.reduce((a, d) => a + d.planned, 0);

  return (
    <div className="stagger mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:gap-3 print:p-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-white">
              <svg width="11" height="11" viewBox="0 0 18 18" aria-hidden>
                <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 6l-1.9 4.1L6 12l1.9-4.1z" fill="currentColor" />
              </svg>
            </span>
            Kompas · Weekrapport
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {companyName}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Week tot en met {longDate.format(ANCHOR_DATE)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-150 active:scale-95 print:hidden"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M4 6V1.5h8V6M4 12.5H2.5a1 1 0 01-1-1V7a1 1 0 011-1h11a1 1 0 011 1v4.5a1 1 0 01-1 1H12M4 10.5h8v4H4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Afdrukken / PDF
        </button>
      </div>

      <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 print:break-inside-avoid">
        {aiReport ? (
          <>
            <h2 className="text-sm font-semibold">Samenvatting van de week</h2>
            <div className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-secondary">
              <Markdown content={aiReport} />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold">
              {(aiBriefing ?? briefing).headline}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-secondary">
              {(aiBriefing ?? briefing).summary}
            </p>
            <ol className="mt-3 flex flex-col gap-1.5">
              {(aiBriefing ?? briefing).actions.map((action, i) => (
                <li key={action} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-track text-[0.7rem] font-semibold text-accent">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 print:grid-cols-4 print:break-inside-avoid">
        <StatTile
          label="Omzet deze week"
          value={euro.format(rev7)}
          delta={periodDelta(revenue365, 7)}
          deltaLabel="vs vorige week"
        />
        <StatTile
          label="Tickets deze week"
          value={number.format(tick7)}
          delta={periodDelta(tickets365, 7)}
          deltaLabel="vs vorige week"
          upIsGood={false}
        />
        <StatTile label="Voorraad kritiek" value={productCount(criticalStock)} />
        <StatTile label="Bezetting vandaag" value={`${present} / ${planned}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5 print:break-inside-avoid print:grid-cols-5">
        <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 lg:col-span-3 print:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Omzet per dag</h2>
            <span className="text-xs text-ink-muted">laatste 30 dagen</span>
          </div>
          <div className="mt-3">
            <RevenueChart points={lastDays(revenue365, 30)} />
          </div>
        </section>
        <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 lg:col-span-2 print:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Tickets per dag</h2>
            <span className="text-xs text-ink-muted">laatste 30 dagen</span>
          </div>
          <div className="mt-3">
            <TicketsChart points={lastDays(tickets365, 30)} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <div className="print:break-inside-avoid">
          <AlertsFeed />
        </div>
        <div className="flex flex-col gap-4">
          <div className="print:break-inside-avoid">
            <InventoryPanel />
          </div>
          <div className="print:break-inside-avoid">
            <StaffingPanel />
          </div>
        </div>
      </div>

      <footer className="pb-4 pt-2 text-center text-xs text-ink-muted">
        Automatisch samengesteld door Kompas op {longDate.format(ANCHOR_DATE)} · demo-data
      </footer>
    </div>
  );
}
