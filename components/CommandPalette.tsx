"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/lib/useChats";

type PaletteItem = {
  key: string;
  section: "Acties" | "Pagina's" | "Chats";
  label: string;
  href: string;
};

const PAGES: { href: string; label: string }[] = [
  { href: "/overzicht", label: "Overzicht" },
  { href: "/omzet", label: "Omzet" },
  { href: "/klantenservice", label: "Klantenservice" },
  { href: "/voorraad", label: "Voorraad" },
  { href: "/personeel", label: "Personeel" },
  { href: "/signaleringen", label: "Signaleringen" },
  { href: "/instellingen", label: "Instellingen" },
];

/** ⌘K / Ctrl+K command palette: navigeren naar acties, pagina's en chats. */
export function CommandPalette() {
  const router = useRouter();
  const conversations = useConversations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setIndex(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (label: string) => !q || label.toLowerCase().includes(q);

    const actions: PaletteItem[] = match("nieuwe chat")
      ? [{ key: "new-chat", section: "Acties", label: "Nieuwe chat", href: "/" }]
      : [];

    const pages: PaletteItem[] = PAGES.filter((p) => match(p.label)).map((p) => ({
      key: p.href,
      section: "Pagina's",
      label: p.label,
      href: p.href,
    }));

    const chats: PaletteItem[] = conversations
      .filter(
        (c) =>
          match(c.title) ||
          (q && c.messages.some((m) => m.content.toLowerCase().includes(q)))
      )
      .slice(0, 6)
      .map((c) => ({
        key: c.id,
        section: "Chats",
        label: c.title,
        href: `/chat/${c.id}`,
      }));

    return [...actions, ...pages, ...chats];
  }, [query, conversations]);

  if (!open) return null;

  const choose = (item: PaletteItem | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  let lastSection: string | null = null;

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[14vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="anim-pop w-full max-w-lg overflow-hidden rounded-2xl border border-edge bg-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => (items.length ? (i + 1) % items.length : 0));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              choose(items[index]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Zoek een pagina, actie of chat…"
          className="w-full border-b border-edge bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-ink-muted"
          aria-label="Zoeken in command palette"
        />
        <div className="max-h-80 overflow-y-auto p-1.5">
          {items.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-ink-muted">
              Niets gevonden.
            </p>
          )}
          {items.map((item, i) => {
            const header =
              item.section !== lastSection ? (
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {item.section}
                </div>
              ) : null;
            lastSection = item.section;
            return (
              <div key={item.key}>
                {header}
                <button
                  type="button"
                  onClick={() => choose(item)}
                  onMouseEnter={() => setIndex(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                    i === index ? "bg-accent-track/50 text-ink" : "text-ink-secondary"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {i === index && (
                    <kbd className="ml-auto shrink-0 rounded border border-edge px-1 text-[10px] text-ink-muted">
                      ↵
                    </kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
