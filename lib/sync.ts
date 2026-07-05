"use client";

// Achtergrond-sync tussen de lokale (gescopte) localStorage en de server-
// kopie per account. Lokaal blijft leidend voor snelheid; elke wijziging
// krijgt een tijdstempel en wordt debounced naar de server gepusht. Bij het
// laden wint de nieuwste versie (last-write-wins), zodat je op elk apparaat
// dezelfde chats en instellingen ziet.

import { notifyScope, scopedKey } from "./scope";

const TS_KEY = "bcc-sync-ts";
const CHATS_KEY = "bcc-chats";
const SETTINGS_KEY = "bcc-settings";
const PUSH_DEBOUNCE_MS = 800;

let pushTimer: ReturnType<typeof setTimeout> | null = null;

function localTs(): number {
  const raw = localStorage.getItem(scopedKey(TS_KEY));
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

/** Markeer een lokale wijziging en plan een push naar de server. */
export function markLocalChange() {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedKey(TS_KEY), String(Date.now()));
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushNow(), PUSH_DEBOUNCE_MS);
}

async function pushNow() {
  const chatsRaw = localStorage.getItem(scopedKey(CHATS_KEY));
  const settingsRaw = localStorage.getItem(scopedKey(SETTINGS_KEY));
  if (chatsRaw === null && settingsRaw === null) return;
  try {
    await fetch("/api/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updatedAt: localTs(),
        chats: chatsRaw ? JSON.parse(chatsRaw) : null,
        settings: settingsRaw ? JSON.parse(settingsRaw) : null,
      }),
    });
  } catch {
    /* offline: de volgende wijziging probeert het opnieuw */
  }
}

/**
 * Haal de server-kopie op en pas de nieuwste versie toe. Ouder lokaal werk
 * wordt overschreven; nieuwer lokaal werk wordt juist gepusht.
 */
export async function syncFromServer() {
  try {
    const res = await fetch("/api/store");
    if (!res.ok) return;
    const data = await res.json();
    const server = data?.store as {
      chats?: unknown;
      settings?: unknown;
      updatedAt?: number;
    } | null;
    const mine = localTs();

    if (server && typeof server.updatedAt === "number" && server.updatedAt > mine) {
      if (server.chats != null) {
        localStorage.setItem(scopedKey(CHATS_KEY), JSON.stringify(server.chats));
      }
      if (server.settings != null) {
        localStorage.setItem(
          scopedKey(SETTINGS_KEY),
          JSON.stringify(server.settings)
        );
      }
      localStorage.setItem(scopedKey(TS_KEY), String(server.updatedAt));
      notifyScope();
    } else if (mine > (server?.updatedAt ?? 0)) {
      void pushNow();
    }
  } catch {
    /* offline: lokaal werkt gewoon door */
  }
}
