// Sessiebeheer via een ondertekende, httpOnly-cookie. Geen server-side
// sessieopslag nodig: het token draagt zelf de gebruikers-id + vervaltijd en
// is HMAC-ondertekend met een lokaal geheim, zodat het niet te vervalsen is.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { getUserById, toPublicUser, type PublicUser } from "./users";

export const SESSION_COOKIE = "kompas_session";
// Een jaar, en rollend: /api/auth/me geeft bij elk bezoek een verse cookie
// uit. Zolang je de app af en toe opent, blijf je dus permanent ingelogd.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const DATA_DIR = join(process.cwd(), ".data");
const SECRET_FILE = join(DATA_DIR, "session.secret");

// Eén keer gegenereerd geheim, daarna herbruikt. Zo blijven sessies geldig
// tussen serverherstarts (anders zou elke herstart iedereen uitloggen).
function getSecret(): string {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (existsSync(SECRET_FILE)) return readFileSync(SECRET_FILE, "utf8");
  const secret = randomBytes(32).toString("hex");
  writeFileSync(SECRET_FILE, secret, "utf8");
  return secret;
}

const base64url = (input: string) =>
  Buffer.from(input).toString("base64url");

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Bouwt een token: "<payload>.<signature>", payload = base64url({uid,exp}). */
export function createSessionToken(userId: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = base64url(JSON.stringify({ uid: userId, exp }));
  return `${payload}.${sign(payload)}`;
}

/** Valideert handtekening + vervaltijd; geeft de gebruikers-id terug of null. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof uid !== "string" || typeof exp !== "number") return null;
    if (Date.now() > exp) return null;
    return uid;
  } catch {
    return null;
  }
}

/** Opties voor de sessie-cookie (gedeeld door set/clear). */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/**
 * Huidige ingelogde gebruiker op basis van de cookie, of null.
 * Leest cookies (mag in server components én route handlers).
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const uid = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const user = getUserById(uid);
  return user ? toPublicUser(user) : null;
}

export { MAX_AGE_SECONDS };
