// Engine invariant tests for the quote money math. Pure functions, no DOM —
// runnable on plain Node after a standalone tsc compile (see the npm/Docker
// command in CLAUDE.md). Asserts the consistency guarantees the Phase-5 redesign
// was built to enforce.

import { DEFAULTS, ITEM_CATALOG, QuoteState, getItemQty } from "./quote-calc-logic";
import { DraftConfig, QuoteLine, Draft, EMPTY_CLIENT_INFO, normalizeIncomingDraft } from "./quote-calc-drafts";
import { CUSTOM_ITEM_FALLBACK_LABEL, computeQuoteBreakdown } from "./quote-calc-totals";
import { buildPublicQuote, isDigitalQuote } from "./quote-calc-portal";

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
// `cfg` leaves pricingVersion unset (⇒ v1, the rules every pre-existing quote
// was saved under); `cfg2` builds a quote under the current v2 rules.
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
const cfg2 = (partial: Partial<DraftConfig>): DraftConfig => cfg({ pricingVersion: 2, ...partial });
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
  check("line discount = raw labor × combined %", approx(sig.discountAmount, sig.laborBase * (sig.discountPtg / 100)));
  check("discount never exceeds raw labor cost", disc.lines.every((l) => l.discountAmount <= l.laborBase + 1e-9));
  // The base is raw labor — admin/profit on labor is NOT given away.
  check("discount base excludes markup on labor", disc.lines.every((l) => l.laborBase < l.list));
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
  check("bundle discount = raw labor × discountSweet%", approx(l.bundleDiscountAmount, l.laborBase * (S.discountSweet / 100)));
  check("net = list − bundle discount (no other discount)", approx(l.net, l.list - l.bundleDiscountAmount));
  // The discount comes off raw labor, so it's strictly smaller than a list-based one.
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
  check("migration: legacy quote lands on pricing v1", !!c && c.pricingVersion === 1);
}

// 9. Zero-line quotes: custom add-ons only, or nothing at all.
{
  const map = { id: "m1", label: "Hand-painted map", qty: 1, unitPrice: 300, digital: true };
  const b = computeQuoteBreakdown(cfg2({ miscAddOns: [map] }), S);
  check("zero lines: total == custom add-on total", approx(b.finalPrice, 300));
  check("zero lines: closure holds", approx(b.subtotalList - b.savings + b.rushAmount, b.finalPrice));
  check("zero lines: digital add-on pays no packaging", b.services.packaging === 0 && !b.anyPhysical);

  const empty = computeQuoteBreakdown(cfg2({}), S);
  check("empty quote: total is exactly 0", empty.finalPrice === 0 && empty.lines.length === 0);
  check("empty quote: no NaN anywhere", [empty.subtotalList, empty.savings, empty.rushAmount, empty.services.servicesList].every(Number.isFinite));
}

// 10. Unnamed custom add-ons: counted under v2, dropped under v1 (old quotes unchanged).
{
  const unnamed = { id: "m1", label: "  ", qty: 2, unitPrice: 50, digital: true };
  const v2 = computeQuoteBreakdown(cfg2({ miscAddOns: [unnamed] }), S);
  check("v2: unnamed add-on counts", approx(v2.miscTotal, 100) && approx(v2.finalPrice, 100));
  check("v2: unnamed add-on labeled as fallback", v2.miscLines[0]?.label === CUSTOM_ITEM_FALLBACK_LABEL);
  const v1 = computeQuoteBreakdown(cfg({ miscAddOns: [unnamed] }), S);
  check("v1: unnamed add-on still excluded", v1.miscLines.length === 0 && v1.finalPrice === 0);
}

// 11. Rush base: includes custom add-ons under v2, excludes them under v1.
{
  const misc = [{ id: "m1", label: "Ribbon", qty: 10, unitPrice: 30, digital: false }];
  const lines = [pkg("sweet", 80)];
  const v2 = computeQuoteBreakdown(cfg2({ lines, miscAddOns: misc, rushFee: true }), S);
  const v1 = computeQuoteBreakdown(cfg({ lines, miscAddOns: misc, rushFee: true }), S);
  const pct = S.rushFeePtg / 100;
  check("v2: rush = (items + services + misc) × rush%", approx(v2.rushAmount, (v2.itemsNet + v2.services.servicesList + v2.miscTotal) * pct));
  check("v1: rush = (items + services) × rush%", approx(v1.rushAmount, (v1.itemsNet + v1.services.servicesList) * pct));
  check("v2 rush > v1 rush by misc × rush%", approx(v2.rushAmount - v1.rushAmount, v2.miscTotal * pct));
  check("v2: closure holds with rush on misc", approx(v2.subtotalList - v2.savings + v2.rushAmount, v2.finalPrice));
  check("rushBase reported matches rushAmount", approx(v2.rushBase * pct, v2.rushAmount));

  const onlyMisc = computeQuoteBreakdown(cfg2({ miscAddOns: [{ ...misc[0], digital: true }], rushFee: true }), S);
  check("v2: rush applies to a custom-only quote", approx(onlyMisc.finalPrice, 300 * (1 + pct)));
}

// 12. Custom add-on physical/digital flag drives packaging + project type.
{
  const phys = { id: "m1", label: "Wax seals", qty: 1, unitPrice: 40, digital: false };
  const dig = { ...phys, id: "m2", digital: true };
  const withPhys = computeQuoteBreakdown(cfg2({ lines: [item("iInvite", 1, true)], miscAddOns: [phys] }), S);
  check("physical add-on: packaging charged once", approx(withPhys.services.packaging, S.packagingCost) && withPhys.anyPhysical);
  const allDig = computeQuoteBreakdown(cfg2({ lines: [item("iInvite", 1, true)], miscAddOns: [dig] }), S);
  check("digital add-on: no packaging", allDig.services.packaging === 0 && !allDig.anyPhysical);
  const twoPhys = computeQuoteBreakdown(cfg2({ lines: [pkg("sweet", 50)], miscAddOns: [phys, { ...phys, id: "m3" }] }), S);
  check("packaging still once with physical lines + add-ons", approx(twoPhys.services.packaging, S.packagingCost));

  check("isDigitalQuote: digital line + physical add-on ⇒ physical", !isDigitalQuote(cfg2({ lines: [item("iInvite", 1, true)], miscAddOns: [phys] })));
  check("isDigitalQuote: digital add-on only ⇒ digital", isDigitalQuote(cfg2({ miscAddOns: [dig] })));
  check("isDigitalQuote: empty quote ⇒ physical", !isDigitalQuote(cfg2({})));
}

// 13. Loading saved quotes: zero lines survive; add-on flags backfill price-neutrally.
{
  const base = {
    name: "Saved",
    createdAt: "",
    updatedAt: "",
    client: { ...EMPTY_CLIENT_INFO },
    assumptionsSnapshot: S,
    cachedTotal: 0,
    schemaVersion: 4,
  };
  const zero = normalizeIncomingDraft({ ...base, id: "z", config: cfg2({ lines: [], miscAddOns: [{ id: "m", label: "Map", qty: 1, unitPrice: 300, digital: true }] }) });
  check("load: v4 quote with zero lines stays empty", !!zero && zero.config.lines.length === 0);
  check("load: pricingVersion 2 preserved", !!zero && zero.config.pricingVersion === 2);

  // Pre-flag quotes: backfill so the recomputed total is identical to before.
  const noFlag = { id: "m", label: "Ribbon", qty: 1, unitPrice: 20 };
  const digitalOnly = normalizeIncomingDraft({ ...base, id: "d", config: { ...cfg({ lines: [pkg("diy", 75)] }), miscAddOns: [noFlag] } });
  check("load: missing pricingVersion ⇒ 1", !!digitalOnly && digitalOnly.config.pricingVersion === 1);
  check("load: add-on on a digital-only quote backfills digital", !!digitalOnly && digitalOnly.config.miscAddOns[0].digital === true);
  check("load: backfill adds no packaging to a digital quote", !!digitalOnly && computeQuoteBreakdown(digitalOnly.config, S).services.packaging === 0);
  const physical = normalizeIncomingDraft({ ...base, id: "p", config: { ...cfg({ lines: [pkg("sweet", 75)] }), miscAddOns: [noFlag] } });
  check("load: add-on on a physical quote backfills physical", !!physical && physical.config.miscAddOns[0].digital === false);

  // A pre-v4 quote with no packages still gets its historical Sweet Suite fallback.
  const legacyEmpty = normalizeIncomingDraft({ ...base, id: "l", schemaVersion: 3, config: { packages: [], mode: "fresh", miscAddOns: [] } });
  check("load: legacy quote with no packages keeps Sweet Suite fallback", !!legacyEmpty && legacyEmpty.config.lines.length === 1 && legacyEmpty.config.lines[0].pkg === "sweet");
}

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) FAILED`);
  process.exit(1);
} else {
  console.log("All engine invariants passed.");
}
