// Pure quote-total computation, shared by the print view and the public client
// portal so both render the *same* numbers from the *same* engine path.
//
// This is the math that used to live inline in PrintQuote's useMemo. Extracted
// verbatim (plus a few intermediate values exposed for the portal's category
// rollup). No IO, no React — importable on the server and the client.

import type { DraftConfig } from "./quote-calc-drafts";
import {
  AddOnResult,
  CatalogItem,
  ITEM_CATALOG,
  PackageResult,
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

export interface MiscLine {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface QuoteBreakdown {
  baseResult: PackageResult;
  addOnLines: AddOnLine[];
  miscLines: MiscLine[];

  // Intermediate buildup (exposed for the portal category rollup).
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

// Compute every figure the print quote and the public portal display, from a
// quote's config + the assumptions snapshot it was priced under. `catalog`
// supplies item labels/qty rules; defaults to the bundled catalog.
export function computeQuoteBreakdown(
  config: DraftConfig,
  assumptions: QuoteState,
  catalog: CatalogItem[] = ITEM_CATALOG,
): QuoteBreakdown {
  const overrideItems = config.pkg === "individual" ? [config.individualItem] : undefined;
  const overrideDigital = config.pkg === "individual" ? config.individualDigital : undefined;

  const baseResult = calcPackage(
    config.pkg,
    config.qty,
    config.mode,
    assumptions,
    config.extraRevisions,
    overrideItems,
    overrideDigital,
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

  const dlFactor = assumptions.digitalLicensePtg / 100;
  const digitalBonus = config.digitalLicense ? baseResult.totalDesignLabor * dlFactor : 0;
  const adjustedVariable = baseResult.totalVariable + digitalBonus;
  const adjustedAdmin = adjustedVariable * (assumptions.adminPtg / 100);
  const adjustedProfit = (adjustedVariable + adjustedAdmin) * (assumptions.targetProfitPtg / 100);
  const adjustedBeforeDiscount = adjustedVariable + adjustedAdmin + adjustedProfit;

  const discountAmount = adjustedBeforeDiscount * (baseResult.discountPtg / 100);
  const vendorAmount = adjustedBeforeDiscount * (baseResult.vendorIncentivePtg / 100);
  const combinedDiscountPtg = baseResult.discountPtg + baseResult.vendorIncentivePtg;
  const basePriceAdjusted = adjustedBeforeDiscount * (1 - combinedDiscountPtg / 100);

  const addOnsTotal = addOnLines.reduce((s, a) => s + a.result.price, 0);
  const miscTotal = miscLines.reduce((s, m) => s + m.total, 0);
  const subtotalBeforeRush = basePriceAdjusted + addOnsTotal;
  const rushAmount = config.rushFee ? subtotalBeforeRush * (assumptions.rushFeePtg / 100) : 0;
  const finalPrice = subtotalBeforeRush + rushAmount + miscTotal;

  return {
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
