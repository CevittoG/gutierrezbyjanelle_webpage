"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CatalogItem,
  DEFAULTS,
  ITEM_CATALOG,
  PACKAGES,
  PackageType,
  PkgKey,
  PricingMode,
  QuoteState,
  calcPackageCost,
  clampPtg,
  fmt$,
  getDiscountPtg,
  getItemQty,
  loadSavedDefaults,
  markupVariable,
} from "@/lib/quote-calc-logic";
import { computeQuoteBreakdown } from "@/lib/quote-calc-totals";
import { mergeRemoteConfig } from "@/lib/quote-calc-config";
import { fetchRemoteConfig } from "@/lib/quote-calc-config-remote";
import {
  DEFAULT_CONFIG,
  Draft,
  DraftClientInfo,
  DraftConfig,
  EMPTY_CLIENT_INFO,
  MiscAddOn,
  QuoteLine,
  SyncStatus,
  createDraft,
  loadDrafts,
  newId,
  reconcileDrafts,
  saveDrafts,
  upsertDraft,
} from "@/lib/quote-calc-drafts";
import {
  fetchRemoteDrafts,
  pushRemoteDraft,
  RemoteFailure,
} from "@/lib/quote-calc-drafts-remote";
import { cn } from "@/utils";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { BreakdownPanel } from "./BreakdownPanel";
import { ClientInfoSection } from "./ClientInfoSection";
import { ConfigBanner, ConfigBannerState } from "./ConfigBanner";
import { DraftsBar } from "./DraftsBar";
import { MiscAddOnSection } from "./MiscAddOnSection";
import { MobileBreakdownSheet } from "./MobileBreakdownSheet";

const WEDDING_PKG_KEYS: PkgKey[] = ["diy", "sweet", "signature"];
const EVENT_PKG_KEYS: PkgKey[] = ["event-basics", "event-fun", "event-works"];

// Default per-line quantity when a package is added to the quote.
const DEFAULT_LINE_QTY = 75;

function failureToStatus(f: RemoteFailure): SyncStatus {
  if (f.kind === "network") return { kind: "offline", reason: "network" };
  if (f.kind === "unconfigured") return { kind: "offline", reason: "unconfigured" };
  return { kind: "offline", reason: "server" };
}

export function QuoteCalculator() {
  // --- Config state (mirrors DraftConfig) ---
  const [lines, setLines] = useState<QuoteLine[]>(() =>
    DEFAULT_CONFIG.lines.map((l) => ({ ...l })),
  );
  // The Wedding/Events tab is just a filter over the package picker.
  const [pkgType, setPkgType] = useState<PackageType>("wedding");
  // Which catalog item the "Add item" picker will append.
  const [itemPick, setItemPick] = useState<string>(ITEM_CATALOG[0]?.key ?? "iInvite");
  const [mode, setMode] = useState<PricingMode>(DEFAULT_CONFIG.mode);
  const [miscAddOns, setMiscAddOns] = useState<MiscAddOn[]>([...DEFAULT_CONFIG.miscAddOns]);
  const [rushFee, setRushFee] = useState(DEFAULT_CONFIG.rushFee);
  const [extraRevisions, setExtraRevisions] = useState(DEFAULT_CONFIG.extraRevisions);
  const [digitalLicense, setDigitalLicense] = useState(DEFAULT_CONFIG.digitalLicense);
  const [vendorIncentive, setVendorIncentive] = useState(DEFAULT_CONFIG.vendorIncentive);
  const [customDiscountPtg, setCustomDiscountPtg] = useState(DEFAULT_CONFIG.customDiscountPtg);
  const [familyFriendsPtg, setFamilyFriendsPtg] = useState(DEFAULT_CONFIG.familyFriendsPtg);
  const [fullColor, setFullColor] = useState(DEFAULT_CONFIG.fullColor);
  const [customPaper, setCustomPaper] = useState(DEFAULT_CONFIG.customPaper);

  // --- Client info ---
  const [client, setClient] = useState<DraftClientInfo>(EMPTY_CLIENT_INFO);

  // --- Assumptions ---
  const [assumptions, setAssumptions] = useState<QuoteState>({ ...DEFAULTS });

  // --- Runtime config (Phase 1: pulled from the Settings + Items sheet tabs) ---
  const [catalog, setCatalog] = useState<CatalogItem[]>(ITEM_CATALOG);
  const [bannerState, setBannerState] = useState<ConfigBannerState>({ kind: "hidden" });
  const [configRetrying, setConfigRetrying] = useState(false);

  // --- Drafts ---
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: "idle" });

  // --- Misc UI ---
  const [tooltipPkg, setTooltipPkg] = useState<PkgKey | null>(null);
  const [dateError, setDateError] = useState(false);

  const hydratedRef = useRef(false);
  // A ?draft=<id> that wasn't in the local cache yet — retried after remote sync.
  const pendingDraftIdRef = useRef<string | null>(null);

  // Build a DraftConfig from current state.
  const config: DraftConfig = useMemo(
    () => ({
      lines,
      mode,
      miscAddOns,
      rushFee,
      extraRevisions,
      digitalLicense,
      vendorIncentive,
      customDiscountPtg,
      familyFriendsPtg,
      fullColor,
      customPaper,
    }),
    [lines, mode, miscAddOns, rushFee, extraRevisions, digitalLicense, vendorIncentive, customDiscountPtg, familyFriendsPtg, fullColor, customPaper],
  );

  // Apply a DraftConfig into state.
  const applyConfig = useCallback((c: DraftConfig) => {
    setLines(c.lines.map((l) => ({ ...l })));
    const firstPkg = c.lines.find((l) => l.kind === "package" && l.pkg);
    setPkgType(firstPkg?.pkg ? PACKAGES[firstPkg.pkg].type : "wedding");
    setMode(c.mode);
    setMiscAddOns([...(c.miscAddOns ?? [])]);
    setRushFee(c.rushFee);
    setExtraRevisions(c.extraRevisions);
    setDigitalLicense(c.digitalLicense);
    setVendorIncentive(c.vendorIncentive);
    setCustomDiscountPtg(c.customDiscountPtg);
    setFamilyFriendsPtg(c.familyFriendsPtg);
    setFullColor(c.fullColor);
    setCustomPaper(c.customPaper);
  }, []);

  // Load a full saved draft into state (used by the ?draft=<id> edit deep-link
  // and by the Open selector). Marks the form clean after applying.
  const loadDraftIntoState = useCallback(
    (draft: Draft) => {
      setClient(draft.client);
      setAssumptions(draft.assumptionsSnapshot);
      applyConfig(draft.config);
      setCurrentDraftId(draft.id);
      requestAnimationFrame(() => setDraftDirty(false));
    },
    [applyConfig],
  );

  // Add a package bundle as a new line on the quote.
  function addPackageLine(key: PkgKey) {
    setLines((prev) => [
      ...prev,
      { id: newId(), kind: "package", pkg: key, qty: DEFAULT_LINE_QTY, digital: false },
    ]);
  }

  // Add a single catalog item as a new line — qty pre-filled to a sensible piece
  // count from the household assumption (fixed items resolve to their flat count).
  function addItemLine(itemKey: string) {
    setLines((prev) => [
      ...prev,
      { id: newId(), kind: "item", itemKey, qty: getItemQty(itemKey, DEFAULT_LINE_QTY, catalog), digital: false },
    ]);
  }

  // Patch one line (qty / item / digital flag) by id.
  function updateLine(id: string, patch: Partial<QuoteLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  // Remove a line — but always keep at least one on the quote.
  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  // Pull the latest Settings + Items from the Sheet. Falls back to bundled
  // defaults on failure and surfaces a banner so Janelle knows.
  const loadRemoteConfig = useCallback(
    async (opts?: { refresh?: boolean }) => {
      setConfigRetrying(true);
      try {
        const result = await fetchRemoteConfig(opts);
        if (!result.ok) {
          // Hard failure: bundled DEFAULTS + ITEM_CATALOG, banner explains why.
          setCatalog(ITEM_CATALOG);
          setBannerState({ kind: "fallback", reason: result.failure.kind });
          return;
        }
        const merged = mergeRemoteConfig(result.value);
        setCatalog(merged.catalog);
        // Sheet is the source of truth — its values win over the locally-saved
        // defaults so editing the Sheet + Retry actually re-prices the quote.
        // Per-draft snapshots are preserved separately on Load (draft.assumptionsSnapshot).
        setAssumptions((prev) => ({ ...prev, ...merged.assumptions }));
        setBannerState(
          merged.warnings.length > 0
            ? { kind: "ok", warnings: merged.warnings }
            : { kind: "hidden" },
        );
      } finally {
        setConfigRetrying(false);
      }
    },
    [],
  );

  // Hydrate on mount: drafts + saved assumptions defaults. A ?draft=<id> query
  // param (the dashboard "Edit" deep-link) preloads that quote; otherwise the
  // form stays blank — "New quote" never resurrects a previously-opened quote.
  useEffect(() => {
    const savedAssumptions = loadSavedDefaults();
    setAssumptions(savedAssumptions);
    const localDrafts = loadDrafts();
    setDrafts(localDrafts);

    const draftParam = new URLSearchParams(window.location.search).get("draft");
    if (draftParam) {
      const found = localDrafts.find((d) => d.id === draftParam);
      if (found) {
        loadDraftIntoState(found);
      } else {
        // Not cached locally yet — load it once the remote sync lands.
        pendingDraftIdRef.current = draftParam;
      }
    }
    // Mark hydration finished AFTER state writes settle.
    requestAnimationFrame(() => {
      hydratedRef.current = true;
    });

    // Background remote sync. Failures fall back to local cache silently.
    (async () => {
      setSyncStatus({ kind: "syncing" });
      const result = await fetchRemoteDrafts();
      if (result.ok) {
        const merged = reconcileDrafts(localDrafts, result.value);
        setDrafts(merged);
        saveDrafts(merged);
        setSyncStatus({ kind: "synced", at: new Date().toISOString() });
        if (pendingDraftIdRef.current) {
          const found = merged.find((d) => d.id === pendingDraftIdRef.current);
          if (found) loadDraftIntoState(found);
          pendingDraftIdRef.current = null;
        }
      } else {
        setSyncStatus(failureToStatus(result.failure));
      }
    })();

    // Config load runs in parallel with drafts sync.
    void loadRemoteConfig();
  }, [loadDraftIntoState, loadRemoteConfig]);

  // Manual refresh from Sheet (triggered by DraftsBar).
  const handleRefreshFromRemote = useCallback(async () => {
    setSyncStatus({ kind: "syncing" });
    const result = await fetchRemoteDrafts();
    if (result.ok) {
      const merged = reconcileDrafts(loadDrafts(), result.value);
      setDrafts(merged);
      saveDrafts(merged);
      setSyncStatus({ kind: "synced", at: new Date().toISOString() });
    } else {
      setSyncStatus(failureToStatus(result.failure));
    }
  }, []);

  // Mark dirty on any tracked change AFTER hydration.
  useEffect(() => {
    if (!hydratedRef.current) return;
    setDraftDirty(true);
  }, [config, client]);

  // Clear the "event date required" flag as soon as a date is entered.
  useEffect(() => {
    if (client.eventDate) setDateError(false);
  }, [client.eventDate]);

  function updateAssumption(key: keyof QuoteState, value: number) {
    setAssumptions((prev) => ({ ...prev, [key]: value }));
    if (hydratedRef.current) setDraftDirty(true);
  }

  // Single source of truth for the price math — shared by the breakdown panel,
  // the mobile bar, and the saved draft total (same engine as print + portal).
  const breakdown = useMemo(
    () => computeQuoteBreakdown(config, assumptions, catalog),
    [config, assumptions, catalog],
  );

  // Rough per-package preview price (list minus the bundle discount, which comes
  // off raw labor only) for the picker cards — the real number is the line's
  // `net` once it's on the quote.
  const pkgPreview = useCallback(
    (key: PkgKey): number => {
      const cost = calcPackageCost(key, DEFAULT_LINE_QTY, mode, assumptions, fullColor, customPaper, catalog);
      const { list } = markupVariable(cost.totalVariable, assumptions);
      const laborBase = cost.totalDesignLabor + cost.totalProductionLabor;
      const disc = clampPtg(getDiscountPtg(key, assumptions));
      return list - laborBase * (disc / 100);
    },
    [mode, assumptions, fullColor, customPaper, catalog],
  );

  // Final total + net margin for the mobile bar, derived from the breakdown.
  const totals = useMemo(() => {
    const finalPrice = breakdown.finalPrice;
    const lineCosts = breakdown.lines.reduce(
      (s, l) => s + l.cost.totalMaterials + l.cost.totalDesignLabor + l.cost.totalProductionLabor,
      0,
    );
    const yourCosts = lineCosts + breakdown.services.servicesVar;
    const netProfit = finalPrice - yourCosts;
    const netMargin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;
    const marginDiff = netMargin - assumptions.targetProfitPtg;
    return { finalPrice, netMargin, marginDiff, miscTotal: breakdown.miscTotal };
  }, [breakdown, assumptions.targetProfitPtg]);

  // --- Draft handlers ---

  // Event date is mandatory — it drives the dashboard priority list. Block the
  // save, flag the field, and bring it into view.
  function requireEventDate(): boolean {
    if (client.eventDate) return true;
    setDateError(true);
    const el = document.getElementById("event-date");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus({ preventScroll: true });
    return false;
  }

  async function syncDraftToRemote(d: Draft) {
    setSyncStatus({ kind: "syncing" });
    const result = await pushRemoteDraft(d);
    if (result.ok) {
      setSyncStatus({ kind: "synced", at: new Date().toISOString() });
    } else {
      setSyncStatus(failureToStatus(result.failure));
    }
  }

  function handleSave() {
    if (!requireEventDate()) return;
    // Save: if there's a currentDraftId, update it in place; else fall back to Save As.
    if (currentDraftId === null) {
      handleSaveAs();
      return;
    }
    const existing = drafts.find((d) => d.id === currentDraftId);
    if (!existing) {
      handleSaveAs();
      return;
    }
    const updated: Draft = {
      ...existing,
      client,
      config,
      assumptionsSnapshot: { ...assumptions },
      cachedTotal: totals.finalPrice,
    };
    const next = upsertDraft(updated);
    setDrafts(next);
    setDraftDirty(false);
    // Find the freshly-stamped version that upsertDraft wrote to disk so the
    // remote write has the same updatedAt.
    const fresh = next.find((d) => d.id === updated.id) ?? updated;
    void syncDraftToRemote(fresh);
  }

  function handleSaveAs() {
    if (!requireEventDate()) return;
    const defaultName =
      client.name?.trim() ||
      (client.eventType ? `${client.eventType} quote` : "Untitled quote");
    const name = window.prompt("Name this quote", defaultName);
    if (name === null) return;
    const draft = createDraft(name, client, config, assumptions, totals.finalPrice);
    const next = upsertDraft(draft);
    setDrafts(next);
    setCurrentDraftId(draft.id);
    setDraftDirty(false);
    const fresh = next.find((d) => d.id === draft.id) ?? draft;
    void syncDraftToRemote(fresh);
  }

  const currentName =
    drafts.find((d) => d.id === currentDraftId)?.name ?? "Untitled quote";

  return (
    <div className="mx-auto max-w-6xl py-6 px-4 md:px-6 normal-case tracking-normal pb-32 lg:pb-8">
      <div className="mb-5">
        <h1 className="font-squarepeg text-4xl md:text-5xl leading-none mb-1">New quote</h1>
        <p className="text-sm text-muted-foreground">
          Draft, save, and share quotes. Assumptions stay flexible; drafts snapshot their own prices.
        </p>
      </div>

      <ConfigBanner
        state={bannerState}
        onRetry={() => void loadRemoteConfig({ refresh: true })}
        retrying={configRetrying}
      />

      <div className="mb-5">
        <DraftsBar
          currentDraftId={currentDraftId}
          currentName={currentName}
          dirty={draftDirty}
          syncStatus={syncStatus}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onRefreshRemote={handleRefreshFromRemote}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left: configuration panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* 0. Client info */}
          <Section title="Client">
            <ClientInfoSection client={client} onChange={setClient} dateError={dateError} />
          </Section>

          {/* 1. Package picker */}
          <Section title="Add a package">
            {/* Wedding / Events tab toggle */}
            <div className="inline-flex rounded-lg border border-border overflow-hidden mb-4">
              {(["wedding", "events"] as PackageType[]).map((t) => {
                const count = t === "wedding" ? WEDDING_PKG_KEYS.length : EVENT_PKG_KEYS.length;
                const isActive = pkgType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setPkgType(t)}
                    className={cn(
                      "h-11 px-5 text-sm font-medium transition-colors",
                      isActive ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-muted"
                    )}
                    aria-pressed={isActive}
                  >
                    {t === "wedding" ? "Wedding" : "Events"} <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Tap a bundle to add it to the quote. Add as many as you like — each becomes its own line with its own quantity.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(pkgType === "wedding" ? WEDDING_PKG_KEYS : EVENT_PKG_KEYS).map((key) => {
                const def = PACKAGES[key];
                const previewPrice = pkgPreview(key);
                const discount = getDiscountPtg(key, assumptions);
                return (
                  <div key={key} className="relative group">
                    <button
                      onClick={() => addPackageLine(key)}
                      onMouseEnter={() => setTooltipPkg(key)}
                      onMouseLeave={() => setTooltipPkg(null)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150",
                        def.colorClass + " hover:brightness-95"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-squarepeg text-xl leading-tight">{def.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {discount > 0 && (
                            <span className="text-xs rounded-full bg-accent text-accent-foreground px-2 py-0.5 font-medium">
                              -{discount}%
                            </span>
                          )}
                          <span className="text-xs rounded-full bg-foreground text-background px-2 py-0.5 font-medium">
                            + Add
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{def.tagline}</p>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{def.description}</p>
                      <p className="text-sm font-mono font-semibold mt-3 tabular-nums">
                        {fmt$(Math.round(previewPrice))}
                        <span className="text-xs font-normal text-muted-foreground"> · at {DEFAULT_LINE_QTY}</span>
                      </p>
                    </button>

                    {/* Tooltip */}
                    {tooltipPkg === key && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-border bg-card shadow-lg p-3 text-xs space-y-1.5">
                        <p className="font-semibold text-foreground">{def.name} includes:</p>
                        <ul className="text-muted-foreground space-y-0.5">
                          {def.items.map((it, idx) => {
                            const isObj = typeof it !== "string";
                            const k = isObj ? it.key : it;
                            const label = (isObj && it.displayLabel) || catalog.find((i) => i.key === k)?.label || k;
                            return <li key={`${k}-${idx}`}>· {label}</li>;
                          })}
                        </ul>
                        <hr className="border-border" />
                        <p className="text-muted-foreground/80 font-mono">
                          Cost × {(1 + assumptions.adminPtg / 100).toFixed(2)} admin × {(1 + assumptions.targetProfitPtg / 100).toFixed(2)} profit
                          {discount > 0 ? ` − ${discount}% off labor` : ""}
                        </p>
                        {def.isDigital && (
                          <p className="text-muted-foreground/60 italic">Digital — design labor only</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 2. Individual item picker (replaces the old add-ons section) */}
          <Section title="Add an individual item">
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Any single catalog piece, à la carte — sold on its own or on top of a package. Each is its own line, priced exactly the same way wherever you add it.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={itemPick}
                onChange={(e) => setItemPick(e.target.value)}
                aria-label="Choose an item to add"
                className="h-11 flex-1 min-w-[12rem] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {catalog.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
              <button
                onClick={() => addItemLine(itemPick)}
                className="h-11 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                + Add item
              </button>
            </div>
          </Section>

          {/* 3. Lines on the quote */}
          <Section title="On this quote">
            <div className="space-y-3">
              {lines.map((line) => {
                const lr = breakdown.lines.find((l) => l.id === line.id);
                const linePrice = lr ? fmt$(Math.round(lr.net)) : null;

                if (line.kind === "package") {
                  const def = line.pkg ? PACKAGES[line.pkg] : undefined;
                  return (
                    <div key={line.id} className="rounded-lg border border-border p-4 space-y-3">
                      <LineHeader
                        title={def?.name ?? line.pkg ?? "Package"}
                        subtitle={def?.tagline ?? ""}
                        price={linePrice}
                        canRemove={lines.length > 1}
                        onRemove={() => removeLine(line.id)}
                      />
                      <QtyInput
                        label="Quantity — households / guests"
                        value={line.qty}
                        onChange={(q) => updateLine(line.id, { qty: q })}
                      />
                    </div>
                  );
                }

                // Item line.
                const cat = catalog.find((i) => i.key === line.itemKey);
                const lineDigital = line.digital ?? false;
                return (
                  <div key={line.id} className="rounded-lg border border-border p-4 space-y-3">
                    <LineHeader
                      title={cat?.label ?? line.itemKey ?? "Item"}
                      subtitle="Individual item"
                      price={linePrice}
                      canRemove={lines.length > 1}
                      onRemove={() => removeLine(line.id)}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        Item
                      </label>
                      <select
                        value={line.itemKey ?? "iInvite"}
                        onChange={(e) => updateLine(line.id, { itemKey: e.target.value })}
                        className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {catalog.map((item) => (
                          <option key={item.key} value={item.key}>{item.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        Sale type
                      </label>
                      <div className="inline-flex rounded-lg border border-border overflow-hidden">
                        {([false, true] as const).map((isDigital) => (
                          <button
                            key={String(isDigital)}
                            onClick={() => updateLine(line.id, { digital: isDigital })}
                            className={cn(
                              "h-11 px-5 text-sm font-medium transition-colors",
                              lineDigital === isDigital
                                ? "bg-foreground text-background"
                                : "bg-card text-foreground hover:bg-muted"
                            )}
                          >
                            {isDigital ? "Digital" : "Physical"}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {lineDigital
                          ? "Digital sale — design labor only, no printing or materials."
                          : "Physical sale — includes production labor and materials."}
                      </p>
                    </div>

                    <QtyInput
                      label="Quantity — pieces"
                      value={line.qty}
                      onChange={(q) => updateLine(line.id, { qty: q })}
                    />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 4. Pricing mode (applies to every line) */}
          <Section title="Configuration">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Pricing mode
              </label>
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                {(["fresh", "reuse"] as PricingMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "h-11 px-5 text-sm font-medium transition-colors",
                      mode === m
                        ? "bg-foreground text-background"
                        : "bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    {m === "fresh" ? "Fresh design" : "Reuse existing"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {mode === "fresh"
                  ? "Full design labor — new original artwork from scratch."
                  : `Reduced design labor (×${assumptions.reuseFactor}) — adapting an existing design.`}
              </p>
            </div>
          </Section>

          {/* 5. Custom add-ons (free-form selling-price items) */}
          <Section title="Custom add-ons">
            <MiscAddOnSection items={miscAddOns} onChange={setMiscAddOns} />
          </Section>

          {/* 6. Project services (quote-level — charged once) */}
          <Section title="Project services">
            <div className="space-y-3">
              <CheckRow
                checked={rushFee}
                onChange={setRushFee}
                title={`Rush fee +${assumptions.rushFeePtg}%`}
                description="Turnaround under 7 days — applied once to the discounted order total."
              />

              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
                <div className="flex-1">
                  <span className="text-sm font-medium">Extra revision rounds</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    First round is free. Each extra round adds {assumptions.revisionMin}m of design labor — once per quote.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExtraRevisions((v) => Math.max(0, v - 1))}
                    disabled={extraRevisions === 0}
                    aria-label="Fewer revisions"
                    className="h-11 w-11 rounded-full border border-border flex items-center justify-center text-base hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono text-base tabular-nums">{extraRevisions}</span>
                  <button
                    onClick={() => setExtraRevisions((v) => Math.min(5, v + 1))}
                    disabled={extraRevisions === 5}
                    aria-label="More revisions"
                    className="h-11 w-11 rounded-full border border-border flex items-center justify-center text-base hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <CheckRow
                checked={digitalLicense}
                onChange={setDigitalLicense}
                title={`Digital file license (+${assumptions.digitalLicensePtg}%)`}
                description={`Print-ready source files · unlimited copies — adds ${assumptions.digitalLicensePtg}% of total design labor, once.`}
              />
            </div>
          </Section>

          {/* 7. Discounts (all additive, labor-only — see the note below) */}
          <Section title="Discounts">
            <div className="space-y-3">
              <CheckRow
                checked={vendorIncentive}
                onChange={setVendorIncentive}
                title={`Vendor incentive (-${assumptions.vendorIncentivePtg}%)`}
                description="Discount for customers referred by another vendor."
              />
              <DiscountInputRow
                label="Family & friends discount"
                description="Optional extra discount for friends and family."
                value={familyFriendsPtg}
                onChange={setFamilyFriendsPtg}
              />
              <DiscountInputRow
                label="Custom discount"
                description="Optional extra discount, e.g. bulk pricing."
                value={customDiscountPtg}
                onChange={setCustomDiscountPtg}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                All discounts add together (they don&apos;t compound) and come off your labor only —
                design and production time. Materials, admin, and project services are never discounted,
                so a discount can&apos;t cut into real cost. Each package&apos;s own bundle discount adds into the same total.
              </p>
            </div>
          </Section>

          {/* 8. Materials */}
          <Section title="Materials">
            <div className="space-y-3">
              <CheckRow
                checked={fullColor}
                onChange={setFullColor}
                title={`Full color designs (x${assumptions.fullColorFactor})`}
                description="Heavy ink coverage increases sheet cost. Multiplied into material pricing."
              />
              <CheckRow
                checked={customPaper}
                onChange={setCustomPaper}
                title={`Custom paper (x${assumptions.customPaperFactor})`}
                description="Premium or specialty paper increases sheet cost. Multiplied into material pricing."
              />
            </div>
          </Section>
        </div>

        {/* Right: price breakdown — hidden on mobile */}
        <div className="lg:col-span-2 hidden lg:block">
          <BreakdownPanel breakdown={breakdown} mode={mode} assumptions={assumptions} catalog={catalog} />
        </div>
      </div>

      {/* Assumptions panel (full width, collapsible) */}
      <div className="mt-6">
        <AssumptionsPanel
          assumptions={assumptions}
          onUpdate={updateAssumption}
          onReset={() => setAssumptions({ ...DEFAULTS })}
          onLoad={(s) => setAssumptions(s)}
          catalog={catalog}
        />
      </div>

      {/* Mobile sticky bottom bar + sheet */}
      <MobileBreakdownSheet
        total={totals.finalPrice}
        netMargin={totals.netMargin}
        marginDiff={totals.marginDiff}
      >
        <BreakdownPanel breakdown={breakdown} mode={mode} assumptions={assumptions} catalog={catalog} embedded />
      </MobileBreakdownSheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

// Header row for a line on the quote: title + subtitle, the line price, and a
// remove button.
function LineHeader({
  title,
  subtitle,
  price,
  canRemove,
  onRemove,
}: {
  title: string;
  subtitle: string;
  price: string | null;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-squarepeg text-xl leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {price && <span className="text-sm font-mono font-semibold tabular-nums">{price}</span>}
        <button
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove ${title}`}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-base hover:bg-muted disabled:opacity-30 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function QtyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={1}
          max={2000}
          step={1}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="h-11 w-32 rounded-lg border border-border bg-background px-3 text-base font-mono tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-sm text-muted-foreground">qty</span>
      </div>
    </div>
  );
}

// A boolean toggle styled like a checked card when active.
function CheckRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px]",
        checked ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded accent-foreground cursor-pointer"
      />
      <div className="flex-1">
        <span className="text-sm font-medium">{title}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  );
}

// An optional, typed percentage discount. Active (and styled like a checked
// extra) whenever the value is above 0.
function DiscountInputRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const active = value > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors min-h-[44px]",
        active ? "border-foreground/40 bg-muted" : "border-border bg-card"
      )}
    >
      <div className="flex-1">
        <span className="text-sm font-medium">
          {label}
          {active ? ` (-${value}%)` : ""}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value));
            onChange(Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);
          }}
          aria-label={label}
          className="h-11 w-16 rounded-lg border border-border bg-background px-2 text-base font-mono tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </div>
  );
}
