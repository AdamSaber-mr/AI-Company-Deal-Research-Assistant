// Gesprekken leven client-side in localStorage (demo), met hetzelfde
// snapshot-cache-patroon als lib/settings.ts zodat useSyncExternalStore
// stabiele referenties krijgt en er geen hydration-mismatch ontstaat.

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  feedback?: "up" | "down";
};

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

import { scopedKey, subscribeScope } from "./scope";
import { markLocalChange } from "./sync";

const KEY = "bcc-chats";
const EMPTY: Conversation[] = [];

// Cache op (sleutel + raw) zodat een accountwissel — die de sleutel verandert —
// gegarandeerd opnieuw inleest.
let cachedKey: string | undefined;
let cachedRaw: string | null | undefined;
let cached: Conversation[] = EMPTY;

export function chatsSnapshot(): Conversation[] {
  const key = scopedKey(KEY);
  const raw = localStorage.getItem(key);
  if (key !== cachedKey || raw !== cachedRaw) {
    cachedKey = key;
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as Conversation[]) : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached;
}

export const serverChatsSnapshot = () => EMPTY;

const listeners = new Set<() => void>();

export function subscribeChats(listener: () => void) {
  listeners.add(listener);
  const unsubScope = subscribeScope(listener);
  return () => {
    listeners.delete(listener);
    unsubScope();
  };
}

function persist(next: Conversation[]) {
  localStorage.setItem(scopedKey(KEY), JSON.stringify(next));
  markLocalChange();
  listeners.forEach((l) => l());
}

function mutate(id: string, fn: (c: Conversation) => Conversation) {
  persist(chatsSnapshot().map((c) => (c.id === id ? fn(c) : c)));
}

function newId(): string {
  return crypto.randomUUID();
}

/** Titel = eerste vraag, ingekort. */
function titleFor(question: string): string {
  const clean = question.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? `${clean.slice(0, 47)}…` : clean;
}

export function createConversation(question: string, title?: string | null): string {
  const id = newId();
  const now = Date.now();
  const conversation: Conversation = {
    id,
    title: title ?? titleFor(question),
    pinned: false,
    createdAt: now,
    updatedAt: now,
    messages: [{ id: newId(), role: "user", content: question }],
  };
  persist([conversation, ...chatsSnapshot()]);
  return id;
}

export function addMessage(conversationId: string, role: ChatRole, content: string): string {
  const messageId = newId();
  mutate(conversationId, (c) => ({
    ...c,
    updatedAt: Date.now(),
    messages: [...c.messages, { id: messageId, role, content }],
  }));
  return messageId;
}

export function updateMessage(conversationId: string, messageId: string, content: string) {
  mutate(conversationId, (c) => ({
    ...c,
    updatedAt: Date.now(),
    messages: c.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
  }));
}

/** Verwijdert alle berichten ná het gegeven bericht (voor bewerken/opnieuw genereren). */
export function truncateAfter(conversationId: string, messageId: string) {
  mutate(conversationId, (c) => {
    const index = c.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return c;
    return { ...c, updatedAt: Date.now(), messages: c.messages.slice(0, index + 1) };
  });
}

export function setFeedback(conversationId: string, messageId: string, feedback: "up" | "down") {
  mutate(conversationId, (c) => ({
    ...c,
    messages: c.messages.map((m) =>
      m.id === messageId
        ? { ...m, feedback: m.feedback === feedback ? undefined : feedback }
        : m
    ),
  }));
}

export function renameConversation(id: string, title: string) {
  const clean = title.trim();
  if (!clean) return;
  mutate(id, (c) => ({ ...c, title: clean }));
}

export function togglePin(id: string) {
  mutate(id, (c) => ({ ...c, pinned: !c.pinned }));
}

export function toggleArchive(id: string) {
  mutate(id, (c) => ({ ...c, archived: !c.archived }));
}

/** Zet een gesprek om naar markdown, voor kopiëren of downloaden. */
export function conversationToMarkdown(c: Conversation): string {
  const lines = [`# ${c.title}`, ""];
  for (const m of c.messages) {
    lines.push(m.role === "user" ? "**Jij:**" : "**Kompas:**", "", m.content, "");
  }
  return lines.join("\n");
}

export function deleteConversation(id: string) {
  persist(chatsSnapshot().filter((c) => c.id !== id));
}
