import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  deleteUser,
  toPublicUser,
  updateUserProfile,
} from "@/lib/server/users";
import {
  SESSION_COOKIE,
  getCurrentUser,
  sessionCookieOptions,
} from "@/lib/server/session";
import { deleteUserStore } from "@/lib/server/store";

/** Naam en/of bedrijfsnaam van het ingelogde account bijwerken. */
export async function PATCH(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { name, company } = (body ?? {}) as { name?: string; company?: string };
  if (name !== undefined && name.trim().length < 2) {
    return Response.json({ error: "Vul je naam in." }, { status: 400 });
  }
  if (company !== undefined && !company.trim()) {
    return Response.json({ error: "Vul een bedrijfsnaam in." }, { status: 400 });
  }

  const user = updateUserProfile(me.id, { name, company });
  if (!user) {
    return Response.json({ error: "Account niet gevonden." }, { status: 404 });
  }
  return Response.json({ user: toPublicUser(user) });
}

/** Het ingelogde account definitief verwijderen; sessie wordt gewist. */
export async function DELETE() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });

  deleteUser(me.id);
  deleteUserStore(me.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return Response.json({ ok: true });
}
