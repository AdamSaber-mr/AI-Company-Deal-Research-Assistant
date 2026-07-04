"use client";

// CSV-export met puntkomma als scheidingsteken (Nederlandse Excel-standaard).

function toCsv(header: string[], rows: (string | number)[][]): string {
  const escape = (cell: string | number) => {
    const s = String(cell);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((row) => row.map(escape).join(";")).join("\n");
}

export function ExportCsvButton({
  filename,
  header,
  rows,
}: {
  filename: string;
  header: string[];
  rows: (string | number)[][];
}) {
  const download = () => {
    const blob = new Blob([toCsv(header, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent/50 hover:text-ink"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
        <path
          d="M8 2v8M4.5 7L8 10.5 11.5 7M2.5 13.5h11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      CSV
    </button>
  );
}
