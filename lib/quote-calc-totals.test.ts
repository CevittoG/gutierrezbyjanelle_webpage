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
  check("savings == discountTotal", approx(b.savings, b.discountTotal));
  check("discountTotal == itemsList − itemsNet", approx(b.discountTotal, b.itemsList - b.itemsNet));
  check("savings == bundle + relationship totals", approx(b.savings, b.bundleDiscountTotal + b.relationshipDiscountLines.reduce((s, d) => s + d.amount, 0)));
  check("rush is on items + services (not misc, not pre-discount)", approx(b.rushAmount, (b.itemsNet + b.services.servicesList) * (S.rushFeePtg / 100)));
}

// 5b. Discounts bite LABOR only, additively — never materials, admin, or services.
{
  const base = cfg({ lines: [pkg("signature", 90), item("iMenu", 120)], extraRevisions: 2, digitalLicense: true });
  const plain = computeQuoteBreakdown(base, S);
  const disc = computeQuoteBreakdown({ ...base, vendorIncentive: true, familyFriendsPtg: 10 }, S);

  // Project services are identical with and without the relationship discount.
  check("services untouched by discounts", approx(plain.services.servicesList, disc.services.servicesList));
  // Each line's list price (materials + admin + profit + labor) is untouched; only net moves.
  check("line list prices untouched by discounts", disc.lines.every((l, i) => approx(l.list, plain.lines[i].list)));
  // A line's discount equals its marked-up labor × the additive, clamped %.
  const sig = disc.lines[0];
  const expectedPtg = S.discountSignature + S.vendorIncentivePtg + 10; // bundle + vendor + family
  check("line discount % is additive (no compounding)", approx(sig.discountPtg, Math.min(100, expectedPtg)));
  check("line discount = laborList × combined %", approx(sig.discountAmount, sig.laborList * (sig.discountPtg / 100)));
  check("discount never exceeds labor value", disc.lines.every((l) => l.discountAmount <= l.laborList + 1e-9));
  // The item line (no bundle) is discounted only by the relationship %s.
  const menu = disc.lines[1];
  check("item line carries no bundle discount", menu.bundleDiscountPtg === 0);
  check("item line discount % = vendor + family", approx(menu.discountPtg, S.vendorIncentivePtg + 10));
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

// 7. Bundle discount applies to package lines (and only to them), off labor.
{
  const b = computeQuoteBreakdown(cfg({ lines: [pkg("sweet", 75)] }), S);
  const l = b.lines[0];
  check("sweet bundle discount = discountSweet%", approx(l.bundleDiscountPtg, S.discountSweet));
  check("sweet net < list when discounted", l.net < l.list);
  check("bundle discount = laborList × discountSweet%", approx(l.bundleDiscountAmount, l.laborList * (S.discountSweet / 100)));
  check("net = list − bundle discount (no other discount)", approx(l.net, l.list - l.bundleDiscountAmount));
  // The discount comes off labor, so it's strictly smaller than a list-based one.
  check("labor-only discount < list-based discount", l.bundleDiscountAmount < l.list * (S.discountSweet / 100));
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
