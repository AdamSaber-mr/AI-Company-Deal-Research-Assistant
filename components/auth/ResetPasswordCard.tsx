"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fieldClass =
  "w-full rounded-lg border border-edge bg-raised px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent";

export function ResetPasswordCard({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (password !== confirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
      setLoading(false);
    }
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
          Nieuw wachtwoord
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Kies een nieuw wachtwoord voor je account.
        </p>

        {!token && (
          <div className="mt-5 rounded-lg border border-critical/30 bg-critical/10 px-3 py-2.5 text-sm text-critical">
            Deze herstel-link is ongeldig. Vraag een nieuwe aan.
          </div>
        )}

        {token && (
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
                <span className="text-sm font-medium text-ink-secondary">Nieuw wachtwoord</span>
                <div className="relative">
                  <input
                    className={`${fieldClass} pr-11`}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Minstens 8 tekens"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-accent-track/40 hover:text-ink"
                  >
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                        <path d="M2 8s2.3-4 6-4 6 4 6 4-2.3 4-6 4-6-4-6-4z" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M3 3l10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                        <path d="M2 8s2.3-4 6-4 6 4 6 4-2.3 4-6 4-6-4-6-4z" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-secondary">Herhaal wachtwoord</span>
                <input
                  className={fieldClass}
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
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
                Wachtwoord opslaan
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
