"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteConversation,
  renameConversation,
  toggleArchive,
  togglePin,
  type Conversation,
} from "@/lib/chat";
import { alerts, type Alert, type Severity } from "@/lib/data";
import { useConversations } from "@/lib/useChats";
import { useStoredSettings } from "@/lib/useSettings";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { CommandPalette, openCommandPalette } from "./CommandPalette";
import { NotificationCenter, useReadAlerts } from "./NotificationCenter";
import { SettingsModal, openSettings } from "./SettingsModal";

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
    href: "/overzicht",
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
  {
    href: "/rapport",
    label: "Weekrapport",
    icon: (
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
        <path d="M4.5 2.5H11l3 3V15a.5.5 0 01-.5.5H4.5A.5.5 0 014 15V3a.5.5 0 01.5-.5zM11 2.5V6h3.5M6.5 9h5M6.5 12h5" {...stroke} />
      </svg>
    ),
  },
];

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

const NEW_CHAT_ICON = (
  <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
    <path d="M9 2.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 15.5h10a1.5 1.5 0 001.5-1.5V9" {...stroke} />
    <path d="M12.8 2.7a1.6 1.6 0 012.5 2L9.5 10.5l-3 .8.8-3 5.5-5.6z" {...stroke} />
  </svg>
);

// Woordmerk als tekst (geen icoon) — editorial serif, net als "Claude".
function Wordmark() {
  return (
    <Link
      href="/"
      className="font-serif text-[22px] font-semibold leading-none tracking-tight text-ink"
    >
      Kompas
    </Link>
  );
}

const SEARCH_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle cx="7" cy="7" r="4.5" {...stroke} />
    <path d="M10.5 10.5L14 14" {...stroke} />
  </svg>
);

// Kleine, ronde icoonknop voor de kop van de sidebar (zoeken, in-/uitklappen).
function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-accent-track/40 hover:text-ink"
    >
      {children}
    </button>
  );
}

// Eén menu-item in het accountmenu.
function MenuItem({
  icon,
  label,
  onClick,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-accent-track/40 hover:text-ink"
    >
      <span className="shrink-0 text-ink-muted">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <span className="shrink-0 text-xs tracking-wide text-ink-muted">{hint}</span>
      )}
    </button>
  );
}

const menuIcon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Accountrij onderaan: avatar + naam + bedrijf. Klik opent een menu-popover
// (zoals Claude). Klapt in tot alleen de avatar; het menu blijft clean bij
// elke sidebar-breedte omdat het los boven de rij zweeft.
function AccountRow({ collapsed }: { collapsed: boolean }) {
  const settings = useStoredSettings();
  const { user } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Naam/e-mail komen uit het ingelogde account; val terug op de instellingen
  // zolang /me nog laadt.
  const name = user?.name?.trim() || settings.ownerName?.trim() || "Gebruiker";
  const subtitle = user?.email ?? settings.companyName;
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-track/70 text-[13px] font-semibold text-ink">
      {initials}
    </span>
  );

  const go = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const logout = async () => {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ook bij netwerkfout doorsturen naar login */
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative">
      {open && (
        <>
          {/* onzichtbare vanger sluit het menu bij klik ernaast */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className={`anim-pop absolute bottom-full z-50 mb-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-edge bg-raised p-1.5 shadow-2xl ${
              collapsed ? "left-0 w-[248px]" : "left-0 right-0"
            }`}
          >
            <div className="px-3 pb-2 pt-1.5 leading-tight">
              <div className="truncate text-sm font-medium text-ink">{name}</div>
              <div className="truncate text-xs text-ink-muted">{subtitle}</div>
            </div>
            <div className="my-1 border-t border-edge" />

            <MenuItem
              icon={
                <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
                  <circle cx="9" cy="9" r="2.4" {...menuIcon} />
                  <path d="M9 2.2v1.6M9 14.2v1.6M2.2 9h1.6M14.2 9h1.6M4.2 4.2l1.1 1.1M12.7 12.7l1.1 1.1M13.8 4.2l-1.1 1.1M5.3 12.7l-1.1 1.1" {...menuIcon} />
                </svg>
              }
              label="Instellingen"
              hint="⌘,"
              onClick={go(() => openSettings())}
            />
            <MenuItem
              icon={
                <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
                  <rect x="2.5" y="3.5" width="13" height="9" rx="1.4" {...menuIcon} />
                  <path d="M6.5 15.5h5M9 12.5v3" {...menuIcon} />
                </svg>
              }
              label="Weergave & thema"
              onClick={go(() => openSettings("weergave"))}
            />
            <MenuItem
              icon={
                <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
                  <circle cx="9" cy="9" r="6.4" {...menuIcon} />
                  <path d="M6.9 6.9a2.1 2.1 0 114 .9c0 1.4-2 1.6-2 3M9 12.6v.05" {...menuIcon} />
                </svg>
              }
              label="Hulp & uitleg"
              onClick={go(() => router.push("/"))}
            />

            <div className="my-1 border-t border-edge" />

            <MenuItem
              icon={
                <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
                  <path d="M7.4 10.6l3.2-3.2M6.6 12.2l-1 1a2.4 2.4 0 01-3.4-3.4l1.9-1.9a2.4 2.4 0 013.4 0M11.4 5.8l1-1a2.4 2.4 0 013.4 3.4l-1.9 1.9a2.4 2.4 0 01-3.4 0" {...menuIcon} />
                </svg>
              }
              label="Systemen koppelen"
              onClick={go(() => openSettings("koppelingen"))}
            />

            <div className="my-1 border-t border-edge" />

            <MenuItem
              icon={
                <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
                  <path d="M11.5 12.5l3-3.5-3-3.5M14 9H6.5M8.5 2.5H4.2a.7.7 0 00-.7.7v11.6a.7.7 0 00.7.7h4.3" {...menuIcon} />
                </svg>
              }
              label="Uitloggen"
              onClick={logout}
            />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? name : undefined}
        aria-label={collapsed ? `${name} · accountmenu` : undefined}
        className={
          collapsed
            ? "flex w-full justify-center"
            : `flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors ${
                open ? "bg-accent-track/50" : "hover:bg-accent-track/40"
              }`
        }
      >
        {avatar}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-ink">{name}</span>
              <span className="block truncate text-[11px] text-ink-muted">
                {subtitle}
              </span>
            </span>
            <span className="text-ink-muted">
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
                <path d="M4.5 10L8 6.5 11.5 10" {...menuIcon} />
              </svg>
            </span>
          </>
        )}
      </button>
    </div>
  );
}

// Badge per pagina, gekleurd naar de zwaarste ongelezen melding: urgent =
// rood, actie nodig = oranje, let op = amber. Goed nieuws en gelezen
// meldingen tellen niet mee.
const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  serious: 2,
  warning: 1,
  good: 0,
};

type Badge = { count: number; severity: Severity };

function badgeFor(items: Alert[]): Badge | null {
  if (items.length === 0) return null;
  const top = items.reduce((a, b) =>
    SEVERITY_RANK[b.severity] > SEVERITY_RANK[a.severity] ? b : a
  );
  return { count: items.length, severity: top.severity };
}

function badgesByHref(readTitles: string[]): Record<string, Badge | null> {
  const flagged = alerts.filter(
    (a) => a.severity !== "good" && !readTitles.includes(a.title)
  );
  return {
    "/omzet": badgeFor(flagged.filter((a) => a.area === "omzet")),
    "/klantenservice": badgeFor(flagged.filter((a) => a.area === "klantenservice")),
    "/voorraad": badgeFor(flagged.filter((a) => a.area === "voorraad")),
    "/personeel": badgeFor(flagged.filter((a) => a.area === "personeel")),
    "/signaleringen": badgeFor(flagged),
  };
}

const BADGE_STYLE: Record<Severity, string> = {
  critical: "bg-critical text-white",
  serious: "bg-serious text-white",
  warning: "bg-warning text-[#3d2e00]",
  good: "bg-good text-white",
};

function NavLink({
  item,
  active,
  collapsed = false,
  badge = null,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  badge?: Badge | null;
}) {
  const badgeChip = badge && (
    <span
      className={`anim-pop flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ${BADGE_STYLE[badge.severity]} ${
        collapsed ? "absolute -right-1 -top-1" : "ml-auto"
      }`}
      style={{ animationDelay: "250ms" }}
      aria-label={`${badge.count} ${badge.count === 1 ? "melding" : "meldingen"}`}
    >
      {badge.count}
    </span>
  );

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-2.5 rounded-lg text-sm transition-colors ${
        collapsed ? "relative justify-center px-0 py-2" : "px-3 py-2"
      } ${
        active
          ? "bg-accent-track/70 font-medium text-ink"
          : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
      }`}
    >
      <span className={`relative ${active ? "text-accent" : "text-ink-muted"}`}>
        {item.icon}
        {collapsed && badgeChip}
      </span>
      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
      {!collapsed && badgeChip}
    </Link>
  );
}

/* ------------------------- gespreksgeschiedenis ------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

function groupChats(chats: Conversation[]): { label: string; items: Conversation[] }[] {
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  const startOfToday = new Date().setHours(0, 0, 0, 0);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Vastgepind", items: [] },
    { label: "Vandaag", items: [] },
    { label: "Gisteren", items: [] },
    { label: "Afgelopen 7 dagen", items: [] },
    { label: "Ouder", items: [] },
  ];

  for (const chat of sorted) {
    if (chat.pinned) groups[0].items.push(chat);
    else if (chat.updatedAt >= startOfToday) groups[1].items.push(chat);
    else if (chat.updatedAt >= startOfToday - DAY_MS) groups[2].items.push(chat);
    else if (chat.updatedAt >= startOfToday - 7 * DAY_MS) groups[3].items.push(chat);
    else groups[4].items.push(chat);
  }

  return groups.filter((g) => g.items.length > 0);
}

function ChatItem({ chat, active }: { chat: Conversation; active: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(chat.title);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirming(false);
  };

  const commitRename = () => {
    renameConversation(chat.id, draft);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className="px-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          className="w-full rounded-lg border border-accent/60 bg-raised px-2 py-1.5 text-sm outline-none"
          aria-label="Gesprek hernoemen"
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={`/chat/${chat.id}`}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2 rounded-lg py-1.5 pl-3 pr-8 text-sm transition-colors ${
          active
            ? "bg-accent-track/70 font-medium text-ink"
            : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
        }`}
      >
        {chat.pinned && (
          <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden className="shrink-0 text-ink-muted">
            <path d="M9.5 1.5l5 5-2.5.5-2 2L9.5 14 6 10.5l-4 4 4-4L2.5 7l4.5-.5 2-2 .5-3z" fill="currentColor" />
          </svg>
        )}
        <span className="truncate">{chat.title}</span>
      </Link>

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={`Opties voor "${chat.title}"`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className={`absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-opacity hover:bg-accent-track/50 hover:text-ink ${
          menuOpen ? "" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <circle cx="3.5" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="12.5" cy="8" r="1.3" fill="currentColor" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={closeMenu} aria-hidden />
          <div className="anim-pop absolute right-0 top-8 z-40 flex w-44 flex-col rounded-xl border border-edge bg-raised p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                togglePin(chat.id);
                closeMenu();
              }}
              className="rounded-lg px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
            >
              {chat.pinned ? "Losmaken" : "Vastpinnen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(chat.title);
                setRenaming(true);
                closeMenu();
              }}
              className="rounded-lg px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
            >
              Hernoemen
            </button>
            <button
              type="button"
              onClick={() => {
                toggleArchive(chat.id);
                closeMenu();
              }}
              className="rounded-lg px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
            >
              {chat.archived ? "Terugzetten" : "Archiveren"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirming) {
                  setConfirming(true);
                  return;
                }
                deleteConversation(chat.id);
                closeMenu();
                if (active) router.push("/");
              }}
              className="rounded-lg px-3 py-1.5 text-left text-sm text-critical hover:bg-critical/10"
            >
              {confirming ? "Zeker weten?" : "Verwijderen"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ----------------------------- breedte slepen ----------------------------- */

// De sidebar-breedte is met de muis aanpasbaar en wordt bewaard in
// localStorage; zelfde snapshot-patroon als de instellingen.
const WIDTH_KEY = "bcc-sidebar-width";
const WIDTH_DEFAULT = 256;
const WIDTH_MIN = 200;
const WIDTH_MAX = 420;

const clampWidth = (w: number) =>
  Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(w)));

const noopSubscribe = () => () => {};
const serverWidth = () => WIDTH_DEFAULT;

function storedWidth(): number {
  const raw = localStorage.getItem(WIDTH_KEY);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? clampWidth(n) : WIDTH_DEFAULT;
}

const COLLAPSE_KEY = "bcc-sidebar-collapsed";
const COLLAPSED_WIDTH = 68;

const storedCollapsed = () => localStorage.getItem(COLLAPSE_KEY) === "1";
const serverCollapsed = () => false;

function useSidebarCollapsed() {
  const stored = useSyncExternalStore(noopSubscribe, storedCollapsed, serverCollapsed);
  const [override, setOverride] = useState<boolean | null>(null);
  const collapsed = override ?? stored;

  const toggle = () => {
    const next = !collapsed;
    setOverride(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

  return { collapsed, toggle };
}

function useSidebarWidth() {
  const stored = useSyncExternalStore(noopSubscribe, storedWidth, serverWidth);
  const [override, setOverride] = useState<number | null>(null);
  const [resizing, setResizing] = useState(false);

  const handleProps = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setResizing(true);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!resizing) return;
      setOverride(clampWidth(e.clientX));
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!resizing) return;
      setResizing(false);
      localStorage.setItem(WIDTH_KEY, String(clampWidth(e.clientX)));
    },
    onDoubleClick: () => {
      localStorage.removeItem(WIDTH_KEY);
      setOverride(null);
    },
  };

  return { width: override ?? stored, resizing, handleProps };
}

/* -------------------------------- sidebar -------------------------------- */

export function Sidebar() {
  const pathname = usePathname();
  const conversations = useConversations();
  const { width, resizing, handleProps } = useSidebarWidth();
  const { collapsed, toggle } = useSidebarCollapsed();
  const readAlerts = useReadAlerts();
  const badges = badgesByHref(readAlerts);

  const archivedChats = conversations
    .filter((c) => c.archived)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const groups = groupChats(conversations.filter((c) => !c.archived));
  const [showArchived, setShowArchived] = useState(false);
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false);

  const desktopNav = NAV.map((item) => (
    <NavLink
      key={item.href}
      item={item}
      active={pathname === item.href}
      collapsed={collapsed}
      badge={badges[item.href]}
    />
  ));
  const mobileNav = NAV.map((item) => (
    <NavLink
      key={item.href}
      item={item}
      active={pathname === item.href}
      badge={badges[item.href]}
    />
  ));

  return (
    <>
      {/* Desktop: vaste sidebar links; breedte sleepbaar, inklapbaar tot icoontjes */}
      {/* z-40: sticky vormt een eigen stacking context; zonder z-index zouden
          popovers uit de sidebar (meldingenpanel) klikken verliezen aan de
          transparante paginawrapper die later in de DOM komt. */}
      <aside
        style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
        className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col gap-3 border-r border-edge bg-surface py-5 px-3 print:!hidden lg:flex ${
          resizing ? "select-none" : "transition-[width] duration-200 ease-out"
        }`}
      >
        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Sidebar-breedte aanpassen"
            title="Sleep om de breedte aan te passen · dubbelklik voor standaardbreedte"
            {...handleProps}
            className={`absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize transition-colors ${
              resizing ? "bg-accent/70" : "hover:bg-accent/40"
            }`}
          />
        )}

        {/* Kop: woordmerk links, zoeken + meldingen + in-/uitklappen rechts */}
        <div
          className={
            collapsed
              ? "flex flex-col items-center gap-1.5"
              : "flex items-center justify-between gap-2 pl-2 pr-1"
          }
        >
          {!collapsed && <Wordmark />}
          <div className={collapsed ? "flex flex-col items-center gap-1.5" : "flex items-center gap-0.5"}>
            <IconButton onClick={openCommandPalette} label="Zoeken (⌘K)">
              {SEARCH_ICON}
            </IconButton>
            <NotificationCenter />
            <IconButton
              onClick={toggle}
              label={collapsed ? "Sidebar uitklappen" : "Sidebar inklappen"}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                <rect x="2.5" y="3" width="13" height="12" rx="2" {...stroke} />
                <path d="M7 3v12" {...stroke} />
              </svg>
            </IconButton>
          </div>
        </div>

        {/* Nieuwe chat + dashboardnavigatie */}
        <div className="flex flex-col gap-0.5">
          <Link
            href="/"
            title={collapsed ? "Nieuwe chat" : undefined}
            className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
            } ${
              pathname === "/"
                ? "bg-accent-track/70 text-ink"
                : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
            }`}
          >
            <span className="text-ink-muted">{NEW_CHAT_ICON}</span>
            {!collapsed && "Nieuwe chat"}
          </Link>

          {!collapsed && (
            <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Dashboard
            </div>
          )}
          <nav className="flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
            {desktopNav}
          </nav>
        </div>

        {/* Recents: gespreksgeschiedenis, vult de resterende ruimte */}
        {collapsed ? (
          <div className="flex-1" />
        ) : (
          <div
            className="-mx-1 mt-1 flex-1 overflow-y-auto px-1"
            aria-label="Gespreksgeschiedenis"
          >
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                Recents
              </span>
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label="Chats zoeken"
                title="Chats zoeken"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="7" cy="7" r="4.5" {...stroke} />
                  <path d="M10.5 10.5L14 14" {...stroke} />
                </svg>
              </button>
            </div>
            {groups.length === 0 && archivedChats.length === 0 ? (
              <p className="px-3 py-2 text-xs leading-relaxed text-ink-muted">
                Nog geen gesprekken — begin een nieuwe chat.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {groups.map((group) => (
                  <div key={group.label}>
                    <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                      {group.label}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          active={pathname === `/chat/${chat.id}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {archivedChats.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowArchived((v) => !v)}
                      className="flex w-full items-center gap-1 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted hover:text-ink"
                    >
                      Gearchiveerd ({archivedChats.length})
                      <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden>
                        <path
                          d={showArchived ? "M3.5 6L8 10.5 12.5 6" : "M6 3.5L10.5 8 6 12.5"}
                          {...stroke}
                        />
                      </svg>
                    </button>
                    {showArchived && (
                      <div className="flex flex-col gap-0.5">
                        {archivedChats.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            active={pathname === `/chat/${chat.id}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Account onderaan: avatar + naam + bedrijf, opent instellingen-pop-up */}
        <div className="border-t border-edge pt-2">
          <AccountRow collapsed={collapsed} />
        </div>
      </aside>

      <CommandPalette />
      <SettingsModal />

      {/* Mobiel: woordmerk + horizontale navigatie bovenaan */}
      <div className="flex flex-col gap-3 border-b border-edge bg-surface px-3 pt-4 pb-2 print:hidden lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Wordmark />
          <div className="flex items-center gap-1">
            <IconButton onClick={openCommandPalette} label="Zoeken">
              {SEARCH_ICON}
            </IconButton>
            <NotificationCenter align="right" />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Hoofdnavigatie">
          <NavLink
            item={{ href: "/", label: "Nieuwe chat", icon: NEW_CHAT_ICON }}
            active={pathname === "/"}
          />
          <button
            type="button"
            onClick={() => setMobileChatsOpen((v) => !v)}
            aria-expanded={mobileChatsOpen}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              mobileChatsOpen
                ? "bg-accent-track/70 font-medium text-ink"
                : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
            }`}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden className="text-ink-muted">
              <path
                d="M15.5 8.5a6.5 6 0 01-6.5 6c-.8 0-1.6-.1-2.3-.35L2.5 15.5l1.2-3.2A5.8 5.8 0 012.5 8.5a6.5 6 0 0113 0z"
                {...stroke}
              />
            </svg>
            <span className="whitespace-nowrap">Chats</span>
            <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden>
              <path d={mobileChatsOpen ? "M3.5 10L8 5.5 12.5 10" : "M3.5 6L8 10.5 12.5 6"} {...stroke} />
            </svg>
          </button>
          {mobileNav}
          <button
            type="button"
            onClick={() => openSettings()}
            className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-accent-track/40 hover:text-ink"
          >
            <span className="text-ink-muted">{SETTINGS_ITEM.icon}</span>
            <span className="whitespace-nowrap">{SETTINGS_ITEM.label}</span>
          </button>
        </nav>

        {mobileChatsOpen && (
          <div className="anim-rise flex flex-col gap-0.5 border-t border-edge pt-2 pb-1">
            {conversations.filter((c) => !c.archived).length === 0 ? (
              <p className="px-3 py-1 text-xs text-ink-muted">
                Nog geen gesprekken — begin een nieuwe chat.
              </p>
            ) : (
              conversations
                .filter((c) => !c.archived)
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, 8)
                .map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    onClick={() => setMobileChatsOpen(false)}
                    className={`truncate rounded-lg px-3 py-1.5 text-sm ${
                      pathname === `/chat/${chat.id}`
                        ? "bg-accent-track/70 font-medium text-ink"
                        : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
                    }`}
                  >
                    {chat.title}
                  </Link>
                ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
