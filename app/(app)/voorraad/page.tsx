import { inventory, productCount } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ExportCsvButton } from "@/components/ExportCsv";

export default function VoorraadPage() {
  const critical = inventory.filter((p) => p.daysLeft <= 3).length;
  const soon = inventory.filter((p) => p.daysLeft > 3 && p.daysLeft <= 7).length;
  const attention = inventory.filter((p) => p.daysLeft > 7 && p.daysLeft <= 14).length;

  return (
    <div className="stagger mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Voorraad"
          subtitle="Hoeveel dagen elk product nog meegaat bij het huidige verkooptempo."
        />
        <ExportCsvButton
          filename="voorraad.csv"
          header={["product", "sku", "voorraad", "verkoop per dag", "dagen resterend"]}
          rows={inventory.map((p) => [p.name, p.sku, p.stock, p.dailySales, p.daysLeft])}
        />
      </div>

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
