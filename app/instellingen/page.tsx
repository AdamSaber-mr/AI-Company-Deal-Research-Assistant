"use client";

import { useRef, useState } from "react";
import { RANGES } from "@/lib/data";
import { saveSettings, type Settings } from "@/lib/settings";
import { useStoredSettings } from "@/lib/useSettings";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Switch } from "@/components/Switch";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      )}
      <div className="mt-4 flex flex-col divide-y divide-[var(--grid)]">
        {children}
      </div>
    </section>
  );
}

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
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div>
        <div className="text-sm">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-lg border border-edge bg-raised px-3 py-1.5 text-sm text-ink outline-none focus:border-accent";

const INTEGRATIONS = [
  { name: "Kassa", detail: "omzet per dag" },
  { name: "Helpdesk", detail: "klantenservice-tickets" },
  { name: "Voorraadsysteem", detail: "voorraadniveaus" },
  { name: "Roostersysteem", detail: "personeelsbezetting" },
];

export default function InstellingenPage() {
  const stored = useStoredSettings();
  const [override, setOverride] = useState<Settings | null>(null);
  const settings = override ?? stored;
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setOverride(next);
    saveSettings(next);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Instellingen"
          subtitle="Wijzigingen worden direct op dit apparaat opgeslagen."
        />
        <span
          aria-live="polite"
          className={`flex items-center gap-1.5 pt-1 text-xs font-medium text-delta-good transition-opacity ${
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
      </div>

      <>
          <Section title="Bedrijfsprofiel">
            <Row label="Bedrijfsnaam">
              <input
                className={inputClass}
                value={settings.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            </Row>
            <Row label="Jouw naam" hint="wordt gebruikt in de ochtendbriefing">
              <input
                className={inputClass}
                value={settings.ownerName}
                onChange={(e) => update({ ownerName: e.target.value })}
              />
            </Row>
          </Section>

          <Section title="Weergave">
            <Row label="Thema">
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
          </Section>

          <Section
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
          </Section>

          <Section
            title="Ochtendbriefing"
            description="Elke ochtend één samenvatting: dit moet je vandaag weten."
          >
            <Row label="Tijdstip">
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
          </Section>

          <Section
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
          </Section>
      </>
    </div>
  );
}
