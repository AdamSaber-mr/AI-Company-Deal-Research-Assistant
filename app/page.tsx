import { Briefing } from "@/components/Briefing";
import { Dashboard } from "@/components/Dashboard";
import { InventoryPanel } from "@/components/InventoryPanel";
import { StaffingPanel } from "@/components/StaffingPanel";
import { AlertsFeed } from "@/components/AlertsFeed";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      {/* Topbalk */}
      <header className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M2 13V8.5M6 13V3M10 13V6M14 13v-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Bedrijfs Command Center
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs text-ink-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          Live · demo-data
        </span>
      </header>

      <Briefing />
      <Dashboard />

      <h2 className="mt-2 px-1 text-xs font-medium uppercase tracking-wider text-ink-muted">
        Vandaag · momentopname
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <AlertsFeed />
        <div className="flex flex-col gap-4">
          <InventoryPanel />
          <StaffingPanel />
        </div>
      </div>

      <footer className="pt-2 pb-4 text-center text-xs text-ink-muted">
        Demo met voorbeelddata — koppel je kassa, helpdesk, voorraad- en roostersysteem voor live cijfers.
      </footer>
    </div>
  );
}
