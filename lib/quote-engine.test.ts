// Engine v2 tests (docs/quote-builder-redesign.md §6.4, §7, §13.2). Plain Node
// after a standalone tsc compile (§13.1). Fixtures only.

import { DEFAULTS, ITEM_CATALOG, type CatalogItem, type QuoteState } from "./legacy/logic";
import type { DraftConfig, QuoteLine, MiscAddOn } from "./legacy/types";
import { computeQuoteBreakdown } from "./legacy/totals";
import {
  addCustomLine,
  addPackage,
  addProduct,
  applyRefresh,
  computeTotals,
  diffAgainstPriceBook,
  isDigitalQuote,
  lineTotal,
  newQuote,
  quoteDisplayName,
  setGuestCounts,
  setLineDigital,
  setLineQty,
  setTargetTotal,
  toggleOption,
  type QuoteTotals,
} from "./quote-engine";
import { computeHealth } from "./quote-health";
import { convertLegacyDraft } from "./quote-legacy";
import { DEFAULT_PRICE_BOOK, packageSample, type PriceBook } from "./quote-pricebook";
import type { DraftConfigV5 } from "./quote-types";
import { round2 } from "./money";

declare const process: { exit(code: number): never };

let failures = 0;
let checks = 0;
function check(name: string, cond: boolean, detail?: string): void {
  checks++;
  if (cond) console.log("  PASS  " + name);
  else {
    console.error("  FAIL  " + name + (detail ? `  (${detail})` : ""));
    failures++;
  }
}
const approx = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;

let n = 0;
const ids = () => `id${n++}`;
const PB = DEFAULT_PRICE_BOOK;
const prod = (id: string) => {
  const p = PB.products.find((x) => x.id === id);
  if (!p) throw new Error("no product " + id);
  return p;
};
const pkgT = (id: string) => PB.packages.find((x) => x.id === id)!;
const opt = (id: string) => PB.options.find((x) => x.id === id)!;
const NOW = "2026-09-27T00:00:00.000Z";

function closes(t: QuoteTotals): boolean {
  const lhs =
    t.itemsSubtotal -
    t.bundleSavings +
    t.services.total -
    (t.discount?.amount ?? 0) +
    (t.rush?.amount ?? 0) +
    (t.adjustment?.amount ?? 0) +
    (t.shipping ?? 0);
  return approx(round2(lhs), t.total, 1e-9);
}

// A rich quote used by several invariants.
function richQuote(): DraftConfigV5 {
  let c = newQuote(PB, { households: 90, now: NOW });
  c = addPackage(c, pkgT("signature-suite"), PB, ids);
  c = addProduct(c, prod("welcome-sign"), { idGen: ids });
  c = addProduct(c, prod("menu"), { idGen: ids });
  c = addCustomLine(c, { name: "Hand-painted map", qty: 1, unitPrice: 120 }, ids);
  c = toggleOption(c, c.lines[2].id, { ...opt("textured-paper") });
  c = toggleOption(c, c.lines[2].id, { ...opt("gold-foil"), amount: 0.4, active: true });
  c = { ...c, services: { ...c.services, rush: true, extraRevisions: 2, license: true } };
  c = { ...c, discount: { reason: "family", kind: "percent", value: 10 }, shipping: 18.5 };
  return c;
}

console.log("§6.4 invariants");

// 1. Closure.
{
  const c = richQuote();
  const t = computeTotals(c);
  check("1. items − bundle + services − discount + rush + adj + shipping == total", closes(t));
  const withAdj = computeTotals({ ...c, adjustment: { amount: -12.34, label: "Courtesy" } });
  check("1. closure holds with an adjustment", closes(withAdj));
  check("1. every component is whole cents", [t.itemsSubtotal, t.bundleSavings, t.services.total, t.discount!.amount, t.rush!.amount, t.total].every((v) => approx(round2(v), v, 1e-9)));
}

// 2. Percentages mean what they say.
{
  const c = richQuote();
  const t = computeTotals(c);
  check("2. percent discount == exactly 10% of base (to the cent)", approx(t.discount!.amount, round2(t.base * 0.1)));
  const g = t.groups[0];
  check("2. 15% suite savings == exactly 15% of the group subtotal", approx(g.savings, round2(g.subtotal * 0.15)));
  let c10 = newQuote(PB, { households: 80, now: NOW });
  c10 = addPackage(c10, pkgT("short-and-suite"), PB, ids);
  const g10 = computeTotals(c10).groups[0];
  check("2. 10% bundle on Short and Suite == 10% of its subtotal", approx(g10.savings, round2(g10.subtotal * 0.1)));
  check("2. discount label states the true %", t.discount!.label === "Family & friends (10%)");
}

// 3. Totals depend only on the config.
{
  const c = richQuote();
  const doubled: PriceBook = {
    ...PB,
    products: PB.products.map((p) => ({ ...p, price: p.price === null ? null : p.price * 2, designFee: p.designFee * 2 })),
    options: PB.options.map((o) => ({ ...o, amount: o.amount === null ? null : o.amount * 3 })),
    settings: { ...PB.settings, rushPct: 99, packagingFee: 50, licenseFee: 500, revisionRoundPrice: 99 },
  };
  const before = computeTotals(c).total;
  // Nothing in computeTotals can see a price book: the same config gives the
  // same total whichever book is "loaded" around it.
  const diff = diffAgainstPriceBook(c, doubled);
  const after = computeTotals(JSON.parse(JSON.stringify(c)) as DraftConfigV5).total;
  check("3. same config + a different price book ⇒ same total", before === after && diff.length > 0);
  check("3. computeTotals takes the config only", computeTotals.length === 1);
  const applied = applyRefresh(c, diff, NOW);
  check("3. only an explicit refresh moves the total", computeTotals(applied).total > before);
}

// 4. The same product twice prices identically.
{
  let c = newQuote(PB, { households: 60, now: NOW });
  c = addProduct(c, prod("games"), { idGen: ids });
  c = addProduct(c, prod("games"), { idGen: ids });
  const t = computeTotals(c);
  check("4. identical inputs ⇒ identical line totals", t.lines[0].total === t.lines[1].total && t.lines[0].total > 0);
}

// 5. Zero-line and custom-only quotes.
{
  const empty = newQuote(PB, { now: NOW });
  check("5. zero-line quote totals 0", computeTotals(empty).total === 0);
  const svc = computeTotals({ ...empty, services: { ...empty.services, extraRevisions: 1, license: true } });
  check("5. zero lines + services = services only (no packaging)", svc.total === 16 + 20 && svc.services.packaging === 0);
  const adj = computeTotals({ ...empty, adjustment: { amount: 25, label: "Consult" } });
  check("5. zero lines + adjustment", adj.total === 25);
  const custom = addCustomLine(empty, { name: "Map", qty: 1, unitPrice: 300, digital: true }, ids);
  const ct = computeTotals(custom);
  check("5. custom-only quote is valid", ct.total === 300 && ct.lines.length === 1);
  check("5. custom-only display name falls back to the custom line", quoteDisplayName(custom) === "Map");
}

// 6. Digital quote and packaging.
{
  let c = newQuote(PB, { households: 50, now: NOW });
  c = addProduct(c, prod("invite"), { digital: true, idGen: ids });
  check("6. all-digital product lines ⇒ digital quote", isDigitalQuote(c));
  check("6. digital-only ⇒ no packaging", computeTotals(c).services.packaging === 0);
  const withCustomPhysical = addCustomLine(c, { name: "Wax seals", qty: 10, unitPrice: 2 }, ids);
  check("6. a physical custom line makes it physical", !isDigitalQuote(withCustomPhysical));
  check("6. …and adds packaging once", computeTotals(withCustomPhysical).services.packaging === PB.settings.packagingFee);
  const two = addProduct(withCustomPhysical, prod("welcome-sign"), { idGen: ids });
  check("6. packaging still once with more physical lines", computeTotals(two).services.packaging === PB.settings.packagingFee);
  check("6. empty quote reads physical", !isDigitalQuote(newQuote(PB, { now: NOW })));
  const inv = c.lines[0];
  check("6. digital line uses the digital price, qty ignored", inv.unitPrice === 16 && lineTotal({ ...inv, qty: 999 }, 25).total === 16);
}

// 7. Guest count re-quantifies linked lines only.
{
  let c = newQuote(PB, { households: 80, now: NOW });
  c = addPackage(c, pkgT("sweet-spot-suite"), PB, ids);
  c = addProduct(c, prod("place-card"), { idGen: ids });
  c = addProduct(c, prod("welcome-sign"), { idGen: ids });
  const invite = c.lines[1];
  const env = c.lines.find((l) => l.productId === "envelope")!;
  const place = c.lines.find((l) => l.productId === "place-card")!;
  check("7. invite follows households (80)", invite.qty === 80);
  check("7. envelope = 2 per household (160)", env.qty === 160);
  check("7. place card follows guests (160)", place.qty === 160);
  c = setLineQty(c, invite.id, 95);
  c = setGuestCounts(c, 100, 190);
  const get = (id: string) => c.lines.find((l) => l.id === id)!;
  check("7. manual qty kept after a guest-count change", get(invite.id).qty === 95 && get(invite.id).qtyLink === null);
  check("7. linked envelope re-quantified (200)", get(env.id).qty === 200);
  check("7. linked place card re-quantified (190)", get(place.id).qty === 190);
  check("7. fixed welcome sign untouched", c.lines.find((l) => l.productId === "welcome-sign")!.qty === 1);
}

// 8. Set total lands exactly.
{
  const c = richQuote();
  let ok = true;
  for (const target of [0, 1, 99.99, 570, 1234.56, computeTotals(c).total - 0.01, 5000]) {
    const t = computeTotals(setTargetTotal(c, target)).total;
    if (t !== round2(target)) {
      ok = false;
      console.error(`    target ${target} → ${t}`);
    }
  }
  check("8. setTargetTotal(config, T) ⇒ total == T exactly", ok);
  const same = setTargetTotal(c, computeTotals(c).total);
  check("8. target == current total clears the adjustment", same.adjustment === null);
}

console.log("§6.5 worked example");
{
  const textured = { ...opt("textured-paper"), kind: "per-piece" as const, amount: 0.25, estCost: 0.0975 };
  let c = newQuote(PB, { households: 80, now: NOW });
  c = addPackage(c, pkgT("sweet-spot-suite"), PB, ids);
  const inv = c.lines.find((l) => l.productId === "invite")!;
  const det = c.lines.find((l) => l.productId === "detail-card")!;
  c = toggleOption(c, inv.id, textured);
  c = toggleOption(c, det.id, textured);
  c = addProduct(c, prod("welcome-sign"), { idGen: ids });
  c = { ...c, services: { ...c.services, extraRevisions: 1 } };
  const plain = computeTotals(c);
  c = { ...c, discount: { reason: "family", kind: "percent", value: 10 } };
  c = setTargetTotal(c, 570);
  const t = computeTotals(c);
  const byName = (name: string) => t.lines[c.lines.findIndex((l) => l.name === name)].total;
  check("invitation line = $192.00", byName("Invitation") === 192);
  check("RSVP line = $200.00", byName("RSVP card") === 200);
  check("envelope printing added at $0 (set price)", byName("Envelope printing") === 0);
  check("suite subtotal $648.00, savings $77.76", t.groups[0].subtotal === 648 && t.groups[0].savings === 77.76);
  check("base $634.99", t.base === 634.99 && plain.total === 634.99);
  check("family & friends −$63.50", t.discount!.amount === 63.5);
  check("courtesy adjustment −$1.49", t.adjustment!.amount === -1.49 && t.adjustment!.label === "Courtesy adjustment");
  check("total $570.00", t.total === 570);
  const h = computeHealth(c, t, c.health!);
  check("≈ 15.9 h of work (2 design, 13.35 production, 0.5 revision)", approx(h.estHours, 15.85, 1e-9) && approx(h.designHours, 2) && approx(h.revisionHours, 0.5));
  check("fees 6% = $34.20", approx(h.fees, 34.2));
  check("≈ $24.21/hr, under the $25 floor", h.perHour !== null && Math.abs(h.perHour - 24.21) < 0.01 && h.status === "under-floor", String(h.perHour));
  const hp = computeHealth({ ...c, discount: null, adjustment: null }, plain, c.health!);
  check("without discount + adjustment ≈ $28.07/hr, below target", hp.perHour !== null && Math.abs(hp.perHour - 28.07) < 0.02 && hp.status === "below-target", String(hp.perHour));
}

console.log("§7 health");
{
  const H = { revisionHours: 0.5, feesPct: 6, hourlyTarget: 30, hourlyFloor: 25 };
  let c = newQuote(PB, { households: 50, now: NOW });
  c = addProduct(c, prod("invite"), { idGen: ids });
  c = { ...c, lines: c.lines.map((l) => ({ ...l, unitPrice: 5 })) };
  const on = computeHealth(c, computeTotals(c), H);
  check("well-priced quote reads on target", on.status === "on-target" && (on.perHour ?? 0) >= 30);
  const cheap = { ...c, lines: c.lines.map((l) => ({ ...l, unitPrice: 1 })) };
  check("thin price reads under floor", computeHealth(cheap, computeTotals(cheap), H).status === "under-floor");
  const noEst = addCustomLine(newQuote(PB, { now: NOW }), { name: "Map", qty: 1, unitPrice: 300 }, ids);
  const un = computeHealth(noEst, computeTotals(noEst), H);
  check("custom-only quote: no estimate, zero coverage", un.status === "unknown" && un.perHour === null && un.coverage === 0 && un.lowCoverage);
  const mixed = addCustomLine(c, { name: "Map", qty: 1, unitPrice: 1000 }, ids);
  const mh = computeHealth(mixed, computeTotals(mixed), H);
  check("coverage = revenue share of lines with estimates", approx(mh.coverage, computeTotals(mixed).lines[0].total / computeTotals(mixed).itemsSubtotal) && mh.lowCoverage);
  const reuse = { ...c, lines: c.lines.map((l) => ({ ...l, reuseDesign: true })) };
  check("reused design counts 25% of the design hours", approx(computeHealth(reuse, computeTotals(reuse), H).designHours, 0.5 * 0.25));
  const dig = addProduct(newQuote(PB, { now: NOW }), prod("invite"), { digital: true, idGen: ids });
  const dh = computeHealth(dig, computeTotals(dig), H);
  check("digital lines: design hours only, no production or materials", dh.productionHours === 0 && dh.estMaterials === 0 && dh.designHours === 0.5);
  const ship = { ...c, shipping: 40 };
  const sh = computeHealth(ship, computeTotals(ship), H);
  check("shipping and packaging are pass-throughs, not earnings", approx(sh.netRevenue, computeTotals(ship).total - 40 - PB.settings.packagingFee));
  check("health never changes the total", computeTotals(c).total === computeTotals({ ...c, health: { ...H, feesPct: 50 } }).total);
}

console.log("Price book cross-checks");
{
  let ok = true;
  for (const pkg of PB.packages) {
    for (const h of [50, 100]) {
      const c = addPackage(newQuote(PB, { households: h, now: NOW }), pkg, PB, ids);
      const t = computeTotals(c);
      const s = packageSample(pkg, PB, h);
      if (!approx(t.itemsSubtotal - t.bundleSavings, s.total, 1e-9)) {
        ok = false;
        console.error(`    ${pkg.id}@${h}: engine ${t.itemsSubtotal - t.bundleSavings} vs sample ${s.total}`);
      }
    }
  }
  check("Price book package samples == engine (6 packages × 50/100)", ok);
  let c = addPackage(newQuote(PB, { households: 50, now: NOW }), pkgT("the-basics"), PB, ids);
  check("display name = group name", quoteDisplayName(c) === "The Basics");
  c = addProduct(c, prod("games"), { idGen: ids });
  c = addProduct(c, prod("games"), { idGen: ids });
  check("display name collapses repeats", quoteDisplayName(c) === "The Basics + Games ×2");
  const sw = setLineDigital(c, c.lines[0].id, true, PB);
  check("switching to digital swaps in the digital price", sw.lines[0].digital && sw.lines[0].unitPrice === 16 && sw.lines[0].listUnitPrice === 16);
}

console.log("§13.2 legacy conversion parity");

const S: QuoteState = { ...DEFAULTS, depositAmount: 150 };
function legacy(partial: Partial<DraftConfig>): DraftConfig {
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
let li = 0;
const item = (itemKey: string, qty: number, digital = false): QuoteLine => ({ id: `i${li++}`, kind: "item", itemKey, qty, digital });
const pkg = (p: QuoteLine["pkg"], qty: number): QuoteLine => ({ id: `p${li++}`, kind: "package", pkg: p, qty });
const misc = (label: string, qty: number, unitPrice: number, digital = false): MiscAddOn => ({ id: `m${li++}`, label, qty, unitPrice, digital });

let parityRuns = 0;
let parityFails = 0;
let worst = 0;
function parity(name: string, config: unknown, snapshot: Partial<QuoteState> = S, catalog: CatalogItem[] = ITEM_CATALOG): void {
  parityRuns++;
  const { config: v5, legacyTotal } = convertLegacyDraft({ id: "q", config, assumptionsSnapshot: snapshot }, catalog, NOW);
  const t = computeTotals(v5);
  const d = Math.abs(t.total - legacyTotal);
  worst = Math.max(worst, d);
  if (!(d < 0.005) || !closes({ ...t, total: round2(t.total) }) || Math.round(t.total) !== Math.round(legacyTotal)) {
    parityFails++;
    console.error(`    FAIL parity ${name}: v5 ${t.total} vs legacy ${legacyTotal}`);
  }
}

// Every scenario from lib/quote-calc-totals.test.ts.
parity("two identical items + revisions", legacy({ lines: [item("iGames", 60), item("iGames", 60)], extraRevisions: 2 }));
parity("sweet + revisions", legacy({ lines: [pkg("sweet", 75)], extraRevisions: 2 }));
parity("sweet + signature + revisions", legacy({ lines: [pkg("sweet", 75), pkg("signature", 75)], extraRevisions: 2 }));
parity("two packages (packaging once)", legacy({ lines: [pkg("sweet", 75), pkg("signature", 50)] }));
parity("digital-only item", legacy({ lines: [item("iInvite", 50, true)] }));
parity("sweet + games + license", legacy({ lines: [pkg("sweet", 75), item("iGames", 60)], digitalLicense: true }));
parity("grand closure, everything on", legacy({
  lines: [pkg("sweet", 80), item("iGames", 120), item("iInvite", 30, true)],
  miscAddOns: [misc("Ribbon", 10, 3)],
  extraRevisions: 2, digitalLicense: true, rushFee: true, vendorIncentive: true, familyFriendsPtg: 10, customDiscountPtg: 5,
}));
parity("signature + menu, labor-only discounts", legacy({ lines: [pkg("signature", 90), item("iMenu", 120)], extraRevisions: 2, digitalLicense: true, vendorIncentive: true, familyFriendsPtg: 10 }));
parity("public projector scenario", legacy({ lines: [pkg("signature", 90), item("iMenu", 180)], extraRevisions: 1, rushFee: true, familyFriendsPtg: 8 }));
parity("bundle discount only", legacy({ lines: [pkg("sweet", 75)] }));
parity("legacy v3 shape (packages + individual + addOns)", {
  packages: [{ id: "a", pkg: "sweet", qty: 75 }, { id: "b", pkg: "individual", qty: 60, individualItem: "iGames", individualDigital: false }],
  mode: "fresh", addOns: { iMenu: 40 }, miscAddOns: [], rushFee: false, extraRevisions: 1, digitalLicense: false,
  vendorIncentive: false, packageDiscountPtg: 7, familyFriendsPtg: 0, fullColor: false, customPaper: false,
});
parity("legacy v1 shape (single pkg/qty)", { pkg: "signature", qty: 120, mode: "reuse", rushFee: true, fullColor: true });
parity("legacy v2 individual digital", { pkg: "individual", qty: 75, individualItem: "iSeating", individualDigital: true });
parity("legacy v2 with iDrinkTop add-on", { packages: [{ pkg: "sweet", qty: 60 }], addOns: { iDrinkTop: 30 } });
parity("v2 custom only, digital", legacy({ pricingVersion: 2, miscAddOns: [misc("Hand-painted map", 1, 300, true)] }));
parity("empty v2 quote", legacy({ pricingVersion: 2 }));
parity("v2 unnamed add-on counts", legacy({ pricingVersion: 2, miscAddOns: [misc("  ", 2, 50, true)] }));
parity("v1 unnamed add-on dropped", legacy({ miscAddOns: [misc("  ", 2, 50, true)] }));
parity("rush + misc under v1", legacy({ lines: [pkg("sweet", 80)], miscAddOns: [misc("Ribbon", 10, 30)], rushFee: true }));
parity("rush + misc under v2", legacy({ pricingVersion: 2, lines: [pkg("sweet", 80)], miscAddOns: [misc("Ribbon", 10, 30)], rushFee: true }));
parity("rush on custom-only v2", legacy({ pricingVersion: 2, miscAddOns: [misc("Ribbon", 10, 30, true)], rushFee: true }));
parity("rush without misc v1", legacy({ lines: [pkg("event-works", 50)], rushFee: true }));
parity("digital line + physical add-on", legacy({ pricingVersion: 2, lines: [item("iInvite", 1, true)], miscAddOns: [misc("Wax seals", 1, 40)] }));
parity("pre-flag add-on on digital quote", { lines: [pkg("diy", 75)], mode: "fresh", miscAddOns: [{ id: "m", label: "Ribbon", qty: 1, unitPrice: 20 }] });
parity("pre-v4 empty ⇒ Sweet Suite fallback", { packages: [], mode: "fresh", miscAddOns: [] });

// All 6 packages × {fresh, reuse} × {plain, color, paper} × discount sets.
const PKGS: QuoteLine["pkg"][] = ["diy", "sweet", "signature", "event-basics", "event-fun", "event-works"];
const discountSets: Partial<DraftConfig>[] = [
  {},
  { vendorIncentive: true },
  { familyFriendsPtg: 10 },
  { customDiscountPtg: 7 },
  { vendorIncentive: true, familyFriendsPtg: 15, customDiscountPtg: 90 }, // clamps at 100 with the bundle
];
for (const p of PKGS) {
  for (const mode of ["fresh", "reuse"] as const) {
    for (const mat of [{}, { fullColor: true }, { customPaper: true }]) {
      for (const disc of discountSets) {
        parity(`${p} ${mode} ${JSON.stringify(mat)} ${JSON.stringify(disc)}`, legacy({ lines: [pkg(p, 73)], mode, ...mat, ...disc, extraRevisions: 1 }));
      }
    }
  }
}
// Digital items, every catalog item, both pricing versions.
for (const it of ITEM_CATALOG) {
  parity(`item ${it.key} physical`, legacy({ lines: [item(it.key, 37)], rushFee: true }));
  parity(`item ${it.key} digital v2`, legacy({ pricingVersion: 2, lines: [item(it.key, 1, true)], digitalLicense: true }));
}
// A live catalog that differs from the bundled one (Items tab edits).
{
  const live = ITEM_CATALOG.map((c) => (c.key === "iMenu" ? { ...c, qty: 3 } : c.key === "iTableSign" ? { ...c, fixed: 2 } : c));
  parity("live catalog override", legacy({ lines: [pkg("event-works", 50), pkg("event-fun", 40)], rushFee: true }), S, live);
  const bundled = convertLegacyDraft({ config: legacy({ lines: [pkg("event-works", 50)] }), assumptionsSnapshot: S }, ITEM_CATALOG, NOW).legacyTotal;
  const liveT = convertLegacyDraft({ config: legacy({ lines: [pkg("event-works", 50)] }), assumptionsSnapshot: S }, live, NOW).legacyTotal;
  check("conversion uses the catalog it is given (live Items)", bundled !== liveT);
}
// Snapshots with odd rates.
parity("snapshot with custom rates", legacy({ lines: [pkg("signature", 64), item("iPlaceCard", 128)], rushFee: true, familyFriendsPtg: 12 }), { ...S, hourly: 31.5, adminPtg: 12.5, targetProfitPtg: 22, rushFeePtg: 25, packagingCost: 4.1 });
parity("partial snapshot (missing keys default)", legacy({ lines: [pkg("sweet", 75)] }), { hourly: 27 });

check(`9. parity < $0.005 on all ${parityRuns} fixtures (worst ${worst.toExponential(1)})`, parityFails === 0);

// Converted quotes keep their shape, type and whole-dollar display.
{
  const src = legacy({
    lines: [pkg("sweet", 80), item("iGames", 120)],
    miscAddOns: [misc("Ribbon", 10, 3)],
    extraRevisions: 1, rushFee: true, familyFriendsPtg: 10,
  });
  const a = convertLegacyDraft({ id: "q1", config: src, assumptionsSnapshot: S }, ITEM_CATALOG, NOW);
  const b = convertLegacyDraft({ id: "q1", config: src, assumptionsSnapshot: S }, ITEM_CATALOG, NOW);
  const old = computeQuoteBreakdown(src, S, ITEM_CATALOG);
  const v = a.config;
  check("conversion is deterministic (same ids twice)", JSON.stringify(a.config) === JSON.stringify(b.config));
  check("lines: 2 priced + services + misc + rush", v.lines.length === 5 && v.lines.filter((l) => l.system).length === 2);
  check("package line lists its pieces", (v.lines[0].includes ?? []).length === 5 && v.lines[0].detail === "80 households");
  check("discount = old savings, as a $ amount labelled Savings", !!v.discount && v.discount.kind === "amount" && approx(v.discount.value, old.discountTotal) && v.discount.label === "Savings");
  check("services zeroed (no double packaging)", computeTotals(v).services.total === 0);
  check("deposit carried over", v.deposit === 150);
  check("legacy kept for audit", !!v.legacy && v.legacy.finalPrice === old.finalPrice && v.legacy.pricingVersion === 1);
  check("display name unchanged (Sweet Suite + Games)", quoteDisplayName(v) === "Sweet Suite + Games");
  const dig = convertLegacyDraft({ config: legacy({ lines: [pkg("diy", 75)], extraRevisions: 1 }), assumptionsSnapshot: S }, ITEM_CATALOG, NOW).config;
  check("digital legacy quote stays digital (services line too)", isDigitalQuote(dig));
  const phys = convertLegacyDraft({ config: legacy({ lines: [item("iInvite", 1, true)], miscAddOns: [misc("Wax", 1, 40)], pricingVersion: 2 }), assumptionsSnapshot: S }, ITEM_CATALOG, NOW).config;
  check("physical add-on keeps a legacy quote physical", !isDigitalQuote(phys));
  const set = setTargetTotal(v, 700);
  check("set total on a converted quote lands on the cent", Math.abs(computeTotals(set).total - 700) < 1e-9);
}

console.log("");
if (failures > 0) {
  console.error(`${failures} of ${checks} check(s) FAILED`);
  process.exit(1);
} else {
  console.log(`All ${checks} engine checks passed (${parityRuns} parity fixtures).`);
}
