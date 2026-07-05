import { cookies } from "next/headers";
import {
  MAX_AGE_SECONDS,
  SESSION_COOKIE,
  createSessionToken,
  getCurrentUser,
  sessionCookieOptions,
} from "@/lib/server/session";

export async function GET() {
  const user = await getCurrentUser();

  // Rollende sessie: elk bezoek geeft een verse cookie met nieuwe vervaltijd,
  // zodat je permanent ingelogd blijft zolang je de app gebruikt.
  if (user) {
    const store = await cookies();
    store.set(
      SESSION_COOKIE,
      createSessionToken(user.id),
      sessionCookieOptions(MAX_AGE_SECONDS)
    );
  }

  return Response.json({ user });
}
