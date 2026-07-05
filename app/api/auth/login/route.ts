import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { toPublicUser, verifyCredentials } from "@/lib/server/users";
import {
  MAX_AGE_SECONDS,
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/server/session";

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

  const user = verifyCredentials(email, password);
  if (!user) {
    return Response.json(
      { error: "E-mailadres of wachtwoord klopt niet." },
      { status: 401 }
    );
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    createSessionToken(user.id),
    sessionCookieOptions(MAX_AGE_SECONDS)
  );
  return Response.json({ user: toPublicUser(user) });
}
