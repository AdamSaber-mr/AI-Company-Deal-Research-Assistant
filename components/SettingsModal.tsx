"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RANGES } from "@/lib/data";
import { saveSettings, type Settings } from "@/lib/settings";
import { useStoredSettings } from "@/lib/useSettings";
import { refreshCurrentUser, useCurrentUser } from "@/lib/useCurrentUser";
import { ThemeToggle } from "./ThemeToggle";
import { Switch } from "./Switch";

export type SettingsSection =
  | "profiel"
  | "account"
  | "weergave"
  | "signaleringen"
  | "briefing"
  | "koppelingen";

/** Open de instellingen-pop-up van buitenaf (sidebar, command palette).
 *  Optioneel op een specifieke sectie. */
export function openSettings(section?: SettingsSection) {
  window.dispatchEvent(
    new CustomEvent("kompas:open-settings", { detail: section })
  );
}

/* ------------------------------- sectie-nav ------------------------------- */

const nav = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type SectionKey = SettingsSection;

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "profiel",
    label: "Profiel",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="6.2" r="3" {...nav} />
        <path d="M3.5 15.2c0-2.9 2.5-4.6 5.5-4.6s5.5 1.7 5.5 4.6" {...nav} />
      </svg>
    ),
  },
  {
    key: "account",
    label: "Account",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <path d="M9 2.2l5.8 2.2v4.2c0 3.5-2.4 5.9-5.8 7.2-3.4-1.3-5.8-3.7-5.8-7.2V4.4L9 2.2z" {...nav} />
        <path d="M6.6 9l1.7 1.7L11.6 7.4" {...nav} />
      </svg>
    ),
  },
  {
    key: "weergave",
    label: "Weergave",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <rect x="2.5" y="3.5" width="13" height="9" rx="1.4" {...nav} />
        <path d="M6.5 15.5h5M9 12.5v3" {...nav} />
      </svg>
    ),
  },
  {
    key: "signaleringen",
    label: "Signaleringen",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <path d="M9 2.6a4.3 4.3 0 014.3 4.3c0 3 .8 4.2 1.4 4.8H3.3c.6-.6 1.4-1.8 1.4-4.8A4.3 4.3 0 019 2.6zM7.4 14.6a1.7 1.7 0 003.2 0" {...nav} />
      </svg>
    ),
  },
  {
    key: "briefing",
    label: "Briefing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r="6.3" {...nav} />
        <path d="M9 5.4V9l2.4 1.6" {...nav} />
      </svg>
    ),
  },
  {
    key: "koppelingen",
    label: "Koppelingen",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <path d="M7.4 10.6l3.2-3.2M6.6 12.2l-1 1a2.4 2.4 0 01-3.4-3.4l1.9-1.9a2.4 2.4 0 013.4 0M11.4 5.8l1-1a2.4 2.4 0 013.4 3.4l-1.9 1.9a2.4 2.4 0 01-3.4 0" {...nav} />
      </svg>
    ),
  },
];

/* ------------------------------ bouwstenen ------------------------------ */

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
      <div className="min-w-0">
        <div className="text-sm text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-3 flex flex-col divide-y divide-[var(--grid)]">
        {children}
      </div>
    </section>
  );
}

const inputClass =
  "max-w-full rounded-lg border border-edge bg-raised px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

const INTEGRATIONS = [
  { name: "Kassa", detail: "omzet per dag" },
  { name: "Helpdesk", detail: "klantenservice-tickets" },
  { name: "Voorraadsysteem", detail: "voorraadniveaus" },
  { name: "Roostersysteem", detail: "personeelsbezetting" },
];

/* --------------------------------- modal --------------------------------- */

export function SettingsModal() {
  const stored = useStoredSettings();
  const { user } = useCurrentUser();
  const router = useRouter();
  const [override, setOverride] = useState<Settings | null>(null);
  const settings = override ?? stored;
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SectionKey>("profiel");
  const [query, setQuery] = useState("");

  // Profielvelden: lokale draft over de accountwaarde heen; wijzigingen gaan
  // debounced naar de server zodat we niet per toetsaanslag PATCHen.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patchAccount = (patch: { name?: string; company?: string }) => {
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/auth/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        refreshCurrentUser();
      } catch {
        /* lokaal blijft de draft staan; volgende poging pakt het op */
      }
    }, 600);
  };

  // Wachtwoord wijzigen
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwLoading) return;
    setPwError(null);
    setPwDone(false);
    if (pwNext !== pwConfirm) {
      setPwError("De nieuwe wachtwoorden komen niet overeen.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: pwCurrent, next: pwNext }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwError(data.error ?? "Er ging iets mis.");
      } else {
        setPwDone(true);
        setPwCurrent("");
        setPwNext("");
        setPwConfirm("");
      }
    } catch {
      setPwError("Geen verbinding. Probeer het opnieuw.");
    }
    setPwLoading(false);
  };

  // Account verwijderen (twee-staps bevestiging)
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bevestigingen/fouten niet mee laten reizen naar een andere sectie: reset
  // bij openen en bij sectie-wissel (in de handlers, niet in een effect).
  const resetTransient = () => {
    setConfirmDelete(false);
    setPwError(null);
    setPwDone(false);
  };

  const deleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await fetch("/api/auth/account", { method: "DELETE" });
    } catch {
      /* sessie kan al weg zijn; doorsturen is dan alsnog correct */
    }
    setOpen(false);
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      setQuery("");
      setConfirmDelete(false);
      setPwError(null);
      setPwDone(false);
      const section = (e as CustomEvent<SettingsSection | undefined>).detail;
      if (section) setActive(section);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("kompas:open-settings", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("kompas:open-settings", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setOverride(next);
    saveSettings(next);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? SECTIONS.filter((s) => s.label.toLowerCase().includes(q)) : SECTIONS;
  }, [query]);

  const initials =
    (user?.name?.trim() || settings.ownerName?.trim() || "")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-6"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Instellingen"
    >
      <div
        className="anim-pop flex h-full w-full max-w-4xl flex-col overflow-hidden bg-raised shadow-2xl sm:h-[86vh] sm:rounded-2xl sm:border sm:border-edge md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Linker rail: zoeken + gemarkeerde sectielijst */}
        <aside className="shrink-0 border-b border-edge p-3 md:w-60 md:border-b-0 md:border-r">
          <div className="relative">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            >
              <circle cx="7" cy="7" r="4.5" {...nav} />
              <path d="M10.5 10.5L14 14" {...nav} />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoeken"
              aria-label="Instellingen zoeken"
              className="w-full rounded-lg border border-edge bg-surface py-2 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
            />
          </div>

          <div className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Instellingen
          </div>
          <nav
            className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
            aria-label="Instellingen-secties"
          >
            {filteredNav.map((s) => {
              const isActive = s.key === active;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    resetTransient();
                    setActive(s.key);
                  }}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-accent-track/70 font-medium text-ink"
                      : "text-ink-secondary hover:bg-accent-track/40 hover:text-ink"
                  }`}
                >
                  <span className={isActive ? "text-accent" : "text-ink-muted"}>
                    {s.icon}
                  </span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
            {filteredNav.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-ink-muted">Niets gevonden.</p>
            )}
          </nav>
        </aside>

        {/* Rechter paneel: inhoud van de actieve sectie, scrollbaar */}
        <div className="relative min-w-0 flex-1 overflow-y-auto">
          {/* Sluitknop + opgeslagen-indicator, blijven bovenin hangen */}
          <div className="pointer-events-none sticky top-0 z-10 flex items-center justify-end gap-3 px-4 pt-4">
            <span
              aria-live="polite"
              className={`flex items-center gap-1.5 text-xs font-medium text-delta-good transition-opacity ${
                saved ? "opacity-100" : "opacity-0"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M3.5 8.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Opgeslagen
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Sluiten"
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-accent-track/40 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" {...nav} />
              </svg>
            </button>
          </div>

          <div className="-mt-6 px-6 pb-8 sm:px-8">
            {active === "profiel" && (
              <Group title="Profiel">
                <Row label="Avatar">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-track/70 text-[13px] font-semibold text-ink">
                    {initials}
                  </span>
                </Row>
                <Row label="Naam" hint="wordt gebruikt in de ochtendbriefing">
                  <input
                    className={`${inputClass} w-56`}
                    value={nameDraft ?? user?.name ?? ""}
                    onChange={(e) => {
                      setNameDraft(e.target.value);
                      update({ ownerName: e.target.value });
                      patchAccount({ name: e.target.value });
                    }}
                  />
                </Row>
                {user && (
                  <Row label="E-mailadres">
                    <span className="text-sm text-ink-secondary">{user.email}</span>
                  </Row>
                )}
                <Row label="Bedrijfsnaam" hint="gebruikt door de app en in de ochtendbriefing">
                  <input
                    className={`${inputClass} w-56`}
                    value={settings.companyName}
                    onChange={(e) => {
                      update({ companyName: e.target.value });
                      patchAccount({ company: e.target.value });
                    }}
                  />
                </Row>
              </Group>
            )}

            {active === "account" && (
              <div className="flex flex-col gap-10">
                <Group
                  title="Wachtwoord wijzigen"
                  description="Kies een nieuw wachtwoord voor je account."
                >
                  <form onSubmit={changePassword} className="flex flex-col gap-4 py-4 first:pt-0">
                    {pwError && (
                      <div
                        role="alert"
                        className="anim-pop flex items-start gap-2 rounded-lg border border-critical/30 bg-critical/10 px-3 py-2.5 text-sm text-critical"
                      >
                        {pwError}
                      </div>
                    )}
                    {pwDone && (
                      <div className="anim-pop rounded-lg border border-edge bg-raised px-3 py-2.5 text-sm text-delta-good">
                        Wachtwoord gewijzigd.
                      </div>
                    )}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm text-ink">Huidig wachtwoord</span>
                      <input
                        type="password"
                        className={`${inputClass} w-64 max-w-full`}
                        value={pwCurrent}
                        onChange={(e) => setPwCurrent(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm text-ink">Nieuw wachtwoord</span>
                      <input
                        type="password"
                        className={`${inputClass} w-64 max-w-full`}
                        value={pwNext}
                        onChange={(e) => setPwNext(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Minstens 8 tekens"
                        minLength={8}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm text-ink">Herhaal nieuw wachtwoord</span>
                      <input
                        type="password"
                        className={`${inputClass} w-64 max-w-full`}
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      Wachtwoord opslaan
                    </button>
                  </form>
                </Group>

                <Group
                  title="Account verwijderen"
                  description="Verwijdert je account definitief. Dit kan niet ongedaan worden gemaakt."
                >
                  <div className="flex items-center gap-3 py-4 first:pt-0">
                    <button
                      type="button"
                      onClick={deleteAccount}
                      disabled={deleting}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                        confirmDelete
                          ? "bg-critical text-white hover:opacity-90"
                          : "border border-critical/40 text-critical hover:bg-critical/10"
                      }`}
                    >
                      {confirmDelete ? "Ja, verwijder definitief" : "Account verwijderen"}
                    </button>
                    {confirmDelete && !deleting && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="text-sm text-ink-muted hover:text-ink"
                      >
                        Annuleren
                      </button>
                    )}
                  </div>
                </Group>
              </div>
            )}

            {active === "weergave" && (
              <Group title="Weergave">
                <Row
                  label="Thema"
                  hint="Auto volgt de licht/donker-instelling van je systeem"
                >
                  <ThemeToggle />
                </Row>
                <Row
                  label="Standaardperiode"
                  hint="beginstand van het periodefilter op de grafiekpagina's"
                >
                  <select
                    className={inputClass}
                    value={settings.defaultRange}
                    onChange={(e) =>
                      update({ defaultRange: e.target.value as Settings["defaultRange"] })
                    }
                  >
                    {RANGES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Row>
              </Group>
            )}

            {active === "signaleringen" && (
              <Group
                title="AI-signaleringen"
                description="Welke afwijkingen de AI actief voor je in de gaten houdt."
              >
                <Row label="Piek in klachten" hint="bijv. 40% meer tickets dan normaal">
                  <Switch
                    checked={settings.alertComplaints}
                    onChange={(v) => update({ alertComplaints: v })}
                    label="Piek in klachten"
                  />
                </Row>
                <Row label="Voorraad bijna op">
                  <Switch
                    checked={settings.alertStock}
                    onChange={(v) => update({ alertStock: v })}
                    label="Voorraad bijna op"
                  />
                </Row>
                <Row
                  label="Voorraaddrempel"
                  hint="waarschuw als een product binnen dit aantal dagen op is"
                >
                  <select
                    className={inputClass}
                    value={settings.stockThresholdDays}
                    onChange={(e) => update({ stockThresholdDays: Number(e.target.value) })}
                  >
                    {[3, 5, 7, 10, 14].map((d) => (
                      <option key={d} value={d}>
                        {d} dagen
                      </option>
                    ))}
                  </select>
                </Row>
                <Row label="Onderbezetting">
                  <Switch
                    checked={settings.alertStaffing}
                    onChange={(v) => update({ alertStaffing: v })}
                    label="Onderbezetting"
                  />
                </Row>
              </Group>
            )}

            {active === "briefing" && (
              <Group title="Ochtendbriefing">
                <Row
                  label="Tijdstip"
                  hint="elke ochtend één samenvatting van wat je moet weten"
                >
                  <input
                    type="time"
                    className={inputClass}
                    value={settings.briefingTime}
                    onChange={(e) => update({ briefingTime: e.target.value })}
                  />
                </Row>
                <Row label="Per e-mail">
                  <Switch
                    checked={settings.briefingEmail}
                    onChange={(v) => update({ briefingEmail: v })}
                    label="Briefing per e-mail"
                  />
                </Row>
                <Row label="Als pushmelding">
                  <Switch
                    checked={settings.briefingPush}
                    onChange={(v) => update({ briefingPush: v })}
                    label="Briefing als pushmelding"
                  />
                </Row>
              </Group>
            )}

            {active === "koppelingen" && (
              <Group
                title="Koppelingen"
                description="In deze demo draait alles op voorbeelddata. Koppel je systemen voor live cijfers."
              >
                {INTEGRATIONS.map((i) => (
                  <Row key={i.name} label={i.name} hint={i.detail}>
                    <span className="flex items-center gap-2 text-xs text-ink-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-baseline" />
                      nog niet gekoppeld
                    </span>
                  </Row>
                ))}
              </Group>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
