// Gelezen-status van signaleringen, client-side in localStorage met het
// vaste snapshot-cache-patroon (zie lib/settings.ts).

import { alerts } from "./data";

const KEY = "bcc-read-alerts";
const EMPTY: string[] = [];

let cachedRaw: string | null | undefined;
let cached: string[] = EMPTY;

export function readAlertsSnapshot(): string[] {
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached;
}

export const serverReadAlerts = () => EMPTY;

const listeners = new Set<() => void>();

export function subscribeReadAlerts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function persist(titles: string[]) {
  localStorage.setItem(KEY, JSON.stringify(titles));
  listeners.forEach((l) => l());
}

export function toggleRead(title: string) {
  const current = readAlertsSnapshot();
  persist(
    current.includes(title)
      ? current.filter((t) => t !== title)
      : [...current, title]
  );
}

export function markAllRead() {
  persist(alerts.map((a) => a.title));
}
