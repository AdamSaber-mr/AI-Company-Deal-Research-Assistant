// AI-generatie voor de ochtendbriefing en het weekrapport. Zelfde patroon als
// de chat: mét ANTHROPIC_API_KEY schrijft Claude de teksten, zonder key geeft
// alles null terug en toont de UI de ingebouwde demo-teksten.
//
// Resultaten worden per gebruiker op schijf gecachet zodat we niet bij elke
// paginalading opnieuw genereren; de demo-data is toch deterministisch.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { buildBusinessContext } from "./context";
import type { PublicUser } from "./users";

const CACHE_DIR = join(process.cwd(), ".data", "ai-cache");

export type AiBriefing = {
  headline: string;
  summary: string;
  actions: string[];
};

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/* --------------------------------- cache --------------------------------- */

function cachePath(kind: string, userId: string): string {
  if (!/^[a-f0-9]+$/.test(userId)) throw new Error("Ongeldige gebruikers-id");
  return join(CACHE_DIR, `${kind}-${userId}.json`);
}

function readCache<T>(kind: string, userId: string): T | null {
  const file = cachePath(kind, userId);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeCache(kind: string, userId: string, value: unknown) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(kind, userId), JSON.stringify(value), "utf8");
}

/* ------------------------------- generatie ------------------------------- */

const BRIEFING_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: {
      type: "string" as const,
      description:
        "Korte, activerende kop van maximaal acht woorden, zonder punt, kleine letters behalve het eerste woord",
    },
    summary: {
      type: "string" as const,
      description:
        "Twee à drie zinnen: wat vraagt vandaag om actie en wat loopt goed",
    },
    actions: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Precies drie concrete acties voor vandaag, elk één zin",
    },
  },
  required: ["headline", "summary", "actions"],
  additionalProperties: false as const,
};

/** Ochtendbriefing door Claude; null zonder API-key of bij een fout. */
export async function generateBriefing(
  user: PublicUser
): Promise<AiBriefing | null> {
  if (!aiAvailable()) return null;

  const cached = readCache<AiBriefing>("briefing", user.id);
  if (cached) return cached;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: BRIEFING_SCHEMA },
      },
      system: `Je schrijft de ochtendbriefing voor ${user.name}, eigenaar van "${user.company}". Nederlands, zakelijk maar warm, concreet. Baseer je uitsluitend op de data.`,
      messages: [
        {
          role: "user",
          content: `Schrijf de ochtendbriefing van vandaag op basis van deze bedrijfsdata:\n\n${buildBusinessContext()}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) return null;
    const briefing = JSON.parse(text) as AiBriefing;
    writeCache("briefing", user.id, briefing);
    return briefing;
  } catch {
    return null;
  }
}

/** Weekrapport-samenvatting (markdown) door Claude; null zonder key/bij fout. */
export async function generateReport(user: PublicUser): Promise<string | null> {
  if (!aiAvailable()) return null;

  const cached = readCache<{ markdown: string }>("report", user.id);
  if (cached) return cached.markdown;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: `Je schrijft de management-samenvatting van het weekrapport voor "${user.company}". Nederlands, beknopt (120–180 woorden), markdown met hooguit wat vetgedrukte kerncijfers. Structuur: hoe de week ging, wat aandacht vraagt, wat er goed loopt. Geen kop boven het geheel, geen lijstjes langer dan drie punten.`,
      messages: [
        {
          role: "user",
          content: `Schrijf de weeksamenvatting op basis van deze bedrijfsdata:\n\n${buildBusinessContext()}`,
        },
      ],
    });

    const markdown = response.content.find((b) => b.type === "text")?.text ?? null;
    if (!markdown) return null;
    writeCache("report", user.id, { markdown });
    return markdown;
  } catch {
    return null;
  }
}
