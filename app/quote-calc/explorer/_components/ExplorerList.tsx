"use client";

// Admin Quote Explorer list. One card per active quote: client / event / total,
// link status + controls, open folder, open detail. Data is fetched server-side
// and passed in; the interactive bits live in LinkControls.

import Link from "next/link";
import { fmt$ } from "@/lib/quote-calc-logic";
import type { LinkStatus } from "@/lib/quote-calc-portal";
import { LinkControls } from "./LinkControls";

export interface ExplorerRow {
  id: string;
  client: string;
  eventType: string;
  eventDate: string;
  name: string;
  total: number;
  publicToken: string;
  linkStatus: LinkStatus;
  expiresAt: string;
  folderUrl: string | null;
}

export function ExplorerList({ rows }: { rows: ExplorerRow[] }) {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-baseline justify-between gap-3 mb-6">
          <h1 className="font-squarepeg text-5xl leading-none">Quote Explorer</h1>
          <Link
            href="/quote-calc"
            className="text-xs normal-case tracking-normal underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            ← Calculator
          </Link>
        </header>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground normal-case tracking-normal">
            No saved quotes yet. Save one from the calculator to see it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-card p-5 normal-case tracking-normal"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-medium truncate">{row.client || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.eventType}
                      {row.name ? ` · ${row.name}` : ""}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-sm shrink-0">{fmt$(row.total)}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/quote-calc/explorer/${encodeURIComponent(row.id)}`}
                    className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors"
                  >
                    Open
                  </Link>
                  {row.folderUrl && (
                    <a
                      href={row.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors inline-flex items-center"
                    >
                      Folder ↗
                    </a>
                  )}
                  <LinkControls id={row.id} token={row.publicToken} linkStatus={row.linkStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
