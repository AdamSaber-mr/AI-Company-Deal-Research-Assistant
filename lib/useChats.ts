"use client";

import { useSyncExternalStore } from "react";
import {
  chatsSnapshot,
  serverChatsSnapshot,
  subscribeChats,
  type Conversation,
} from "./chat";

export function useConversations(): Conversation[] {
  return useSyncExternalStore(subscribeChats, chatsSnapshot, serverChatsSnapshot);
}

export function useConversation(id: string): Conversation | undefined {
  return useConversations().find((c) => c.id === id);
}
