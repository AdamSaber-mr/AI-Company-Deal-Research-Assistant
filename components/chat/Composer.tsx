"use client";

import { useEffect, useRef, useState } from "react";
import { COMMANDS } from "@/lib/assistant";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Draait de chat op echte AI (Claude) of op de demo-assistent? Eén keer per
// paginalading opvragen; module-cache voorkomt herhaalde calls.
let aiStatusCache: boolean | null = null;

function useAiStatus(): boolean {
  const [ai, setAi] = useState(aiStatusCache ?? false);
  useEffect(() => {
    if (aiStatusCache !== null) return;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        aiStatusCache = Boolean(d?.ai);
        setAi(aiStatusCache);
      })
      .catch(() => {});
  }, []);
  return ai;
}

export function Composer({
  onSend,
  busy = false,
  onStop,
  autoFocus = false,
  placeholder = "Stel een vraag over je zaak…",
}: {
  onSend: (text: string) => void;
  busy?: boolean;
  onStop?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const ai = useAiStatus();
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Slash-commando's: typ "/" en kies een kant-en-klare vraag.
  const slashMatches =
    !busy && !menuDismissed && text.startsWith("/")
      ? COMMANDS.filter((c) => c.command.startsWith(text.trim().toLowerCase()))
      : [];
  const menuOpen = slashMatches.length > 0;

  const chooseCommand = (index: number) => {
    const cmd = slashMatches[index];
    if (!cmd) return;
    setText("");
    requestAnimationFrame(grow);
    onSend(cmd.question);
  };

  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  };

  const send = () => {
    const clean = text.trim();
    if (!clean || busy) return;
    setText("");
    requestAnimationFrame(grow);
    onSend(clean);
  };

  return (
    <div className="relative rounded-2xl border border-edge bg-raised shadow-sm transition-colors focus-within:border-accent/60">
      {menuOpen && (
        <div className="anim-pop absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-edge bg-raised p-1 shadow-lg">
          {slashMatches.map((cmd, i) => (
            <button
              key={cmd.command}
              type="button"
              onClick={() => chooseCommand(i)}
              onMouseEnter={() => setMenuIndex(i)}
              className={`flex w-full items-baseline gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                i === menuIndex ? "bg-accent-track/50" : ""
              }`}
            >
              <span className="font-mono text-[0.8rem] font-medium text-accent">
                {cmd.command}
              </span>
              <span className="font-medium">{cmd.label}</span>
              <span className="ml-auto hidden truncate text-xs text-ink-muted sm:block">
                {cmd.question}
              </span>
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        rows={1}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          setMenuIndex(0);
          setMenuDismissed(false);
          grow();
        }}
        onKeyDown={(e) => {
          if (menuOpen) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMenuIndex((i) => (i + 1) % slashMatches.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setMenuIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length);
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              chooseCommand(menuIndex);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setMenuDismissed(true);
              return;
            }
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        className="max-h-48 w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[0.95rem] leading-relaxed outline-none placeholder:text-ink-muted"
        aria-label="Bericht aan de assistent"
      />

      <div className="flex items-center gap-2 px-2.5 pb-2.5">
        <button
          type="button"
          disabled
          title="Bijlagen zijn niet beschikbaar in deze demo"
          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-ink-muted opacity-60"
          aria-label="Bijlage toevoegen (niet beschikbaar in demo)"
        >
          <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
            <path d="M9 3.5v11M3.5 9h11" {...stroke} />
          </svg>
        </button>

        <span className="text-xs text-ink-muted">
          {ai ? "Claude" : "Demo-assistent"}
        </span>

        <span className="ml-auto hidden text-[11px] text-ink-muted sm:block">
          Enter ↵ verzenden · Shift+Enter nieuwe regel · / commando&apos;s
        </span>

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-ink transition-colors hover:border-accent/60"
            aria-label="Antwoord stoppen"
            title="Stoppen"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white transition-all duration-150 active:scale-90 disabled:opacity-35"
            aria-label="Verzenden"
            title="Verzenden"
          >
            <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden>
              <path d="M9 14.5v-11M4.5 8L9 3.5 13.5 8" {...stroke} strokeWidth={2} />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function ComposerDisclaimer() {
  return (
    <p className="px-2 py-2 text-center text-[11px] text-ink-muted">
      De AI-assistent kan fouten maken — controleer belangrijke cijfers in het dashboard.
    </p>
  );
}
