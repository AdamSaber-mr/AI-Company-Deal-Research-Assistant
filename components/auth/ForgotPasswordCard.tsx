"use client";

import { useState } from "react";
import Link from "next/link";

const fieldClass =
  "w-full rounded-lg border border-edge bg-raised px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent";

export function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mailed, setMailed] = useState(false);
  const [resetPath, setResetPath] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
        setLoading(false);
        return;
      }
      // Altijd hetzelfde eindscherm — met mailprovider gaat de link per
      // e-mail; in de demo tonen we hem direct (alleen als het account bestaat).
      setDone(true);
      setMailed(Boolean(data.sent));
      setResetPath((data.resetPath as string | undefined) ?? null);
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="font-serif text-3xl font-semibold tracking-tight text-ink">
          Kompas
        </span>
      </div>

      <div className="rounded-2xl border border-edge bg-surface p-7 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Wachtwoord vergeten
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Vul je e-mailadres in en we maken een herstel-link voor je aan.
        </p>

        {done ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-lg border border-edge bg-raised px-3.5 py-3 text-sm text-ink-secondary">
              <p className="font-medium text-ink">
                {mailed
                  ? "Als dit e-mailadres bekend is, hebben we een herstel-link gemaild"
                  : "Als dit e-mailadres bekend is, is er een herstel-link aangemaakt"}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {mailed
                  ? "Check je inbox (en eventueel je spam-map). De link is één uur geldig."
                  : `In een echte app krijg je deze per e-mail.${resetPath ? " In deze demo kun je direct verder:" : ""}`}
              </p>
            </div>
            {!mailed && resetPath && (
              <Link
                href={resetPath}
                className="flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Nieuw wachtwoord instellen
              </Link>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="anim-pop mt-5 flex items-start gap-2 rounded-lg border border-critical/30 bg-critical/10 px-3 py-2.5 text-sm text-critical"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="mt-0.5 shrink-0">
                  <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 5v3.5M8 10.6v.05" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-secondary">E-mailadres</span>
                <input
                  className={fieldClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="jij@bedrijf.nl"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading && (
                  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden className="animate-spin">
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                    <path d="M8 2a6 6 0 016 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                Herstel-link maken
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}
