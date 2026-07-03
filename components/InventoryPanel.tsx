import { inventory, number } from "@/lib/data";
import { SEVERITY, SeverityIcon } from "./severity";

// Meter: de vulling draagt de ernst; de lege track is een lichtere stap
// van dezelfde ramp zodat de balk als één geheel leest.
function StockMeter({ fraction, color }: { fraction: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-accent-track overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(4, Math.min(100, fraction * 100))}%`, background: color }}
      />
    </div>
  );
}

export function InventoryPanel() {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Voorraad</h2>
        <span className="text-xs text-ink-muted">op basis van huidig verkooptempo</span>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-[var(--grid)]">
        {inventory.map((p) => {
          const s = SEVERITY[p.severity];
          const fraction = Math.min(1, p.daysLeft / 21);
          const color = p.severity === "good" ? "var(--accent)" : s.color;
          return (
            <li key={p.sku} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm">{p.name}</span>
                  <span
                    className="shrink-0 text-xs text-ink-muted"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {number.format(p.stock)} stuks
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <StockMeter fraction={fraction} color={color} />
                  <span className="flex w-32 shrink-0 items-center gap-1.5 text-xs font-medium text-ink-secondary">
                    <SeverityIcon severity={p.severity} size={13} />
                    {p.daysLeft <= 14 ? `over ${p.daysLeft} dagen op` : "ruim voldoende"}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
