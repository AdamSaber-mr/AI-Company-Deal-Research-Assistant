"use client";

import { useState, useSyncExternalStore } from "react";

// De *keuze* van de gebruiker (niet het opgeloste thema): "system" volgt de
// systeemvoorkeur en is de standaard. Licht/donker overrulen dat.
type ThemeChoice = "system" | "light" | "dark";

function storedChoice(): ThemeChoice {
  const raw = localStorage.getItem("theme");
  return raw === "light" || raw === "dark" ? raw : "system";
}

// Op de server (en tijdens hydration) is de keuze onbekend: val terug op auto.
const noopSubscribe = () => () => {};
const serverChoice = (): ThemeChoice => "system";

export function ThemeToggle() {
  const initial = useSyncExternalStore(noopSubscribe, storedChoice, serverChoice);
  const [override, setOverride] = useState<ThemeChoice | null>(null);
  const choice = override ?? initial;

  const apply = (next: ThemeChoice) => {
    if (next === "system") {
      // Attribuut weg → de CSS-mediaquery bepaalt weer licht/donker.
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "system");
    } else {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    }
    setOverride(next);
  };

  const options: { key: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    {
      key: "system",
      label: "Auto",
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="2" y="3" width="12" height="8.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 14h4M8 11.5V14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "light",
      label: "Licht",
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M8 5.2a2.8 2.8 0 110 5.6 2.8 2.8 0 010-5.6zM8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      key: "dark",
      label: "Donker",
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M13.5 9.8A5.8 5.8 0 016.2 2.5a5.8 5.8 0 107.3 7.3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="flex rounded-full border border-edge p-0.5"
      role="group"
      aria-label="Thema"
    >
      {options.map((o) => {
        const active = choice === o.key;
        return (
          <button
            key={o.key}
            onClick={() => apply(o.key)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-accent-track/70 text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
