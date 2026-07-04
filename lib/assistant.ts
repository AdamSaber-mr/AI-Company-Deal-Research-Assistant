// Demo-assistent zonder API: antwoorden worden lokaal samengesteld uit de
// deterministische data in lib/data.ts. Antwoorden zijn markdown; een regel
// {{chart:revenue}} of {{chart:tickets}} wordt in de chat als grafiek gerenderd.

import {
  revenue90,
  tickets90,
  lastDays,
  sum,
  periodDelta,
  euro,
  number,
  inventory,
  staffing,
  ticketCategories,
  alerts,
  briefing,
} from "./data";

function fmtDelta(d: number): string {
  return `${d > 0 ? "+" : ""}${d.toLocaleString("nl-NL")}%`;
}

function pick(options: string[], variant: number): string {
  return options[Math.abs(variant) % options.length];
}

/* ---------- vooraf berekende cijfers (deterministische data) ---------- */

const rev30 = sum(lastDays(revenue90, 30));
const rev7 = sum(lastDays(revenue90, 7));
const revDelta = periodDelta(revenue90, 30);
const bestDay = lastDays(revenue90, 30).reduce((a, b) => (b.value > a.value ? b : a));

const weekend30 = lastDays(revenue90, 30).filter((p) => [0, 6].includes(p.date.getDay()));
const weekday30 = lastDays(revenue90, 30).filter((p) => ![0, 6].includes(p.date.getDay()));
const weekendAvg = Math.round(sum(weekend30) / weekend30.length);
const weekdayAvg = Math.round(sum(weekday30) / weekday30.length);

const tickets7 = sum(lastDays(tickets90, 7));
const ticketBaseline = tickets90.slice(0, -7);
const ticketSpike = Math.round(
  ((sum(lastDays(tickets90, 7)) / 7 - sum(ticketBaseline) / ticketBaseline.length) /
    (sum(ticketBaseline) / ticketBaseline.length)) *
    100
);

const critical = inventory.filter((p) => p.daysLeft <= 7);
const present = staffing.reduce((a, d) => a + d.present, 0);
const planned = staffing.reduce((a, d) => a + d.planned, 0);
const shortages = staffing.filter((d) => d.present < d.planned);

/* ---------------------------- antwoorden ---------------------------- */

function revenueAnswer(variant: number): string {
  const intro = pick(
    [
      "De omzet ontwikkelt zich goed — de trend stijgt licht over de hele periode.",
      "Goed nieuws: je omzet zit in een licht stijgende lijn.",
    ],
    variant
  );
  return `${intro}

{{chart:revenue}}

**De cijfers op een rij:**
- Laatste 30 dagen: **${euro.format(rev30)}** (${fmtDelta(revDelta)} t.o.v. de 30 dagen ervoor)
- Laatste 7 dagen: **${euro.format(rev7)}**
- Beste dag: **${bestDay.label}** met ${euro.format(bestDay.value)}
- Doordeweeks draai je gemiddeld **${euro.format(weekdayAvg)}** per dag, in het weekend **${euro.format(weekendAvg)}**

Wil je dat ik inzoom op een specifieke week, of de omzet naast de klachtenpiek van deze week leg?`;
}

function ticketsAnswer(variant: number): string {
  const intro = pick(
    [
      `Er kwamen deze week **${number.format(tickets7)} tickets** binnen — **${fmtDelta(ticketSpike)}** ten opzichte van het gemiddelde van de voorgaande weken. De piek zit vrijwel volledig bij bezorging.`,
      `De klachtenpiek is reëel: **${number.format(tickets7)} tickets** deze week, **${fmtDelta(ticketSpike)}** boven normaal — en vrijwel alle extra tickets gaan over vertraagde bezorging.`,
    ],
    variant
  );
  const rows = ticketCategories
    .map((c) => `| ${c.name} | ${c.count} | ${fmtDelta(c.deltaVsNormal)} |`)
    .join("\n");
  return `${intro}

{{chart:tickets}}

**Verdeling per categorie (deze week):**

| Categorie | Aantal | t.o.v. normaal |
| --- | --- | --- |
${rows}

**Mijn advies:**
1. Bekijk de openstaande bezorgklachten en informeer klanten proactief — dat voorkomt vervolgvragen.
2. Vraag bij je bezorgpartner na wat er speelt; de stijging van ${fmtDelta(ticketCategories[0].deltaVsNormal)} bij "Vertraagde bezorging" is te groot voor toeval.
3. Zet een standaardantwoord klaar voor vragen over vertraging, dan is je team er minder tijd aan kwijt.`;
}

function inventoryAnswer(variant: number): string {
  const urgent = critical[0];
  const intro = pick(
    [
      `Er ${critical.length === 1 ? "is" : "zijn"} **${critical.length} product${critical.length === 1 ? "" : "en"}** met kritieke voorraad. Het meest urgent: **${urgent.name}** — bij het huidige verkooptempo over **${urgent.daysLeft} dagen** op, terwijl de levertijd 4 werkdagen is. Vandaag bestellen dus.`,
      `Je bestellijst kan niet wachten: **${urgent.name}** is over **${urgent.daysLeft} dagen** op en de levering duurt 4 werkdagen. Daarnaast ${critical.length - 1 === 1 ? "vraagt nog 1 product" : `vragen nog ${critical.length - 1} producten`} om actie.`,
    ],
    variant
  );
  const rows = inventory
    .slice(0, 4)
    .map((p) => `| ${p.name} | ${p.stock} stuks | ${p.daysLeft} dagen |`)
    .join("\n");
  const list = critical
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** (${p.sku}) — nog ${p.daysLeft} dagen voorraad, ${
          i === 0 ? "vandaag bestellen" : "deze week bestellen"
        }`
    )
    .join("\n");
  return `${intro}

**Laagste voorraad eerst:**

| Product | Voorraad | Nog voor |
| --- | --- | --- |
${rows}

**Bestellijst:**
${list}

Zal ik ook de rest van het assortiment doorlopen op producten die binnen twee weken op raken?`;
}

function staffingAnswer(variant: number): string {
  const intro = pick(
    [
      `Vandaag zijn **${present} van de ${planned}** geplande medewerkers aanwezig.`,
      `De bezetting van vandaag: **${present} van de ${planned}** ingeplande mensen zijn er.`,
    ],
    variant
  );
  const rows = staffing
    .map(
      (d) =>
        `| ${d.name} | ${d.present} | ${d.planned} | ${
          d.present >= d.planned ? "op sterkte" : `${d.planned - d.present} te weinig`
        } |`
    )
    .join("\n");
  return `${intro}

| Afdeling | Aanwezig | Gepland | Status |
| --- | --- | --- | --- |
${rows}

**Let op:** ${shortages.map((d) => `${d.name} mist ${d.planned - d.present} ${d.planned - d.present === 1 ? "persoon" : "mensen"}`).join(" en ")} — en zaterdag is historisch je drukste dag. Overweeg vandaag nog 1–2 flexkrachten op te roepen voor de bediening.`;
}

function todayAnswer(): string {
  const actions = briefing.actions.map((a, i) => `${i + 1}. ${a}`).join("\n");
  const signals = alerts.map((a) => `- **${a.title}** · ${a.time}`).join("\n");
  return `### ${briefing.headline}

${briefing.summary}

**Actielijst voor vandaag:**
${actions}

**Alle signaleringen van vanochtend:**
${signals}

Vraag gerust door over een van deze punten — bijvoorbeeld *"Waarom zijn er meer klachten?"* of *"Wat moet ik bestellen?"*.`;
}

function greeting(): string {
  return `Goedemorgen! Ik ben je AI-assistent en kijk mee met de cijfers van je zaak. Probeer bijvoorbeeld:

- *Wat moet ik vandaag doen?*
- *Hoe ontwikkelt de omzet zich?*
- *Waarom zijn er deze week meer klachten?*`;
}

function capabilities(): string {
  return `Ik ben **Kompas**, je AI-researchassistent. Ik kan vragen beantwoorden over:

- **Omzet** — trends, beste dagen, weekend versus doordeweeks
- **Klantenservice** — ticketaantallen, pieken en categorieën
- **Voorraad** — wat er bijna op is en wat je moet bestellen
- **Personeel** — bezetting per afdeling en roostergaten
- **Vandaag** — je ochtendbriefing en alle AI-signaleringen op een rij

In deze demo antwoord ik op basis van de voorbeelddata van *Koffiebar De Ronde* — er is geen externe AI-verbinding nodig.`;
}

function fallback(): string {
  return `Daar heb ik (nog) geen data over — ik ben een demo-assistent die alleen meekijkt met de cijfers van je zaak. Waar ik wél mee kan helpen:

- *Hoe ontwikkelt de omzet zich?*
- *Waarom zijn er deze week meer klachten?*
- *Wat moet ik vandaag bestellen?*
- *Staat er genoeg personeel ingepland?*

Stel je vraag gerust anders geformuleerd, dan kijk ik nog een keer.`;
}

/* ----------------------------- matching ----------------------------- */

export type Topic =
  | "greeting"
  | "capabilities"
  | "tickets"
  | "inventory"
  | "staffing"
  | "revenue"
  | "today"
  | "fallback";

export function classify(question: string): Topic {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (/^\s*(hoi|hallo|hey|hi|yo|goedemorgen|goedemiddag|goedenavond)[\s!.?]*$/.test(q)) {
    return "greeting";
  }
  if (has("wat kun je", "wat kan je", "wie ben je", "help")) return "capabilities";
  if (has("klacht", "ticket", "klantenservice", "bezorg")) return "tickets";
  if (has("voorraad", "bestel", "espresso", "bonen", "inkoop", "product")) return "inventory";
  if (has("personeel", "bezetting", "rooster", "medewerker", "ingepland", "bediening", "flexkracht")) {
    return "staffing";
  }
  if (has("omzet", "verkoop", "verdien", "financ")) return "revenue";
  if (has("vandaag", "briefing", "samenvatting", "signalering", "doen", "prioriteit", "overzicht")) {
    return "today";
  }
  return "fallback";
}

export function answer(question: string, variant = 0): string {
  switch (classify(question)) {
    case "greeting":
      return greeting();
    case "capabilities":
      return capabilities();
    case "tickets":
      return ticketsAnswer(variant);
    case "inventory":
      return inventoryAnswer(variant);
    case "staffing":
      return staffingAnswer(variant);
    case "revenue":
      return revenueAnswer(variant);
    case "today":
      return todayAnswer();
    default:
      return fallback();
  }
}

/* --------------------- follow-ups, bronnen, commando's --------------------- */

const DEFAULT_FOLLOW_UPS = [
  "Wat moet ik vandaag doen?",
  "Hoe ontwikkelt de omzet zich?",
  "Wat moet ik vandaag bestellen?",
];

const FOLLOW_UPS: Record<Topic, string[]> = {
  revenue: [
    "Leg de omzet naast de klachtenpiek",
    "Wat moet ik vandaag doen?",
    "Staat er genoeg personeel ingepland?",
  ],
  tickets: [
    "Wat moet ik vandaag bestellen?",
    "Hoe ontwikkelt de omzet zich?",
    "Wat moet ik vandaag doen?",
  ],
  inventory: [
    "Waarom zijn er meer klachten deze week?",
    "Staat er genoeg personeel ingepland?",
    "Hoe ontwikkelt de omzet zich?",
  ],
  staffing: [
    "Wat moet ik vandaag doen?",
    "Waarom zijn er meer klachten deze week?",
    "Hoe ontwikkelt de omzet zich?",
  ],
  today: [
    "Waarom zijn er meer klachten deze week?",
    "Wat moet ik vandaag bestellen?",
    "Staat er genoeg personeel ingepland?",
  ],
  greeting: DEFAULT_FOLLOW_UPS,
  capabilities: DEFAULT_FOLLOW_UPS,
  fallback: DEFAULT_FOLLOW_UPS,
};

export function followUpsFor(question: string): string[] {
  return FOLLOW_UPS[classify(question)];
}

export type AnswerSource = { href: string; label: string };

const SOURCES: Partial<Record<Topic, AnswerSource>> = {
  revenue: { href: "/omzet", label: "Bekijk omzet in het dashboard" },
  tickets: { href: "/klantenservice", label: "Bekijk klantenservice in het dashboard" },
  inventory: { href: "/voorraad", label: "Bekijk voorraad in het dashboard" },
  staffing: { href: "/personeel", label: "Bekijk personeel in het dashboard" },
  today: { href: "/signaleringen", label: "Bekijk alle signaleringen" },
};

export function sourceFor(question: string): AnswerSource | null {
  return SOURCES[classify(question)] ?? null;
}

export type SlashCommand = { command: string; label: string; question: string };

/** Slash-commando's voor de composer: /commando → kant-en-klare vraag. */
export const COMMANDS: SlashCommand[] = [
  { command: "/vandaag", label: "Ochtendbriefing", question: "Wat moet ik vandaag doen?" },
  { command: "/omzet", label: "Omzet-analyse", question: "Hoe ontwikkelt de omzet zich?" },
  { command: "/klachten", label: "Klachten & tickets", question: "Waarom zijn er deze week meer klachten?" },
  { command: "/voorraad", label: "Bestellijst", question: "Wat moet ik vandaag bestellen?" },
  { command: "/personeel", label: "Bezetting vandaag", question: "Staat er vandaag genoeg personeel ingepland?" },
  { command: "/help", label: "Wat kan Kompas?", question: "Wat kun je allemaal?" },
];

/** Suggestie-chips op het welkomstscherm, gekoppeld aan de demo-data. */
export const SUGGESTIONS = [
  "Wat moet ik vandaag doen?",
  "Waarom zijn er deze week zoveel meer klachten?",
  "Wat moet ik vandaag bestellen?",
  "Hoe ontwikkelt de omzet zich?",
];
