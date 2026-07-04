import { staffing } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StaffingPanel } from "@/components/StaffingPanel";

export default function PersoneelPage() {
  const present = staffing.reduce((a, d) => a + d.present, 0);
  const planned = staffing.reduce((a, d) => a + d.planned, 0);
  const short = staffing.filter((d) => d.present < d.planned);

  return (
    <div className="stagger mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Personeel"
        subtitle="Bezetting van vandaag per afdeling, vergeleken met de planning."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Bezetting vandaag" value={`${present} / ${planned}`} />
        <StatTile
          label="Bezettingsgraad"
          value={`${Math.round((present / planned) * 100)}%`}
        />
        <StatTile label="Afdelingen met tekort" value={`${short.length}`} />
        <StatTile
          label="Ontbrekende krachten"
          value={`${short.reduce((a, d) => a + (d.planned - d.present), 0)}`}
        />
      </div>

      <StaffingPanel />
    </div>
  );
}
