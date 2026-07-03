"use client";

import { useState, useSyncExternalStore } from "react";
import type { RangeKey } from "./data";
import { DEFAULT_SETTINGS, settingsSnapshot, type Settings } from "./settings";

// Instellingen komen uit localStorage; useSyncExternalStore rendert op de
// server (en tijdens hydration) de defaults en direct daarna de opgeslagen
// waarden — zonder setState-in-effect en zonder hydration-mismatch.
const noopSubscribe = () => () => {};
const serverSnapshot = () => DEFAULT_SETTINGS;

export function useStoredSettings(): Settings {
  return useSyncExternalStore(noopSubscribe, settingsSnapshot, serverSnapshot);
}

/** Periodefilter-state die start op de ingestelde standaardperiode. */
export function useRangeSetting() {
  const stored = useStoredSettings();
  const [override, setOverride] = useState<RangeKey | null>(null);
  return [override ?? stored.defaultRange, setOverride] as const;
}
