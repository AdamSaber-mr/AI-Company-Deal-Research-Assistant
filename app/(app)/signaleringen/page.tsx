import { alerts } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { AlertsFeed } from "@/components/AlertsFeed";

export default function SignaleringenPage() {
  const urgent = alerts.filter((a) => a.severity === "critical").length;
  const action = alerts.filter((a) => a.severity === "serious").length;
  const watch = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="stagger mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="AI-signaleringen"
        subtitle="Automatisch gedetecteerde afwijkingen in omzet, tickets, voorraad en bezetting."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Urgent" value={`${urgent}`} />
        <StatTile label="Actie nodig" value={`${action}`} />
        <StatTile label="Let op" value={`${watch}`} />
        <StatTile label="Signaleringen totaal" value={`${alerts.length}`} />
      </div>

      <AlertsFeed />
    </div>
  );
}
