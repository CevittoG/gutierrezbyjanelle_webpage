export type PkgKey =
  | "individual"
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

  discountIndividual: number;
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
}

export const DEFAULTS: QuoteState = {
  hourly: 25, adminPtg: 10, targetProfitPtg: 15, errorMarginPtg: 5,
  packagingCost: 2.5, reuseFactor: 0.25, revisionMin: 30,

  discountIndividual: 0, discountDiy: 10, discountSweet: 12, discountSignature: 15,
  discountEventBasics: 0, discountEventFun: 0, discountEventWorks: 0,

  vendorIncentivePtg: 10, fullColorFactor: 1.5, customPaperFactor: 1.3, rushFeePtg: 30, digitalLicensePtg: 30,

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
];

export const ADD_ON_KEYS = [
  "iMenu", "iWedgeTop", "iWaferTop", "iTableSign", "iPlaceCard", "iThankYou", "iPartyFavor", "iGames",
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
  individual: {
    name: "Individual Item",
    tagline: "One item type a la carte",
    description: "Any single stationery piece. Can be sold as digital (design only) or physical (printed + shipped).",
    items: ["iInvite"],
    isDigital: false,
    discountKey: "discountIndividual",
    type: "wedding",
    ...SHARED_PKG_COLORS,
  },
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

export function getItemQty(itemKey: string, packageQty: number): number {
  const item = ITEM_CATALOG.find((i) => i.key === itemKey);
  if (!item) return 0;
  if (item.fixed !== undefined) return item.fixed;
  return item.qty * packageQty;
}

export function getDiscountPtg(pkgKey: PkgKey, s: QuoteState): number {
  return stateVal(s, PACKAGES[pkgKey].discountKey);
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

export interface PackageResult {
  finalPrice: number;

  totalFullDesignLabor: number;
  totalDesignLabor: number;
  reuseDiscount: number;
  totalProductionLabor: number;
  totalMaterials: number;
  packaging: number;
  revisionLabor: number;
  totalVariable: number;
  totalFullVariable: number;

  adminAmount: number;
  profitAmount: number;
  priceBeforeDiscount: number;
  discountPtg: number;
  discountAmount: number;
  vendorIncentivePtg: number;
  vendorIncentiveAmount: number;

  totalDirectCosts: number;
  totalLaborCost: number;
  netProfit: number;
  effectiveMargin: number;

  itemBreakdown: ItemBreakdown[];
  isDigital: boolean;
}

export interface AddOnResult {
  qty: number;
  designMin: number;
  designLabor: number;
  prodMin: number;
  productionLabor: number;
  materialPerUnit: number;
  materialsCost: number;
  itemVariable: number;
  adminAmount: number;
  profitAmount: number;
  price: number;
}

// --- Calculations ---

function normalizePkgItem(it: PkgItem): { key: string; multiplier: number; displayLabel?: string } {
  return typeof it === "string"
    ? { key: it, multiplier: 1 }
    : { key: it.key, multiplier: it.multiplier ?? 1, displayLabel: it.displayLabel };
}

export function calcPackage(
  pkgKey: PkgKey,
  qty: number,
  mode: PricingMode,
  s: QuoteState,
  extraRevisions: number,
  overrideItems?: PkgItem[],
  overrideDigital?: boolean,
  fullColor?: boolean,
  customPaper?: boolean,
  vendorIncentive?: boolean,
): PackageResult {
  const pkg = PACKAGES[pkgKey];
  const items = (overrideItems ?? pkg.items).map(normalizePkgItem);
  const isDigital = overrideDigital ?? pkg.isDigital;
  const isReuse = mode === "reuse";

  let totalDesignLabor = 0;
  let totalFullDesignLabor = 0;
  let totalProductionLabor = 0;
  let totalMaterials = 0;
  const itemBreakdown: ItemBreakdown[] = [];

  const sheetMultiplier = (fullColor ? s.fullColorFactor : 1) * (customPaper ? s.customPaperFactor : 1);

  for (const norm of items) {
    const itemKey = norm.key;
    const itemQty = getItemQty(itemKey, qty) * norm.multiplier;
    const designMin = stateVal(s, itemKey + "_dt");
    const prodMin = stateVal(s, itemKey + "_pt");
    const rawSheetCost = stateVal(s, itemKey + "_sc");
    const sheetCost = rawSheetCost * sheetMultiplier;
    const yield_ = Math.max(1, stateVal(s, itemKey + "_y"));
    const catalogItem = ITEM_CATALOG.find((i) => i.key === itemKey)!;

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

    totalFullDesignLabor += fullDesignLabor;
    totalDesignLabor += designLabor;
    totalProductionLabor += productionLabor;
    totalMaterials += materialsCost;

    itemBreakdown.push({
      label: norm.displayLabel ?? catalogItem.label,
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
    });
  }

  const revisionLabor = (extraRevisions * s.revisionMin / 60) * s.hourly;
  const packaging = isDigital ? 0 : s.packagingCost;
  const reuseDiscount = totalFullDesignLabor - totalDesignLabor;

  const totalVariable = totalDesignLabor + totalProductionLabor + totalMaterials + revisionLabor + packaging;
  const totalFullVariable = totalFullDesignLabor + totalProductionLabor + totalMaterials + revisionLabor + packaging;
  const adminAmount = totalVariable * (s.adminPtg / 100);
  const priceAfterAdmin = totalVariable + adminAmount;
  const profitAmount = priceAfterAdmin * (s.targetProfitPtg / 100);
  const priceBeforeDiscount = priceAfterAdmin + profitAmount;

  const discountPtg = getDiscountPtg(pkgKey, s);
  const vendorIncentivePtg = vendorIncentive ? s.vendorIncentivePtg : 0;
  const combinedDiscountPtg = discountPtg + vendorIncentivePtg;
  const discountAmount = priceBeforeDiscount * (discountPtg / 100);
  const vendorIncentiveAmount = priceBeforeDiscount * (vendorIncentivePtg / 100);
  const finalPrice = priceBeforeDiscount * (1 - combinedDiscountPtg / 100);

  const totalDirectCosts = totalMaterials + packaging;
  const totalLaborCost = totalDesignLabor + totalProductionLabor + revisionLabor;
  const netProfit = finalPrice - totalDirectCosts - totalLaborCost;
  const effectiveMargin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;

  return {
    finalPrice, totalFullDesignLabor, totalDesignLabor, reuseDiscount,
    totalProductionLabor, totalMaterials, packaging, revisionLabor,
    totalVariable, totalFullVariable, adminAmount, profitAmount,
    priceBeforeDiscount, discountPtg, discountAmount,
    vendorIncentivePtg, vendorIncentiveAmount,
    totalDirectCosts, totalLaborCost, netProfit, effectiveMargin,
    itemBreakdown, isDigital,
  };
}

export function calcAddOn(
  itemKey: string,
  qty: number,
  mode: PricingMode,
  s: QuoteState,
  fullColor?: boolean,
  customPaper?: boolean,
): AddOnResult {
  return calcAddOnInternal(itemKey, getItemQty(itemKey, qty), mode, s, fullColor, customPaper);
}

// Add-on calc using an explicit piece count entered by the user (no household multiplier).
export function calcAddOnRaw(
  itemKey: string,
  pieceCount: number,
  mode: PricingMode,
  s: QuoteState,
  fullColor?: boolean,
  customPaper?: boolean,
): AddOnResult {
  return calcAddOnInternal(itemKey, Math.max(0, Math.round(pieceCount)), mode, s, fullColor, customPaper);
}

function calcAddOnInternal(
  itemKey: string,
  itemQty: number,
  mode: PricingMode,
  s: QuoteState,
  fullColor?: boolean,
  customPaper?: boolean,
): AddOnResult {
  const designMin = stateVal(s, itemKey + "_dt");
  const prodMin = stateVal(s, itemKey + "_pt");
  const rawSheetCost = stateVal(s, itemKey + "_sc");
  const sheetMultiplier = (fullColor ? s.fullColorFactor : 1) * (customPaper ? s.customPaperFactor : 1);
  const sheetCost = rawSheetCost * sheetMultiplier;
  const yield_ = Math.max(1, stateVal(s, itemKey + "_y"));
  const isReuse = mode === "reuse";

  const designLabor = (designMin / 60) * s.hourly * (isReuse ? s.reuseFactor : 1);
  const productionLabor = (prodMin / 60) * s.hourly * itemQty;
  const materialPerUnit = (sheetCost / yield_) * (1 + s.errorMarginPtg / 100);
  const materialsCost = materialPerUnit * itemQty;

  const itemVariable = designLabor + productionLabor + materialsCost;
  const adminAmount = itemVariable * (s.adminPtg / 100);
  const profitAmount = (itemVariable + adminAmount) * (s.targetProfitPtg / 100);
  const price = itemVariable + adminAmount + profitAmount;

  return {
    qty: itemQty, designMin, designLabor, prodMin, productionLabor,
    materialPerUnit, materialsCost, itemVariable, adminAmount, profitAmount, price,
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
