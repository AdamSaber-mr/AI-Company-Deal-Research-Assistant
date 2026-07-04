"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteConversation,
  renameConversation,
  togglePin,
  type Conversation,
} from "@/lib/chat";
import { useConversations } from "@/lib/useChats";
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
          <div className="absolute right-0 top-8 z-40 flex w-44 flex-col rounded-xl border border-edge bg-raised p-1 shadow-lg">
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

/* -------------------------------- sidebar -------------------------------- */

export function Sidebar() {
  const pathname = usePathname();
  const conversations = useConversations();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focust het zoekveld, net als in Claude.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      )
    : conversations;
  const groups = groupChats(filtered);

  const navItems = NAV.map((item) => (
    <NavLink key={item.href} item={item} active={pathname === item.href} />
  ));
  const settingsLink = (
    <NavLink item={SETTINGS_ITEM} active={pathname === SETTINGS_ITEM.href} />
  );

  return (
    <>
      {/* Desktop: vaste sidebar links */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-edge bg-surface py-6 px-3 lg:flex">
        <Logo />

        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-accent-track/70 text-ink"
                : "text-accent hover:bg-accent-track/40"
            }`}
          >
            <span className={pathname === "/" ? "text-accent" : ""}>{NEW_CHAT_ICON}</span>
            Nieuwe chat
          </Link>

          <div className="relative px-0.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            >
              <circle cx="7" cy="7" r="4.5" {...stroke} />
              <path d="M10.5 10.5L14 14" {...stroke} />
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chats zoeken"
              className="w-full rounded-lg border border-edge bg-transparent py-1.5 pl-8 pr-9 text-sm outline-none placeholder:text-ink-muted focus:border-accent/50"
              aria-label="Chats zoeken"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-edge px-1 text-[10px] text-ink-muted">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="-mx-1 flex-1 overflow-y-auto px-1" aria-label="Gespreksgeschiedenis">
          {groups.length === 0 ? (
            <p className="px-3 py-2 text-xs leading-relaxed text-ink-muted">
              {q
                ? "Geen gesprekken gevonden."
                : "Nog geen gesprekken — begin een nieuwe chat."}
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
            </div>
          )}
        </div>

        <div className="border-t border-edge pt-3">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Dashboard
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
            {navItems}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-edge pt-3">
          <div className="flex items-center justify-between gap-2 px-3">
            <ThemeToggle />
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-[11px] text-ink-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              Demo
            </span>
          </div>
          {settingsLink}
        </div>
      </aside>

      {/* Mobiel: logo + horizontale navigatie bovenaan */}
      <div className="flex flex-col gap-3 border-b border-edge bg-surface px-3 pt-4 pb-2 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <ThemeToggle />
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Hoofdnavigatie">
          <NavLink
            item={{ href: "/", label: "Nieuwe chat", icon: NEW_CHAT_ICON }}
            active={pathname === "/"}
          />
          {navItems}
          {settingsLink}
        </nav>
      </div>
    </>
  );
}
