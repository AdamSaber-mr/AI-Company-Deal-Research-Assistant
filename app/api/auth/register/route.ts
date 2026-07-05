import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthError, createUser, toPublicUser } from "@/lib/server/users";
import {
  MAX_AGE_SECONDS,
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/server/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { name, company, email, password } = (body ?? {}) as {
    name?: string;
    company?: string;
    email?: string;
    password?: string;
  };

  if (!name || name.trim().length < 2) {
    return Response.json({ error: "Vul je naam in." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json(
      { error: "Wachtwoord moet minstens 8 tekens zijn." },
      { status: 400 }
    );
  }

  try {
    const user = createUser({ name, company, email, password });
    const store = await cookies();
    store.set(
      SESSION_COOKIE,
      createSessionToken(user.id),
      sessionCookieOptions(MAX_AGE_SECONDS)
    );
    return Response.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    return Response.json({ error: "Er ging iets mis." }, { status: 500 });
  }
}
