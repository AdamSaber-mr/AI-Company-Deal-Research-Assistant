// Server-side accountopslag. Bewust dependency-vrij: gebruikers staan in een
// JSON-bestand op schijf en wachtwoorden worden gehasht met Node's ingebouwde
// scrypt. Prima voor een lokale demo; voor productie zou je dit vervangen door
// een echte database. Dit bestand mag NOOIT vanuit client-code geïmporteerd
// worden (het raakt het filesystem).

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  company: string;
  passwordHash: string; // "salt:hash" (beide hex)
  createdAt: number;
};

/** Account zonder geheimen — veilig om naar de client te sturen. */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  company: string;
};

const DATA_DIR = join(process.cwd(), ".data");
const USERS_FILE = join(DATA_DIR, "users.json");
const RESETS_FILE = join(DATA_DIR, "resets.json");
const RESET_TTL_MS = 60 * 60 * 1000; // herstel-link 1 uur geldig

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers(): StoredUser[] {
  ensureDir();
  if (!existsSync(USERS_FILE)) return [];
  try {
    const raw = readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureDir();
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export function toPublicUser(u: StoredUser): PublicUser {
  return { id: u.id, email: u.email, name: u.name, company: u.company };
}

/* ------------------------------ wachtwoorden ------------------------------ */

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  // Lengtes gelijk → constant-time vergelijk (voorkomt timing-lekken).
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* -------------------------------- queries -------------------------------- */

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function getUserByEmail(email: string): StoredUser | null {
  const target = normalizeEmail(email);
  return readUsers().find((u) => u.email === target) ?? null;
}

export function getUserById(id: string): StoredUser | null {
  return readUsers().find((u) => u.id === id) ?? null;
}

export class AuthError extends Error {}

/** Maakt een account aan. Gooit AuthError als het e-mailadres al bestaat. */
export function createUser(input: {
  email: string;
  name: string;
  company?: string;
  password: string;
}): StoredUser {
  const email = normalizeEmail(input.email);
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    throw new AuthError("E-mailadres is al in gebruik.");
  }
  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    email,
    name: input.name.trim(),
    company: input.company?.trim() || "Mijn bedrijf",
    passwordHash: hashPassword(input.password),
    createdAt: Date.now(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

/** Controleert inloggegevens; geeft de gebruiker terug of null. */
export function verifyCredentials(
  email: string,
  password: string
): StoredUser | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  return verifyPassword(password, user.passwordHash) ? user : null;
}

/* --------------------------- wachtwoord herstellen --------------------------- */

type Reset = { token: string; userId: string; exp: number };

function readResets(): Reset[] {
  ensureDir();
  if (!existsSync(RESETS_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(RESETS_FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as Reset[]) : [];
  } catch {
    return [];
  }
}

function writeResets(resets: Reset[]) {
  ensureDir();
  writeFileSync(RESETS_FILE, JSON.stringify(resets, null, 2), "utf8");
}

/** Maakt een herstel-token voor het e-mailadres; null als het niet bestaat. */
export function createPasswordReset(email: string): string | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  const token = randomBytes(24).toString("hex");
  const active = readResets().filter((r) => r.exp > Date.now());
  active.push({ token, userId: user.id, exp: Date.now() + RESET_TTL_MS });
  writeResets(active);
  return token;
}

/** Wisselt een geldig token in voor de bijbehorende gebruikers-id (eenmalig). */
export function consumePasswordReset(token: string): string | null {
  const resets = readResets();
  const found = resets.find((r) => r.token === token && r.exp > Date.now());
  if (!found) return null;
  writeResets(resets.filter((r) => r.token !== token));
  return found.userId;
}

/** Zet een nieuw wachtwoord voor de gebruiker. */
export function updateUserPassword(userId: string, password: string): boolean {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  user.passwordHash = hashPassword(password);
  writeUsers(users);
  return true;
}

/** Werkt naam en/of bedrijfsnaam bij; geeft het bijgewerkte account terug. */
export function updateUserProfile(
  userId: string,
  patch: { name?: string; company?: string }
): StoredUser | null {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  if (patch.name !== undefined && patch.name.trim().length >= 2) {
    user.name = patch.name.trim();
  }
  if (patch.company !== undefined && patch.company.trim()) {
    user.company = patch.company.trim();
  }
  writeUsers(users);
  return user;
}

/** Controleert het huidige wachtwoord van een gebruiker (voor wijzigen). */
export function checkPassword(userId: string, password: string): boolean {
  const user = getUserById(userId);
  return user ? verifyPassword(password, user.passwordHash) : false;
}

/** Verwijdert het account en eventuele openstaande herstel-tokens. */
export function deleteUser(userId: string): boolean {
  const users = readUsers();
  const next = users.filter((u) => u.id !== userId);
  if (next.length === users.length) return false;
  writeUsers(next);
  writeResets(readResets().filter((r) => r.userId !== userId));
  return true;
}
