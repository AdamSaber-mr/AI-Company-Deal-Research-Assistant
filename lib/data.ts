// Alle data is deterministisch gegenereerd zodat server- en client-render
// identiek zijn (geen hydration-mismatch) en het dashboard er altijd
// hetzelfde uitziet in de demo.

export const ANCHOR_DATE = new Date("2026-07-03T08:00:00");

export type DayPoint = {
  date: Date;
  label: string; // "3 jul"
  value: number;
};

export type RangeKey = "7d" | "30d" | "90d";

export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "Laatste 7 dagen", days: 7 },
  { key: "30d", label: "Laatste 30 dagen", days: 30 },
  { key: "90d", label: "Laatste 90 dagen", days: 90 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const dayLabel = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
});

export const longDate = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const number = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 0,
});

// Deterministische pseudo-random (mulberry32)
function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function series(
  days: number,
  seed: number,
  base: number,
  weekendFactor: number,
  noise: number,
  shape: (i: number, days: number) => number
): DayPoint[] {
  const rnd = seeded(seed);
  const out: DayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(ANCHOR_DATE.getTime() - (days - 1 - i) * DAY_MS);
    const dow = date.getDay();
    const weekend = dow === 0 || dow === 6 ? weekendFactor : 1;
    const value = Math.max(
      0,
      Math.round(base * weekend * shape(i, days) * (1 + (rnd() - 0.5) * noise))
    );
    out.push({ date, label: dayLabel.format(date), value });
  }
  return out;
}

export function lastDays(points: DayPoint[], days: number): DayPoint[] {
  return points.slice(-days);
}

// Omzet: 365 dagen, licht stijgende trend over het jaar
export const revenue365 = series(
  365,
  7,
  8400,
  0.62,
  0.22,
  (i, days) => 0.85 + (0.35 * i) / days
);

// Tickets: 365 dagen, stabiel — met een duidelijke piek in de laatste week (+40%)
export const tickets365 = series(365, 21, 34, 0.55, 0.3, (i, days) =>
  i >= days - 6 ? 1.4 : 1
);

// Aliassen voor de veelgebruikte laatste 90 dagen
export const revenue90 = lastDays(revenue365, 90);
export const tickets90 = lastDays(tickets365, 90);

export function sum(points: DayPoint[]): number {
  return points.reduce((acc, p) => acc + p.value, 0);
}

/** Delta in % t.o.v. de periode direct ervoor, afgerond op 1 decimaal. */
export function periodDelta(points: DayPoint[], days: number): number {
  const current = sum(points.slice(-days));
  const previous = sum(points.slice(-days * 2, -days));
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function productCount(n: number): string {
  return `${n} ${n === 1 ? "product" : "producten"}`;
}

export type Severity = "good" | "warning" | "serious" | "critical";

export type Product = {
  name: string;
  sku: string;
  stock: number;
  dailySales: number;
  daysLeft: number;
  severity: Severity;
};

function productSeverity(daysLeft: number): Severity {
  if (daysLeft <= 3) return "critical";
  if (daysLeft <= 7) return "serious";
  if (daysLeft <= 14) return "warning";
  return "good";
}

function product(name: string, sku: string, stock: number, dailySales: number): Product {
  const daysLeft = Math.floor(stock / dailySales);
  return { name, sku, stock, dailySales, daysLeft, severity: productSeverity(daysLeft) };
}

export const inventory: Product[] = [
  product("Barista espressobonen 1 kg", "KF-1001", 54, 18),
  product("Havermelk 1 L", "ZV-2044", 41, 9),
  product("Meeneembekers 300 ml (50 st.)", "VP-3310", 22, 4),
  product("Verse croissants (doos 24)", "BK-0207", 36, 3),
  product("Filterkoffie navulling 500 g", "KF-1010", 88, 4),
  product("Schoonmaaktabletten machine", "OH-7781", 60, 2),
].sort((a, b) => a.daysLeft - b.daysLeft);

export type Department = {
  name: string;
  present: number;
  planned: number;
};

export const staffing: Department[] = [
  { name: "Bediening", present: 6, planned: 8 },
  { name: "Keuken", present: 4, planned: 4 },
  { name: "Bezorging", present: 3, planned: 3 },
  { name: "Klantenservice", present: 2, planned: 3 },
];

export type TicketCategory = {
  name: string;
  count: number; // deze week
  deltaVsNormal: number; // % t.o.v. 12-weeks gemiddelde
};

export const ticketCategories: TicketCategory[] = [
  { name: "Vertraagde bezorging", count: 19, deltaVsNormal: 111 },
  { name: "Vragen over bestelling", count: 14, deltaVsNormal: 8 },
  { name: "Productkwaliteit", count: 9, deltaVsNormal: -5 },
  { name: "Retouren", count: 7, deltaVsNormal: 12 },
  { name: "Overig", count: 5, deltaVsNormal: -2 },
];

export type AlertArea = "omzet" | "klantenservice" | "voorraad" | "personeel";

export type Alert = {
  severity: Severity;
  area: AlertArea;
  title: string;
  detail: string;
  time: string;
};

export const alerts: Alert[] = [
  {
    severity: "critical",
    area: "voorraad",
    title: "Voorraad bijna op: espressobonen",
    detail:
      "Barista espressobonen 1 kg is bij het huidige verkooptempo over 3 dagen op. Gebruikelijke levertijd is 4 werkdagen — bestel vandaag.",
    time: "07:42",
  },
  {
    severity: "serious",
    area: "klantenservice",
    title: "40% meer klachten dan normaal",
    detail:
      "Deze week kwamen er 40% meer klantenservice-tickets binnen dan het gemiddelde van de afgelopen 12 weken. 8 van de 12 extra tickets gaan over vertraagde bezorging.",
    time: "07:40",
  },
  {
    severity: "warning",
    area: "personeel",
    title: "Onderbezetting bediening",
    detail:
      "Vandaag staan 6 van de 8 geplande medewerkers ingeroosterd bij Bediening. Zaterdag is historisch de drukste dag.",
    time: "07:38",
  },
  {
    severity: "good",
    area: "omzet",
    title: "Omzet ligt op koers",
    detail:
      "De omzet van deze week ligt 6% boven dezelfde week vorige maand. Geen actie nodig.",
    time: "07:35",
  },
];

export const briefing = {
  headline: "Dit moet je vandaag weten",
  summary:
    "Twee zaken vragen vandaag om actie: de voorraad espressobonen raakt over 3 dagen op en het aantal klachten ligt 40% boven normaal — vooral over vertraagde bezorging. De omzet ligt op koers en de keuken is volledig bezet.",
  actions: [
    "Bestel vandaag espressobonen bij (levertijd 4 werkdagen).",
    "Bekijk de 12 openstaande bezorgklachten en informeer klanten proactief.",
    "Roep 1–2 extra krachten op voor de bediening van zaterdag.",
  ],
};
