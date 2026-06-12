"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADD_ON_KEYS,
  CatalogItem,
  DEFAULTS,
  ITEM_CATALOG,
  PACKAGES,
  PackageType,
  PkgKey,
  PricingMode,
  QuoteState,
  calcAddOnRaw,
  calcPackage,
  fmt$,
  getDiscountPtg,
  loadSavedDefaults,
} from "@/lib/quote-calc-logic";
import { mergeRemoteConfig } from "@/lib/quote-calc-config";
import { fetchRemoteConfig } from "@/lib/quote-calc-config-remote";
import {
  DEFAULT_CONFIG,
  Draft,
  DraftClientInfo,
  DraftConfig,
  EMPTY_CLIENT_INFO,
  MiscAddOn,
  SyncStatus,
  createDraft,
  loadDrafts,
  reconcileDrafts,
  saveDrafts,
  upsertDraft,
} from "@/lib/quote-calc-drafts";
import {
  archiveRemoteDraft,
  fetchRemoteDrafts,
  pushRemoteDraft,
  RemoteFailure,
} from "@/lib/quote-calc-drafts-remote";
import { cn } from "@/utils";
import { AddOnRow } from "./AddOnRow";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { BreakdownPanel } from "./BreakdownPanel";
import { ClientInfoSection } from "./ClientInfoSection";
import { ConfigBanner, ConfigBannerState } from "./ConfigBanner";
import { DraftsBar } from "./DraftsBar";
import { MiscAddOnSection } from "./MiscAddOnSection";
import { MobileBreakdownSheet } from "./MobileBreakdownSheet";

const WEDDING_PKG_KEYS: PkgKey[] = ["individual", "diy", "sweet", "signature"];
const EVENT_PKG_KEYS: PkgKey[] = ["event-basics", "event-fun", "event-works"];

function failureToStatus(f: RemoteFailure): SyncStatus {
  if (f.kind === "network") return { kind: "offline", reason: "network" };
  if (f.kind === "unconfigured") return { kind: "offline", reason: "unconfigured" };
  return { kind: "offline", reason: "server" };
}

export function QuoteCalculator() {
  // --- Config state (mirrors DraftConfig) ---
  const [pkg, setPkg] = useState<PkgKey>(DEFAULT_CONFIG.pkg);
  const [pkgType, setPkgType] = useState<PackageType>(PACKAGES[DEFAULT_CONFIG.pkg].type);
  const [mode, setMode] = useState<PricingMode>(DEFAULT_CONFIG.mode);
  const [qty, setQty] = useState(DEFAULT_CONFIG.qty);
  const [addOns, setAddOns] = useState<Record<string, number>>({ ...DEFAULT_CONFIG.addOns });
  const [miscAddOns, setMiscAddOns] = useState<MiscAddOn[]>([...DEFAULT_CONFIG.miscAddOns]);
  const [rushFee, setRushFee] = useState(DEFAULT_CONFIG.rushFee);
  const [extraRevisions, setExtraRevisions] = useState(DEFAULT_CONFIG.extraRevisions);
  const [digitalLicense, setDigitalLicense] = useState(DEFAULT_CONFIG.digitalLicense);
  const [vendorIncentive, setVendorIncentive] = useState(DEFAULT_CONFIG.vendorIncentive);
  const [fullColor, setFullColor] = useState(DEFAULT_CONFIG.fullColor);
  const [customPaper, setCustomPaper] = useState(DEFAULT_CONFIG.customPaper);
  const [individualItem, setIndividualItem] = useState(DEFAULT_CONFIG.individualItem);
  const [individualDigital, setIndividualDigital] = useState(DEFAULT_CONFIG.individualDigital);

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
      pkg,
      mode,
      qty,
      addOns,
      miscAddOns,
      rushFee,
      extraRevisions,
      digitalLicense,
      vendorIncentive,
      fullColor,
      customPaper,
      individualItem,
      individualDigital,
    }),
    [pkg, mode, qty, addOns, miscAddOns, rushFee, extraRevisions, digitalLicense, vendorIncentive, fullColor, customPaper, individualItem, individualDigital],
  );

  // Apply a DraftConfig into state.
  const applyConfig = useCallback((c: DraftConfig) => {
    setPkg(c.pkg);
    setPkgType(PACKAGES[c.pkg].type);
    setMode(c.mode);
    setQty(c.qty);
    setAddOns({ ...c.addOns });
    setMiscAddOns([...(c.miscAddOns ?? [])]);
    setRushFee(c.rushFee);
    setExtraRevisions(c.extraRevisions);
    setDigitalLicense(c.digitalLicense);
    setVendorIncentive(c.vendorIncentive);
    setFullColor(c.fullColor);
    setCustomPaper(c.customPaper);
    setIndividualItem(c.individualItem);
    setIndividualDigital(c.individualDigital);
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

  // Choose a package: also flip pkgType to match (so the right tab stays selected).
  function selectPackage(key: PkgKey) {
    setPkg(key);
    setPkgType(PACKAGES[key].type);
  }

  // Default fallback per type when the user just toggles tabs.
  const DEFAULT_PER_TYPE: Record<PackageType, PkgKey> = {
    wedding: "sweet",
    events: "event-fun",
  };
  function switchPkgType(next: PackageType) {
    if (next === pkgType) return;
    setPkgType(next);
    // Only switch the chosen package if the current one is from the other type.
    if (PACKAGES[pkg].type !== next) {
      setPkg(DEFAULT_PER_TYPE[next]);
    }
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

  function setAddOnQty(key: string, q: number) {
    setAddOns((prev) => {
      const next = { ...prev };
      if (q <= 0) {
        delete next[key];
      } else {
        next[key] = q;
      }
      return next;
    });
  }

  const overrideItems = pkg === "individual" ? [individualItem] : undefined;
  const overrideDigital = pkg === "individual" ? individualDigital : undefined;

  const baseResult = useMemo(
    () => calcPackage(pkg, qty, mode, assumptions, extraRevisions, overrideItems, overrideDigital, fullColor, customPaper, vendorIncentive, catalog),
    [pkg, qty, mode, assumptions, extraRevisions, overrideItems?.[0], overrideDigital, fullColor, customPaper, vendorIncentive, catalog],
  );

  const selectedAddOns = useMemo(
    () =>
      Object.entries(addOns)
        .filter(([, q]) => q > 0)
        .map(([k, q]) => ({
          key: k,
          qty: q,
          label: catalog.find((i) => i.key === k)?.label ?? k,
          result: calcAddOnRaw(k, q, mode, assumptions, fullColor, customPaper),
        })),
    [addOns, mode, assumptions, fullColor, customPaper, catalog],
  );

  const addOnPreviews = useMemo(
    () =>
      Object.fromEntries(
        ADD_ON_KEYS.map((k) => [k, calcAddOnRaw(k, addOns[k] ?? 0, mode, assumptions, fullColor, customPaper)])
      ),
    [addOns, mode, assumptions, fullColor, customPaper],
  );

  // Compute the final total + net margin once at the parent so the mobile bar
  // and the breakdown panel agree. Mirrors the formula inside BreakdownPanel.
  const totals = useMemo(() => {
    const dlFactor = assumptions.digitalLicensePtg / 100;
    const digitalBonus = digitalLicense ? baseResult.totalDesignLabor * dlFactor : 0;
    const adjustedVariable = baseResult.totalVariable + digitalBonus;
    const adjustedAdmin = adjustedVariable * (assumptions.adminPtg / 100);
    const adjustedProfit = (adjustedVariable + adjustedAdmin) * (assumptions.targetProfitPtg / 100);
    const adjustedBeforeDiscount = adjustedVariable + adjustedAdmin + adjustedProfit;
    const combinedDiscountPtg = baseResult.discountPtg + baseResult.vendorIncentivePtg;
    const basePriceAdjusted = adjustedBeforeDiscount * (1 - combinedDiscountPtg / 100);
    const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.result.price, 0);
    const addOnsMaterials = selectedAddOns.reduce((s, a) => s + a.result.materialsCost, 0);
    const addOnsLabor = selectedAddOns.reduce((s, a) => s + a.result.designLabor + a.result.productionLabor, 0);
    const miscTotal = miscAddOns.reduce(
      (s, m) => s + Math.max(0, m.qty) * Math.max(0, m.unitPrice),
      0,
    );
    const subtotalBeforeRush = basePriceAdjusted + addOnsTotal;
    const rushAmount = rushFee ? subtotalBeforeRush * (assumptions.rushFeePtg / 100) : 0;
    const finalPrice = subtotalBeforeRush + rushAmount + miscTotal;
    // Misc add-ons are treated as pure margin (no internal cost) in v1.
    const yourCosts =
      baseResult.totalDirectCosts +
      addOnsMaterials +
      baseResult.totalLaborCost +
      addOnsLabor +
      digitalBonus;
    const netProfit = finalPrice - yourCosts;
    const netMargin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;
    const marginDiff = netMargin - assumptions.targetProfitPtg;
    return { finalPrice, netMargin, marginDiff, miscTotal };
  }, [assumptions, baseResult, digitalLicense, rushFee, selectedAddOns, miscAddOns]);

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

  function handleNewDraft() {
    if (draftDirty || currentDraftId !== null) {
      if (!window.confirm("Start a new quote? Unsaved changes will be lost.")) return;
    }
    applyConfig(DEFAULT_CONFIG);
    setClient(EMPTY_CLIENT_INFO);
    setCurrentDraftId(null);
    requestAnimationFrame(() => setDraftDirty(false));
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

  async function handleDraftsChange(next: Draft[]) {
    // Called from DraftsBar after a delete or rename.
    const prev = drafts;
    setDrafts(next);
    // If a draft was deleted, archive it remotely too.
    const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
    for (const r of removed) {
      setSyncStatus({ kind: "syncing" });
      const result = await archiveRemoteDraft(r.id);
      if (result.ok) {
        setSyncStatus({ kind: "synced", at: new Date().toISOString() });
      } else {
        setSyncStatus(failureToStatus(result.failure));
      }
    }
    // If a draft was renamed (kept id, different name), push the rename remotely too.
    const renamed = next.filter((n) => {
      const before = prev.find((p) => p.id === n.id);
      return before && before.name !== n.name;
    });
    for (const r of renamed) {
      void syncDraftToRemote(r);
    }
  }

  function handleLoadDraft(id: string) {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    if (draftDirty) {
      if (!window.confirm("Discard unsaved changes and load this draft?")) return;
    }
    setClient(draft.client);
    setAssumptions(draft.assumptionsSnapshot);
    applyConfig(draft.config);
    setCurrentDraftId(draft.id);
    requestAnimationFrame(() => setDraftDirty(false));
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
          drafts={drafts}
          currentDraftId={currentDraftId}
          currentName={currentName}
          dirty={draftDirty}
          syncStatus={syncStatus}
          onLoadDraft={handleLoadDraft}
          onNew={handleNewDraft}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onDraftsChange={handleDraftsChange}
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

          {/* 1. Package selector */}
          <Section title="Package">
            {/* Wedding / Events tab toggle */}
            <div className="inline-flex rounded-lg border border-border overflow-hidden mb-4">
              {(["wedding", "events"] as PackageType[]).map((t) => {
                const count = t === "wedding" ? WEDDING_PKG_KEYS.length : EVENT_PKG_KEYS.length;
                const isActive = pkgType === t;
                return (
                  <button
                    key={t}
                    onClick={() => switchPkgType(t)}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(pkgType === "wedding" ? WEDDING_PKG_KEYS : EVENT_PKG_KEYS).map((key) => {
                const def = PACKAGES[key];
                const isSelected = pkg === key;
                const previewResult = calcPackage(key, qty, mode, assumptions, 0, undefined, undefined, fullColor, customPaper, vendorIncentive, catalog);
                const discount = getDiscountPtg(key, assumptions);
                return (
                  <div key={key} className="relative group">
                    <button
                      onClick={() => selectPackage(key)}
                      onMouseEnter={() => setTooltipPkg(key)}
                      onMouseLeave={() => setTooltipPkg(null)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150",
                        isSelected ? def.selectedColorClass : def.colorClass + " hover:brightness-95"
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
                          {isSelected && (
                            <span className="text-xs rounded-full bg-foreground text-background px-2 py-0.5 font-medium">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{def.tagline}</p>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{def.description}</p>
                      <p className="text-sm font-mono font-semibold mt-3 tabular-nums">
                        {fmt$(Math.round(previewResult.finalPrice))}
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
                          {discount > 0 ? ` × ${(1 - discount / 100).toFixed(2)} (${discount}% savings)` : ""}
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

          {/* 2. Mode + Quantity + Individual options */}
          <Section title="Configuration">
            <div className="space-y-4">
              {/* Individual item selector */}
              {pkg === "individual" && (
                <div className="space-y-3 pb-3 border-b border-border">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Select item
                    </label>
                    <select
                      value={individualItem}
                      onChange={(e) => setIndividualItem(e.target.value)}
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
                          onClick={() => setIndividualDigital(isDigital)}
                          className={cn(
                            "h-11 px-5 text-sm font-medium transition-colors",
                            individualDigital === isDigital
                              ? "bg-foreground text-background"
                              : "bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          {isDigital ? "Digital" : "Physical"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {individualDigital
                        ? "Digital sale — design labor only, no printing or materials."
                        : "Physical sale — includes production labor and materials."}
                    </p>
                  </div>
                </div>
              )}

              {/* Mode toggle */}
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

              {/* Quantity */}
              <div>
                <label
                  htmlFor="qty"
                  className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2"
                >
                  Quantity — households / guests invited
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="qty"
                    type="number"
                    inputMode="numeric"
                    value={qty}
                    min={1}
                    max={500}
                    step={5}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-11 w-32 rounded-lg border border-border bg-background px-3 text-base font-mono tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">households</span>
                </div>
              </div>
            </div>
          </Section>

          {/* 3. Add-ons */}
          <Section title="Add-ons">
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Sold a la carte on top of any package. Enter an explicit piece count for each — use Suggest to pre-fill from {qty} households.
            </p>
            <div className="space-y-2">
              {ADD_ON_KEYS.map((key) => {
                const item = catalog.find((i) => i.key === key);
                if (!item) return null;
                const currentQty = addOns[key] ?? 0;
                return (
                  <AddOnRow
                    key={key}
                    item={item}
                    qty={currentQty}
                    packageQty={qty}
                    preview={addOnPreviews[key]}
                    onChange={(next) => setAddOnQty(key, next)}
                    catalog={catalog}
                  />
                );
              })}
            </div>
          </Section>

          {/* 3b. Miscellaneous add-ons */}
          <Section title="Custom add-ons">
            <MiscAddOnSection items={miscAddOns} onChange={setMiscAddOns} />
          </Section>

          {/* 4. Extras */}
          <Section title="Extras">
            <div className="space-y-3">
              {/* Rush fee */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px]",
                  rushFee ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={rushFee}
                  onChange={(e) => setRushFee(e.target.checked)}
                  className="h-5 w-5 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Rush fee +30%</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Turnaround under 7 days — applied to the full quote total.
                  </p>
                </div>
              </label>

              {/* Revision rounds */}
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
                <div className="flex-1">
                  <span className="text-sm font-medium">Extra revision rounds</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    First round is free. Each extra round adds {assumptions.revisionMin}m of design labor.
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

              {/* Digital file license */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px]",
                  digitalLicense ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={digitalLicense}
                  onChange={(e) => setDigitalLicense(e.target.checked)}
                  className="h-5 w-5 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Digital file license (+{assumptions.digitalLicensePtg}%)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Print-ready source files · unlimited copies — design labor ×{(1 + assumptions.digitalLicensePtg / 100).toFixed(1)}.
                  </p>
                </div>
              </label>

              {/* Vendor incentive */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px]",
                  vendorIncentive ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={vendorIncentive}
                  onChange={(e) => setVendorIncentive(e.target.checked)}
                  className="h-5 w-5 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Vendor incentive (-{assumptions.vendorIncentivePtg}%)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Discount for customers referred by another vendor. Stacks with package discount.
                  </p>
                </div>
              </label>

              {/* Full color designs */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px]",
                  fullColor ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={fullColor}
                  onChange={(e) => setFullColor(e.target.checked)}
                  className="h-5 w-5 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Full color designs (x{assumptions.fullColorFactor})</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Heavy ink coverage increases sheet cost. Multiplied into material pricing.
                  </p>
                </div>
              </label>

              {/* Custom paper */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px]",
                  customPaper ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={customPaper}
                  onChange={(e) => setCustomPaper(e.target.checked)}
                  className="h-5 w-5 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Custom paper (x{assumptions.customPaperFactor})</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Premium or specialty paper increases sheet cost. Multiplied into material pricing.
                  </p>
                </div>
              </label>
            </div>
          </Section>
        </div>

        {/* Right: price breakdown — hidden on mobile */}
        <div className="lg:col-span-2 hidden lg:block">
          <BreakdownPanel
            pkg={pkg}
            mode={mode}
            qty={qty}
            assumptions={assumptions}
            baseResult={baseResult}
            selectedAddOns={selectedAddOns}
            miscAddOns={miscAddOns}
            rushFee={rushFee}
            extraRevisions={extraRevisions}
            digitalLicense={digitalLicense}
            vendorIncentive={vendorIncentive}
            fullColor={fullColor}
            customPaper={customPaper}
            catalog={catalog}
          />
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
        <BreakdownPanel
          pkg={pkg}
          mode={mode}
          qty={qty}
          assumptions={assumptions}
          baseResult={baseResult}
          selectedAddOns={selectedAddOns}
          miscAddOns={miscAddOns}
          rushFee={rushFee}
          extraRevisions={extraRevisions}
          digitalLicense={digitalLicense}
          vendorIncentive={vendorIncentive}
          fullColor={fullColor}
          customPaper={customPaper}
          catalog={catalog}
          embedded
        />
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
