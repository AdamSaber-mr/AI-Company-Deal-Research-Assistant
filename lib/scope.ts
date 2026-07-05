"use client";

// Per-account naamruimte voor localStorage. Chats en instellingen worden
// bewaard onder een sleutel met de gebruikers-id erin, zodat twee accounts op
// dezelfde browser elkaars data niet zien. De actieve id wordt gezet door
// <AccountScope> (uit de server-sessie) vóór de rest rendert.

let activeUserId: string | null = null;
const listeners = new Set<() => void>();

export function setActiveUserId(id: string | null) {
  // Alleen op de client muteren — de server deelt modules tussen requests.
  if (typeof window === "undefined") return;
  if (id === activeUserId) return;
  activeUserId = id;
  listeners.forEach((l) => l());
}

/** Sleutel met accountsuffix; zonder account de kale sleutel (voorkomt crashes). */
export function scopedKey(base: string): string {
  return activeUserId ? `${base}::${activeUserId}` : base;
}

/** Laat data-hooks opnieuw lezen wanneer het actieve account wisselt. */
export function subscribeScope(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Forceer een herlees van alle gescopte data (na migratie of sync). */
export function notifyScope() {
  listeners.forEach((l) => l());
}

// Sleutels van vóór de per-account scheiding (ongescoopt).
const LEGACY_BASES = ["bcc-chats", "bcc-settings", "bcc-read-alerts"];

/**
 * Eenmalige migratie: data van vóór de account-scheiding wordt geclaimd door
 * het eerste account dat inlogt, daarna verdwijnen de oude sleutels zodat
 * volgende accounts schoon starten.
 */
export function migrateLegacyData(userId: string): boolean {
  let migrated = false;
  for (const base of LEGACY_BASES) {
    const legacy = localStorage.getItem(base);
    if (legacy === null) continue;
    const scoped = `${base}::${userId}`;
    if (localStorage.getItem(scoped) === null) {
      localStorage.setItem(scoped, legacy);
      migrated = true;
    }
    localStorage.removeItem(base);
  }
  return migrated;
}
