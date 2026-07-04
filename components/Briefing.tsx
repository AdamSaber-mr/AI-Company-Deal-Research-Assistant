"use client";

import Link from "next/link";
import { briefing, longDate, ANCHOR_DATE } from "@/lib/data";
import { useStoredSettings } from "@/lib/useSettings";

export function Briefing() {
  const { ownerName } = useStoredSettings();

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-muted uppercase tracking-wider">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="text-accent">
          <path
            d="M8 1.5l1.7 4.3L14 7.5l-4.3 1.7L8 13.5 6.3 9.2 2 7.5l4.3-1.7L8 1.5z"
            fill="currentColor"
          />
        </svg>
        AI-ochtendbriefing · {longDate.format(ANCHOR_DATE)}
      </div>

      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
        Goedemorgen, {ownerName} — {briefing.headline.toLowerCase()}
      </h1>

      <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-ink-secondary">
        {briefing.summary}
      </p>

      <ol className="mt-5 flex flex-col gap-2.5">
        {briefing.actions.map((action, i) => (
          <li key={action} className="flex items-start gap-3 text-sm">
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-track text-[0.7rem] font-semibold text-accent">
              {i + 1}
            </span>
            <span className="text-ink">{action}</span>
          </li>
        ))}
      </ol>

      <Link
        href={`/?vraag=${encodeURIComponent("Wat moet ik vandaag doen?")}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        Vraag door in de chat →
      </Link>
    </section>
  );
}
