import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { toPublicUser, verifyCredentials } from "@/lib/server/users";
import {
  clearAttempts,
  lockedSeconds,
  recordAttempt,
} from "@/lib/server/ratelimit";
import {
  MAX_AGE_SECONDS,
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/server/session";

// Max 5 mislukte pogingen per e-mailadres per kwartier.
const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return Response.json(
      { error: "Vul je e-mailadres en wachtwoord in." },
      { status: 400 }
    );
  }

  const key = `login:${email.trim().toLowerCase()}`;
  const wait = lockedSeconds(key, LOGIN_MAX, LOGIN_WINDOW_MS);
  if (wait > 0) {
    return Response.json(
      {
        error: `Te veel mislukte pogingen. Probeer het over ${Math.ceil(wait / 60)} minuten opnieuw.`,
      },
      { status: 429 }
    );
  }

  const user = verifyCredentials(email, password);
  if (!user) {
    recordAttempt(key);
    return Response.json(
      { error: "E-mailadres of wachtwoord klopt niet." },
      { status: 401 }
    );
  }
  clearAttempts(key);

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    createSessionToken(user.id),
    sessionCookieOptions(MAX_AGE_SECONDS)
  );
  return Response.json({ user: toPublicUser(user) });
}
