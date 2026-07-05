import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/session";
import { readUserStore, writeUserStore } from "@/lib/server/store";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  return Response.json({ store: readUserStore(me.id) });
}

export async function PUT(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { chats, settings, updatedAt } = (body ?? {}) as {
    chats?: unknown;
    settings?: unknown;
    updatedAt?: number;
  };
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) {
    return Response.json({ error: "Ongeldige versie." }, { status: 400 });
  }

  // writeUserStore negeert verouderde versies (last-write-wins) en geeft de
  // winnende versie terug, zodat de client kan bijtrekken.
  const winner = writeUserStore(me.id, {
    chats: chats ?? null,
    settings: settings ?? null,
    updatedAt,
  });
  return Response.json({ store: winner });
}
