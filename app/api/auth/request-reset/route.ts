import type { NextRequest } from "next/server";
import { createPasswordReset } from "@/lib/server/users";

// In een echte app mailen we de link. In deze lokale demo sturen we 'm terug
// zodat je 'm meteen kunt gebruiken.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { email } = (body ?? {}) as { email?: string };
  if (!email) {
    return Response.json({ error: "Vul je e-mailadres in." }, { status: 400 });
  }

  const token = createPasswordReset(email);
  if (!token) {
    return Response.json(
      { error: "Geen account met dit e-mailadres." },
      { status: 404 }
    );
  }

  return Response.json({ resetPath: `/wachtwoord-herstellen?token=${token}` });
}
