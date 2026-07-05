// Gelezen-status van signaleringen, client-side in localStorage met het
// vaste snapshot-cache-patroon (zie lib/settings.ts). Per account gescopet,
// net als chats en instellingen.

import { alerts } from "./data";
import { scopedKey, subscribeScope } from "./scope";

const KEY = "bcc-read-alerts";
const EMPTY: string[] = [];

let cachedKey: string | undefined;
let cachedRaw: string | null | undefined;
let cached: string[] = EMPTY;

export function readAlertsSnapshot(): string[] {
  const key = scopedKey(KEY);
  const raw = localStorage.getItem(key);
  if (key !== cachedKey || raw !== cachedRaw) {
    cachedKey = key;
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
  const unsubScope = subscribeScope(listener);
  return () => {
    listeners.delete(listener);
    unsubScope();
  };
}

function persist(titles: string[]) {
  localStorage.setItem(scopedKey(KEY), JSON.stringify(titles));
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
