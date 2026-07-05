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
