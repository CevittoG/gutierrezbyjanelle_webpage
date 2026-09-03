"use client";

// Studio dashboard. Absorbs the old Explorer list and adds a read-only overview
// derived entirely from the rows it's handed (no new IO): a ledger strip, the
// nearest upcoming event ("up next"), and a searchable / filterable / sortable
// quote list. Each row exposes four actions:
//   • Edit              → /quote/new?draft=<id>  (calculator, quote preloaded)
//   • Profile Overview  → /quotes/<id>           (manage link + info)
//   • Client Quote Profile → /q/<token>          (the client's personal link)
//   • Delete            → soft archive (confirm dialog; restorable)
//
// Deleting never destroys anything: it flips the Sheet's Status cell to
// "archived", which drops the quote out of the list AND out of every ledger
// total. Archived quotes live behind their own filter chip with a Restore
// action, so a mis-click costs one click to undo.
//
// Brand discipline: one accent (Powder Rose) used only as state; no traffic-light
// status colors; status is conveyed by label + shape, never color alone — so the
// delete action is a neutral bordered icon like its siblings, not a red button.
// The confirm dialog carries the weight instead. Stats are a flat ledger strip,
// deliberately not the banned SaaS stat-card grid.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { fmt$ } from "@/lib/quote-calc-logic";
import { isLinkActive, type LinkStatus } from "@/lib/quote-calc-portal";
import { deleteDraft } from "@/lib/quote-calc-drafts";
import { archiveRemoteDraft, restoreRemoteDraft } from "@/lib/quote-calc-drafts-remote";
import { LinkControls } from "@/components/quote-app/LinkControls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  archived: boolean;
}

type Filter = "all" | "upcoming" | "shared" | "nolink" | "archived";
type Sort = "date" | "updated";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "shared", label: "Link shared" },
  { key: "nolink", label: "No link" },
];

// Appended only when there is something archived to look at.
const ARCHIVED_FILTER: { key: Filter; label: string } = { key: "archived", label: "Archived" };

function failureMessage(kind: string, verb: "delete" | "restore"): string {
  if (kind === "unauthorized") return "Your session expired — sign in again.";
  if (kind === "unconfigured") return "The quote sheet isn't connected right now.";
  if (kind === "network") return `Couldn't reach the sheet — check your connection and ${verb} again.`;
  return `Couldn't ${verb} that quote — try again.`;
}

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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("date");

  // Delete/restore write to the Sheet and then router.refresh(). Until the fresh
  // server render lands, `overrides` (id → archived) keeps the list and the
  // ledger honest, so the row and its money disappear on click, not a beat later.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<QuoteRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A new `rows` array means the server just re-rendered — it is now the truth,
  // so the optimistic layer has done its job and must get out of the way.
  useEffect(() => {
    setOverrides((o) => (Object.keys(o).length ? {} : o));
  }, [rows]);

  const allRows = useMemo(
    () => rows.map((r) => (r.id in overrides ? { ...r, archived: overrides[r.id] } : r)),
    [rows, overrides],
  );
  const activeRows = useMemo(() => allRows.filter((r) => !r.archived), [allRows]);
  const archivedRows = useMemo(() => allRows.filter((r) => r.archived), [allRows]);

  const isUpcoming = (r: QuoteRow) => !!r.eventDate && r.eventDate >= todayISO;

  // Overview stats — pure derivations from the *live* rows. Deleted quotes never
  // count toward the ledger.
  const pipeline = useMemo(() => activeRows.reduce((s, r) => s + r.total, 0), [activeRows]);
  const sharedCount = useMemo(() => activeRows.filter(linkLive).length, [activeRows]);

  // Up next: soonest upcoming event.
  const upNext = useMemo(() => {
    const upcoming = activeRows
      .filter(isUpcoming)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    return upcoming[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRows, todayISO]);

  const setArchived = useCallback((id: string, archived: boolean) => {
    setOverrides((o) => ({ ...o, [id]: archived }));
  }, []);

  // Soft-delete: archive the Sheet row, optionally kill the client link, and
  // drop the local copy so the calculator can't resurrect it (reconcileDrafts is
  // a union merge — it never subtracts, so localStorage would keep it alive).
  const confirmDelete = useCallback(
    async (row: QuoteRow, revokeLink: boolean) => {
      setBusyId(row.id);
      setError(null);
      setArchived(row.id, true);

      const res = await archiveRemoteDraft(row.id);
      if (!res.ok) {
        setArchived(row.id, false);
        setError(failureMessage(res.failure.kind, "delete"));
        setBusyId(null);
        return;
      }

      if (revokeLink) {
        // Best effort — the quote is already archived; a failed revoke must not
        // fail the delete. Profile Overview can still revoke by hand.
        try {
          await fetch(`/quote-calc/api/portal/${encodeURIComponent(row.id)}/revoke`, {
            method: "POST",
            credentials: "same-origin",
          });
        } catch {
          /* ignore */
        }
      }

      deleteDraft(row.id);
      if (!res.value.found) setError("That quote was already gone — the list is up to date.");
      setBusyId(null);
      setPending(null);
      router.refresh();
    },
    [router, setArchived],
  );

  const restore = useCallback(
    async (row: QuoteRow) => {
      setBusyId(row.id);
      setError(null);
      setArchived(row.id, false);

      const res = await restoreRemoteDraft(row.id);
      if (!res.ok) {
        setArchived(row.id, true);
        setError(failureMessage(res.failure.kind, "restore"));
        setBusyId(null);
        return;
      }

      setBusyId(null);
      router.refresh();
    },
    [router, setArchived],
  );

  const byEventDate = (a: QuoteRow, b: QuoteRow) => {
    if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
    if (a.eventDate) return -1;
    if (b.eventDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Archived quotes surface in exactly one place — their own filter — and
    // never leak into All / Upcoming / Link shared / No link.
    const base = filter === "archived" ? archivedRows : activeRows;
    const list = base.filter((r) => {
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
  }, [activeRows, archivedRows, query, filter, sort, todayISO]);

  // The Archived chip only exists once something has been deleted — until then
  // the dashboard looks exactly as it always has.
  const filterChips = useMemo(
    () => (archivedRows.length ? [...FILTERS, ARCHIVED_FILTER] : FILTERS),
    [archivedRows.length],
  );

  // Deleting the last archived quote's chip out from under the user would strand
  // them on an empty view; fall back to All.
  useEffect(() => {
    if (filter === "archived" && archivedRows.length === 0) setFilter("all");
  }, [filter, archivedRows.length]);

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
        <Stat label="Open quotes" value={String(activeRows.length)} />
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
          {filterChips.map((f) => {
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

        {error && (
          <p
            role="status"
            className="mb-4 text-sm text-foreground normal-case tracking-normal rounded-md border border-border bg-muted/60 px-3 py-2"
          >
            {error}
          </p>
        )}

        {activeRows.length === 0 && archivedRows.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground normal-case tracking-normal py-8 text-center">
            {filter === "archived"
              ? "Nothing archived. Deleted quotes land here."
              : "No quotes match. Try a different search or filter."}
          </p>
        ) : (
          <ul className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {visible.map((row) => (
              <QuoteListRow
                key={row.id}
                row={row}
                todayISO={todayISO}
                upcoming={isUpcoming(row)}
                busy={busyId === row.id}
                onDelete={() => {
                  setError(null);
                  setPending(row);
                }}
                onRestore={() => restore(row)}
              />
            ))}
          </ul>
        )}
      </section>

      <DeleteQuoteDialog
        row={pending}
        busy={!!pending && busyId === pending.id}
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
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
  busy,
  onDelete,
  onRestore,
}: {
  row: QuoteRow;
  todayISO: string;
  upcoming: boolean;
  busy: boolean;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const days = daysBetween(todayISO, row.eventDate);
  const shared = linkLive(row);

  return (
    <li className="flex items-center gap-3 px-4 sm:px-5 py-3.5 normal-case tracking-normal hover:bg-muted/40 transition-colors">
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", row.archived && "text-muted-foreground")}>
          {row.client || "—"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {row.eventType || "Event"} · {formatEventDate(row.eventDate)}
          {upcoming && days !== null && !row.archived && (
            <span className="text-foreground/70"> · {countdownLabel(days)}</span>
          )}
          {shared && !row.archived && <span className="text-accent-foreground/70"> · Shared</span>}
          {row.archived && <span className="italic"> · Archived</span>}
        </p>
      </div>

      <p
        className={cn(
          "w-20 sm:w-24 shrink-0 text-right font-mono tabular-nums text-sm",
          row.archived && "text-muted-foreground",
        )}
      >
        {fmt$(row.total)}
      </p>

      {/* An archived quote isn't a working quote — editing, managing its link, or
          opening the client's view would all be misleading. Restore is the only
          way back in. */}
      {row.archived ? (
        <div className="flex items-center gap-1 shrink-0">
          <RowAction as="button" label="Restore quote" onClick={onRestore} disabled={busy}>
            <RestoreIcon className="h-4 w-4" />
          </RowAction>
        </div>
      ) : (
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
          <RowAction as="button" label="Delete quote" onClick={onDelete} disabled={busy}>
            <TrashIcon className="h-4 w-4" />
          </RowAction>
        </div>
      )}
    </li>
  );
}

function RowAction({
  as,
  href,
  label,
  onClick,
  disabled,
  children,
}: {
  as: "link" | "external" | "disabled" | "button";
  href?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "h-9 w-9 inline-flex items-center justify-center rounded-md border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={cn(
          base,
          "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none",
        )}
      >
        <span className="sr-only">{label}</span>
        {children}
      </button>
    );
  }
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

// Two-part guard on a destructive-feeling action: a modal that names the quote
// it is about to remove, and — when a client is already looking at a live link —
// an explicit choice about whether that link dies with it. Archiving alone would
// leave /q/<token> serving a quote Janelle believes she deleted.
function DeleteQuoteDialog({
  row,
  busy,
  onCancel,
  onConfirm,
}: {
  row: QuoteRow | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (row: QuoteRow, revokeLink: boolean) => void;
}) {
  const [revokeLink, setRevokeLink] = useState(true);
  const hasLiveLink = !!row && linkLive(row);

  // Fresh default every time the dialog opens for a different quote.
  useEffect(() => {
    if (row) setRevokeLink(true);
  }, [row]);

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent>
        {row && (
          <>
            <DialogHeader>
              <DialogTitle>Delete this quote?</DialogTitle>
              <DialogDescription>
                <span className="block text-foreground font-medium">{row.client || "Untitled"}</span>
                {row.eventType || "Event"} · {formatEventDate(row.eventDate)} · {fmt$(row.total)}
              </DialogDescription>
            </DialogHeader>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              It moves to <span className="text-foreground">Archived</span> — it stops counting
              toward your totals and drops off this list. Nothing is erased, and you can restore it
              any time.
            </p>

            {hasLiveLink && (
              <label className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeLink}
                  onChange={(e) => setRevokeLink(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span>
                  Also revoke the client link
                  <span className="block text-xs text-muted-foreground">
                    Otherwise the client can still open their quote page.
                  </span>
                </span>
              </label>
            )}

            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="h-10 px-4 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(row, hasLiveLink && revokeLink)}
                disabled={busy}
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-ring transition-colors disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete quote"}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function RestoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
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
