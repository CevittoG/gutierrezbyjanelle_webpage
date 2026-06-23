export type PkgKey =
  | "diy"
  | "sweet"
  | "signature"
  | "event-basics"
  | "event-fun"
  | "event-works";
export type PricingMode = "fresh" | "reuse";
export type PackageType = "wedding" | "events";

export interface QuoteState {
  hourly: number;
  adminPtg: number;
  targetProfitPtg: number;
  errorMarginPtg: number;
  packagingCost: number;
  reuseFactor: number;
  revisionMin: number;

  discountDiy: number;
  discountSweet: number;
  discountSignature: number;
  discountEventBasics: number;
  discountEventFun: number;
  discountEventWorks: number;

  vendorIncentivePtg: number;
  fullColorFactor: number;
  customPaperFactor: number;
  rushFeePtg: number;
  digitalLicensePtg: number;

  // Fixed initial payment shown on the client portal (deposit/balance split).
  // Display-only: never enters the price math — the quote total is unchanged.
  depositAmount: number;

  // Per-item: _dt = design time (min), _pt = production time/unit (min), _sc = sheet cost, _y = yield
  iSaveDate_dt: number; iSaveDate_pt: number; iSaveDate_sc: number; iSaveDate_y: number;
  iInvite_dt: number;   iInvite_pt: number;   iInvite_sc: number;   iInvite_y: number;
  iDetail_dt: number;   iDetail_pt: number;   iDetail_sc: number;   iDetail_y: number;
  iRSVP_dt: number;     iRSVP_pt: number;     iRSVP_sc: number;     iRSVP_y: number;
  iEnvelope_dt: number; iEnvelope_pt: number;  iEnvelope_sc: number; iEnvelope_y: number;
  iCeremony_dt: number; iCeremony_pt: number;  iCeremony_sc: number; iCeremony_y: number;
  iGuestSetting_dt: number; iGuestSetting_pt: number; iGuestSetting_sc: number; iGuestSetting_y: number;
  iWelcome_dt: number;  iWelcome_pt: number;   iWelcome_sc: number;  iWelcome_y: number;
  iSeating_dt: number;  iSeating_pt: number;   iSeating_sc: number;  iSeating_y: number;
  iMenu_dt: number;     iMenu_pt: number;      iMenu_sc: number;     iMenu_y: number;
  iWedgeTop_dt: number; iWedgeTop_pt: number; iWedgeTop_sc: number; iWedgeTop_y: number;
  iWaferTop_dt: number; iWaferTop_pt: number; iWaferTop_sc: number; iWaferTop_y: number;
  iTableSign_dt: number; iTableSign_pt: number; iTableSign_sc: number; iTableSign_y: number;
  iPlaceCard_dt: number; iPlaceCard_pt: number; iPlaceCard_sc: number; iPlaceCard_y: number;
  iThankYou_dt: number; iThankYou_pt: number;  iThankYou_sc: number; iThankYou_y: number;
  iPartyFavor_dt: number; iPartyFavor_pt: number; iPartyFavor_sc: number; iPartyFavor_y: number;
  iGames_dt: number;    iGames_pt: number;     iGames_sc: number;    iGames_y: number;
  iCoaster_dt: number;    iCoaster_pt: number;     iCoaster_sc: number;    iCoaster_y: number;
}

export const DEFAULTS: QuoteState = {
  hourly: 25, adminPtg: 10, targetProfitPtg: 15, errorMarginPtg: 5,
  packagingCost: 2.5, reuseFactor: 0.25, revisionMin: 30,

  discountDiy: 10, discountSweet: 12, discountSignature: 15,
  discountEventBasics: 0, discountEventFun: 0, discountEventWorks: 0,

  vendorIncentivePtg: 10, fullColorFactor: 1.5, customPaperFactor: 1.3, rushFeePtg: 30, digitalLicensePtg: 30,

  depositAmount: 0,

  //                       dt   pt    sc     y
  iSaveDate_dt: 30,      iSaveDate_pt: 3,   iSaveDate_sc: 0.55,  iSaveDate_y: 6,
  iInvite_dt: 30,        iInvite_pt: 3,     iInvite_sc: 0.55,    iInvite_y: 2,
  iDetail_dt: 30,        iDetail_pt: 3,     iDetail_sc: 0.55,    iDetail_y: 2,
  iRSVP_dt: 30,          iRSVP_pt: 4,       iRSVP_sc: 0.55,      iRSVP_y: 4,
  iEnvelope_dt: 0,       iEnvelope_pt: 0,   iEnvelope_sc: 0.31,  iEnvelope_y: 1,
  iCeremony_dt: 45,      iCeremony_pt: 3,   iCeremony_sc: 0.55,  iCeremony_y: 2,
  iGuestSetting_dt: 30,  iGuestSetting_pt: 4, iGuestSetting_sc: 0.55, iGuestSetting_y: 4,
  iWelcome_dt: 30,       iWelcome_pt: 1,    iWelcome_sc: 22,     iWelcome_y: 1,
  iSeating_dt: 60,       iSeating_pt: 1,    iSeating_sc: 22,     iSeating_y: 1,
  iMenu_dt: 15,          iMenu_pt: 2,       iMenu_sc: 0.55,      iMenu_y: 1,
  iWedgeTop_dt: 30,      iWedgeTop_pt: 4,   iWedgeTop_sc: 0.55,  iWedgeTop_y: 8,
  iWaferTop_dt: 20,      iWaferTop_pt: 3,   iWaferTop_sc: 0.55,  iWaferTop_y: 16,
  iTableSign_dt: 15,     iTableSign_pt: 1,  iTableSign_sc: 0.55, iTableSign_y: 1,
  iPlaceCard_dt: 15,     iPlaceCard_pt: 3,  iPlaceCard_sc: 0.55, iPlaceCard_y: 6,
  iThankYou_dt: 30,      iThankYou_pt: 2,   iThankYou_sc: 0.55,  iThankYou_y: 4,
  iPartyFavor_dt: 15,    iPartyFavor_pt: 4, iPartyFavor_sc: 0.55, iPartyFavor_y: 10,
  iGames_dt: 20,         iGames_pt: 2,      iGames_sc: 0.55,     iGames_y: 4,
  iCoaster_dt: 15,        iCoaster_pt: 0.05,    iCoaster_sc: 54,       iCoaster_y: 100,
};

export interface CatalogItem {
  key: string;
  label: string;
  qty: number;
  fixed?: number;
  notes: string;
}

export const ITEM_CATALOG: CatalogItem[] = [
  { key: "iSaveDate",     label: "Save the date",              qty: 1, notes: "Sent 4-8 months out" },
  { key: "iInvite",       label: "Invite",                     qty: 1, notes: "Core item - anchor of every suite" },
  { key: "iDetail",       label: "Detail card",                qty: 1, notes: "Hotel info, QR codes, directions" },
  { key: "iRSVP",         label: "RSVP",                       qty: 1, notes: "Often bundled with invite" },
  { key: "iEnvelope",     label: "Envelope",                   qty: 2, notes: "Material cost only - no design" },
  { key: "iCeremony",     label: "Ceremony card",              qty: 1, notes: "Program / order of events" },
  { key: "iGuestSetting", label: "Personalized guest setting", qty: 2, notes: "~2 per household - high volume" },
  { key: "iWelcome",      label: "Welcome sign",               qty: 0, fixed: 1, notes: "1 per event - large format" },
  { key: "iSeating",      label: "Seating chart",              qty: 0, fixed: 1, notes: "1 per event - time-intensive" },
  { key: "iMenu",         label: "Menu",                       qty: 2, notes: "~2 per household" },
  { key: "iWedgeTop",     label: "Wedge topper",               qty: 4, notes: "Larger format topper" },
  { key: "iWaferTop",     label: "Wafer topper",               qty: 4, notes: "Smaller round topper" },
  { key: "iTableSign",    label: "Table top signs",            qty: 0, fixed: 8, notes: "~8 tables typical" },
  { key: "iPlaceCard",    label: "Place cards",                qty: 2, notes: "~2 per household - great margin at scale" },
  { key: "iThankYou",     label: "Thank you cards",            qty: 1, notes: "Common reorder after the event" },
  { key: "iPartyFavor",   label: "Party favor tags",           qty: 2, notes: "~2 per household - small format" },
  { key: "iGames",        label: "Games",                      qty: 1, notes: "Activity card per setting" },
  { key: "iCoaster",        label: "Coaster",                  qty: 1, notes: "Personalized coaster" },
];

export type PkgItem = string | { key: string; multiplier?: number; displayLabel?: string };

export interface PackageDef {
  name: string;
  tagline: string;
  description: string;
  items: PkgItem[];
  isDigital: boolean;
  discountKey: keyof QuoteState;
  type: PackageType;
  colorClass: string;
  selectedColorClass: string;
}

const SHARED_PKG_COLORS = {
  colorClass: "border-accent-foreground/20 bg-accent/20",
  selectedColorClass: "border-accent-foreground/60 bg-accent/40 ring-2 ring-accent-foreground/20",
};

export const PACKAGES: Record<PkgKey, PackageDef> = {
  diy: {
    name: "Design Suite",
    tagline: "Print-ready PDFs - design only",
    description: "High-quality PDF files delivered by email. No printing or shipping included.",
    items: ["iSaveDate", "iInvite"],
    isDigital: true,
    discountKey: "discountDiy",
    type: "wedding",
    ...SHARED_PKG_COLORS,
  },
  sweet: {
    name: "Sweet Suite",
    tagline: "Full invite suite - printed & shipped",
    description: "Begin your wedding brand with this complete invitation suite.",
    items: ["iSaveDate", "iInvite", "iDetail", "iRSVP", "iEnvelope"],
    isDigital: false,
    discountKey: "discountSweet",
    type: "wedding",
    ...SHARED_PKG_COLORS,
  },
  signature: {
    name: "Signature Suite",
    tagline: "The full experience - invites + day-of pieces",
    description: "Everything in Sweet Suite plus ceremony cards, personalized guest settings, welcome sign, and seating chart.",
    items: ["iSaveDate", "iInvite", "iDetail", "iRSVP", "iEnvelope", "iCeremony", "iGuestSetting", "iWelcome", "iSeating"],
    isDigital: false,
    discountKey: "discountSignature",
    type: "wedding",
    ...SHARED_PKG_COLORS,
  },
  "event-basics": {
    name: "The Basics",
    tagline: "Invite + thank yous",
    description: "A clean, cohesive foundation for any event - everything you need to set the tone.",
    items: ["iInvite", "iThankYou"],
    isDigital: false,
    discountKey: "discountEventBasics",
    type: "events",
    ...SHARED_PKG_COLORS,
  },
  "event-fun": {
    name: "Add Some Fun",
    tagline: "Invite + menus + signage",
    description: "Extra pieces that keep the party going from start to sweet finish.",
    items: [
      "iInvite",
      "iThankYou",
      { key: "iMenu", displayLabel: "Menus" },
      { key: "iTableSign", displayLabel: "Event sign" },
      { key: "iTableSign", displayLabel: "Dessert sign" },
    ],
    isDigital: false,
    discountKey: "discountEventFun",
    type: "events",
    ...SHARED_PKG_COLORS,
  },
  "event-works": {
    name: "Give Me the Works",
    tagline: "Full event suite - menus, signage, day-of",
    description: "Every detail covered so your guests feel every bit of the celebration.",
    items: [
      "iInvite",
      "iThankYou",
      { key: "iMenu", displayLabel: "Food menu" },
      { key: "iMenu", displayLabel: "Dessert menu" },
      { key: "iMenu", displayLabel: "Bar menu" },
      "iWelcome",
      { key: "iTableSign", displayLabel: "Event sign" },
      { key: "iTableSign", displayLabel: "Dessert sign" },
      { key: "iTableSign", displayLabel: "Signature drink sign" },
    ],
    isDigital: false,
    discountKey: "discountEventWorks",
    type: "events",
    ...SHARED_PKG_COLORS,
  },
};

// --- Time formatting ---

export function fmtTime(totalMin: number): string {
  const m = Math.round(totalMin);
  if (m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h === 0) return `${rm}m`;
  return `${h}h ${rm}m`;
}

export function timeToHM(totalMin: number): { h: number; m: number } {
  const t = Math.max(0, Math.round(totalMin));
  return { h: Math.floor(t / 60), m: t % 60 };
}

export function hmToMin(h: number, m: number): number {
  return Math.max(0, h) * 60 + Math.max(0, m);
}

// --- Helpers ---

function stateVal(s: QuoteState, key: string): number {
  return (s as unknown as Record<string, number>)[key] ?? 0;
}

export function getItemQty(
  itemKey: string,
  packageQty: number,
  catalog: CatalogItem[] = ITEM_CATALOG,
): number {
  const item = catalog.find((i) => i.key === itemKey);
  if (!item) return 0;
  if (item.fixed !== undefined) return item.fixed;
  return item.qty * packageQty;
}

export function getDiscountPtg(pkgKey: PkgKey, s: QuoteState): number {
  return stateVal(s, PACKAGES[pkgKey].discountKey);
}

// Clamp a typed discount percentage into the valid [0, 100] range.
export function clampPtg(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

// --- Result types ---

export interface ItemBreakdown {
  label: string;
  qty: number;
  designMin: number;
  designLabor: number;
  fullDesignLabor: number;
  prodMin: number;
  productionLabor: number;
  sheetCost: number;
  yield: number;
  materialPerUnitBase: number;
  materialPerUnit: number;
  materialsCost: number;
}

// Variable-cost components of one quote line (a bundle or a single item). No
// revision, packaging, markup, or discount — the quote orchestrator
// (computeQuoteBreakdown) layers those on. `isDigital` ⇒ no production/materials.
export interface LineCost {
  isDigital: boolean;
  totalFullDesignLabor: number;
  totalDesignLabor: number;
  reuseDiscount: number;
  totalProductionLabor: number;
  totalMaterials: number;
  totalVariable: number;
  totalFullVariable: number;
  itemBreakdown: ItemBreakdown[];
}

// Quote-level project services, computed once for the whole quote.
export interface QuoteServices {
  revisionCost: number;
  packaging: number;
  licenseVar: number;
  servicesVar: number;
  adminAmount: number;
  profitAmount: number;
  servicesList: number;
}

// --- Calculations ---

function normalizePkgItem(it: PkgItem): { key: string; multiplier: number; displayLabel?: string } {
  return typeof it === "string"
    ? { key: it, multiplier: 1 }
    : { key: it.key, multiplier: it.multiplier ?? 1, displayLabel: it.displayLabel };
}

function sheetMul(s: QuoteState, fullColor?: boolean, customPaper?: boolean): number {
  return (fullColor ? s.fullColorFactor : 1) * (customPaper ? s.customPaperFactor : 1);
}

// Variable cost of a single catalog piece at a given quantity. Pure — no
// revision, packaging, markup, or discount (those are quote-level). Design
// labor is charged once per piece type; production + materials scale with the
// piece count and are zero for digital (design-only) lines.
function costOneItem(
  itemKey: string,
  itemQty: number,
  isDigital: boolean,
  isReuse: boolean,
  s: QuoteState,
  sheetMultiplier: number,
  displayLabel: string | undefined,
  catalog: CatalogItem[],
): ItemBreakdown {
  const designMin = stateVal(s, itemKey + "_dt");
  const prodMin = stateVal(s, itemKey + "_pt");
  const rawSheetCost = stateVal(s, itemKey + "_sc");
  const sheetCost = rawSheetCost * sheetMultiplier;
  const yield_ = Math.max(1, stateVal(s, itemKey + "_y"));
  const catalogItem = catalog.find((i) => i.key === itemKey);

  const fullDesignLabor = (designMin / 60) * s.hourly;
  const designLabor = fullDesignLabor * (isReuse ? s.reuseFactor : 1);

  let productionLabor = 0;
  let materialPerUnitBase = 0;
  let materialPerUnit = 0;
  let materialsCost = 0;
  if (!isDigital) {
    productionLabor = (prodMin / 60) * s.hourly * itemQty;
    materialPerUnitBase = sheetCost / yield_;
    materialPerUnit = materialPerUnitBase * (1 + s.errorMarginPtg / 100);
    materialsCost = materialPerUnit * itemQty;
  }

  return {
    label: displayLabel ?? catalogItem?.label ?? itemKey,
    qty: itemQty,
    designMin,
    designLabor,
    fullDesignLabor,
    prodMin,
    productionLabor,
    sheetCost,
    yield: yield_,
    materialPerUnitBase,
    materialPerUnit,
    materialsCost,
  };
}

function accumulateLine(breakdown: ItemBreakdown[], isDigital: boolean): LineCost {
  let totalFullDesignLabor = 0;
  let totalDesignLabor = 0;
  let totalProductionLabor = 0;
  let totalMaterials = 0;
  for (const b of breakdown) {
    totalFullDesignLabor += b.fullDesignLabor;
    totalDesignLabor += b.designLabor;
    totalProductionLabor += b.productionLabor;
    totalMaterials += b.materialsCost;
  }
  return {
    isDigital,
    totalFullDesignLabor,
    totalDesignLabor,
    reuseDiscount: totalFullDesignLabor - totalDesignLabor,
    totalProductionLabor,
    totalMaterials,
    totalVariable: totalDesignLabor + totalProductionLabor + totalMaterials,
    totalFullVariable: totalFullDesignLabor + totalProductionLabor + totalMaterials,
    itemBreakdown: breakdown,
  };
}

// Variable cost of a predefined bundle: each catalog piece sized by the bundle's
// per-household qty rules, scaled by the line's household count.
export function calcPackageCost(
  pkgKey: PkgKey,
  qty: number,
  mode: PricingMode,
  s: QuoteState,
  fullColor?: boolean,
  customPaper?: boolean,
  catalog: CatalogItem[] = ITEM_CATALOG,
): LineCost {
  const pkg = PACKAGES[pkgKey];
  const isDigital = pkg.isDigital;
  const isReuse = mode === "reuse";
  const mult = sheetMul(s, fullColor, customPaper);
  const breakdown = pkg.items
    .map(normalizePkgItem)
    .map((it) =>
      costOneItem(
        it.key,
        getItemQty(it.key, qty, catalog) * it.multiplier,
        isDigital,
        isReuse,
        s,
        mult,
        it.displayLabel,
        catalog,
      ),
    );
  return accumulateLine(breakdown, isDigital);
}

// Variable cost of a single catalog piece at a raw piece count. `digital` makes
// it design-only (no production/materials).
export function calcItemCost(
  itemKey: string,
  rawQty: number,
  digital: boolean,
  mode: PricingMode,
  s: QuoteState,
  fullColor?: boolean,
  customPaper?: boolean,
  catalog: CatalogItem[] = ITEM_CATALOG,
): LineCost {
  const isReuse = mode === "reuse";
  const mult = sheetMul(s, fullColor, customPaper);
  const breakdown = costOneItem(
    itemKey,
    Math.max(0, Math.round(rawQty)),
    digital,
    isReuse,
    s,
    mult,
    undefined,
    catalog,
  );
  return accumulateLine([breakdown], digital);
}

// Apply admin overhead then target profit to a variable cost. Shared by every
// priced line and by the project-services tier so markup is identical everywhere.
export function markupVariable(
  variable: number,
  s: QuoteState,
): { admin: number; profit: number; list: number } {
  const admin = variable * (s.adminPtg / 100);
  const profit = (variable + admin) * (s.targetProfitPtg / 100);
  return { admin, profit, list: variable + admin + profit };
}

// Quote-level project services, computed once for the whole quote: extra
// revision rounds, a single packaging charge (when any piece is physical), and
// the optional digital-file license (a % of total design labor). The sum is
// marked up like any other cost.
export function calcQuoteServices(
  s: QuoteState,
  opts: {
    extraRevisions: number;
    anyPhysical: boolean;
    digitalLicense: boolean;
    totalDesignLabor: number;
  },
): QuoteServices {
  const revisionCost = ((opts.extraRevisions * s.revisionMin) / 60) * s.hourly;
  const packaging = opts.anyPhysical ? s.packagingCost : 0;
  const licenseVar = opts.digitalLicense ? opts.totalDesignLabor * (s.digitalLicensePtg / 100) : 0;
  const servicesVar = revisionCost + packaging + licenseVar;
  const { admin, profit, list } = markupVariable(servicesVar, s);
  return {
    revisionCost,
    packaging,
    licenseVar,
    servicesVar,
    adminAmount: admin,
    profitAmount: profit,
    servicesList: list,
  };
}

// --- Formatting ---

export function fmt$(n: number, dec = 0): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmt$2(n: number): string {
  return fmt$(n, 2);
}

export function fmtPct(n: number): string {
  return Math.round(n) + "%";
}

// --- Persistence ---

const STORAGE_KEY = "quote-calc-defaults";

export function loadSavedDefaults(): QuoteState {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<QuoteState>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveDefaults(s: QuoteState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSavedDefaults(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportSettings(s: QuoteState): void {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quote-calc-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSettings(file: File): Promise<QuoteState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<QuoteState>;
        resolve({ ...DEFAULTS, ...parsed });
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
