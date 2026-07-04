"use client";

import { useState, type ReactNode } from "react";
import { lastDays, revenue90, tickets90 } from "@/lib/data";
import { RevenueChart } from "../RevenueChart";
import { TicketsChart } from "../TicketsChart";

// Lichtgewicht markdown-renderer voor assistent-antwoorden: koppen, vet/cursief,
// inline code, links, lijsten, tabellen, codeblokken en {{chart:…}}-embeds.
// Geen externe dependency nodig voor de subset die de demo-engine schrijft.

type Block =
  | { type: "p"; text: string }
  | { type: "h2" | "h3"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "chart"; kind: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const chart = line.match(/^\{\{chart:([a-z]+)\}\}$/);
    if (chart) {
      blocks.push({ type: "chart", kind: chart[1] });
      i++;
      continue;
    }

    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // sluitende ```
      blocks.push({ type: "code", lang: fence[1], code: code.join("\n") });
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        // separator-rij (|---|---|) overslaan
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [header, ...body] = rows;
      blocks.push({ type: "table", header: header ?? [], rows: body });
      continue;
    }

    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    blocks.push({ type: "p", text: line });
    i++;
  }

  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-accent-track/40 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          className="text-accent underline underline-offset-2 hover:opacity-80"
        >
          {link[1]}
        </a>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-edge">
      <div className="flex items-center justify-between bg-surface px-3 py-1.5 text-xs text-ink-muted">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded px-1.5 py-0.5 hover:bg-accent-track/40 hover:text-ink"
        >
          {copied ? "Gekopieerd" : "Kopiëren"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-raised p-3 font-mono text-[0.85rem] leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function ChartEmbed({ kind }: { kind: string }) {
  if (kind !== "revenue" && kind !== "tickets") return null;
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {kind === "revenue" ? "Omzet per dag" : "Tickets per dag"}
        </h3>
        <span className="text-xs text-ink-muted">laatste 30 dagen</span>
      </div>
      <div className="mt-3">
        {kind === "revenue" ? (
          <RevenueChart points={lastDays(revenue90, 30)} />
        ) : (
          <TicketsChart points={lastDays(tickets90, 30)} />
        )}
      </div>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="flex flex-col gap-3 text-[0.925rem] leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-2 text-lg font-semibold tracking-tight">
                {inline(block.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-2 text-base font-semibold tracking-tight">
                {inline(block.text)}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-ink-muted">
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-medium marker:text-accent">
                {block.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    {inline(item)}
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-edge">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge bg-surface">
                      {block.header.map((cell, j) => (
                        <th
                          key={j}
                          className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-ink-muted"
                        >
                          {inline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j} className="border-b border-grid last:border-0">
                        {row.map((cell, k) => (
                          <td key={k} className="px-3 py-2">
                            {inline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "code":
            return <CodeBlock key={i} lang={block.lang} code={block.code} />;
          case "chart":
            return <ChartEmbed key={i} kind={block.kind} />;
          default:
            return <p key={i}>{inline(block.text)}</p>;
        }
      })}
    </div>
  );
}
