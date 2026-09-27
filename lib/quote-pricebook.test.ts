// Price book tests (P1). Plain Node after a standalone tsc compile, like the
// engine tests (docs/quote-builder-redesign.md §13.1). Fixtures only: nothing
// here talks to the real Google Sheet.

import { DEFAULTS } from "./legacy/logic";
import { mergeRemoteConfig } from "./quote-calc-config";
import {
  DEFAULT_PRICE_BOOK,
  DEFAULT_SETTINGS,
  PACKAGES_SEED,
  PRODUCTS_HEADER,
  PRODUCTS_SEED,
  OPTIONS_SEED,
  PRICE_SETTING_KEYS,
  mergePriceBook,
  packageSample,
  planSeed,
  priceGuide,
  settingsSeedRows,
  type RemotePriceBook,
  type SeedState,
  type SheetRow,
} from "./quote-pricebook";

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  if (cond) console.log("  PASS  " + name);
  else {
    console.error("  FAIL  " + name);
    failures++;
  }
}
const approx = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;

const ok = (rows: SheetRow[]) => ({ status: "ok" as const, rows });
const seeded: RemotePriceBook = {
  products: ok(PRODUCTS_SEED),
  options: ok(OPTIONS_SEED),
  packages: ok(PACKAGES_SEED),
  settings: ok(settingsSeedRows()),
};

// 1. Seed prices reproduce today's engine per product (Appendix B.1).
{
  const legacy: Record<string, string> = {
    "save-the-date": "iSaveDate", invite: "iInvite", "detail-card": "iDetail", rsvp: "iRSVP",
    envelope: "iEnvelope", "ceremony-card": "iCeremony", "guest-setting": "iGuestSetting",
    menu: "iMenu", "place-card": "iPlaceCard", games: "iGames", "welcome-sign": "iWelcome",
    "seating-chart": "iSeating", "table-sign": "iTableSign", "wedge-topper": "iWedgeTop",
    "wafer-topper": "iWaferTop", "favor-tag": "iPartyFavor", coaster: "iCoaster", sticker: "iSticker",
    "wine-charm": "iWineCharm", "drink-charm": "iDrinkCharm", "thank-you": "iThankYou",
  };
  const S = DEFAULTS as unknown as Record<string, number>;
  const markup = (1 + DEFAULTS.adminPtg / 100) * (1 + DEFAULTS.targetProfitPtg / 100);
  let priceOk = true;
  let feeOk = true;
  for (const [pid, key] of Object.entries(legacy)) {
    const p = DEFAULT_PRICE_BOOK.products.find((x) => x.id === pid)!;
    const mat = (S[key + "_sc"] / Math.max(1, S[key + "_y"])) * (1 + DEFAULTS.errorMarginPtg / 100);
    const price = Math.round(((mat + (S[key + "_pt"] / 60) * DEFAULTS.hourly) * markup) / 0.05) * 0.05;
    const fee = Math.round((S[key + "_dt"] / 60) * DEFAULTS.hourly * markup);
    if (!approx(p.price ?? -1, price, 0.0051)) {
      priceOk = false;
      console.error(`    ${pid}: seed ${p.price} vs derived ${price.toFixed(2)}`);
    }
    if (p.designFee !== fee) {
      feeOk = false;
      console.error(`    ${pid}: design ${p.designFee} vs derived ${fee}`);
    }
  }
  check("seed prices = today's engine rounded to $0.05 (B.1)", priceOk);
  check("seed design fees = today's design labor × 1.265, rounded (B.1)", feeOk);
  check("seed has 34 products, 3 options, 6 packages", DEFAULT_PRICE_BOOK.products.length === 34 && DEFAULT_PRICE_BOOK.options.length === 3 && DEFAULT_PRICE_BOOK.packages.length === 6);
  check("seed bundle % are 10/12/15 for weddings and events", DEFAULT_PRICE_BOOK.packages.map((p) => p.bundlePct).join() === "10,12,15,10,12,15");
  check("seed packages all physical (Short and Suite printed by default)", DEFAULT_PRICE_BOOK.packages.every((p) => p.delivery === "physical"));
  check("seed settings match §14", DEFAULT_SETTINGS.hourlyTarget === 30 && DEFAULT_SETTINGS.hourlyFloor === 25 && DEFAULT_SETTINGS.feesPct === 6 && DEFAULT_SETTINGS.guestsPerHousehold === 2);
  const env = DEFAULT_PRICE_BOOK.products.find((p) => p.id === "envelope")!;
  check("envelope: 2 per household", env.qtyBasis === "household" && env.qtyPer === 2);
  check("six to-do products are unpriced and inactive", DEFAULT_PRICE_BOOK.products.filter((p) => p.price === null && !p.active).length === 6);
}

// 2. A seeded Sheet merges cleanly; only to-do warnings remain.
{
  const m = mergePriceBook(seeded);
  check("seeded sheet: every source is the Sheet", Object.values(m.sources).every((s) => s === "sheet"));
  check("seeded sheet: no seed offered", !m.needsSeed);
  check("seeded sheet: only needs-price warnings", m.warnings.every((w) => w.kind === "needs-price"));
  check("seeded sheet: product rows carry their sheet row", m.priceBook.products[0].sheetRow === 2);
}

// 3. Validation names the tab and row.
{
  const rows = PRODUCTS_SEED.map((r) => [...r]);
  rows[1][2] = "abc"; // invite price → row 3
  rows.push([...rows[0]]); // duplicate save-the-date → last row
  rows[4][6] = "table"; // bad qtyBasis on envelope → row 6
  rows[5][11] = 5; // ceremony marketLow > marketHigh → row 7
  rows[5][12] = 2;
  const m = mergePriceBook({ ...seeded, products: ok(rows) });
  const at = (row: number, word: string) => m.warnings.some((w) => w.tab === "Products" && w.sheetRow === row && w.detail.includes(word));
  check("non-numeric price → Products row 3", at(3, "price"));
  check("duplicate id → Products last row", at(rows.length + 1, "duplicate"));
  check("unknown qtyBasis → Products row 6", at(6, "qtyBasis"));
  check("marketLow > marketHigh → Products row 7", at(7, "marketLow"));
  const pkgRows = PACKAGES_SEED.map((r) => [...r]);
  pkgRows[0][3] = "detail-card, invite, nope";
  const mp = mergePriceBook({ ...seeded, packages: ok(pkgRows) });
  check("unknown product in a package → Packages row 2, piece skipped", mp.warnings.some((w) => w.tab === "Packages" && w.sheetRow === 2 && w.detail.includes("nope")) && mp.priceBook.packages[0].items.length === 2);
  const settings = [...settingsSeedRows(), ["hourly", 25], ["feesPct", "six"], ["mystery", 1]];
  const ms = mergePriceBook({ ...seeded, settings: ok(settings) });
  check("legacy Settings key ignored silently", !ms.warnings.some((w) => w.detail.includes('"hourly"')));
  check("bad Settings value named, default kept", ms.warnings.some((w) => w.tab === "Settings" && w.detail.includes("feesPct")) && ms.priceBook.settings.feesPct === 6);
  check("unknown Settings key warned", ms.warnings.some((w) => w.kind === "unknown-key" && w.detail.includes("mystery")));
}

// 4. Adding a row adds a product (no code).
{
  const rows = [...PRODUCTS_SEED, ["vellum-wrap", "Vellum wrap", 1.1, "Invitations", "", "", "household", 1]];
  const m = mergePriceBook({ ...seeded, products: ok(rows) });
  const p = m.priceBook.products.find((x) => x.id === "vellum-wrap");
  check("new Sheet row becomes a product", !!p && p.price === 1.1 && p.qtyBasis === "household" && p.active);
}

// 5. Missing / empty tabs fall back to the seed and offer the seed action.
{
  const m = mergePriceBook({
    products: { status: "missing" },
    options: ok([]),
    packages: { status: "missing" },
    settings: ok([["hourly", 25]]),
  });
  check("missing tabs → bundled products/packages", m.sources.products === "bundled" && m.priceBook.products.length === 34);
  check("missing tabs → needsSeed", m.needsSeed);
  check("missing tab warning names the tab", m.warnings.some((w) => w.kind === "tab-missing" && w.tab === "Products"));
}

// 6. Seed plan: a blank Sheet gets everything, a second run changes nothing.
{
  const blank: SeedState = {
    products: { exists: false, dataRows: 0 },
    options: { exists: false, dataRows: 0 },
    packages: { exists: false, dataRows: 0 },
    settings: { exists: true, dataRows: 20, keys: ["hourly", "adminPtg", "depositAmount"] },
  };
  const plan = planSeed(blank);
  const products = plan.find((a) => a.tab === "Products");
  check("blank sheet: creates Products/Options/Packages", ["Products", "Options", "Packages"].every((t) => plan.some((a) => a.tab === t && a.create)));
  check("blank sheet: Products = header + 34 rows", !!products && products.rows.length === 35 && products.rows[0].join() === PRODUCTS_HEADER.join());
  const settings = plan.find((a) => a.tab === "Settings");
  check("blank sheet: appends missing Settings keys only (depositAmount kept)", !!settings && settings.mode === "append" && settings.rows.length === PRICE_SETTING_KEYS.length - 1 && !settings.rows.some((r) => r[0] === "depositAmount"));
  const after: SeedState = {
    products: { exists: true, dataRows: 34 },
    options: { exists: true, dataRows: 3 },
    packages: { exists: true, dataRows: 6 },
    settings: { exists: true, dataRows: 31, keys: [...blank.settings.keys, ...PRICE_SETTING_KEYS] },
  };
  check("second run: no actions", planSeed(after).length === 0);
  const emptyTab = planSeed({ ...after, options: { exists: true, dataRows: 0 } });
  check("existing-but-empty tab is filled, not created", emptyTab.length === 1 && emptyTab[0].tab === "Options" && !emptyTab[0].create);
}

// 7. The old calculator's reader shows no new warnings for the new keys.
{
  const legacy = mergeRemoteConfig({
    settings: settingsSeedRows().map((r, i) => ({ key: String(r[0]), value: Number(r[1]), sheetRow: i + 2 })),
    items: [],
    warnings: [],
  });
  check("old reader tolerates price-book Settings keys", legacy.warnings.length === 0);
}

// 8. Floor/target and package samples.
{
  const invite = DEFAULT_PRICE_BOOK.products.find((p) => p.id === "invite")!;
  const g = priceGuide(invite, DEFAULT_SETTINGS);
  check("invite floor = (0.29 + 3/60×25)/0.94", approx(g.floorUnit!, (0.29 + 1.25) / 0.94));
  check("invite target = (0.29 + 3/60×30)/0.94", approx(g.targetUnit!, (0.29 + 1.5) / 0.94));
  check("invite has no market data flag", g.flags.includes("no-market-data"));
  const sweet = DEFAULT_PRICE_BOOK.packages.find((p) => p.id === "sweet-spot-suite")!;
  const smp = packageSample(sweet, DEFAULT_PRICE_BOOK, 80);
  // §6.5 without textured paper: 80×1.95+16, 80×1.95+16, 80×2.30+16, 160×0.40, envelope printing $0.
  const sub = 172 + 172 + 200 + 64;
  check("Sweet Spot @80 subtotal", approx(smp.subtotal, sub, 0.001));
  check("Sweet Spot bundle is a true 12%", approx(smp.savings, Math.round(sub * 12) / 100, 0.001));
  check("unpriced envelope printing reported", smp.unpriced.includes("Envelope printing"));
}

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) FAILED`);
  process.exit(1);
} else {
  console.log("All price book checks passed.");
}
