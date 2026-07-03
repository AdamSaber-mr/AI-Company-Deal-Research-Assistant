import type { RangeKey } from "./data";

// Instellingen leven client-side in localStorage (demo). Elke sleutel heeft
// een default zodat de app ook zonder opgeslagen keuzes werkt.

export type Settings = {
  companyName: string;
  ownerName: string;
  defaultRange: RangeKey;
  briefingTime: string; // "07:30"
  briefingEmail: boolean;
  briefingPush: boolean;
  alertComplaints: boolean;
  alertStock: boolean;
  alertStaffing: boolean;
  stockThresholdDays: number; // waarschuw bij ≤ X dagen voorraad
};

export const DEFAULT_SETTINGS: Settings = {
  companyName: "Koffiebar De Ronde",
  ownerName: "Adam",
  defaultRange: "30d",
  briefingTime: "07:30",
  briefingEmail: true,
  briefingPush: false,
  alertComplaints: true,
  alertStock: true,
  alertStaffing: true,
  stockThresholdDays: 7,
};

const KEY = "bcc-settings";

// Cache zodat settingsSnapshot() dezelfde object-referentie teruggeeft zolang
// localStorage niet wijzigt — vereist voor useSyncExternalStore.
let cachedRaw: string | null | undefined;
let cachedSettings: Settings = DEFAULT_SETTINGS;

/** Stabiele snapshot van de opgeslagen instellingen (client-side). */
export function settingsSnapshot(): Settings {
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSettings = raw
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
        : DEFAULT_SETTINGS;
    } catch {
      cachedSettings = DEFAULT_SETTINGS;
    }
  }
  return cachedSettings;
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
