// Engine invariant tests for the quote money math. Pure functions, no DOM —
// runnable on plain Node after a standalone tsc compile (see the npm/Docker
// command in CLAUDE.md). Asserts the consistency guarantees the Phase-5 redesign
// was built to enforce.

import { DEFAULTS, ITEM_CATALOG, QuoteState, getItemQty } from "./quote-calc-logic";
import { DraftConfig, QuoteLine, Draft, EMPTY_CLIENT_INFO, normalizeIncomingDraft } from "./quote-calc-drafts";
import { computeQuoteBreakdown } from "./quote-calc-totals";
import { buildPublicQuote } from "./quote-calc-portal";

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  if (cond) {
    console.log("  PASS  " + name);
  } else {
    console.error("  FAIL  " + name);
    failures++;
  }
}
const approx = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

const S: QuoteState = { ...DEFAULTS };
function cfg(partial: Partial<DraftConfig>): DraftConfig {
  return {
    lines: [],
    mode: "fresh",
    miscAddOns: [],
    rushFee: false,
    extraRevisions: 0,
    digitalLicense: false,
    vendorIncentive: false,
    customDiscountPtg: 0,
    familyFriendsPtg: 0,
    fullColor: false,
    customPaper: false,
    ...partial,
  };
}
let idc = 0;
const item = (itemKey: string, qty: number, digital = false): QuoteLine => ({
  id: `i${idc++}`,
  kind: "item",
  itemKey,
  qty,
  digital,
});
const pkg = (p: DraftConfig["lines"][number]["pkg"], qty: number): QuoteLine => ({
  id: `p${idc++}`,
  kind: "package",
  pkg: p,
  qty,
});

// 1. Two identical item lines price identically (the reported bug).
{
  const b = computeQuoteBreakdown(cfg({ lines: [item("iGames", 60), item("iGames", 60)], extraRevisions: 2 }), S);
  check("identical item lines have equal net", approx(b.lines[0].net, b.lines[1].net));
  check("identical item lines have equal list", approx(b.lines[0].list, b.lines[1].list));
  check("item lines carry no bundle discount", b.lines[0].bundleDiscountPtg === 0 && approx(b.lines[0].net, b.lines[0].list));
}

// 2. Revision labor is charged exactly once, regardless of line count.
{
  const expected = ((2 * S.revisionMin) / 60) * S.hourly;
  const one = computeQuoteBreakdown(cfg({ lines: [pkg("sweet", 75)], extraRevisions: 2 }), S);
  const two = computeQuoteBreakdown(cfg({ lines: [pkg("sweet", 75), pkg("signature", 75)], extraRevisions: 2 }), S);
  check("revision cost = single computation", approx(one.services.revisionCost, expected));
  check("revision cost unchanged by adding a line", approx(one.services.revisionCost, two.services.revisionCost));
}

// 3. Packaging is charged once per quote, even with multiple physical packages.
{
  const b = computeQuoteBreakdown(cfg({ lines: [pkg("sweet", 75), pkg("signature", 50)] }), S);
  check("packaging charged once", approx(b.services.packaging, S.packagingCost));
  // A fully-digital quote pays no packaging.
  const dig = computeQuoteBreakdown(cfg({ lines: [item("iInvite", 50, true)] }), S);
  check("digital-only quote pays no packaging", dig.services.packaging === 0);
}

// 4. Digital license is computed once, on total design labor across the quote.
{
  const b = computeQuoteBreakdown(cfg({ lines: [pkg("sweet", 75), item("iGames", 60)], digitalLicense: true }), S);
  check("license = totalDesignLabor × dlPtg, once", approx(b.services.licenseVar, b.totalDesignLabor * (S.digitalLicensePtg / 100)));
}

// 5. The grand closure: subtotalList − savings + rush + (misc is in subtotal) == finalPrice.
{
  const b = computeQuoteBreakdown(
    cfg({
      lines: [pkg("sweet", 80), item("iGames", 120), item("iInvite", 30, true)],
      miscAddOns: [{ id: "m1", label: "Ribbon", qty: 10, unitPrice: 3 }],
      extraRevisions: 2,
      digitalLicense: true,
      rushFee: true,
      vendorIncentive: true,
      familyFriendsPtg: 10,
      customDiscountPtg: 5,
    }),
    S,
  );
  check("subtotalList − savings + rush == finalPrice", approx(b.subtotalList - b.savings + b.rushAmount, b.finalPrice));
  check("savings == bundle + quote discount", approx(b.savings, b.bundleDiscountTotal + b.quoteDiscountAmount));
  check("preDiscount == itemsNet + servicesList", approx(b.preDiscount, b.itemsNet + b.services.servicesList));
  check("itemized quote discount lines sum to total (≤100%)", approx(b.quoteDiscountLines.reduce((s, d) => s + d.amount, 0), b.quoteDiscountAmount));
}

// 6. Public projector closes the same way (client-safe shape never drifts).
{
  const config = cfg({
    lines: [pkg("signature", 90), item("iMenu", 180)],
    extraRevisions: 1,
    rushFee: true,
    familyFriendsPtg: 8,
  });
  const breakdown = computeQuoteBreakdown(config, S);
  const draft: Draft = {
    id: "t1",
    name: "Test",
    createdAt: "",
    updatedAt: "",
    client: { ...EMPTY_CLIENT_INFO },
    config,
    assumptionsSnapshot: S,
    cachedTotal: breakdown.finalPrice,
    schemaVersion: 4,
  };
  const q = buildPublicQuote(draft, breakdown, [], ITEM_CATALOG, 0);
  check("public: subtotal − savings + rush == total", approx(q.subtotal - q.savings + q.rush, q.total));
  check("public total == engine finalPrice", approx(q.total, breakdown.finalPrice));
}

// 7. Bundle discount applies to package lines (and only to them).
{
  const b = computeQuoteBreakdown(cfg({ lines: [pkg("sweet", 75)] }), S);
  check("sweet bundle discount = discountSweet%", approx(b.lines[0].bundleDiscountPtg, S.discountSweet));
  check("sweet net < list when discounted", b.lines[0].net < b.lines[0].list);
}

// 8. A legacy v3 draft migrates cleanly into the unified line model.
{
  const legacyRaw = {
    id: "legacy1",
    name: "Legacy",
    createdAt: "",
    updatedAt: "",
    client: { ...EMPTY_CLIENT_INFO },
    assumptionsSnapshot: S,
    cachedTotal: 0,
    schemaVersion: 3,
    config: {
      // v3 shape: packages[] (incl. an `individual` pseudo-package) + addOns record.
      packages: [
        { id: "a", pkg: "sweet", qty: 75 },
        { id: "b", pkg: "individual", qty: 60, individualItem: "iGames", individualDigital: false },
      ],
      mode: "fresh",
      addOns: { iMenu: 40 },
      miscAddOns: [],
      rushFee: false,
      extraRevisions: 1,
      digitalLicense: false,
      vendorIncentive: false,
      packageDiscountPtg: 7, // renamed → customDiscountPtg
      familyFriendsPtg: 0,
      fullColor: false,
      customPaper: false,
    },
  };
  const migrated = normalizeIncomingDraft(legacyRaw);
  const c = migrated?.config;
  check("migration produced a draft", !!c);
  check("migration: 3 lines (sweet pkg + games item + menu add-on item)", !!c && c.lines.length === 3);
  check("migration: sweet stays a package line", !!c && c.lines[0].kind === "package" && c.lines[0].pkg === "sweet");
  check("migration: individual → item line", !!c && c.lines[1].kind === "item" && c.lines[1].itemKey === "iGames");
  check("migration: individual qty preserved via getItemQty", !!c && c.lines[1].qty === getItemQty("iGames", 60));
  check("migration: add-on → item line (raw qty)", !!c && c.lines[2].kind === "item" && c.lines[2].itemKey === "iMenu" && c.lines[2].qty === 40);
  check("migration: packageDiscountPtg → customDiscountPtg", !!c && c.customDiscountPtg === 7);
  check("migration: no addOns field remains", !!c && !("addOns" in c));
  check("migrated draft re-prices without error", !!c && computeQuoteBreakdown(c, S).finalPrice > 0);
}

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) FAILED`);
  process.exit(1);
} else {
  console.log("All engine invariants passed.");
}
