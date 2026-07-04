"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { answer, followUpsFor, sourceFor } from "@/lib/assistant";
import {
  addMessage,
  conversationToMarkdown,
  deleteConversation,
  setFeedback,
  toggleArchive,
  truncateAfter,
  updateMessage,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat";
import { useConversation } from "@/lib/useChats";
import { Composer, ComposerDisclaimer } from "./Composer";
import { Markdown } from "./Markdown";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AssistantAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-track text-accent"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16">
        <path
          d="M8 1.5l1.7 4.3L14 7.5l-4.3 1.7L8 13.5 6.3 9.2 2 7.5l4.3-1.7L8 1.5z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function IconButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent-track/40 hover:text-ink ${
        active ? "text-accent" : "text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      label={copied ? "Gekopieerd" : "Kopiëren"}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path d="M3 8.5L6.5 12 13 4.5" {...stroke} />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" {...stroke} />
          <path d="M10.5 3.5v-1a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h1" {...stroke} />
        </svg>
      )}
    </IconButton>
  );
}

function ConversationMenu({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  const itemClass =
    "rounded-lg px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-accent-track/40 hover:text-ink";

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Gespreksopties"
        aria-label="Gespreksopties"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-accent-track/40 hover:text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
          <circle cx="3.5" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="12.5" cy="8" r="1.3" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
          <div className="absolute right-0 top-9 z-40 flex w-56 flex-col rounded-xl border border-edge bg-raised p-1 shadow-lg">
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                navigator.clipboard.writeText(conversationToMarkdown(conversation));
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                  close();
                }, 900);
              }}
            >
              {copied ? "Gekopieerd ✓" : "Kopieer gesprek"}
            </button>
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                const blob = new Blob([conversationToMarkdown(conversation)], {
                  type: "text/markdown",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${conversation.title.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.md`;
                a.click();
                URL.revokeObjectURL(url);
                close();
              }}
            >
              Download als markdown
            </button>
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                toggleArchive(conversation.id);
                close();
              }}
            >
              {conversation.archived ? "Terugzetten uit archief" : "Archiveren"}
            </button>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-left text-sm text-critical hover:bg-critical/10"
              onClick={() => {
                if (!confirming) {
                  setConfirming(true);
                  return;
                }
                deleteConversation(conversation.id);
                router.push("/");
              }}
            >
              {confirming ? "Zeker weten?" : "Verwijderen"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-1" aria-label="De assistent denkt na">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function UserMessage({
  message,
  onEdit,
}: {
  message: ChatMessage;
  onEdit: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim()) {
                setEditing(false);
                onEdit(draft.trim());
              }
            }
            if (e.key === "Escape") {
              setDraft(message.content);
              setEditing(false);
            }
          }}
          rows={2}
          className="w-full max-w-[85%] resize-none rounded-2xl border border-accent/60 bg-raised px-4 py-2.5 text-[0.95rem] leading-relaxed outline-none"
        />
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setDraft(message.content);
              setEditing(false);
            }}
            className="rounded-lg border border-edge px-3 py-1.5 text-ink-secondary hover:text-ink"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => {
              if (draft.trim()) {
                setEditing(false);
                onEdit(draft.trim());
              }
            }}
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white"
          >
            Opslaan &amp; opnieuw
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-end gap-1">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-edge bg-surface px-4 py-2.5 text-[0.95rem] leading-relaxed">
        {message.content}
      </div>
      <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <CopyButton text={message.content} />
        <IconButton
          label="Bewerken"
          onClick={() => {
            setDraft(message.content);
            setEditing(true);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M11.3 2.7a1.4 1.4 0 012 2L5.5 12.5l-2.8.8.8-2.8 7.8-7.8z" {...stroke} />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  content,
  streaming,
  isLast,
  question,
  onRegenerate,
  onFeedback,
  onFollowUp,
}: {
  message: ChatMessage;
  content: string;
  streaming: boolean;
  isLast: boolean;
  question: string | null;
  onRegenerate: () => void;
  onFeedback: (fb: "up" | "down") => void;
  onFollowUp: (text: string) => void;
}) {
  const source = question ? sourceFor(question) : null;
  const followUps = question ? followUpsFor(question) : [];
  return (
    <div className="group flex gap-3">
      <div className="mt-0.5">
        <AssistantAvatar />
      </div>
      <div className="min-w-0 flex-1">
        <Markdown content={content} />
        {streaming && (
          <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-accent align-text-bottom" />
        )}
        {!streaming && (
          <div
            className={`mt-1.5 flex gap-0.5 transition-opacity ${
              isLast ? "" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
          >
            <CopyButton text={message.content} />
            {isLast && (
              <IconButton label="Opnieuw genereren" onClick={onRegenerate}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                  <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 1.5v3h-3" {...stroke} />
                </svg>
              </IconButton>
            )}
            <IconButton
              label="Goed antwoord"
              active={message.feedback === "up"}
              onClick={() => onFeedback("up")}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M4.5 7v6.5M1.5 8.5v4a1 1 0 001 1h9.2a1.5 1.5 0 001.5-1.2l.9-4.5A1.5 1.5 0 0012.6 6H9.5l.6-3a1.4 1.4 0 00-2.5-1.1L4.5 7H2.5"
                  {...stroke}
                  fill={message.feedback === "up" ? "currentColor" : "none"}
                />
              </svg>
            </IconButton>
            <IconButton
              label="Slecht antwoord"
              active={message.feedback === "down"}
              onClick={() => onFeedback("down")}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M11.5 9V2.5M14.5 7.5v-4a1 1 0 00-1-1H4.3a1.5 1.5 0 00-1.5 1.2l-.9 4.5A1.5 1.5 0 003.4 10h3.1l-.6 3a1.4 1.4 0 002.5 1.1L11.5 9h2"
                  {...stroke}
                  fill={message.feedback === "down" ? "currentColor" : "none"}
                />
              </svg>
            </IconButton>
          </div>
        )}

        {/* Bronlink + follow-up-suggesties, alleen onder het laatste antwoord */}
        {!streaming && isLast && (source || followUps.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {source && (
              <Link
                href={source.href}
                className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent-track/30 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent/70"
              >
                {source.label} →
              </Link>
            )}
            {followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => onFollowUp(followUp)}
                className="rounded-full border border-edge bg-surface px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-accent/50 hover:text-ink"
              >
                {followUp}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatView({ conversationId }: { conversationId: string }) {
  const conversation = useConversation(conversationId);

  const [stream, setStream] = useState<{ messageId: string; shown: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const busyRef = useRef(false);
  const timersRef = useRef<{ timeout?: number; interval?: number }>({});
  const commitRef = useRef<{ messageId: string; shown: string } | null>(null);
  const atBottomRef = useRef(true);

  const busy = thinking || stream !== null;
  const lastMessage = conversation?.messages[conversation.messages.length - 1];

  const stopTimers = () => {
    window.clearTimeout(timersRef.current.timeout);
    window.clearInterval(timersRef.current.interval);
  };

  // Bij een gesprekwissel: streaming-status resetten tijdens de render
  // (React-patroon "adjusting state during render") zodat er geen stale
  // stream van het vorige gesprek blijft hangen.
  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  if (prevConversationId !== conversationId) {
    setPrevConversationId(conversationId);
    setStream(null);
    setThinking(false);
  }

  // Bij verlaten van een gesprek midden in een stream: timers stoppen en de
  // deeltekst bewaren. Dit effect staat vóór het antwoord-effect zodat het
  // opruimen eerst gebeurt bij een gesprekwissel.
  useEffect(() => {
    return () => {
      stopTimers();
      const partial = commitRef.current;
      if (partial && partial.shown) {
        updateMessage(conversationId, partial.messageId, partial.shown);
        commitRef.current = null;
      }
      busyRef.current = false;
    };
     
  }, [conversationId]);

  // Onbeantwoorde gebruikersvraag → antwoord genereren met streaming-effect.
  // Geen cleanup hier: een re-run (door de eigen store-writes) mag de lopende
  // timers niet doden; opruimen gebeurt in het reset-effect hierboven.
  useEffect(() => {
    if (!conversation || !lastMessage || lastMessage.role !== "user") return;
    if (busyRef.current) return;
    busyRef.current = true;
    setThinking(true);

    const full = answer(lastMessage.content, Math.floor(Math.random() * 4));
    const tokens = full.match(/\S+\s*/g) ?? [full];

    timersRef.current.timeout = window.setTimeout(() => {
      setThinking(false);
      const messageId = addMessage(conversation.id, "assistant", "");
      let shown = "";
      let index = 0;
      commitRef.current = { messageId, shown: "" };
      setStream({ messageId, shown: "" });

      timersRef.current.interval = window.setInterval(() => {
        shown += tokens[index] ?? "";
        index++;
        if (index >= tokens.length) {
          stopTimers();
          updateMessage(conversation.id, messageId, full);
          commitRef.current = null;
          setStream(null);
          busyRef.current = false;
        } else {
          commitRef.current = { messageId, shown };
          setStream({ messageId, shown });
        }
      }, 22);
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, lastMessage?.id, lastMessage?.content]);

  // Volg de pagina-scroll voor de "naar beneden"-knop en auto-scroll.
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const nearBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 160;
      atBottomRef.current = nearBottom;
      setAtBottom(nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = (smooth = true) =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });

  useEffect(() => {
    if (atBottomRef.current) scrollToBottom(false);
  }, [stream?.shown, thinking, conversation?.messages.length]);

  const stop = () => {
    stopTimers();
    setThinking(false);
    const partial = commitRef.current;
    if (partial) {
      updateMessage(conversationId, partial.messageId, partial.shown || "*Gestopt.*");
      commitRef.current = null;
    }
    setStream(null);
    busyRef.current = false;
  };

  const send = (text: string) => {
    if (busyRef.current) return;
    addMessage(conversationId, "user", text);
    requestAnimationFrame(() => scrollToBottom(false));
  };

  const regenerate = () => {
    if (busyRef.current || !conversation) return;
    const lastUser = [...conversation.messages].reverse().find((m) => m.role === "user");
    if (lastUser) truncateAfter(conversationId, lastUser.id);
  };

  const edit = (message: ChatMessage, content: string) => {
    if (busyRef.current) return;
    updateMessage(conversationId, message.id, content);
    truncateAfter(conversationId, message.id);
  };

  if (!conversation) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <AssistantAvatar size={40} />
        <p className="text-sm text-ink-secondary">Dit gesprek bestaat niet (meer).</p>
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Nieuwe chat beginnen
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 border-b border-edge bg-page/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <AssistantAvatar size={22} />
          <span className="truncate text-sm font-medium">{conversation.title}</span>
          {conversation.archived && (
            <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[10px] text-ink-muted">
              Gearchiveerd
            </span>
          )}
          <ConversationMenu conversation={conversation} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 py-6">
        {conversation.messages.map((message, i) =>
          message.role === "user" ? (
            <UserMessage
              key={message.id}
              message={message}
              onEdit={(content) => edit(message, content)}
            />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              content={stream?.messageId === message.id ? stream.shown : message.content}
              streaming={stream?.messageId === message.id}
              isLast={i === conversation.messages.length - 1}
              question={
                conversation.messages
                  .slice(0, i)
                  .reverse()
                  .find((m) => m.role === "user")?.content ?? null
              }
              onRegenerate={regenerate}
              onFeedback={(fb) => setFeedback(conversationId, message.id, fb)}
              onFollowUp={send}
            />
          )
        )}
        {thinking && <ThinkingIndicator />}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 bg-page px-4 pt-1 sm:-mx-6 sm:px-6">
        {!atBottom && (
          <div className="pointer-events-none absolute -top-12 left-0 right-0 flex justify-center">
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-raised text-ink-secondary shadow-md transition-colors hover:text-ink"
              aria-label="Naar het einde van het gesprek"
              title="Naar beneden"
            >
              <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden>
                <path d="M9 3.5v11M4.5 10L9 14.5 13.5 10" {...stroke} strokeWidth={2} />
              </svg>
            </button>
          </div>
        )}
        <Composer onSend={send} busy={busy} onStop={stop} autoFocus />
        <ComposerDisclaimer />
      </div>
    </div>
  );
}
