import { Briefing } from "@/components/Briefing";
import { Dashboard } from "@/components/Dashboard";
import { InventoryPanel } from "@/components/InventoryPanel";
import { StaffingPanel } from "@/components/StaffingPanel";
import { AlertsFeed } from "@/components/AlertsFeed";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
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
