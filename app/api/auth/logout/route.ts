import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";

export async function POST() {
  const store = await cookies();
  // Cookie leegmaken met maxAge 0 → browser verwijdert 'm direct.
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return Response.json({ ok: true });
}
