import { alerts } from "@/lib/data";
import { SEVERITY, SeverityIcon } from "./severity";

export function AlertsFeed() {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">AI-signaleringen</h2>
        <span className="text-xs text-ink-muted">vanochtend bijgewerkt</span>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-[var(--grid)]">
        {alerts.map((a) => (
          <li key={a.title} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
            <SeverityIcon severity={a.severity} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium">{a.title}</span>
                <span className="text-xs text-ink-muted">
                  {SEVERITY[a.severity].label} · {a.time}
                </span>
              </div>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-secondary">
                {a.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
