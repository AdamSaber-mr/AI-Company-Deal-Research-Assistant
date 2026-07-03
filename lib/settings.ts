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

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

/** Standaardperiode voor grafiekpagina's; veilig aan te roepen in useEffect. */
export function defaultRange(): RangeKey {
  return loadSettings().defaultRange;
}
