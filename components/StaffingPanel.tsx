import { staffing } from "@/lib/data";
import { SeverityIcon } from "./severity";

export function StaffingPanel() {
  const totalPresent = staffing.reduce((a, d) => a + d.present, 0);
  const totalPlanned = staffing.reduce((a, d) => a + d.planned, 0);

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Personeelsbezetting vandaag</h2>
        <span className="text-xs text-ink-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
          {totalPresent} van {totalPlanned} ingepland
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-3.5">
        {staffing.map((d) => {
          const full = d.present >= d.planned;
          return (
            <li key={d.name} className="flex items-center gap-4">
              <span className="w-32 shrink-0 text-sm">{d.name}</span>
              <div className="flex flex-1 items-center gap-1">
                {Array.from({ length: d.planned }, (_, i) => (
                  <span
                    key={i}
                    className="h-2 w-7 rounded-full"
                    style={{
                      background: i < d.present ? "var(--accent)" : "var(--accent-track)",
                    }}
                  />
                ))}
              </div>
              <span className="flex w-24 shrink-0 items-center justify-end gap-1.5 text-xs font-medium text-ink-secondary">
                <SeverityIcon severity={full ? "good" : "warning"} size={13} />
                {full ? "volledig" : `${d.planned - d.present} te kort`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
