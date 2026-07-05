// Bouwt de bedrijfscontext voor de AI-chat: een compacte, deterministische
// samenvatting van de dashboarddata. Deterministisch is belangrijk — het
// systeem-prompt blijft byte-identiek, zodat prompt-caching blijft werken.

import {
  ANCHOR_DATE,
  alerts,
  inventory,
  lastDays,
  periodDelta,
  revenue365,
  revenue90,
  staffing,
  sum,
  ticketCategories,
  tickets90,
} from "@/lib/data";

const eur = (n: number) => `€${Math.round(n).toLocaleString("nl-NL")}`;
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;

export function buildBusinessContext(): string {
  const rev7 = sum(lastDays(revenue90, 7));
  const rev30 = sum(lastDays(revenue90, 30));
  const tick7 = sum(lastDays(tickets90, 7));
  const tick30 = sum(lastDays(tickets90, 30));

  const lines: string[] = [];

  lines.push(`Peildatum: ${ANCHOR_DATE.toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("## Omzet");
  lines.push(`- Laatste 7 dagen: ${eur(rev7)} (${pct(periodDelta(revenue365, 7))} vs vorige periode)`);
  lines.push(`- Laatste 30 dagen: ${eur(rev30)} (${pct(periodDelta(revenue365, 30))} vs vorige periode)`);
  lines.push("");
  lines.push("## Klantenservice");
  lines.push(`- Tickets laatste 7 dagen: ${tick7} · laatste 30 dagen: ${tick30} (${pct(periodDelta(tickets90, 30))})`);
  lines.push("- Onderwerpen deze week (aantal · vs normaal):");
  for (const c of ticketCategories) {
    lines.push(`  - ${c.name}: ${c.count} · ${pct(c.deltaVsNormal)}`);
  }
  lines.push("");
  lines.push("## Voorraad (op huidig verkooptempo)");
  for (const p of inventory) {
    lines.push(
      `- ${p.name}: ${p.stock} stuks, nog ~${p.daysLeft} dagen (status: ${p.severity})`
    );
  }
  lines.push("");
  lines.push("## Personeelsbezetting vandaag");
  for (const d of staffing) {
    lines.push(`- ${d.name}: ${d.present} van ${d.planned} aanwezig`);
  }
  lines.push("");
  lines.push("## Openstaande signaleringen");
  for (const a of alerts) {
    lines.push(`- [${a.severity}] ${a.title} (${a.area}): ${a.detail}`);
  }

  return lines.join("\n");
}

export function buildSystemPrompt(): string {
  return `Je bent Kompas, de AI-researchassistent van een klein bedrijf. Je kijkt mee met de bedrijfscijfers en helpt de eigenaar snel te begrijpen wat er speelt.

Richtlijnen:
- Antwoord in het Nederlands, beknopt en concreet. Begin met het antwoord, details daarna.
- Baseer cijfers uitsluitend op de bedrijfsdata hieronder; verzin niets. Ontbreekt iets, zeg dat dan eerlijk.
- Gebruik markdown spaarzaam (vetgedrukte kerncijfers, korte lijstjes). Geen lange inleidingen.
- Verwijs waar relevant naar de dashboardpagina's: /omzet, /klantenservice, /voorraad, /personeel, /signaleringen, /rapport.
- Geef bij zorgen (piek in klachten, lage voorraad, onderbezetting) een korte, praktische vervolgactie.
- Sluit elk antwoord af met precies één aparte regel die begint met [[vervolg]] gevolgd door twee à drie korte vervolgvragen die de gebruiker zou kunnen stellen, gescheiden door " | ". Voorbeeld: [[vervolg]] Hoe verhoudt dit zich tot vorige maand? | Welke producten moet ik bijbestellen? — geen andere tekst op die regel.

# Bedrijfsdata (live dashboard)

${buildBusinessContext()}`;
}
