"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  // Pas na mount bekend (localStorage/systeemvoorkeur), dus start neutraal.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const apply = (t: Theme) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    setTheme(t);
  };

  const options: { key: Theme; label: string; icon: React.ReactNode }[] = [
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
        const active = theme === o.key;
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
