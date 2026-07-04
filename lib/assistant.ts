// Demo-assistent zonder API: antwoorden worden lokaal samengesteld uit de
// deterministische data in lib/data.ts. Antwoorden zijn markdown; een regel
// {{chart:revenue}} of {{chart:tickets}} wordt in de chat als grafiek gerenderd.

import {
  ANCHOR_DATE,
  longDate,
  revenue90,
  revenue365,
  tickets90,
  tickets365,
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
  type DayPoint,
  type Product,
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
  const list = critical
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** (${p.sku}) — nog ${p.daysLeft} dagen voorraad, ${
          i === 0 ? "vandaag bestellen" : "deze week bestellen"
        }`
    )
    .join("\n");
  return `${intro}

{{chart:inventory}}

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
  return `${intro}

{{chart:staffing}}

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
- **Voorraad** — wat er bijna op is en wat je moet bestellen, ook per product (*"Hoeveel havermelk heb ik nog?"*)
- **Personeel** — bezetting per afdeling en roostergaten
- **Specifieke dagen** — *"Hoe was 19 juni?"* of *"Hoe was het gisteren?"*
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

/* ------------------------- dag- en productvragen ------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

const shortDate = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" });

function findPoint(series: DayPoint[], date: Date): DayPoint | undefined {
  return series.find(
    (p) =>
      p.date.getDate() === date.getDate() &&
      p.date.getMonth() === date.getMonth() &&
      p.date.getFullYear() === date.getFullYear()
  );
}

/** Herkent "19 juni", "gisteren" of "eergisteren" in een vraag. */
function parseDay(q: string): Date | null {
  if (q.includes("eergisteren")) return new Date(ANCHOR_DATE.getTime() - 2 * DAY_MS);
  if (q.includes("gisteren")) return new Date(ANCHOR_DATE.getTime() - DAY_MS);
  const m = q.match(
    /(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/
  );
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS.indexOf(m[2]);
  // Meest recente voorkomen van die dag+maand (data loopt een jaar terug)
  const inFuture =
    month > ANCHOR_DATE.getMonth() ||
    (month === ANCHOR_DATE.getMonth() && day > ANCHOR_DATE.getDate());
  const year = ANCHOR_DATE.getFullYear() - (inFuture ? 1 : 0);
  return new Date(year, month, day, 8);
}

/** Zoekt een product op basis van woorden uit de productnaam. */
function findProduct(q: string): Product | undefined {
  return inventory.find((p) =>
    p.name
      .toLowerCase()
      .split(/[^a-zà-ü]+/)
      .filter((word) => word.length >= 5)
      .some((word) => q.includes(word))
  );
}

function dayAnswer(date: Date): string {
  const rev = findPoint(revenue365, date);
  const tick = findPoint(tickets365, date);
  if (!rev || !tick) {
    return `Daar heb ik geen data van — mijn reeks loopt van ${longDate.format(
      revenue365[0].date
    )} tot ${longDate.format(ANCHOR_DATE)}. Kies een dag binnen die periode.`;
  }

  const revAvg = sum(lastDays(revenue365, 30)) / 30;
  const tickAvg = sum(lastDays(tickets365, 30)) / 30;
  const revVsAvg = Math.round(((rev.value - revAvg) / revAvg) * 100);
  const weekEarlier = findPoint(revenue365, new Date(date.getTime() - 7 * DAY_MS));
  const vsWeek =
    weekEarlier && weekEarlier.value > 0
      ? Math.round(((rev.value - weekEarlier.value) / weekEarlier.value) * 100)
      : null;
  const isWeekend = [0, 6].includes(date.getDay());

  const heading = longDate.format(date);
  return `### ${heading.charAt(0).toUpperCase()}${heading.slice(1)}

Op ${rev.label} draaide je **${euro.format(rev.value)}** omzet en kwamen er **${tick.value} klantenservice-tickets** binnen.

- Omzet: **${euro.format(rev.value)}** (${fmtDelta(revVsAvg)} t.o.v. je daggemiddelde van de laatste 30 dagen)
- Tickets: **${tick.value}** (gemiddeld ~${Math.round(tickAvg)} per dag)${
    vsWeek !== null && weekEarlier
      ? `\n- Een week eerder (${weekEarlier.label}): ${euro.format(weekEarlier.value)} — dat is ${fmtDelta(vsWeek)} verschil`
      : ""
  }${isWeekend ? "\n\nHet was een weekenddag — die liggen bij jou gemiddeld een stuk lager dan doordeweeks." : ""}

Wil je een andere dag zien, of de hele periode in de grafiek?`;
}

function productAnswer(p: Product): string {
  const advice = {
    critical: "**Bestel vandaag nog** — de levertijd is 4 werkdagen, dus dit wordt krap.",
    serious: "Bestel deze week om zonder stress aangevuld te zijn.",
    warning: "Nog geen haast, maar zet het op de bestellijst voor volgende week.",
    good: "Ruim voldoende — geen actie nodig.",
  }[p.severity];
  const orderSize = Math.max(0, p.dailySales * 21 - p.stock);

  return `**${p.name}** (${p.sku})

- Voorraad: **${p.stock} stuks**
- Verkoop: ~**${p.dailySales} per dag**
- Daarmee kom je nog **${p.daysLeft} dagen** vooruit

${advice}${
    orderSize > 0
      ? `\n\nBestel-suggestie: **${orderSize} stuks** — dan zit je weer op zo'n drie weken voorraad.`
      : ""
  }

{{chart:inventory}}`;
}

/* ----------------------------- matching ----------------------------- */

export type Topic =
  | "greeting"
  | "capabilities"
  | "product"
  | "day"
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
  if (findProduct(q)) return "product";
  if (parseDay(q)) return "day";
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
  const q = question.toLowerCase();
  switch (classify(question)) {
    case "greeting":
      return greeting();
    case "capabilities":
      return capabilities();
    case "product":
      return productAnswer(findProduct(q)!);
    case "day":
      return dayAnswer(parseDay(q)!);
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
  product: [
    "Wat moet ik vandaag bestellen?",
    "Wat moet ik vandaag doen?",
    "Waarom zijn er meer klachten deze week?",
  ],
  day: [
    "Hoe ontwikkelt de omzet zich?",
    "Hoe was het gisteren?",
    "Wat moet ik vandaag doen?",
  ],
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
  product: { href: "/voorraad", label: "Bekijk voorraad in het dashboard" },
  day: { href: "/omzet", label: "Bekijk omzet in het dashboard" },
  revenue: { href: "/omzet", label: "Bekijk omzet in het dashboard" },
  tickets: { href: "/klantenservice", label: "Bekijk klantenservice in het dashboard" },
  inventory: { href: "/voorraad", label: "Bekijk voorraad in het dashboard" },
  staffing: { href: "/personeel", label: "Bekijk personeel in het dashboard" },
  today: { href: "/signaleringen", label: "Bekijk alle signaleringen" },
};

export function sourceFor(question: string): AnswerSource | null {
  return SOURCES[classify(question)] ?? null;
}

/** Korte, professionele gesprekstitel per onderwerp (null = gebruik de vraag). */
export function titleFor(question: string): string | null {
  const q = question.toLowerCase();
  switch (classify(question)) {
    case "product": {
      const p = findProduct(q)!;
      const name = p.name.split(" ").filter((w) => !/\d/.test(w)).slice(0, 2).join(" ");
      return `Voorraad · ${name}`;
    }
    case "day":
      return `Dagdetail · ${shortDate.format(parseDay(q)!)}`;
    case "revenue":
      return "Omzet-analyse";
    case "tickets":
      return "Klachten & tickets";
    case "inventory":
      return "Bestellijst & voorraad";
    case "staffing":
      return "Bezetting & rooster";
    case "today":
      return "Dagbriefing";
    case "greeting":
    case "capabilities":
      return "Kennismaking met Kompas";
    default:
      return null;
  }
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
