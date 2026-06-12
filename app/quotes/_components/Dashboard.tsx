"use client";

// Studio dashboard. Absorbs the old Explorer list and adds a read-only overview
// derived entirely from the rows it's handed (no new IO): a ledger strip, the
// nearest upcoming event ("up next"), and a searchable / filterable / sortable
// quote list. Each row exposes three actions:
//   • Edit              → /quote/new?draft=<id>  (calculator, quote preloaded)
//   • Profile Overview  → /quotes/<id>           (manage link + info)
//   • Client Quote Profile → /q/<token>          (the client's personal link)
//
// Brand discipline: one accent (Powder Rose) used only as state; no traffic-light
// status colors; status is conveyed by label + shape, never color alone. Stats are
// a flat ledger strip, deliberately not the banned SaaS stat-card grid.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { fmt$ } from "@/lib/quote-calc-logic";
import { isLinkActive, type LinkStatus } from "@/lib/quote-calc-portal";
import { LinkControls } from "@/components/quote-app/LinkControls";
import { cn } from "@/utils";

export interface QuoteRow {
  id: string;
  client: string;
  eventType: string;
  eventDate: string; // "YYYY-MM-DD" or ""
  name: string;
  packageName: string;
  total: number;
  updatedAt: string;
  publicToken: string;
  linkStatus: LinkStatus;
  expiresAt: string;
  folderUrl: string | null;
}

type Filter = "all" | "upcoming" | "shared" | "nolink";
type Sort = "date" | "updated";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "shared", label: "Link shared" },
  { key: "nolink", label: "No link" },
];

function formatEventDate(iso: string): string {
  if (!iso) return "Date TBD";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(fromISO: string, toISO: string): number | null {
  if (!toISO) return null;
  const a = Date.parse(fromISO + "T00:00:00Z");
  const b = Date.parse(toISO + "T00:00:00Z");
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

function countdownLabel(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "Yesterday";
  return `${Math.abs(days)} days ago`;
}

function linkLive(r: QuoteRow): boolean {
  return isLinkActive(r) && !!r.publicToken;
}

export function Dashboard({ rows, todayISO }: { rows: QuoteRow[]; todayISO: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("date");

  const isUpcoming = (r: QuoteRow) => !!r.eventDate && r.eventDate >= todayISO;

  // Overview stats — pure derivations from rows.
  const pipeline = useMemo(() => rows.reduce((s, r) => s + r.total, 0), [rows]);
  const sharedCount = useMemo(() => rows.filter(linkLive).length, [rows]);

  // Up next: soonest upcoming event.
  const upNext = useMemo(() => {
    const upcoming = rows.filter(isUpcoming).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    return upcoming[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, todayISO]);

  const byEventDate = (a: QuoteRow, b: QuoteRow) => {
    if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
    if (a.eventDate) return -1;
    if (b.eventDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (filter === "upcoming" && !isUpcoming(r)) return false;
      if (filter === "shared" && !linkLive(r)) return false;
      if (filter === "nolink" && linkLive(r)) return false;
      if (!q) return true;
      return (
        r.client.toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.packageName.toLowerCase().includes(q)
      );
    });
    return sort === "updated"
      ? list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : list.sort(byEventDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, filter, sort, todayISO]);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {new Date(todayISO + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="font-squarepeg text-5xl md:text-6xl leading-none">Your studio</h1>
        </div>
        <Link
          href="/quote/new"
          className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium normal-case tracking-normal transition-colors hover:bg-ring"
        >
          New quote <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {/* Ledger strip — flat, hairline-divided. Not a stat-card grid. */}
      <dl className="grid grid-cols-3 border-y border-border divide-x divide-border mb-10">
        <Stat label="Active pipeline" value={fmt$(pipeline)} />
        <Stat label="Open quotes" value={String(rows.length)} />
        <Stat label="Shared links" value={String(sharedCount)} />
      </dl>

      {/* Up next */}
      {upNext && <UpNext row={upNext} todayISO={todayISO} />}

      {/* All quotes */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-squarepeg text-3xl leading-none">All quotes</h2>
          <div className="flex items-center gap-2">
            <label className="relative">
              <span className="sr-only">Search quotes</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search client or event…"
                className="h-10 w-48 max-w-[50vw] rounded-md border border-border bg-card px-3 text-sm normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/60"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Sort quotes</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 rounded-md border border-border bg-card pl-3 pr-8 text-sm normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
              >
                <option value="date">Sort: Event date</option>
                <option value="updated">Sort: Recently updated</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter quotes">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={cn(
                  "h-8 px-3 rounded-full text-xs normal-case tracking-normal border transition-colors",
                  active
                    ? "border-ring bg-accent/40 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground normal-case tracking-normal py-8 text-center">
            No quotes match. Try a different search or filter.
          </p>
        ) : (
          <ul className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {visible.map((row) => (
              <QuoteListRow key={row.id} row={row} todayISO={todayISO} upcoming={isUpcoming(row)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 sm:px-6 py-4 sm:py-5 min-w-0">
      <dt className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 truncate">{label}</dt>
      <dd className="font-squarepeg text-2xl sm:text-4xl leading-none tabular-nums truncate">{value}</dd>
    </div>
  );
}

function UpNext({ row, todayISO }: { row: QuoteRow; todayISO: string }) {
  const days = daysBetween(todayISO, row.eventDate);
  return (
    <section className="mb-10" aria-labelledby="up-next-heading">
      <p id="up-next-heading" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Up next
      </p>
      <div className="glass rounded-2xl p-6 sm:p-7 normal-case tracking-normal">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h3 className="font-squarepeg text-3xl sm:text-4xl leading-none">{row.client || "Untitled"}</h3>
              {days !== null && (
                <span className="text-sm font-medium text-foreground/80 tabular-nums">{countdownLabel(days)}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {row.eventType || "Event"} · {formatEventDate(row.eventDate)} · {row.packageName}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="font-squarepeg text-4xl leading-none tabular-nums">{fmt$(row.total)}</p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border/60 flex flex-wrap items-center gap-2">
          <Link
            href={`/quotes/${encodeURIComponent(row.id)}`}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
          >
            Profile overview <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            href={`/quote/new?draft=${encodeURIComponent(row.id)}`}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
          >
            <PencilIcon className="h-3.5 w-3.5" /> Edit
          </Link>
          {row.folderUrl && (
            <a
              href={row.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
            >
              Folder <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          <LinkControls id={row.id} token={row.publicToken} linkStatus={row.linkStatus} />
        </div>
      </div>
    </section>
  );
}

function QuoteListRow({
  row,
  todayISO,
  upcoming,
}: {
  row: QuoteRow;
  todayISO: string;
  upcoming: boolean;
}) {
  const days = daysBetween(todayISO, row.eventDate);
  const shared = linkLive(row);

  return (
    <li className="flex items-center gap-3 px-4 sm:px-5 py-3.5 normal-case tracking-normal hover:bg-muted/40 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{row.client || "—"}</p>
        <p className="text-xs text-muted-foreground truncate">
          {row.eventType || "Event"} · {formatEventDate(row.eventDate)}
          {upcoming && days !== null && <span className="text-foreground/70"> · {countdownLabel(days)}</span>}
          {shared && <span className="text-accent-foreground/70"> · Shared</span>}
        </p>
      </div>

      <p className="w-20 sm:w-24 shrink-0 text-right font-mono tabular-nums text-sm">{fmt$(row.total)}</p>

      <div className="flex items-center gap-1 shrink-0">
        <RowAction
          as="link"
          href={`/quote/new?draft=${encodeURIComponent(row.id)}`}
          label="Edit in calculator"
        >
          <PencilIcon className="h-4 w-4" />
        </RowAction>
        <RowAction as="link" href={`/quotes/${encodeURIComponent(row.id)}`} label="Profile Overview">
          <OverviewIcon className="h-4 w-4" />
        </RowAction>
        {shared ? (
          <RowAction
            as="external"
            href={`/q/${row.publicToken}`}
            label="Open Client Quote Profile"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </RowAction>
        ) : (
          <RowAction as="disabled" label="No client link yet — generate one in Profile Overview">
            <ExternalLink className="h-4 w-4" aria-hidden />
          </RowAction>
        )}
      </div>
    </li>
  );
}

function RowAction({
  as,
  href,
  label,
  children,
}: {
  as: "link" | "external" | "disabled";
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "h-9 w-9 inline-flex items-center justify-center rounded-md border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  if (as === "disabled") {
    return (
      <span
        aria-disabled="true"
        title={label}
        className={cn(base, "text-muted-foreground/40 cursor-not-allowed")}
      >
        <span className="sr-only">{label}</span>
        {children}
      </span>
    );
  }
  if (as === "external") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        className={cn(base, "text-muted-foreground hover:text-foreground hover:bg-muted")}
      >
        <span className="sr-only">{label}</span>
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href!}
      title={label}
      className={cn(base, "text-muted-foreground hover:text-foreground hover:bg-muted")}
    >
      <span className="sr-only">{label}</span>
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center normal-case tracking-normal">
      <p className="font-squarepeg text-2xl mb-2">No quotes yet</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
        Build your first quote in the calculator. Saved quotes show up here with their client links and proofs.
      </p>
      <Link
        href="/quote/new"
        className="h-10 px-5 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-ring transition-colors"
      >
        New quote <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}
