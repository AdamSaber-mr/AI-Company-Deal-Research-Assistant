import type { NextRequest } from "next/server";
import { checkPassword, updateUserPassword } from "@/lib/server/users";
import { getCurrentUser } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { current, next } = (body ?? {}) as { current?: string; next?: string };
  if (!current) {
    return Response.json(
      { error: "Vul je huidige wachtwoord in." },
      { status: 400 }
    );
  }
  if (!next || next.length < 8) {
    return Response.json(
      { error: "Nieuw wachtwoord moet minstens 8 tekens zijn." },
      { status: 400 }
    );
  }
  if (!checkPassword(me.id, current)) {
    return Response.json(
      { error: "Huidig wachtwoord klopt niet." },
      { status: 401 }
    );
  }

  updateUserPassword(me.id, next);
  return Response.json({ ok: true });
}
