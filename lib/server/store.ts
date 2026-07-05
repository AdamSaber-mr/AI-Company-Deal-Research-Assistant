// Per-account opslag van chats + instellingen, één JSON-bestand per gebruiker.
// De client blijft op localStorage werken (snel, offline-bestendig) en synct
// op de achtergrond met deze kopie — zelfde data op elk apparaat.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const STORE_DIR = join(process.cwd(), ".data", "store");

export type UserStore = {
  chats: unknown;
  settings: unknown;
  updatedAt: number;
};

function fileFor(userId: string): string {
  // Ids zijn intern gegenereerde hex-strings; valideer desondanks zodat er
  // nooit een pad buiten de store-map kan ontstaan.
  if (!/^[a-f0-9]+$/.test(userId)) throw new Error("Ongeldige gebruikers-id");
  return join(STORE_DIR, `${userId}.json`);
}

export function readUserStore(userId: string): UserStore | null {
  const file = fileFor(userId);
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (typeof parsed?.updatedAt !== "number") return null;
    return parsed as UserStore;
  } catch {
    return null;
  }
}

/** Schrijft alleen als de aangeleverde versie nieuwer is (last-write-wins). */
export function writeUserStore(userId: string, store: UserStore): UserStore {
  const existing = readUserStore(userId);
  if (existing && existing.updatedAt >= store.updatedAt) return existing;
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(fileFor(userId), JSON.stringify(store), "utf8");
  return store;
}

export function deleteUserStore(userId: string) {
  const file = fileFor(userId);
  if (existsSync(file)) rmSync(file);
}
