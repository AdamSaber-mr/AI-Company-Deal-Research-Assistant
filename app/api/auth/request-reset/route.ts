import type { NextRequest } from "next/server";
import { createPasswordReset } from "@/lib/server/users";
import { lockedSeconds, recordAttempt } from "@/lib/server/ratelimit";
import { mailConfigured, resetEmailHtml, sendMail } from "@/lib/server/mail";

// Max 3 herstel-aanvragen per e-mailadres per kwartier.
const RESET_MAX = 3;
const RESET_WINDOW_MS = 15 * 60 * 1000;

// Antwoordt altijd 200 met dezelfde melding, of het adres nu bestaat of niet —
// zo valt niet af te leiden welke e-mailadressen een account hebben. In een
// echte app gaat de link per mail; in deze demo geven we hem terug (alleen
// als het account bestaat) zodat je direct verder kunt.
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

  const key = `reset:${email.trim().toLowerCase()}`;
  const wait = lockedSeconds(key, RESET_MAX, RESET_WINDOW_MS);
  if (wait > 0) {
    return Response.json(
      {
        error: `Te veel aanvragen. Probeer het over ${Math.ceil(wait / 60)} minuten opnieuw.`,
      },
      { status: 429 }
    );
  }
  recordAttempt(key);

  const token = createPasswordReset(email);
  const resetPath = token ? `/wachtwoord-herstellen?token=${token}` : null;

  // Met een geconfigureerde mailprovider gaat de link per e-mail en verlaat
  // hij nooit de server; zonder provider (demo) geven we hem terug aan de UI.
  if (mailConfigured()) {
    if (resetPath) {
      const resetUrl = new URL(resetPath, request.nextUrl.origin).toString();
      await sendMail(
        email,
        "Wachtwoord herstellen — Kompas",
        resetEmailHtml(resetUrl)
      );
    }
    return Response.json({
      message:
        "Als dit e-mailadres bekend is, hebben we een herstel-link gemaild.",
      sent: true,
    });
  }

  return Response.json({
    message:
      "Als dit e-mailadres bekend is, is er een herstel-link aangemaakt.",
    ...(resetPath ? { resetPath } : {}),
  });
}
