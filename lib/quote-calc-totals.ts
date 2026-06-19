// Pure quote-total computation, shared by the print view and the public client
// portal so both render the *same* numbers from the *same* engine path.
//
// This is the math that used to live inline in PrintQuote's useMemo. Extracted
// verbatim (plus a few intermediate values exposed for the portal's category
// rollup). No IO, no React — importable on the server and the client.

import type { DraftConfig, PackageLine } from "./quote-calc-drafts";
import {
  AddOnResult,
  CatalogItem,
  ITEM_CATALOG,
  PackageResult,
  PkgKey,
  QuoteState,
  calcAddOnRaw,
  calcPackage,
} from "./quote-calc-logic";

export interface AddOnLine {
  key: string;
  label: string;
  qty: number;
  result: AddOnResult;
}

// One priced package line: the raw `calcPackage` result plus the per-line
// admin/profit/discount buildup. Line prices are summed into the quote total.
export interface PackageLineResult {
  id: string;
  pkg: PkgKey;
  qty: number;
  individualItem?: string;
  individualDigital?: boolean;
  result: PackageResult;
  digitalBonus: number;
  adjustedVariable: number;
  adjustedAdmin: number;
  adjustedProfit: number;
  adjustedBeforeDiscount: number;
  discountAmount: number;
  vendorAmount: number;
  linePrice: number;
}

export interface MiscLine {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface QuoteBreakdown {
  packageLines: PackageLineResult[];
  // Back-compat alias = packageLines[0].result (the first/primary line).
  baseResult: PackageResult;
  addOnLines: AddOnLine[];
  miscLines: MiscLine[];

  // Intermediate buildup, summed across all package lines (exposed for the
  // portal category rollup).
  digitalBonus: number;
  adjustedVariable: number;
  adjustedAdmin: number;
  adjustedProfit: number;
  adjustedBeforeDiscount: number;
  discountAmount: number;
  vendorAmount: number;

  basePriceAdjusted: number;
  addOnsTotal: number;
  miscTotal: number;
  subtotalBeforeRush: number;
  rushAmount: number;
  finalPrice: number;
}

// Price one package line: calcPackage (variable cost, with its own discount key)
// then the digital-license / admin / profit buildup. `extraRevisions` is passed
// only to the first line by the caller so the quote is billed revisions once.
function computePackageLine(
  line: PackageLine,
  config: DraftConfig,
  assumptions: QuoteState,
  catalog: CatalogItem[],
  extraRevisions: number,
): PackageLineResult {
  const overrideItems = line.pkg === "individual" ? [line.individualItem ?? "iInvite"] : undefined;
  const overrideDigital = line.pkg === "individual" ? (line.individualDigital ?? false) : undefined;

  const result = calcPackage(
    line.pkg,
    line.qty,
    config.mode,
    assumptions,
    extraRevisions,
    overrideItems,
    overrideDigital,
    config.fullColor,
    config.customPaper,
    config.vendorIncentive,
    catalog,
  );

  const dlFactor = assumptions.digitalLicensePtg / 100;
  const digitalBonus = config.digitalLicense ? result.totalDesignLabor * dlFactor : 0;
  const adjustedVariable = result.totalVariable + digitalBonus;
  const adjustedAdmin = adjustedVariable * (assumptions.adminPtg / 100);
  const adjustedProfit = (adjustedVariable + adjustedAdmin) * (assumptions.targetProfitPtg / 100);
  const adjustedBeforeDiscount = adjustedVariable + adjustedAdmin + adjustedProfit;
  const discountAmount = adjustedBeforeDiscount * (result.discountPtg / 100);
  const vendorAmount = adjustedBeforeDiscount * (result.vendorIncentivePtg / 100);
  const combinedDiscountPtg = result.discountPtg + result.vendorIncentivePtg;
  const linePrice = adjustedBeforeDiscount * (1 - combinedDiscountPtg / 100);

  return {
    id: line.id,
    pkg: line.pkg,
    qty: line.qty,
    individualItem: line.individualItem,
    individualDigital: line.individualDigital,
    result,
    digitalBonus,
    adjustedVariable,
    adjustedAdmin,
    adjustedProfit,
    adjustedBeforeDiscount,
    discountAmount,
    vendorAmount,
    linePrice,
  };
}

// Compute every figure the print quote and the public portal display, from a
// quote's config + the assumptions snapshot it was priced under. `catalog`
// supplies item labels/qty rules; defaults to the bundled catalog.
export function computeQuoteBreakdown(
  config: DraftConfig,
  assumptions: QuoteState,
  catalog: CatalogItem[] = ITEM_CATALOG,
): QuoteBreakdown {
  // Price each line independently (each with its own package discount), billing
  // extra revisions once — on the first line only — so a single-package quote
  // prices identically to before.
  const packageLines: PackageLineResult[] = config.packages.map((line, i) =>
    computePackageLine(line, config, assumptions, catalog, i === 0 ? config.extraRevisions : 0),
  );

  const sumLines = (sel: (l: PackageLineResult) => number): number =>
    packageLines.reduce((s, l) => s + sel(l), 0);

  // Defensive fallback for the degenerate "no packages" state — the UI keeps at
  // least one line, so this only guards against malformed data.
  const baseResult =
    packageLines[0]?.result ??
    calcPackage(
      config.packages[0]?.pkg ?? "sweet",
      0,
      config.mode,
      assumptions,
      0,
      undefined,
      undefined,
      config.fullColor,
      config.customPaper,
      config.vendorIncentive,
      catalog,
    );

  const addOnLines: AddOnLine[] = Object.entries(config.addOns)
    .filter(([, q]) => q > 0)
    .map(([key, q]) => {
      const cat = catalog.find((i) => i.key === key);
      return {
        key,
        label: cat?.label ?? key,
        qty: q,
        result: calcAddOnRaw(key, q, config.mode, assumptions, config.fullColor, config.customPaper),
      };
    });

  const miscLines: MiscLine[] = (config.miscAddOns ?? [])
    .filter((m) => m.qty > 0 && m.unitPrice > 0 && (m.label ?? "").trim().length > 0)
    .map((m) => ({
      id: m.id,
      label: m.label.trim(),
      qty: m.qty,
      unitPrice: m.unitPrice,
      total: m.qty * m.unitPrice,
    }));

  const digitalBonus = sumLines((l) => l.digitalBonus);
  const adjustedVariable = sumLines((l) => l.adjustedVariable);
  const adjustedAdmin = sumLines((l) => l.adjustedAdmin);
  const adjustedProfit = sumLines((l) => l.adjustedProfit);
  const adjustedBeforeDiscount = sumLines((l) => l.adjustedBeforeDiscount);

  const discountAmount = sumLines((l) => l.discountAmount);
  const vendorAmount = sumLines((l) => l.vendorAmount);
  const basePriceAdjusted = sumLines((l) => l.linePrice);

  const addOnsTotal = addOnLines.reduce((s, a) => s + a.result.price, 0);
  const miscTotal = miscLines.reduce((s, m) => s + m.total, 0);
  const subtotalBeforeRush = basePriceAdjusted + addOnsTotal;
  const rushAmount = config.rushFee ? subtotalBeforeRush * (assumptions.rushFeePtg / 100) : 0;
  const finalPrice = subtotalBeforeRush + rushAmount + miscTotal;

  return {
    packageLines,
    baseResult,
    addOnLines,
    miscLines,
    digitalBonus,
    adjustedVariable,
    adjustedAdmin,
    adjustedProfit,
    adjustedBeforeDiscount,
    discountAmount,
    vendorAmount,
    basePriceAdjusted,
    addOnsTotal,
    miscTotal,
    subtotalBeforeRush,
    rushAmount,
    finalPrice,
  };
}
