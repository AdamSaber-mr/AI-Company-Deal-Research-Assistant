"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: "Welkom terug",
    subtitle: "Log in om verder te gaan met Kompas.",
    cta: "Inloggen",
  },
  register: {
    title: "Account aanmaken",
    subtitle: "Begin met Kompas — je bedrijf in één helder overzicht.",
    cta: "Account aanmaken",
  },
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-lg border border-edge bg-raised px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent";

export function AuthCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { name, company, email, password }
            : { email, password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
        setLoading(false);
        return;
      }
      // Cookie is gezet; server-layout opnieuw laten evalueren en doorsturen.
      router.push("/");
      router.refresh();
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Woordmerk, zoals in de sidebar */}
      <div className="mb-8 text-center">
        <span className="font-serif text-3xl font-semibold tracking-tight text-ink">
          Kompas
        </span>
      </div>

      <div className="rounded-2xl border border-edge bg-surface p-7 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">{copy.subtitle}</p>

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
          {mode === "register" && (
            <>
              <Field label="Naam">
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Adam Saber"
                  required
                />
              </Field>
              <Field label="Bedrijfsnaam">
                <input
                  className={fieldClass}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                  placeholder="Koffiebar De Ronde"
                  required
                />
              </Field>
            </>
          )}

          <Field label="E-mailadres">
            <input
              className={fieldClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="jij@bedrijf.nl"
              required
            />
          </Field>

          <Field label="Wachtwoord">
            <div className="relative">
              <input
                className={`${fieldClass} pr-11`}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder={mode === "register" ? "Minstens 8 tekens" : "••••••••"}
                minLength={mode === "register" ? 8 : undefined}
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
          </Field>

          {mode === "login" && (
            <Link
              href="/wachtwoord-vergeten"
              className="-mt-1 self-end text-xs font-medium text-ink-muted hover:text-ink"
            >
              Wachtwoord vergeten?
            </Link>
          )}

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
            {copy.cta}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        {mode === "login" ? (
          <>
            Nog geen account?{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Registreren
            </Link>
          </>
        ) : (
          <>
            Al een account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Inloggen
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
