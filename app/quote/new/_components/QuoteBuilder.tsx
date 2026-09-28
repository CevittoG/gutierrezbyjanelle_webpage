"use client";

// The quote builder (docs/quote-builder-redesign.md §9). State is a v5
// DraftConfigV5; every change goes through the pure builders in
// lib/quote-engine.ts and every figure through computeTotals, so the summary
// here equals /q to the cent. The price book is only consulted when adding or
// refreshing lines.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Plus, Printer, Save } from "lucide-react";
import { ConfigBanner, type ConfigBannerState } from "@/app/quote-calc/_components/ConfigBanner";
import { ClientInfoSection } from "@/app/quote-calc/_components/ClientInfoSection";
import { MobileBreakdownSheet } from "@/app/quote-calc/_components/MobileBreakdownSheet";
import {
  EMPTY_CLIENT_INFO,
  createDraft,
  loadDrafts,
  newId,
  reconcileDrafts,
  saveDrafts,
  saveLastSession,
  upsertDraft,
  type Draft,
  type DraftClientInfo,
  type SyncStatus,
} from "@/lib/quote-calc-drafts";
import { fetchRemoteDrafts, pushRemoteDraft, type RemoteFailure } from "@/lib/quote-calc-drafts-remote";
import {
  addCustomLine,
  addPackage,
  addProduct,
  applyRefresh,
  computeTotals,
  diffAgainstPriceBook,
  newQuote,
  setGuestCounts,
} from "@/lib/quote-engine";
import { computeHealth, HEALTH_GLYPH } from "@/lib/quote-health";
import { buildPublicQuote } from "@/lib/quote-calc-portal";
import { fetchPriceBook, loadCachedPriceBook } from "@/lib/quote-pricebook-remote";
import { DEFAULT_PRICE_BOOK, isTodoWarning, type PriceBook } from "@/lib/quote-pricebook";
import type { DraftConfigV5, HealthSnapshot } from "@/lib/quote-types";
import { formatMoney, formatMoney2 } from "@/lib/money";
import { cn } from "@/utils";
import { DiscountControl } from "./DiscountControl";
import { EventBasics } from "./EventBasics";
import { Section } from "./fields";
import { LineGroup } from "./LineGroup";
import { LineRow } from "./LineRow";
import { PackageChips } from "./PackageChips";
import { PriceRefreshBanner } from "./PriceRefreshBanner";
import { ProductCombobox } from "./ProductCombobox";
import { ServicesPanel } from "./ServicesPanel";
import { SummaryPanel } from "./SummaryPanel";

function failureToStatus(f: RemoteFailure): SyncStatus {
  if (f.kind === "network") return { kind: "offline", reason: "network" };
  if (f.kind === "unconfigured") return { kind: "offline", reason: "unconfigured" };
  return { kind: "offline", reason: "server" };
}

function syncLabel(s: SyncStatus): string {
  switch (s.kind) {
    case "idle":
      return "Not saved yet";
    case "syncing":
      return "Saving to the Sheet…";
    case "synced":
      return "Saved to the Sheet";
    case "offline":
      return s.reason === "network"
        ? "Offline · saved in this browser"
        : s.reason === "unconfigured"
          ? "Sheet not connected · saved in this browser"
          : "Sheet unavailable · saved in this browser";
  }
}

function healthSnapshot(pb: PriceBook): HealthSnapshot {
  const s = pb.settings;
  return { revisionHours: s.revisionHours, feesPct: s.feesPct, hourlyTarget: s.hourlyTarget, hourlyFloor: s.hourlyFloor };
}

function day(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? "" : t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type PbSource = { kind: "sheet" } | { kind: "cache"; loadedAt: string } | { kind: "bundled" };

export function QuoteBuilder() {
  // --- Price book (cached last-good copy first, then the Sheet) ---
  const [priceBook, setPriceBook] = useState<PriceBook>(DEFAULT_PRICE_BOOK);
  const [pbSource, setPbSource] = useState<PbSource>({ kind: "bundled" });
  const [banner, setBanner] = useState<ConfigBannerState>({ kind: "hidden" });
  const [pbLoading, setPbLoading] = useState(false);

  // --- The quote ---
  const [config, setConfig] = useState<DraftConfigV5>(() => newQuote(DEFAULT_PRICE_BOOK));
  const [client, setClient] = useState<DraftClientInfo>(EMPTY_CLIENT_INFO);
  const [name, setName] = useState("");
  const [guestsAuto, setGuestsAuto] = useState(true);
  const [focusLineId, setFocusLineId] = useState<string | null>(null);

  // --- Drafts + sync ---
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: "idle" });
  const [dateError, setDateError] = useState(false);

  const hydrated = useRef(false);
  const pristine = useRef(true); // a new quote nobody has touched yet
  const pendingDraftId = useRef<string | null>(null);

  const apply = useCallback((fn: (c: DraftConfigV5) => DraftConfigV5) => {
    pristine.current = false;
    setConfig((c) => fn(c));
  }, []);

  const loadDraftIntoState = useCallback((d: Draft) => {
    pristine.current = false;
    setConfig(d.config);
    setClient({ ...EMPTY_CLIENT_INFO, ...d.client });
    setName(d.name);
    setCurrentDraftId(d.id);
    setGuestsAuto(false);
    requestAnimationFrame(() => setDirty(false));
  }, []);

  const loadPriceBook = useCallback(async (refresh?: boolean) => {
    setPbLoading(true);
    try {
      const r = await fetchPriceBook({ refresh });
      if (r.ok) {
        const pb = r.value.merged.priceBook;
        setPriceBook(pb);
        setPbSource({ kind: "sheet" });
        const problems = r.value.merged.warnings.filter((w) => !isTodoWarning(w));
        setBanner(problems.length > 0 ? { kind: "ok", warnings: problems } : { kind: "hidden" });
        // An untouched new quote picks up the Sheet's policies (rush %, fees…).
        if (pristine.current) setConfig(newQuote(pb, { households: 75 }));
        return;
      }
      const cached = loadCachedPriceBook();
      if (cached) {
        setPriceBook(cached.priceBook);
        setPbSource({ kind: "cache", loadedAt: cached.loadedAt });
        if (pristine.current) setConfig(newQuote(cached.priceBook, { households: 75 }));
      } else {
        setPbSource({ kind: "bundled" });
      }
      setBanner({ kind: "fallback", reason: r.failure.kind });
    } finally {
      setPbLoading(false);
    }
  }, []);

  // Hydrate: local drafts, a ?draft=<id> deep link, then the Sheet (drafts +
  // price book) in the background. "New quote" always starts blank.
  useEffect(() => {
    const cached = loadCachedPriceBook();
    if (cached) {
      setPriceBook(cached.priceBook);
      setPbSource({ kind: "cache", loadedAt: cached.loadedAt });
      setConfig(newQuote(cached.priceBook, { households: 75 }));
    }
    const local = loadDrafts();
    setDrafts(local);
    const param = new URLSearchParams(window.location.search).get("draft");
    if (param) {
      const found = local.find((d) => d.id === param);
      if (found) loadDraftIntoState(found);
      else pendingDraftId.current = param;
    }
    requestAnimationFrame(() => {
      hydrated.current = true;
    });

    (async () => {
      setSyncStatus({ kind: "syncing" });
      const r = await fetchRemoteDrafts();
      if (r.ok) {
        const merged = reconcileDrafts(local, r.value);
        setDrafts(merged);
        saveDrafts(merged);
        setSyncStatus({ kind: "synced", at: new Date().toISOString() });
        const want = pendingDraftId.current ?? param;
        const found = want ? merged.find((d) => d.id === want) : undefined;
        // The server copy wins over a local cache.
        if (found) loadDraftIntoState(found);
        pendingDraftId.current = null;
      } else {
        setSyncStatus(param ? failureToStatus(r.failure) : { kind: "idle" });
      }
    })();
    void loadPriceBook();
  }, [loadDraftIntoState, loadPriceBook]);

  // Dirty tracking + the working copy for "Print" of an unsaved quote.
  useEffect(() => {
    if (!hydrated.current) return;
    const untouched =
      pristine.current && !name && JSON.stringify(client) === JSON.stringify(EMPTY_CLIENT_INFO);
    if (untouched) return; // the Sheet's policies landing on a blank quote isn't an edit
    setDirty(true);
    saveLastSession({ client, config, name, currentDraftId });
  }, [config, client, name, currentDraftId]);

  useEffect(() => {
    if (client.eventDate) setDateError(false);
  }, [client.eventDate]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // --- Derived ---
  const fallbackHealth = useMemo(() => healthSnapshot(priceBook), [priceBook]);
  const totals = useMemo(() => computeTotals(config), [config]);
  const health = useMemo(() => computeHealth(config, totals, fallbackHealth), [config, totals, fallbackHealth]);
  const defaultName = [client.name.trim(), client.eventType].filter(Boolean).join(" · ") || "Untitled quote";
  const draftView: Draft = useMemo(
    () => ({
      id: currentDraftId ?? "new",
      name: name || defaultName,
      createdAt: "",
      updatedAt: "",
      client,
      config,
      cachedTotal: totals.total,
      schemaVersion: 5,
    }),
    [currentDraftId, name, defaultName, client, config, totals.total],
  );
  const publicQuote = useMemo(() => buildPublicQuote(draftView, totals, [], 0), [draftView, totals]);
  const changes = useMemo(
    () => (currentDraftId && !config.legacy && pbSource.kind !== "bundled" ? diffAgainstPriceBook(config, priceBook) : []),
    [currentDraftId, config, priceBook, pbSource.kind],
  );
  const wholeDollars = !!config.legacy;
  const money = (n: number) => formatMoney(n, { wholeDollars });
  const lineTotals = useMemo(() => new Map(totals.lines.map((l) => [l.id, l])), [totals]);
  const standalone = config.lines.filter((l) => !l.groupId || !config.groups.some((g) => g.id === l.groupId));

  // --- Save / duplicate / print ---
  function requireEventDate(): boolean {
    if (client.eventDate) return true;
    setDateError(true);
    const el = document.getElementById("event-date");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus({ preventScroll: true });
    return false;
  }

  async function push(d: Draft) {
    setSyncStatus({ kind: "syncing" });
    const r = await pushRemoteDraft(d);
    setSyncStatus(r.ok ? { kind: "synced", at: new Date().toISOString() } : failureToStatus(r.failure));
  }

  function withHealth(c: DraftConfigV5): DraftConfigV5 {
    return c.health || c.legacy ? c : { ...c, health: fallbackHealth };
  }

  function save() {
    if (!requireEventDate()) return;
    const finalName = name.trim() || defaultName;
    const existing = currentDraftId ? drafts.find((d) => d.id === currentDraftId) : undefined;
    const draft: Draft = existing
      ? { ...existing, name: finalName, client, config: withHealth(config) }
      : createDraft(finalName, client, withHealth(config));
    const next = upsertDraft(draft);
    setDrafts(next);
    setCurrentDraftId(draft.id);
    setName(finalName);
    requestAnimationFrame(() => setDirty(false));
    void push(next.find((d) => d.id === draft.id) ?? draft);
  }

  function duplicate() {
    if (!requireEventDate()) return;
    const copyName = `${name.trim() || defaultName} (copy)`;
    const draft = createDraft(copyName, client, withHealth(config));
    const next = upsertDraft(draft);
    setDrafts(next);
    setCurrentDraftId(draft.id);
    setName(copyName);
    requestAnimationFrame(() => setDirty(false));
    void push(next.find((d) => d.id === draft.id) ?? draft);
  }

  const printHref =
    currentDraftId && !dirty ? `/quote-calc/print?draft=${encodeURIComponent(currentDraftId)}` : "/quote-calc/print?draft=__current";

  function addCustom() {
    const id = newId();
    apply((c) => addCustomLine(c, { name: "", qty: 1, unitPrice: 0 }, () => id));
    setFocusLineId(id);
  }

  const statusLine = (
    <>
      <span aria-hidden>{HEALTH_GLYPH[health.status]} </span>
      {health.perHour !== null ? `${formatMoney2(health.perHour)}/hr` : "no estimate"}
      {dirty ? " · unsaved" : ""}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 pb-32 lg:pb-10 normal-case tracking-normal">
      {/* Title bar: inline name + save actions (no window.prompt) */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-72">
          <label htmlFor="quote-name" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {currentDraftId ? "Quote" : "New quote"}
          </label>
          <input
            id="quote-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="mt-1 h-14 w-full rounded-md border border-transparent bg-transparent px-2 -mx-2 font-squarepeg text-4xl md:text-5xl leading-none placeholder:text-foreground/40 hover:border-border focus:border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {currentDraftId ? syncLabel(syncStatus) : "Not saved yet"}
            {dirty && currentDraftId && " · unsaved changes"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-ring transition-colors"
          >
            <Save className="h-4 w-4" aria-hidden /> Save
          </button>
          <button
            type="button"
            onClick={duplicate}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
          >
            <Copy className="h-4 w-4" aria-hidden /> Duplicate
          </button>
          <a
            href={printHref}
            target="_blank"
            rel="noopener"
            className="h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
          >
            <Printer className="h-4 w-4" aria-hidden /> Print
          </a>
        </div>
      </div>

      <ConfigBanner state={banner} onRetry={() => void loadPriceBook(true)} retrying={pbLoading} />
      {pbSource.kind === "cache" && banner.kind === "fallback" && (
        <p className="-mt-4 mb-6 text-xs text-muted-foreground">
          Using the price book from {day(pbSource.loadedAt)}. Saved quotes are unaffected; their prices are frozen.
        </p>
      )}

      <div className="space-y-4 mb-5">
        {config.legacy && (
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Converted from the old calculator. Its lines are fixed prices and its total is exactly what the client
            saw; anything you add is priced from the price book.
          </p>
        )}
        {changes.length > 0 && (
          <PriceRefreshBanner
            key={changes.map((c) => c.key).join()}
            changes={changes}
            pricedAt={config.pricedAt}
            onApply={(sel) => apply((c) => applyRefresh(c, sel, new Date().toISOString()))}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <div className="space-y-5 min-w-0">
          <Section step="1" title="Client & event">
            <EventBasics
              client={client}
              onClient={setClient}
              dateError={dateError}
              households={config.households}
              guests={config.guests}
              guestsAuto={guestsAuto}
              guestsPerHousehold={priceBook.settings.guestsPerHousehold}
              onCounts={(h, g, auto) => {
                setGuestsAuto(auto);
                apply((c) => setGuestCounts(c, h, g));
              }}
            />
          </Section>

          <Section step="2" title="Start from">
            <PackageChips
              priceBook={priceBook}
              eventType={client.eventType}
              onAdd={(pkg) => apply((c) => addPackage(c, pkg, priceBook))}
            />
          </Section>

          <Section
            step="3"
            title="Lines"
            aside={<span className="text-xs text-muted-foreground tabular-nums">{money(totals.itemsSubtotal - totals.bundleSavings)}</span>}
          >
            <div className="space-y-4">
              {config.lines.length === 0 && config.groups.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nothing on this quote yet. Start from a suite above, add a product, or add a custom line.
                </p>
              )}
              {config.groups.map((g) => (
                <LineGroup
                  key={g.id}
                  group={g}
                  groupTotal={totals.groups.find((t) => t.id === g.id)}
                  totals={totals}
                  config={config}
                  priceBook={priceBook}
                  apply={apply}
                  wholeDollars={wholeDollars}
                />
              ))}
              {standalone.length > 0 && (
                <ul className={cn("divide-y divide-border/70", config.groups.length > 0 && "border-t border-border pt-3")}>
                  {standalone.map((l) => (
                    <LineRow
                      key={l.id}
                      line={l}
                      total={lineTotals.get(l.id)}
                      config={config}
                      priceBook={priceBook}
                      groups={config.groups}
                      apply={apply}
                      wholeDollars={wholeDollars}
                      autoFocusName={focusLineId === l.id}
                    />
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <ProductCombobox priceBook={priceBook} onPick={(p) => apply((c) => addProduct(c, p))} />
                <button
                  type="button"
                  onClick={addCustom}
                  className="h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" aria-hidden /> Custom line
                </button>
              </div>
            </div>
          </Section>

          <Section step="4" title="Services">
            <ServicesPanel config={config} onChange={(next) => apply(() => next)} physical={totals.anyPhysical} />
          </Section>

          <Section step="5" title="Discount">
            <DiscountControl
              discount={config.discount}
              settings={priceBook.settings}
              onChange={(discount) => apply((c) => ({ ...c, discount }))}
            />
          </Section>

          <Section step="6" title="Notes">
            <ClientInfoSection client={client} onChange={setClient} part="notes" />
          </Section>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-20" aria-label="Quote summary">
          <div className="rounded-lg border border-border bg-card p-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <SummaryPanel
              quote={publicQuote}
              totals={totals}
              health={health}
              config={config}
              healthFallback={fallbackHealth}
              onConfig={(next) => apply(() => next)}
            />
          </div>
        </aside>
      </div>

      <MobileBreakdownSheet
        total={money(totals.total)}
        status={statusLine}
        actions={
          <button
            type="button"
            onClick={save}
            aria-label="Save"
            className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <Save className="h-4 w-4" aria-hidden />
          </button>
        }
      >
        <SummaryPanel
          quote={publicQuote}
          totals={totals}
          health={health}
          config={config}
          healthFallback={fallbackHealth}
          onConfig={(next) => apply(() => next)}
        />
      </MobileBreakdownSheet>
    </div>
  );
}
