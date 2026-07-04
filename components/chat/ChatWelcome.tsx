"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SUGGESTIONS } from "@/lib/assistant";
import { createConversation } from "@/lib/chat";
import { useStoredSettings } from "@/lib/useSettings";
import { Composer, ComposerDisclaimer } from "./Composer";
import { AssistantAvatar } from "./ChatView";

export function ChatWelcome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ownerName, companyName } = useStoredSettings();
  const handledRef = useRef(false);

  const start = (question: string) => {
    const id = createConversation(question);
    router.push(`/chat/${id}`);
  };

  // "Bespreek in chat"-links elders in de app openen een gesprek via ?vraag=…
  const vraag = searchParams.get("vraag");
  useEffect(() => {
    if (vraag && !handledRef.current) {
      handledRef.current = true;
      start(vraag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vraag]);

  return (
    <div className="stagger mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <AssistantAvatar size={44} />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Goedemorgen, {ownerName}
        </h1>
        <p className="max-w-md text-[0.95rem] leading-relaxed text-ink-secondary">
          Stel een vraag over {companyName} — omzet, klantenservice, voorraad of
          personeel. Ik kijk mee met je cijfers.
        </p>
      </div>

      <div className="mt-8">
        <Composer onSend={start} autoFocus placeholder="Waar kan ik mee helpen?" />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => start(suggestion)}
            className="rounded-full border border-edge bg-surface px-3.5 py-2 text-sm text-ink-secondary transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/50 hover:text-ink"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <ComposerDisclaimer />
    </div>
  );
}
