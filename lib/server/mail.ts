// E-mailverzending, optioneel. Geconfigureerd via .env.local:
//   RESEND_API_KEY=re_...   (https://resend.com — gratis tier volstaat)
//   MAIL_FROM="Kompas <onboarding@resend.dev>"
// Zonder configuratie verstuurt de app niets en toont de UI de herstel-link
// direct op het scherm (demo-gedrag). Bewust via fetch — geen extra dependency.

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/** Verstuurt een mail; geeft true terug als dat gelukt is. */
export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!mailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function resetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-family: Georgia, serif; font-size: 24px; margin: 0 0 16px;">Kompas</h1>
      <p style="font-size: 14px; color: #333; line-height: 1.6;">
        Je hebt een wachtwoordherstel aangevraagd. Klik op de knop hieronder om
        een nieuw wachtwoord in te stellen. De link is één uur geldig.
      </p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="background: #2a78d6; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Nieuw wachtwoord instellen
        </a>
      </p>
      <p style="font-size: 12px; color: #888;">
        Vroeg je dit niet aan? Dan kun je deze e-mail negeren.
      </p>
    </div>`;
}
