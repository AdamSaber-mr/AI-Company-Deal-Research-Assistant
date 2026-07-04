"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { alerts } from "@/lib/data";
import {
  markAllRead,
  readAlertsSnapshot,
  serverReadAlerts,
  subscribeReadAlerts,
  toggleRead,
} from "@/lib/alerts";
import { SEVERITY, SeverityIcon } from "./severity";

export function useReadAlerts(): string[] {
  return useSyncExternalStore(subscribeReadAlerts, readAlertsSnapshot, serverReadAlerts);
}

/** Bel-knop met ongelezen-teller; opent een panel met alle signaleringen. */
export function NotificationCenter({ align = "left" }: { align?: "left" | "right" }) {
  const read = useReadAlerts();
  const [open, setOpen] = useState(false);

  const unread = alerts.filter(
    (a) => a.severity !== "good" && !read.includes(a.title)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Signaleringen"
        aria-label={`Signaleringen (${unread.length} ongelezen)`}
        aria-expanded={open}
        className="relative flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-accent-track/40 hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
          <path
            d="M9 2.5a4.5 4.5 0 014.5 4.5c0 3.2.9 4.4 1.5 5H3c.6-.6 1.5-1.8 1.5-5A4.5 4.5 0 019 2.5zM7.3 14.8a1.8 1.8 0 003.4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread.length > 0 && (
          <span className="anim-pop absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-critical px-0.5 text-[9px] font-semibold leading-none text-white">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={`anim-pop absolute top-9 z-50 flex w-[21rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-edge bg-raised shadow-lg ${
              align === "left" ? "left-0" : "right-0"
            }`}
            role="dialog"
            aria-label="Signaleringen"
          >
            <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-2.5">
              <span className="text-sm font-semibold">Signaleringen</span>
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Alles gelezen
                </button>
              )}
            </div>

            <ul className="max-h-80 overflow-y-auto p-1.5">
              {alerts.map((a) => {
                const isRead = read.includes(a.title);
                return (
                  <li key={a.title}>
                    <div
                      className={`flex gap-2.5 rounded-lg px-2.5 py-2.5 transition-opacity hover:bg-accent-track/20 ${
                        isRead ? "opacity-55" : ""
                      }`}
                    >
                      <SeverityIcon severity={a.severity} size={15} />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleRead(a.title)}
                          title={isRead ? "Markeer als ongelezen" : "Markeer als gelezen"}
                          className="flex w-full items-baseline justify-between gap-2 text-left"
                        >
                          <span className="truncate text-sm font-medium">{a.title}</span>
                          {!isRead && a.severity !== "good" && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          )}
                        </button>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-secondary">
                          {a.detail}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
                          <span>
                            {SEVERITY[a.severity].label} · {a.time}
                          </span>
                          <Link
                            href={`/?vraag=${encodeURIComponent(`Vertel me meer over: ${a.title}`)}`}
                            onClick={() => setOpen(false)}
                            className="font-medium text-accent hover:underline"
                          >
                            Bespreek in chat →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/signaleringen"
              onClick={() => setOpen(false)}
              className="border-t border-edge px-4 py-2.5 text-center text-xs font-medium text-ink-secondary transition-colors hover:text-ink"
            >
              Alle signaleringen bekijken
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
