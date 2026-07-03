import type { Severity } from "@/lib/data";

// Status draagt nooit betekenis via kleur alleen: elk niveau heeft een
// eigen icoon + tekstlabel naast de kleur.
export const SEVERITY: Record<
  Severity,
  { label: string; color: string; icon: React.ReactNode }
> = {
  good: {
    label: "Op koers",
    color: "var(--good)",
    icon: (
      <path
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  warning: {
    label: "Let op",
    color: "var(--warning)",
    icon: (
      <path
        d="M8 2.2L14.6 13H1.4L8 2.2zM8 6.4v3M8 11.4v.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  serious: {
    label: "Actie nodig",
    color: "var(--serious)",
    icon: (
      <path
        d="M8 1.8a6.2 6.2 0 110 12.4A6.2 6.2 0 018 1.8zM8 5v4M8 11.2v.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),
  },
  critical: {
    label: "Urgent",
    color: "var(--critical)",
    icon: (
      <path
        d="M8 1.5l6.5 6.5L8 14.5 1.5 8 8 1.5zM8 5v3.4M8 11v.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
};

export function SeverityIcon({
  severity,
  size = 16,
}: {
  severity: Severity;
  size?: number;
}) {
  const s = SEVERITY[severity];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ color: s.color }}
      aria-hidden
      className="shrink-0"
    >
      {s.icon}
    </svg>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY[severity];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
      <SeverityIcon severity={severity} size={14} />
      {s.label}
    </span>
  );
}
