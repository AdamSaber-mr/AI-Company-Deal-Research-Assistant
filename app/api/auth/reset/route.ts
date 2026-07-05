import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  consumePasswordReset,
  getUserById,
  toPublicUser,
  updateUserPassword,
} from "@/lib/server/users";
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

  const { token, password } = (body ?? {}) as {
    token?: string;
    password?: string;
  };

  if (!token) {
    return Response.json({ error: "Ontbrekende herstel-link." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json(
      { error: "Wachtwoord moet minstens 8 tekens zijn." },
      { status: 400 }
    );
  }

  const userId = consumePasswordReset(token);
  if (!userId) {
    return Response.json(
      { error: "Deze herstel-link is ongeldig of verlopen." },
      { status: 400 }
    );
  }

  updateUserPassword(userId, password);
  const user = getUserById(userId);
  if (!user) {
    return Response.json({ error: "Account niet gevonden." }, { status: 404 });
  }

  // Meteen inloggen na een geslaagde reset.
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    createSessionToken(user.id),
    sessionCookieOptions(MAX_AGE_SECONDS)
  );
  return Response.json({ user: toPublicUser(user) });
}
