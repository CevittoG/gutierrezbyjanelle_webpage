// The price book: what Janelle sells and at what price, read from four Google
// Sheet tabs (Products, Options, Packages, Settings). See
// docs/quote-builder-redesign.md §5 for the tab spec and Appendix B for the seed.
//
// Pure module (no IO, no React): the server reads raw rows, this module parses
// and validates them into a PriceBook plus warnings that name the tab and row.
// The bundled seed below is both the fallback when a tab is missing and the
// content written by the one-time seed endpoint, so the two can never drift.
//
// The price book is consulted when a line is *added* or *refreshed*. Quote
// totals never read it (lib/quote-engine.ts).

// --- Warnings (shared with the legacy config layer and ConfigBanner) ---

export type ConfigWarningKind =
  | "fetch-failed"
  | "tab-missing"
  | "empty"
  | "invalid-row"
  | "unknown-key"
  | "needs-price";

export type ConfigTab = "Settings" | "Items" | "Products" | "Options" | "Packages";

export interface ConfigWarning {
  kind: ConfigWarningKind;
  tab: ConfigTab | null;
  sheetRow: number | null;
  detail: string;
}

// --- Types ---

export type QtyBasis = "household" | "guest" | "fixed";
export type OptionKind = "per-piece" | "percent" | "flat";
export type PackageType = "wedding" | "event";
export type Delivery = "physical" | "digital";

export interface Product {
  id: string;
  name: string;
  /** Selling price per physical piece. null ⇒ not priced yet ("set price"). */
  price: number | null;
  category: string;
  /** One-time design fee, added once per line (fresh design). */
  designFee: number;
  /** Flat price as a digital file. null ⇒ not offered digitally. */
  digitalPrice: number | null;
  qtyBasis: QtyBasis;
  qtyPer: number;
  estUnitCost: number | null;
  estMinutes: number | null;
  estDesignHours: number | null;
  marketLow: number | null;
  marketHigh: number | null;
  active: boolean;
  notes: string;
  /** 1-indexed sheet row, or null for the bundled seed. */
  sheetRow: number | null;
}

export interface ProductOption {
  id: string;
  name: string;
  kind: OptionKind;
  /** $ or % according to `kind`. null ⇒ not priced yet. */
  amount: number | null;
  /** Categories and/or product ids (lowercased). Empty ⇒ every product. */
  appliesTo: string[];
  estCost: number | null;
  active: boolean;
  notes: string;
  sheetRow: number | null;
}

export interface PackageTemplate {
  id: string;
  name: string;
  type: PackageType;
  /** Product ids in display order; repeats allowed. */
  items: string[];
  /** Suite savings, a true % of the group's subtotal. */
  bundlePct: number;
  delivery: Delivery;
  active: boolean;
  notes: string;
  sheetRow: number | null;
}

export interface PriceSettings {
  guestsPerHousehold: number;
  rushPct: number;
  revisionRoundPrice: number;
  revisionHours: number;
  licenseFee: number;
  packagingFee: number;
  depositAmount: number;
  reuseDesignPct: number;
  vendorReferralPct: number;
  feesPct: number;
  hourlyTarget: number;
  hourlyFloor: number;
}

export interface PriceBook {
  products: Product[];
  options: ProductOption[];
  packages: PackageTemplate[];
  settings: PriceSettings;
}

// --- Sheet layout ---

type Cell = string | number | boolean | null | undefined;
export type SheetRow = Cell[];

export const PRODUCTS_TAB = "Products";
export const OPTIONS_TAB = "Options";
export const PACKAGES_TAB = "Packages";
export const SETTINGS_TAB = "Settings";

export const PRODUCTS_HEADER = [
  "id", "name", "price", "category", "designFee", "digitalPrice", "qtyBasis", "qtyPer",
  "estUnitCost", "estMinutes", "estDesignHours", "marketLow", "marketHigh", "active", "notes",
] as const;
export const OPTIONS_HEADER = ["id", "name", "kind", "amount", "appliesTo", "estCost", "active", "notes"] as const;
export const PACKAGES_HEADER = ["id", "name", "type", "items", "bundlePct", "delivery", "active", "notes"] as const;
export const SETTINGS_HEADER = ["key", "value"] as const;

// --- Seed (Appendix B). Row arrays in header order; "" = blank cell. ---

export const PRODUCTS_SEED: SheetRow[] = [
  ["save-the-date", "Save the date", 1.7, "Invitations", 16, 16, "household", 1, 0.1, 3, 0.5, "", "", "", ""],
  ["invite", "Invitation", 1.95, "Invitations", 16, 16, "household", 1, 0.29, 3, 0.5, "", "", "", ""],
  ["detail-card", "Detail card", 1.95, "Invitations", 16, 16, "household", 1, 0.29, 3, 0.5, "", "", "", ""],
  ["rsvp", "RSVP card", 2.3, "Invitations", 16, 16, "household", 1, 0.14, 4, 0.5, "", "", "", ""],
  ["envelope", "Envelope", 0.4, "Invitations", "", "", "household", 2, 0.33, 0, 0, "", "", "", "One for the invite, one for the RSVP reply"],
  ["ceremony-card", "Ceremony card", 1.95, "Day-of", 24, 24, "household", 1, 0.29, 3, 0.75, "", "", "", ""],
  ["guest-setting", "Personalized guest setting", 2.3, "Day-of", 16, 16, "guest", 1, 0.14, 4, 0.5, "", "", "", ""],
  ["menu", "Menu", 1.8, "Day-of", 8, 8, "guest", 1, 0.58, 2, 0.25, "", "", "", ""],
  ["place-card", "Place card", 1.7, "Day-of", 8, 8, "guest", 1, 0.1, 3, 0.25, "", "", "", ""],
  ["games", "Games", 1.25, "Day-of", 11, 11, "household", 1, 0.14, 2, 0.33, "", "", "", ""],
  ["welcome-sign", "Welcome sign", 29.75, "Signage", 16, 16, "fixed", 1, 23.1, 1, 0.5, "", "", "", "Check against the market: $23.10 of board"],
  ["seating-chart", "Seating chart", 29.75, "Signage", 32, 32, "fixed", 1, 23.1, 1, 1, "", "", "", ""],
  ["table-sign", "Table top sign", 1.25, "Signage", 8, 8, "fixed", 1, 0.58, 1, 0.25, "", "", "", ""],
  ["event-sign", "Event sign", 1.25, "Signage", 8, 8, "fixed", 1, 0.58, 1, 0.25, "", "", "", ""],
  ["dessert-sign", "Dessert sign", 1.25, "Signage", 8, 8, "fixed", 1, 0.58, 1, 0.25, "", "", "", ""],
  ["drink-sign", "Signature drink sign", 1.25, "Signage", 8, 8, "fixed", 1, 0.58, 1, 0.25, "", "", "", ""],
  ["dessert-menu", "Dessert menu", 1.25, "Signage", 8, 8, "fixed", 1, 0.58, 1, 0.25, "", "", "", ""],
  ["bar-menu", "Bar menu", 1.25, "Signage", 8, 8, "fixed", 1, 0.58, 1, 0.25, "", "", "", ""],
  ["wedge-topper", "Wedge topper", 2.2, "Favors & bar", 16, 16, "guest", 2, 0.07, 4, 0.5, "", "", "", ""],
  ["wafer-topper", "Wafer topper", 1.65, "Favors & bar", 11, 11, "guest", 2, 0.04, 3, 0.33, "", "", "", ""],
  ["favor-tag", "Party favor tag", 2.2, "Favors & bar", 8, 8, "guest", 1, 0.06, 4, 0.25, "", "", "", ""],
  ["coaster", "Coaster", 0.75, "Favors & bar", 8, 8, "household", 1, 0.57, 0.05, 0.25, "", "", "", ""],
  ["sticker", "Sticker", 0.3, "Favors & bar", 8, 8, "household", 1, 0.21, 0.05, 0.25, "", "", "", ""],
  ["wine-charm", "Wine charm", 1.65, "Favors & bar", 11, 11, "guest", 1, 0.07, 3, 0.33, "", "", "", ""],
  ["drink-charm", "Drink charm", 1.65, "Favors & bar", 11, 11, "guest", 1, 0.07, 3, 0.33, "", "", "", ""],
  ["wine-charm-set", "Wine charm set (6)", 9.9, "Favors & bar", 11, 11, "fixed", 1, 0.43, 18, 0.33, "", "", "", ""],
  ["drink-charm-set", "Drink charm set (6)", 9.9, "Favors & bar", 11, 11, "fixed", 1, 0.43, 18, 0.33, "", "", "", ""],
  ["thank-you", "Thank you card", 1.25, "After the event", 16, 16, "household", 1, 0.14, 2, 0.5, "", "", "", ""],
  ["envelope-printing", "Envelope printing", "", "Invitations", "", "", "household", 1, "", "", "", "", "", "FALSE", "To do: set a price, then set active"],
  ["envelope-liner", "Envelope liner", "", "Invitations", "", "", "household", 1, "", "", "", "", "", "FALSE", "To do: set a price, then set active"],
  ["suite-accessory", "Suite pocket, band or clip", "", "Invitations", "", "", "household", 1, "", "", "", "", "", "FALSE", "To do: set a price, then set active"],
  ["wax-seal", "Wax seal (adhesive)", "", "Invitations", "", "", "household", 1, "", "", "", "", "", "FALSE", "To do: set a price, then set active"],
  ["extra-card-design", "Extra card or shape design", "", "Services", "", "", "fixed", 1, "", "", "", "", "", "FALSE", "To do: set a price, then set active"],
  ["ai-render", "AI-generated event render", "", "Services", "", "", "fixed", 1, "", "", "", "", "", "FALSE", "To do: set a price, then set active"],
];

export const OPTIONS_SEED: SheetRow[] = [
  ["textured-paper", "Textured paper", "percent", 6, "Invitations, Day-of", "", "", "Parity placeholder (today's x1.3 paper factor); set the real upcharge"],
  ["full-color", "Full color design", "percent", 10, "", "", "", "Parity placeholder (today's x1.5 ink factor); set the real upcharge"],
  ["gold-foil", "Gold foil", "per-piece", "", "Invitations", "", "FALSE", "To do: set a price, then set active"],
];

export const PACKAGES_SEED: SheetRow[] = [
  ["short-and-suite", "Short and Suite", "wedding", "detail-card, invite", 10, "physical", "", ""],
  ["sweet-spot-suite", "Sweet Spot Suite", "wedding", "detail-card, invite, rsvp, envelope, envelope-printing", 12, "physical", "", ""],
  ["signature-suite", "Signature Suite", "wedding", "rsvp, detail-card, invite, envelope, envelope-printing, suite-accessory, ceremony-card, table-sign, ai-render", 15, "physical", "", ""],
  ["the-basics", "The Basics", "event", "invite, thank-you", 10, "physical", "", ""],
  ["add-some-fun", "Add Some Fun", "event", "invite, thank-you, menu, event-sign, dessert-sign", 12, "physical", "", ""],
  ["give-me-the-works", "Give Me the Works", "event", "invite, thank-you, menu, dessert-menu, bar-menu, welcome-sign, event-sign, dessert-sign, drink-sign", 15, "physical", "", ""],
];

export const DEFAULT_SETTINGS: PriceSettings = {
  guestsPerHousehold: 2,
  rushPct: 30,
  revisionRoundPrice: 16,
  revisionHours: 0.5,
  licenseFee: 20,
  packagingFee: 3,
  depositAmount: 0,
  reuseDesignPct: 25,
  vendorReferralPct: 10,
  feesPct: 6,
  hourlyTarget: 30,
  hourlyFloor: 25,
};

export const PRICE_SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof PriceSettings)[];

// Settings keys the old calculator reads. The new reader ignores them silently
// (they stay in the tab until P5), and the old reader ignores ours.
export const LEGACY_SETTING_KEYS = new Set([
  "hourly", "adminPtg", "targetProfitPtg", "errorMarginPtg", "packagingCost", "reuseFactor",
  "revisionMin", "discountDiy", "discountSweet", "discountSignature", "discountEventBasics",
  "discountEventFun", "discountEventWorks", "discountIndividual", "vendorIncentivePtg",
  "fullColorFactor", "customPaperFactor", "rushFeePtg", "digitalLicensePtg",
]);

export function isPriceSettingKey(key: string): key is keyof PriceSettings {
  return (PRICE_SETTING_KEYS as string[]).includes(key);
}

// --- Cell parsing ---

// Tolerates "$1.50", "10%", "1,250": Janelle edits these by hand in Sheets.
export function parseSheetNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function text(c: Cell): string {
  return c === null || c === undefined ? "" : String(c).trim();
}

function isBlank(c: Cell): boolean {
  return text(c) === "";
}

function parseActive(c: Cell): boolean {
  if (typeof c === "boolean") return c;
  const t = text(c).toLowerCase();
  return !(t === "false" || t === "no" || t === "0" || t === "n");
}

function list(c: Cell): string[] {
  return text(c)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// A number cell: blank ⇒ null; non-numeric ⇒ warning + null.
function numCell(
  c: Cell,
  field: string,
  ctx: { tab: ConfigTab; sheetRow: number; id: string; warnings: ConfigWarning[] },
): number | null {
  if (isBlank(c)) return null;
  const n = parseSheetNumber(c);
  if (n === null || n < 0) {
    ctx.warnings.push({
      kind: "invalid-row",
      tab: ctx.tab,
      sheetRow: ctx.sheetRow,
      detail: `Row ${ctx.sheetRow} (${ctx.id}): ${field} "${text(c)}" is not a number, so it was left blank.`,
    });
    return null;
  }
  return n;
}

// --- Row parsers (exported for tests) ---

export function parseProductRows(rows: SheetRow[], opts: { fromSheet: boolean }): {
  products: Product[];
  warnings: ConfigWarning[];
} {
  const warnings: ConfigWarning[] = [];
  const products: Product[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const sheetRow = i + 2;
    const id = text(row[0]).toLowerCase();
    if (!id) return;
    const ctx = { tab: "Products" as const, sheetRow, id, warnings };
    if (seen.has(id)) {
      warnings.push({ kind: "invalid-row", tab: "Products", sheetRow, detail: `Row ${sheetRow}: duplicate id "${id}", ignored. Each product needs its own id.` });
      return;
    }
    seen.add(id);
    const name = text(row[1]) || id;
    const price = numCell(row[2], "price", ctx);
    const basisRaw = text(row[6]).toLowerCase();
    let qtyBasis: QtyBasis = "fixed";
    if (basisRaw === "household" || basisRaw === "guest" || basisRaw === "fixed") qtyBasis = basisRaw;
    else if (basisRaw) {
      warnings.push({ kind: "invalid-row", tab: "Products", sheetRow, detail: `Row ${sheetRow} (${id}): qtyBasis "${basisRaw}" is not household, guest or fixed. Using fixed.` });
    }
    const marketLow = numCell(row[11], "marketLow", ctx);
    const marketHigh = numCell(row[12], "marketHigh", ctx);
    if (marketLow !== null && marketHigh !== null && marketLow > marketHigh) {
      warnings.push({ kind: "invalid-row", tab: "Products", sheetRow, detail: `Row ${sheetRow} (${id}): marketLow is higher than marketHigh.` });
    }
    const active = parseActive(row[13]);
    if (price === null && opts.fromSheet) {
      warnings.push({ kind: "needs-price", tab: "Products", sheetRow, detail: `${name} (${id}) needs a price. It stays out of the picker, and a package that includes it adds it at $0.` });
    }
    products.push({
      id,
      name,
      price,
      category: text(row[3]) || "Other",
      designFee: numCell(row[4], "designFee", ctx) ?? 0,
      digitalPrice: numCell(row[5], "digitalPrice", ctx),
      qtyBasis,
      qtyPer: numCell(row[7], "qtyPer", ctx) ?? 1,
      estUnitCost: numCell(row[8], "estUnitCost", ctx),
      estMinutes: numCell(row[9], "estMinutes", ctx),
      estDesignHours: numCell(row[10], "estDesignHours", ctx),
      marketLow,
      marketHigh,
      active,
      notes: text(row[14]),
      sheetRow: opts.fromSheet ? sheetRow : null,
    });
  });
  return { products, warnings };
}

export function parseOptionRows(rows: SheetRow[], opts: { fromSheet: boolean }): {
  options: ProductOption[];
  warnings: ConfigWarning[];
} {
  const warnings: ConfigWarning[] = [];
  const options: ProductOption[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const sheetRow = i + 2;
    const id = text(row[0]).toLowerCase();
    if (!id) return;
    const ctx = { tab: "Options" as const, sheetRow, id, warnings };
    if (seen.has(id)) {
      warnings.push({ kind: "invalid-row", tab: "Options", sheetRow, detail: `Row ${sheetRow}: duplicate id "${id}", ignored.` });
      return;
    }
    seen.add(id);
    const kindRaw = text(row[2]).toLowerCase();
    if (kindRaw !== "per-piece" && kindRaw !== "percent" && kindRaw !== "flat") {
      warnings.push({ kind: "invalid-row", tab: "Options", sheetRow, detail: `Row ${sheetRow} (${id}): kind "${kindRaw}" is not per-piece, percent or flat. Ignored.` });
      return;
    }
    const name = text(row[1]) || id;
    const amount = numCell(row[3], "amount", ctx);
    if (amount === null && opts.fromSheet) {
      warnings.push({ kind: "needs-price", tab: "Options", sheetRow, detail: `${name} (${id}) needs an amount before it can be offered.` });
    }
    options.push({
      id,
      name,
      kind: kindRaw,
      amount,
      appliesTo: list(row[4]),
      estCost: numCell(row[5], "estCost", ctx),
      active: parseActive(row[6]),
      notes: text(row[7]),
      sheetRow: opts.fromSheet ? sheetRow : null,
    });
  });
  return { options, warnings };
}

export function parsePackageRows(
  rows: SheetRow[],
  products: Product[],
  opts: { fromSheet: boolean },
): { packages: PackageTemplate[]; warnings: ConfigWarning[] } {
  const warnings: ConfigWarning[] = [];
  const packages: PackageTemplate[] = [];
  const seen = new Set<string>();
  const byId = new Map(products.map((p) => [p.id, p]));
  rows.forEach((row, i) => {
    const sheetRow = i + 2;
    const id = text(row[0]).toLowerCase();
    if (!id) return;
    const ctx = { tab: "Packages" as const, sheetRow, id, warnings };
    if (seen.has(id)) {
      warnings.push({ kind: "invalid-row", tab: "Packages", sheetRow, detail: `Row ${sheetRow}: duplicate id "${id}", ignored.` });
      return;
    }
    seen.add(id);
    const typeRaw = text(row[2]).toLowerCase();
    let type: PackageType = "wedding";
    if (typeRaw === "event" || typeRaw === "events") type = "event";
    else if (typeRaw && typeRaw !== "wedding") {
      warnings.push({ kind: "invalid-row", tab: "Packages", sheetRow, detail: `Row ${sheetRow} (${id}): type "${typeRaw}" is not wedding or event. Using wedding.` });
    }
    const items = list(row[3]);
    for (const pid of Array.from(new Set(items))) {
      const p = byId.get(pid);
      if (!p) {
        warnings.push({ kind: "invalid-row", tab: "Packages", sheetRow, detail: `Row ${sheetRow} (${id}): unknown product "${pid}". The builder skips that piece.` });
      } else if (p.price === null && opts.fromSheet) {
        warnings.push({ kind: "needs-price", tab: "Packages", sheetRow, detail: `${text(row[1]) || id} includes ${p.name}, which has no price yet. It is added at $0 with a "set price" badge.` });
      }
    }
    const bundlePct = numCell(row[4], "bundlePct", ctx) ?? 0;
    const deliveryRaw = text(row[5]).toLowerCase();
    packages.push({
      id,
      name: text(row[1]) || id,
      type,
      items: items.filter((pid) => byId.has(pid)),
      bundlePct: Math.min(100, bundlePct),
      delivery: deliveryRaw === "digital" ? "digital" : "physical",
      active: parseActive(row[6]),
      notes: text(row[7]),
      sheetRow: opts.fromSheet ? sheetRow : null,
    });
  });
  return { packages, warnings };
}

export function parseSettingsRows(rows: SheetRow[]): { settings: PriceSettings; warnings: ConfigWarning[] } {
  const warnings: ConfigWarning[] = [];
  const settings: PriceSettings = { ...DEFAULT_SETTINGS };
  rows.forEach((row, i) => {
    const sheetRow = i + 2;
    const key = text(row[0]);
    if (!key) return;
    if (!isPriceSettingKey(key)) {
      if (!LEGACY_SETTING_KEYS.has(key)) {
        warnings.push({ kind: "unknown-key", tab: "Settings", sheetRow, detail: `Unknown setting "${key}", ignored.` });
      }
      return;
    }
    const value = parseSheetNumber(row[1]);
    if (value === null || value < 0) {
      warnings.push({ kind: "invalid-row", tab: "Settings", sheetRow, detail: `Row ${sheetRow} (${key}): value "${text(row[1])}" is not a number. Using ${DEFAULT_SETTINGS[key]}.` });
      return;
    }
    settings[key] = value;
  });
  return { settings, warnings };
}

// --- The bundled price book (Appendix B) ---

function buildDefault(): PriceBook {
  const { products } = parseProductRows(PRODUCTS_SEED, { fromSheet: false });
  const { options } = parseOptionRows(OPTIONS_SEED, { fromSheet: false });
  const { packages } = parsePackageRows(PACKAGES_SEED, products, { fromSheet: false });
  return { products, options, packages, settings: { ...DEFAULT_SETTINGS } };
}

export const DEFAULT_PRICE_BOOK: PriceBook = buildDefault();

// --- Merge: raw tabs from the Sheet → PriceBook + warnings ---

export type TabRead = { status: "ok"; rows: SheetRow[] } | { status: "missing" } | { status: "failed"; detail: string };

export interface RemotePriceBook {
  products: TabRead;
  options: TabRead;
  packages: TabRead;
  settings: TabRead;
}

export type TabSource = "sheet" | "bundled";

export interface MergedPriceBook {
  priceBook: PriceBook;
  warnings: ConfigWarning[];
  /** Where each part came from: a tab that is missing, empty or unreadable falls back to the seed. */
  sources: { products: TabSource; options: TabSource; packages: TabSource; settings: TabSource };
  /** True when any of the three price-book tabs is missing or empty (the seed action is offered). */
  needsSeed: boolean;
}

function tabFallbackWarning(tab: ConfigTab, read: TabRead): ConfigWarning | null {
  if (read.status === "missing") {
    return { kind: "tab-missing", tab, sheetRow: null, detail: `No "${tab}" tab yet. Using the built-in price book until it is created.` };
  }
  if (read.status === "failed") {
    return { kind: "fetch-failed", tab, sheetRow: null, detail: read.detail };
  }
  if (read.rows.every((r) => isBlank(r[0]))) {
    return { kind: "empty", tab, sheetRow: null, detail: `The "${tab}" tab has no rows. Using the built-in price book.` };
  }
  return null;
}

function usable(read: TabRead): read is { status: "ok"; rows: SheetRow[] } {
  return read.status === "ok" && read.rows.some((r) => !isBlank(r[0]));
}

export function mergePriceBook(remote: RemotePriceBook | null): MergedPriceBook {
  if (!remote) {
    return {
      priceBook: DEFAULT_PRICE_BOOK,
      warnings: [],
      sources: { products: "bundled", options: "bundled", packages: "bundled", settings: "bundled" },
      needsSeed: false,
    };
  }
  const warnings: ConfigWarning[] = [];

  let products = DEFAULT_PRICE_BOOK.products;
  let productsSource: TabSource = "bundled";
  if (usable(remote.products)) {
    const r = parseProductRows(remote.products.rows, { fromSheet: true });
    products = r.products;
    productsSource = "sheet";
    warnings.push(...r.warnings);
  } else {
    const w = tabFallbackWarning("Products", remote.products);
    if (w) warnings.push(w);
  }

  let options = DEFAULT_PRICE_BOOK.options;
  let optionsSource: TabSource = "bundled";
  if (usable(remote.options)) {
    const r = parseOptionRows(remote.options.rows, { fromSheet: true });
    options = r.options;
    optionsSource = "sheet";
    warnings.push(...r.warnings);
  } else {
    const w = tabFallbackWarning("Options", remote.options);
    if (w) warnings.push(w);
  }

  let packages: PackageTemplate[];
  let packagesSource: TabSource = "bundled";
  if (usable(remote.packages)) {
    const r = parsePackageRows(remote.packages.rows, products, { fromSheet: true });
    packages = r.packages;
    packagesSource = "sheet";
    warnings.push(...r.warnings);
  } else {
    // The seed packages, resolved against whichever products are in play.
    packages = parsePackageRows(PACKAGES_SEED, products, { fromSheet: false }).packages;
    const w = tabFallbackWarning("Packages", remote.packages);
    if (w) warnings.push(w);
  }

  let settings = { ...DEFAULT_SETTINGS };
  let settingsSource: TabSource = "bundled";
  if (remote.settings.status === "ok") {
    const r = parseSettingsRows(remote.settings.rows);
    settings = r.settings;
    settingsSource = "sheet";
    warnings.push(...r.warnings);
  } else {
    const w = tabFallbackWarning("Settings", remote.settings);
    if (w) warnings.push(w);
  }

  const needsSeed = [remote.products, remote.options, remote.packages].some(
    (t) => t.status === "missing" || (t.status === "ok" && !usable(t)),
  );

  return {
    priceBook: { products, options, packages, settings },
    warnings,
    sources: { products: productsSource, options: optionsSource, packages: packagesSource, settings: settingsSource },
    needsSeed,
  };
}

// Warnings that are Janelle's to-do list (a product or option without a price)
// rather than a problem. The builder banner hides them; the Price book page
// lists them.
export function isTodoWarning(w: ConfigWarning): boolean {
  return w.kind === "needs-price";
}

// --- Lookups ---

export function findProduct(pb: PriceBook, id: string | undefined): Product | undefined {
  return id ? pb.products.find((p) => p.id === id) : undefined;
}

/** Products the builder can offer in its picker: active and priced. */
export function pickableProducts(pb: PriceBook): Product[] {
  return pb.products.filter((p) => p.active && p.price !== null);
}

/** Options that apply to a product (by id or category), active and priced. */
export function optionsFor(pb: PriceBook, product: Pick<Product, "id" | "category"> | undefined): ProductOption[] {
  return pb.options.filter((o) => {
    if (!o.active || o.amount === null) return false;
    if (o.appliesTo.length === 0) return true;
    if (!product) return false;
    return o.appliesTo.includes(product.id) || o.appliesTo.includes(product.category.toLowerCase());
  });
}

// --- Floor and target prices (§7.2): the cost-plus logic, demoted to advice ---

export interface PriceGuide {
  floorUnit: number | null;
  targetUnit: number | null;
  floorDesign: number | null;
  targetDesign: number | null;
  flags: ("below-floor" | "above-market" | "no-market-data" | "no-price" | "no-estimate")[];
}

export function priceGuide(p: Product, s: PriceSettings): PriceGuide {
  const hasUnitEst = p.estUnitCost !== null || p.estMinutes !== null;
  const grossUp = 1 - Math.min(99, s.feesPct) / 100;
  const unitAt = (rate: number) => ((p.estUnitCost ?? 0) + ((p.estMinutes ?? 0) / 60) * rate) / grossUp;
  const floorUnit = hasUnitEst ? unitAt(s.hourlyFloor) : null;
  const targetUnit = hasUnitEst ? unitAt(s.hourlyTarget) : null;
  const floorDesign = p.estDesignHours !== null ? p.estDesignHours * s.hourlyFloor : null;
  const targetDesign = p.estDesignHours !== null ? p.estDesignHours * s.hourlyTarget : null;

  const flags: PriceGuide["flags"] = [];
  if (p.price === null) flags.push("no-price");
  if (!hasUnitEst && p.estDesignHours === null) flags.push("no-estimate");
  const belowUnit = p.price !== null && floorUnit !== null && p.price < floorUnit - 0.005;
  const belowDesign = floorDesign !== null && floorDesign > 0 && p.designFee < floorDesign - 0.005;
  if (belowUnit || belowDesign) flags.push("below-floor");
  if (p.marketLow === null && p.marketHigh === null) flags.push("no-market-data");
  else if (p.price !== null && p.marketHigh !== null && p.price > p.marketHigh) flags.push("above-market");
  return { floorUnit, targetUnit, floorDesign, targetDesign, flags };
}

// --- Seeding plan (pure; the Sheets module executes it) ---

export interface TabState {
  exists: boolean;
  /** Data rows with a non-blank first cell (header excluded). */
  dataRows: number;
}

export interface SeedState {
  products: TabState;
  options: TabState;
  packages: TabState;
  settings: TabState & { keys: string[] };
}

export interface SeedAction {
  tab: string;
  create: boolean;
  /** Header + rows to write from A1, or rows to append (for Settings). */
  mode: "write" | "append";
  rows: SheetRow[];
}

export function settingsSeedRows(): SheetRow[] {
  return PRICE_SETTING_KEYS.map((k) => [k, DEFAULT_SETTINGS[k]]);
}

// Only missing or empty tabs are written, and only missing Settings keys are
// appended. A tab Janelle has touched is never overwritten, so a second run is
// a no-op.
export function planSeed(state: SeedState): SeedAction[] {
  const actions: SeedAction[] = [];
  const tabs: [string, TabState, readonly string[], SheetRow[]][] = [
    [PRODUCTS_TAB, state.products, PRODUCTS_HEADER, PRODUCTS_SEED],
    [OPTIONS_TAB, state.options, OPTIONS_HEADER, OPTIONS_SEED],
    [PACKAGES_TAB, state.packages, PACKAGES_HEADER, PACKAGES_SEED],
  ];
  for (const [tab, st, header, rows] of tabs) {
    if (st.exists && st.dataRows > 0) continue;
    actions.push({ tab, create: !st.exists, mode: "write", rows: [[...header], ...rows] });
  }
  const have = new Set(state.settings.keys);
  const missing = settingsSeedRows().filter((r) => !have.has(String(r[0])));
  if (!state.settings.exists) {
    actions.push({ tab: SETTINGS_TAB, create: true, mode: "write", rows: [[...SETTINGS_HEADER], ...missing] });
  } else if (missing.length > 0) {
    actions.push({ tab: SETTINGS_TAB, create: false, mode: "append", rows: missing });
  }
  return actions;
}

// --- Quantities from the guest count (§8.2) ---

export function defaultQty(p: Pick<Product, "qtyBasis" | "qtyPer">, households: number, guests: number): number {
  if (p.qtyBasis === "household") return Math.max(0, Math.round(p.qtyPer * households));
  if (p.qtyBasis === "guest") return Math.max(0, Math.round(p.qtyPer * guests));
  return Math.max(0, Math.round(p.qtyPer));
}

// A package's sample price at a household count, for the Price book page
// (compare against competitor suite pricing). Pieces priced physical, fresh
// design, no options; unpriced pieces count as $0.
export function packageSample(
  pkg: PackageTemplate,
  pb: PriceBook,
  households: number,
): { subtotal: number; savings: number; total: number; perHousehold: number; unpriced: string[] } {
  const guests = households * pb.settings.guestsPerHousehold;
  let subtotal = 0;
  const unpriced: string[] = [];
  for (const pid of pkg.items) {
    const p = findProduct(pb, pid);
    if (!p) continue;
    if (p.price === null) unpriced.push(p.name);
    subtotal += Math.round((defaultQty(p, households, guests) * (p.price ?? 0) + p.designFee) * 100) / 100;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  const savings = Math.round(subtotal * pkg.bundlePct) / 100;
  const total = Math.round((subtotal - savings) * 100) / 100;
  return { subtotal, savings, total, perHousehold: households > 0 ? total / households : 0, unpriced };
}
