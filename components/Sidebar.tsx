"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Overzicht",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M2.5 2.5h5v5h-5zM10.5 2.5h5v5h-5zM2.5 10.5h5v5h-5zM10.5 10.5h5v5h-5z" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/omzet",
    label: "Omzet",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M2.5 15.5V11M6.83 15.5V7M11.17 15.5V9.5M15.5 15.5V4" {...stroke} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/klantenservice",
    label: "Klantenservice",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M15.5 8.5a6.5 6 0 01-6.5 6c-.8 0-1.6-.1-2.3-.35L2.5 15.5l1.2-3.2A5.8 5.8 0 012.5 8.5a6.5 6 0 0113 0z" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/voorraad",
    label: "Voorraad",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M2.5 5.5L9 2.5l6.5 3v7l-6.5 3-6.5-3v-7zM2.5 5.5L9 8.5l6.5-3M9 8.5v7" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/personeel",
    label: "Personeel",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M6.5 8.5a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zM1.5 15.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5M12 3.4a2.75 2.75 0 010 4.9M13.5 11.3c1.8.5 3 1.9 3 4.2" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/signaleringen",
    label: "Signaleringen",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M9 2.5a4.5 4.5 0 014.5 4.5c0 3.2.9 4.4 1.5 5H3c.6-.6 1.5-1.8 1.5-5A4.5 4.5 0 019 2.5zM7.3 14.8a1.8 1.8 0 003.4 0" {...stroke} />
      </svg>
    ),
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M2 13V8.5M6 13V3M10 13V6M14 13v-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-sm font-semibold leading-tight tracking-tight">
        Bedrijfs
        <br />
        Command Center
      </span>
    </Link>
  );
}

const SETTINGS_ITEM: NavItem = {
  href: "/instellingen",
  label: "Instellingen",
  icon: (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M9 11.4a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zM14.6 9c0-.42-.05-.83-.13-1.22l1.53-1.19-1.5-2.6-1.8.73a5.6 5.6 0 00-2.1-1.22L10.3 1.6H7.7l-.3 1.9a5.6 5.6 0 00-2.1 1.22l-1.8-.73-1.5 2.6 1.53 1.19a5.7 5.7 0 000 2.44L2 11.41l1.5 2.6 1.8-.73c.6.55 1.32.97 2.1 1.22l.3 1.9h2.6l.3-1.9a5.6 5.6 0 002.1-1.22l1.8.73 1.5-2.6-1.53-1.19c.08-.39.13-.8.13-1.22z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-accent-track/70 font-medium text-ink"
          : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
      }`}
    >
      <span className={active ? "text-accent" : "text-ink-muted"}>{item.icon}</span>
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const items = NAV.map((item) => (
    <NavLink key={item.href} item={item} active={pathname === item.href} />
  ));
  const settingsLink = (
    <NavLink item={SETTINGS_ITEM} active={pathname === SETTINGS_ITEM.href} />
  );

  return (
    <>
      {/* Desktop: vaste sidebar links */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-edge bg-surface py-6 px-3 lg:flex">
        <Logo />
        <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
          {items}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-3 px-3">
            <ThemeToggle />
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs text-ink-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              Live · demo-data
            </span>
          </div>
          <div className="border-t border-edge pt-3">{settingsLink}</div>
        </div>
      </aside>

      {/* Mobiel: logo + horizontale navigatie bovenaan */}
      <div className="flex flex-col gap-3 border-b border-edge bg-surface px-3 pt-4 pb-2 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <ThemeToggle />
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Hoofdnavigatie">
          {items}
          {settingsLink}
        </nav>
      </div>
    </>
  );
}
