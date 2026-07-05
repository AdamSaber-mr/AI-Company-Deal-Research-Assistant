"use client";

// Hooks voor AI-gegenereerde inhoud (briefing, weekrapport). Geven null terug
// zolang er niets is — de UI toont dan de ingebouwde demo-teksten. Resultaten
// worden per paginalading gecachet in modulevariabelen.

import { useEffect, useState } from "react";

export type AiBriefing = {
  headline: string;
  summary: string;
  actions: string[];
};

let briefingCache: AiBriefing | null | undefined; // undefined = nog niet opgehaald
let reportCache: string | null | undefined;

export function useAiBriefing(): AiBriefing | null {
  const [briefing, setBriefing] = useState<AiBriefing | null>(briefingCache ?? null);

  useEffect(() => {
    if (briefingCache !== undefined) return;
    briefingCache = null; // voorkom dubbele fetches
    fetch("/api/ai/briefing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.briefing) {
          briefingCache = d.briefing as AiBriefing;
          setBriefing(briefingCache);
        }
      })
      .catch(() => {});
  }, []);

  return briefing;
}

export function useAiReport(): string | null {
  const [report, setReport] = useState<string | null>(reportCache ?? null);

  useEffect(() => {
    if (reportCache !== undefined) return;
    reportCache = null;
    fetch("/api/ai/report")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.report?.markdown) {
          reportCache = d.report.markdown as string;
          setReport(reportCache);
        }
      })
      .catch(() => {});
  }, []);

  return report;
}
