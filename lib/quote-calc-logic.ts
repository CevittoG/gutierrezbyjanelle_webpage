export type PkgKey = "individual" | "diy" | "sweet" | "deluxe";
export type PricingMode = "fresh" | "reuse";

export interface QuoteState {
  // Material & production
  paper: number;
  env: number;
  pkg: number;
  hourly: number;
  // Markup levers
  shipBase: number;
  printProfit: number;
  shipProfit: number;
  // Design fees
  feeC: number;
  feeR: number;
  feeT: number;
  // Item-level [_d = design fee, _r = reuse price, _p = print cost/unit]
  iSaveDate_d: number; iSaveDate_r: number; iSaveDate_p: number;
  iInvite_d: number;   iInvite_r: number;   iInvite_p: number;
  iDetail_d: number;   iDetail_r: number;   iDetail_p: number;
  iRSVP_d: number;     iRSVP_r: number;     iRSVP_p: number;
  iEnvelope_d: number; iEnvelope_r: number; iEnvelope_p: number;
  iCeremony_d: number; iCeremony_r: number; iCeremony_p: number;
  iGuestSetting_d: number; iGuestSetting_r: number; iGuestSetting_p: number;
  iWelcome_d: number;  iWelcome_r: number;  iWelcome_p: number;
  iSeating_d: number;  iSeating_r: number;  iSeating_p: number;
  iMenu_d: number;     iMenu_r: number;     iMenu_p: number;
  iDrinkTop_d: number; iDrinkTop_r: number; iDrinkTop_p: number;
  iTableSign_d: number; iTableSign_r: number; iTableSign_p: number;
  iPlaceCard_d: number; iPlaceCard_r: number; iPlaceCard_p: number;
  iThankYou_d: number; iThankYou_r: number; iThankYou_p: number;
  iPartyFavor_d: number; iPartyFavor_r: number; iPartyFavor_p: number;
  // Hours per package
  hDIY: number; hSweet: number; hDeluxe: number;
  // Target
  target: number;
}

export const DEFAULTS: QuoteState = {
  paper: 0.15, env: 0.25, pkg: 5, hourly: 60,
  shipBase: 12, printProfit: 100, shipProfit: 25,
  feeC: 250, feeR: 55, feeT: 75,
  iSaveDate_d: 120, iSaveDate_r: 18,  iSaveDate_p: 0.55,
  iInvite_d: 150,   iInvite_r: 22,    iInvite_p: 0.75,
  iDetail_d: 60,    iDetail_r: 10,    iDetail_p: 0.45,
  iRSVP_d: 80,      iRSVP_r: 12,      iRSVP_p: 0.55,
  iEnvelope_d: 0,   iEnvelope_r: 0,   iEnvelope_p: 0.30,
  iCeremony_d: 80,  iCeremony_r: 12,  iCeremony_p: 0.55,
  iGuestSetting_d: 100, iGuestSetting_r: 8, iGuestSetting_p: 0.65,
  iWelcome_d: 180,  iWelcome_r: 65,   iWelcome_p: 35,
  iSeating_d: 200,  iSeating_r: 90,   iSeating_p: 55,
  iMenu_d: 90,      iMenu_r: 12,      iMenu_p: 0.60,
  iDrinkTop_d: 50,  iDrinkTop_r: 1.5, iDrinkTop_p: 0.35,
  iTableSign_d: 70, iTableSign_r: 18, iTableSign_p: 4,
  iPlaceCard_d: 50, iPlaceCard_r: 1.5,iPlaceCard_p: 0.40,
  iThankYou_d: 90,  iThankYou_r: 3,   iThankYou_p: 0.55,
  iPartyFavor_d: 60,iPartyFavor_r: 2, iPartyFavor_p: 0.40,
  hDIY: 4, hSweet: 8, hDeluxe: 14,
  target: 50,
};

export interface CatalogItem {
  key: string;
  label: string;
  qty: number;
  fixed?: number;
  notes: string;
}

export const ITEM_CATALOG: CatalogItem[] = [
  { key: "iSaveDate",     label: "Save the date",              qty: 1, notes: "Sent 4–8 months out" },
  { key: "iInvite",       label: "Invite",                     qty: 1, notes: "Core item · anchor of every suite" },
  { key: "iDetail",       label: "Detail card",                qty: 1, notes: "Hotel info, QR codes, directions" },
  { key: "iRSVP",         label: "RSVP",                       qty: 1, notes: "Often bundled with invite" },
  { key: "iEnvelope",     label: "Envelope",                   qty: 2, notes: "Material cost only · no design fee" },
  { key: "iCeremony",     label: "Ceremony card",              qty: 1, notes: "Program / order of events" },
  { key: "iGuestSetting", label: "Personalized guest setting", qty: 2, notes: "~2 per household · high volume" },
  { key: "iWelcome",      label: "Welcome sign",               qty: 0, fixed: 1, notes: "1 per event · large format" },
  { key: "iSeating",      label: "Seating chart",              qty: 0, fixed: 1, notes: "1 per event · time-intensive" },
  { key: "iMenu",         label: "Menu",                       qty: 2, notes: "~2 per household" },
  { key: "iDrinkTop",     label: "Drink toppers",              qty: 4, notes: "~4 per household · easy upsell" },
  { key: "iTableSign",    label: "Table top signs",            qty: 0, fixed: 8, notes: "~8 tables typical" },
  { key: "iPlaceCard",    label: "Place cards",                qty: 2, notes: "~2 per household · great margin at scale" },
  { key: "iThankYou",     label: "Thank you cards",            qty: 1, notes: "Common reorder after the event" },
  { key: "iPartyFavor",   label: "Party favor tags",           qty: 2, notes: "~2 per household · small format" },
];

export const ADD_ON_KEYS = [
  "iMenu", "iDrinkTop", "iTableSign", "iPlaceCard", "iThankYou", "iPartyFavor",
];

export interface PackageDef {
  name: string;
  tagline: string;
  description: string;
  items: string[];
  hasShipping: boolean;
  hasPrinting: boolean;
  hasDesignFee: boolean;
  hours: number | string;
  colorClass: string;
  selectedColorClass: string;
}

export const PACKAGES: Record<PkgKey, PackageDef> = {
  individual: {
    name: "Individual Item",
    tagline: "One item type à la carte",
    description: "Sample shown as a single Invite. Use this template for any standalone line item on a quote.",
    items: ["iInvite"],
    hasShipping: true, hasPrinting: true, hasDesignFee: true,
    hours: 2,
    colorClass: "border-primary/40 bg-primary/5",
    selectedColorClass: "border-primary bg-primary/10 ring-2 ring-primary/30",
  },
  diy: {
    name: "DIY Digital",
    tagline: "Print-ready PDFs — no printing or shipping",
    description: "High-quality PDF files delivered by email. Great for budget-conscious clients who want to self-print.",
    items: ["iSaveDate", "iInvite"],
    hasShipping: false, hasPrinting: false, hasDesignFee: true,
    hours: "hDIY",
    colorClass: "border-ring/30 bg-ring/5",
    selectedColorClass: "border-ring bg-ring/10 ring-2 ring-ring/30",
  },
  sweet: {
    name: "Sweet Suite",
    tagline: "Full invite suite · printed & shipped",
    description: "All the core invite pieces, professionally printed at home and shipped anywhere in the US.",
    items: ["iSaveDate", "iInvite", "iDetail", "iRSVP", "iEnvelope"],
    hasShipping: true, hasPrinting: true, hasDesignFee: true,
    hours: "hSweet",
    colorClass: "border-accent-foreground/20 bg-accent/20",
    selectedColorClass: "border-accent-foreground/60 bg-accent/40 ring-2 ring-accent-foreground/20",
  },
  deluxe: {
    name: "Deluxe Suite",
    tagline: "The full experience — invites + day-of pieces",
    description: "Everything in Sweet Suite plus ceremony cards, personalized guest settings, welcome sign, and seating chart.",
    items: ["iSaveDate", "iInvite", "iDetail", "iRSVP", "iEnvelope", "iCeremony", "iGuestSetting", "iWelcome", "iSeating"],
    hasShipping: true, hasPrinting: true, hasDesignFee: true,
    hours: "hDeluxe",
    colorClass: "border-muted-foreground/30 bg-muted/50",
    selectedColorClass: "border-muted-foreground bg-muted ring-2 ring-muted-foreground/30",
  },
};

export interface PrintLineItem {
  label: string;
  qty: number;
  costPer: number;
  markup: number;
  revenue: number;
}

export interface FeeLineItem {
  label: string;
  amount: number;
}

export interface PackageResult {
  price: number;
  printCost: number;
  printRevenue: number;
  shipCost: number;
  shipRevenue: number;
  itemFees: number;
  cogs: number;
  grossProfit: number;
  laborCost: number;
  netProfit: number;
  netMargin: number;
  hours: number;
  pkgMaterials: number;
  printLines: PrintLineItem[];
  feeLines: FeeLineItem[];
}

export interface AddOnResult {
  qty: number;
  costPer: number;
  markup: number;
  printRevenue: number;
  printCost: number;
  itemFee: number;
  price: number;
}

function stateVal(s: QuoteState, key: string): number {
  return (s as Record<string, number>)[key] ?? 0;
}

export function getItemQty(itemKey: string, packageQty: number): number {
  const item = ITEM_CATALOG.find((i) => i.key === itemKey);
  if (!item) return 0;
  if (item.fixed !== undefined) return item.fixed;
  return item.qty * packageQty;
}

export function calcPackage(
  pkgKey: PkgKey,
  qty: number,
  mode: PricingMode,
  s: QuoteState
): PackageResult {
  const pkg = PACKAGES[pkgKey];
  const isFresh = mode === "fresh";
  const printMarkup = 1 + s.printProfit / 100;
  const shipMarkup = 1 + s.shipProfit / 100;

  let printCost = 0;
  let printRevenue = 0;
  let itemFees = 0;
  const printLines: PrintLineItem[] = [];
  const feeLines: FeeLineItem[] = [];

  for (const itemKey of pkg.items) {
    const itemQty = getItemQty(itemKey, qty);
    const printCostPer = stateVal(s, itemKey + "_p");
    const designFee = stateVal(s, itemKey + "_d");
    const reusePrice = stateVal(s, itemKey + "_r");
    const catalogItem = ITEM_CATALOG.find((i) => i.key === itemKey)!;

    if (pkg.hasPrinting && printCostPer > 0) {
      const lineRevenue = itemQty * printCostPer * printMarkup;
      printCost += itemQty * printCostPer;
      printRevenue += lineRevenue;
      printLines.push({ label: catalogItem.label, qty: itemQty, costPer: printCostPer, markup: printMarkup, revenue: lineRevenue });
    }

    if (itemKey === "iEnvelope") continue;

    if (isFresh && designFee > 0) {
      itemFees += designFee;
      feeLines.push({ label: catalogItem.label, amount: designFee });
    } else if (!isFresh && reusePrice > 0) {
      itemFees += reusePrice;
      feeLines.push({ label: catalogItem.label, amount: reusePrice });
    }
  }

  let shipCost = 0;
  let shipRevenue = 0;
  if (pkg.hasShipping) {
    shipCost = s.shipBase;
    shipRevenue = s.shipBase * shipMarkup;
  }

  let hours: number;
  if (typeof pkg.hours === "string") {
    hours = stateVal(s, pkg.hours);
  } else {
    hours = pkg.hours;
  }
  if (!isFresh) hours = Math.max(1, hours * 0.4);
  const laborCost = s.hourly * hours;

  const price = pkgKey === "diy" ? laborCost + itemFees : printRevenue + shipRevenue + itemFees;
  const pkgMaterials = pkg.hasShipping ? s.pkg : 0;
  const cogs = printCost + shipCost + pkgMaterials;
  const grossProfit = price - cogs;
  const netProfit = grossProfit - laborCost;
  const netMargin = price > 0 ? (netProfit / price) * 100 : 0;

  return {
    price, printCost, printRevenue, shipCost, shipRevenue, itemFees,
    cogs, grossProfit, laborCost, netProfit, netMargin, hours, pkgMaterials,
    printLines, feeLines,
  };
}

export function calcAddOn(
  itemKey: string,
  qty: number,
  mode: PricingMode,
  s: QuoteState
): AddOnResult {
  const itemQty = getItemQty(itemKey, qty);
  const printCostPer = stateVal(s, itemKey + "_p");
  const designFee = stateVal(s, itemKey + "_d");
  const reusePrice = stateVal(s, itemKey + "_r");
  const printMarkup = 1 + s.printProfit / 100;
  const printCost = itemQty * printCostPer;
  const printRevenue = printCost * printMarkup;
  const itemFee = mode === "fresh" ? designFee : reusePrice;
  return { qty: itemQty, costPer: printCostPer, markup: printMarkup, printRevenue, printCost, itemFee, price: printRevenue + itemFee };
}

export function fmt$(n: number, dec = 0): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmt$2(n: number): string {
  return fmt$(n, 2);
}

export function fmtPct(n: number): string {
  return Math.round(n) + "%";
}
