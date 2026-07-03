import { inventory, productCount } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { InventoryPanel } from "@/components/InventoryPanel";

export default function VoorraadPage() {
  const critical = inventory.filter((p) => p.daysLeft <= 3).length;
  const soon = inventory.filter((p) => p.daysLeft > 3 && p.daysLeft <= 7).length;
  const attention = inventory.filter((p) => p.daysLeft > 7 && p.daysLeft <= 14).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Voorraad"
        subtitle="Hoeveel dagen elk product nog meegaat bij het huidige verkooptempo."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Bestel vandaag" value={productCount(critical)} />
        <StatTile label="Deze week bestellen" value={productCount(soon)} />
        <StatTile label="In de gaten houden" value={productCount(attention)} />
        <StatTile label="Producten totaal" value={`${inventory.length}`} />
      </div>

      <InventoryPanel />
    </div>
  );
}
