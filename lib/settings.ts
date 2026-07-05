import type { RangeKey } from "./data";
import { scopedKey } from "./scope";

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

// Cache op (sleutel + raw) zodat settingsSnapshot() een stabiele referentie
// teruggeeft, maar bij een accountwissel (andere sleutel) opnieuw inleest.
let cachedKey: string | undefined;
let cachedRaw: string | null | undefined;
let cachedSettings: Settings = DEFAULT_SETTINGS;

/** Stabiele snapshot van de opgeslagen instellingen (client-side). */
export function settingsSnapshot(): Settings {
  const key = scopedKey(KEY);
  const raw = localStorage.getItem(key);
  if (key !== cachedKey || raw !== cachedRaw) {
    cachedKey = key;
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

/** Bestaat er al een opgeslagen instellingenrecord voor het actieve account? */
export function hasStoredSettings(): boolean {
  return localStorage.getItem(scopedKey(KEY)) !== null;
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(scopedKey(KEY), JSON.stringify(settings));
}
