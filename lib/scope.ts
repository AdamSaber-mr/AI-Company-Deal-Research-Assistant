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
