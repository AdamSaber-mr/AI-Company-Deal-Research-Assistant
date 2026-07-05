import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/server/session";
import { buildSystemPrompt } from "@/lib/server/context";

// Streamt een echt AI-antwoord (Claude) als er een API-key is geconfigureerd.
// Zonder key antwoordt de route met { fallback: true } en gebruikt de client
// de ingebouwde demo-assistent — de app werkt dus altijd.

type IncomingMessage = { role: "user" | "assistant"; content: string };

/** Statuscheck voor de UI: draait de chat op echte AI of op de demo? */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  return Response.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY) });
}

const MAX_TURNS = 30; // begrens de historie die we meesturen

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ fallback: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const raw = ((body ?? {}) as { messages?: IncomingMessage[] }).messages;
  const history = (Array.isArray(raw) ? raw : [])
    .filter(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return Response.json({ error: "Geen vraag gevonden." }, { status: 400 });
  }

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        // Stabiel deel eerst + cache-breakpoint: de bedrijfsdata is
        // deterministisch, dus vervolgvragen lezen dit uit de prompt-cache.
        type: "text",
        text: buildSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
      {
        // Persoonsgebonden deel ná het breakpoint (klein, per gebruiker).
        type: "text",
        text: `De gebruiker heet ${me.name} en runt "${me.company}".`,
      },
    ],
    messages: history,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\n*Het antwoord werd onderbroken — probeer het opnieuw.*")
        );
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
