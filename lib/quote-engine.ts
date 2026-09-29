// Quote engine v2 (docs/quote-builder-redesign.md §6). Pure: no IO, no React.
//
// Two halves:
//   • computeTotals(config): the ONLY money math. Its input is the saved quote
//     config and nothing else: never the price book, never a snapshot.
//   • Builders (newQuote, addProduct, addPackage, …): the composition rules
//     used when a line is added or refreshed. These read the price book and
//     return a new config; they never touch totals directly.
//
// Order of operations (§6.3): lines → suite savings → services → one discount
// → rush → adjustment → shipping. Every money component is rounded to cents,
// so displayed lines always sum to the displayed total. Quotes converted from
// the old calculator (config.legacy) skip the rounding to keep the old
// engine's exact totals.

import { round2, formatPct } from "./money";
import {
  defaultQty,
  findProduct,
  type PackageTemplate,
  type PriceBook,
  type Product,
  type ProductOption,
} from "./quote-pricebook";
import type {
  DiscountReason,
  DraftConfigV5,
  LineOption,
  QuoteDiscount,
  QuoteGroup,
  QuoteLineV5,
} from "./quote-types";

export type IdGen = () => string;

export const defaultIdGen: IdGen = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export interface LineTotal {
  id: string;
  /** qty × (unit + per-piece options), physical lines; unit, digital lines. */
  pieces: number;
  /** Percent + flat options on this line. */
  options: number;
  /** Design fee after the reuse %, physical product/custom lines only. */
  design: number;
  total: number;
}

export interface GroupTotal {
  id: string;
  name: string;
  bundlePct: number;
  lineIds: string[];
  subtotal: number;
  savings: number;
}

export interface QuoteTotals {
  lines: LineTotal[];
  groups: GroupTotal[];
  itemsSubtotal: number;
  bundleSavings: number;
  services: { revisions: number; license: number; packaging: number; total: number };
  /** itemsSubtotal − bundleSavings + services: what the discount comes off. */
  base: number;
  discount: { amount: number; label: string } | null;
  rush: { amount: number; pct: number; label: string } | null;
  adjustment: { amount: number; label: string } | null;
  shipping: number | null;
  total: number;
  /** Expected deposit, capped at the total. Display only. */
  deposit: number;
  anyPhysical: boolean;
  isDigital: boolean;
}

function rounder(config: Pick<DraftConfigV5, "legacy">): (n: number) => number {
  return config.legacy ? (n: number) => n : round2;
}

function nonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function clampPct(n: number): number {
  return Math.min(100, nonNeg(n));
}

export function lineTotal(line: QuoteLineV5, reuseDesignPct: number, r: (n: number) => number = round2): LineTotal {
  const opts = line.options ?? [];
  const pctSum = opts.filter((o) => o.kind === "percent").reduce((s, o) => s + nonNeg(o.amount), 0);
  const flatSum = opts.filter((o) => o.kind === "flat").reduce((s, o) => s + nonNeg(o.amount), 0);
  const unit = nonNeg(line.unitPrice);

  // A digital product line is one flat file price; qty is not used.
  if (line.kind === "product" && line.digital) {
    const pieces = unit;
    const options = pieces * (pctSum / 100) + flatSum;
    return { id: line.id, pieces, options, design: 0, total: r(pieces + options) };
  }

  const perPiece = opts.filter((o) => o.kind === "per-piece").reduce((s, o) => s + nonNeg(o.amount), 0);
  const pieces = nonNeg(line.qty) * (unit + perPiece);
  const options = pieces * (pctSum / 100) + flatSum;
  const fee = nonNeg(line.designFee);
  const design = line.reuseDesign ? fee * (clampPct(reuseDesignPct) / 100) : fee;
  return { id: line.id, pieces, options, design, total: r(pieces + options + design) };
}

const REASON_LABEL: Record<DiscountReason, string> = {
  vendor: "Vendor referral",
  family: "Family & friends",
  promo: "Promo",
  custom: "Discount",
};

export function discountName(d: Pick<QuoteDiscount, "reason" | "label">): string {
  return d.label?.trim() || REASON_LABEL[d.reason];
}

export function isDigitalQuote(config: Pick<DraftConfigV5, "lines">): boolean {
  return config.lines.length > 0 && config.lines.every((l) => l.digital);
}

export function computeTotals(config: DraftConfigV5): QuoteTotals {
  const r = rounder(config);
  const lines = config.lines.map((l) => lineTotal(l, config.reuseDesignPct, r));
  const byId = new Map(lines.map((l) => [l.id, l]));

  const groups: GroupTotal[] = config.groups.map((g) => {
    const members = config.lines.filter((l) => l.groupId === g.id);
    const subtotal = r(members.reduce((s, l) => s + (byId.get(l.id)?.total ?? 0), 0));
    return {
      id: g.id,
      name: g.name,
      bundlePct: clampPct(g.bundlePct),
      lineIds: members.map((l) => l.id),
      subtotal,
      savings: r((subtotal * clampPct(g.bundlePct)) / 100),
    };
  });

  const itemsSubtotal = r(lines.reduce((s, l) => s + l.total, 0));
  const bundleSavings = r(groups.reduce((s, g) => s + g.savings, 0));

  const anyPhysical = config.lines.some((l) => !l.digital);
  const sv = config.services;
  const revisions = r(nonNeg(Math.round(sv.extraRevisions)) * nonNeg(sv.revisionRoundPrice));
  const license = sv.license ? r(nonNeg(sv.licenseFee)) : 0;
  const packaging = anyPhysical ? r(nonNeg(sv.packagingFee)) : 0;
  const servicesTotal = r(revisions + license + packaging);

  const base = r(itemsSubtotal - bundleSavings + servicesTotal);

  let discount: QuoteTotals["discount"] = null;
  if (config.discount && nonNeg(config.discount.value) > 0) {
    const d = config.discount;
    const amount =
      d.kind === "percent" ? r((base * clampPct(d.value)) / 100) : r(Math.min(nonNeg(d.value), base));
    const name = discountName(d);
    discount = { amount, label: d.kind === "percent" ? `${name} (${formatPct(clampPct(d.value))})` : name };
  }
  const discountAmount = discount?.amount ?? 0;

  const rush = sv.rush
    ? {
        amount: r(((base - discountAmount) * nonNeg(sv.rushPct)) / 100),
        pct: nonNeg(sv.rushPct),
        label: `Rush production (+${formatPct(nonNeg(sv.rushPct))})`,
      }
    : null;
  const rushAmount = rush?.amount ?? 0;

  const adjustment =
    config.adjustment && config.adjustment.amount !== 0 && Number.isFinite(config.adjustment.amount)
      ? { amount: r(config.adjustment.amount), label: config.adjustment.label.trim() || "Adjustment" }
      : null;

  const shipping = config.shipping === null || config.shipping === undefined ? null : r(nonNeg(config.shipping));

  const total = r(base - discountAmount + rushAmount + (adjustment?.amount ?? 0) + (shipping ?? 0));

  return {
    lines,
    groups,
    itemsSubtotal,
    bundleSavings,
    services: { revisions, license, packaging, total: servicesTotal },
    base,
    discount,
    rush,
    adjustment,
    shipping,
    total,
    deposit: Math.min(nonNeg(config.deposit), Math.max(total, 0)),
    anyPhysical,
    isDigital: isDigitalQuote(config),
  };
}

// ---------------------------------------------------------------------------
// Builders (read the price book; return a new config)
// ---------------------------------------------------------------------------

export function newQuote(pb: PriceBook, opts?: { households?: number; now?: string }): DraftConfigV5 {
  const households = opts?.households ?? 75;
  const s = pb.settings;
  return {
    schema: 5,
    households,
    guests: Math.round(households * s.guestsPerHousehold),
    groups: [],
    lines: [],
    services: {
      rush: false,
      rushPct: s.rushPct,
      extraRevisions: 0,
      revisionRoundPrice: s.revisionRoundPrice,
      license: false,
      licenseFee: s.licenseFee,
      packagingFee: s.packagingFee,
    },
    reuseDesignPct: s.reuseDesignPct,
    discount: null,
    adjustment: null,
    shipping: null,
    deposit: s.depositAmount,
    pricedAt: opts?.now ?? new Date().toISOString(),
    health: {
      revisionHours: s.revisionHours,
      feesPct: s.feesPct,
      hourlyTarget: s.hourlyTarget,
      hourlyFloor: s.hourlyFloor,
    },
  };
}

function estOf(p: Product): QuoteLineV5["est"] {
  if (p.estUnitCost === null && p.estMinutes === null && p.estDesignHours === null) return undefined;
  return { unitCost: p.estUnitCost ?? 0, minutes: p.estMinutes ?? 0, designHours: p.estDesignHours ?? 0 };
}

/** A line for a price-book product, quantity linked to the guest count. */
export function makeProductLine(
  config: Pick<DraftConfigV5, "households" | "guests">,
  product: Product,
  opts?: { groupId?: string; digital?: boolean; id?: string },
): QuoteLineV5 {
  const digital = !!opts?.digital && product.digitalPrice !== null;
  const price = digital ? product.digitalPrice : product.price;
  const qtyLink =
    product.qtyBasis === "fixed" ? null : { basis: product.qtyBasis, per: product.qtyPer };
  return {
    id: opts?.id ?? defaultIdGen(),
    kind: "product",
    productId: product.id,
    ...(opts?.groupId ? { groupId: opts.groupId } : {}),
    name: product.name,
    qty: defaultQty(product, config.households, config.guests),
    qtyLink,
    unitPrice: price ?? 0,
    ...(price !== null ? { listUnitPrice: price } : {}),
    designFee: product.designFee,
    listDesignFee: product.designFee,
    digital,
    options: [],
    ...(estOf(product) ? { est: estOf(product) } : {}),
  };
}

// Insert a line at the end of its group (groups stay contiguous) or at the end.
function insertLine(lines: QuoteLineV5[], line: QuoteLineV5): QuoteLineV5[] {
  if (!line.groupId) return [...lines, line];
  let at = -1;
  lines.forEach((l, i) => {
    if (l.groupId === line.groupId) at = i;
  });
  if (at < 0) return [...lines, line];
  return [...lines.slice(0, at + 1), line, ...lines.slice(at + 1)];
}

export function addProduct(
  config: DraftConfigV5,
  product: Product,
  opts?: { groupId?: string; digital?: boolean; idGen?: IdGen },
): DraftConfigV5 {
  const line = makeProductLine(config, product, { ...opts, id: (opts?.idGen ?? defaultIdGen)() });
  return { ...config, lines: insertLine(config.lines, line) };
}

export function addPackage(
  config: DraftConfigV5,
  pkg: PackageTemplate,
  pb: PriceBook,
  idGen: IdGen = defaultIdGen,
): DraftConfigV5 {
  const group: QuoteGroup = { id: idGen(), packageId: pkg.id, name: pkg.name, bundlePct: pkg.bundlePct };
  const lines: QuoteLineV5[] = [];
  for (const pid of pkg.items) {
    const product = findProduct(pb, pid);
    if (!product) continue; // unknown id: warned by the price book, skipped here
    lines.push(
      makeProductLine(config, product, { groupId: group.id, digital: pkg.delivery === "digital", id: idGen() }),
    );
  }
  return { ...config, groups: [...config.groups, group], lines: [...config.lines, ...lines] };
}

export function addCustomLine(
  config: DraftConfigV5,
  input: { name: string; qty: number; unitPrice: number; digital?: boolean; groupId?: string },
  idGen: IdGen = defaultIdGen,
): DraftConfigV5 {
  const line: QuoteLineV5 = {
    id: idGen(),
    kind: "custom",
    ...(input.groupId ? { groupId: input.groupId } : {}),
    name: input.name,
    qty: nonNeg(input.qty),
    qtyLink: null,
    unitPrice: nonNeg(input.unitPrice),
    designFee: 0,
    digital: !!input.digital,
    options: [],
  };
  return { ...config, lines: insertLine(config.lines, line) };
}

export function updateLine(config: DraftConfigV5, id: string, patch: Partial<QuoteLineV5>): DraftConfigV5 {
  return { ...config, lines: config.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) };
}

/** Typing a quantity breaks the guest-count link. */
export function setLineQty(config: DraftConfigV5, id: string, qty: number): DraftConfigV5 {
  return updateLine(config, id, { qty: Math.max(0, Math.round(qty)), qtyLink: null });
}

/** Re-link a line to the guest count using its product's rule. */
export function relinkLine(config: DraftConfigV5, id: string, pb: PriceBook): DraftConfigV5 {
  const line = config.lines.find((l) => l.id === id);
  const product = findProduct(pb, line?.productId);
  if (!line || !product || product.qtyBasis === "fixed") return config;
  const link = { basis: product.qtyBasis, per: product.qtyPer };
  return updateLine(config, id, { qtyLink: link, qty: linkedQty(link, config.households, config.guests) });
}

function linkedQty(link: { basis: "household" | "guest"; per: number }, households: number, guests: number): number {
  return Math.max(0, Math.round(link.per * (link.basis === "household" ? households : guests)));
}

/** Changing households/guests re-quantifies linked lines only (§8.2). */
export function setGuestCounts(config: DraftConfigV5, households: number, guests: number): DraftConfigV5 {
  const h = Math.max(0, Math.round(households));
  const g = Math.max(0, Math.round(guests));
  return {
    ...config,
    households: h,
    guests: g,
    lines: config.lines.map((l) => (l.qtyLink ? { ...l, qty: linkedQty(l.qtyLink, h, g) } : l)),
  };
}

/** Physical ⇄ digital for a product line with a digital price; swaps the unit price. */
export function setLineDigital(config: DraftConfigV5, id: string, digital: boolean, pb: PriceBook): DraftConfigV5 {
  const line = config.lines.find((l) => l.id === id);
  if (!line) return config;
  if (line.kind === "custom") return updateLine(config, id, { digital });
  const product = findProduct(pb, line.productId);
  if (!product || product.digitalPrice === null) return digital ? config : updateLine(config, id, { digital });
  const price = digital ? product.digitalPrice : product.price ?? 0;
  const list = digital ? product.digitalPrice : product.price;
  return updateLine(config, id, {
    digital,
    unitPrice: price,
    ...(list !== null ? { listUnitPrice: list } : { listUnitPrice: undefined }),
  });
}

export function resolveOption(o: ProductOption): LineOption {
  return {
    id: o.id,
    name: o.name,
    kind: o.kind,
    amount: o.amount ?? 0,
    ...(o.estCost !== null ? { estCost: o.estCost } : {}),
  };
}

export function toggleOption(config: DraftConfigV5, lineId: string, option: ProductOption): DraftConfigV5 {
  const line = config.lines.find((l) => l.id === lineId);
  if (!line) return config;
  const has = line.options.some((o) => o.id === option.id);
  return updateLine(config, lineId, {
    options: has ? line.options.filter((o) => o.id !== option.id) : [...line.options, resolveOption(option)],
  });
}

export function removeLine(config: DraftConfigV5, id: string): DraftConfigV5 {
  return { ...config, lines: config.lines.filter((l) => l.id !== id) };
}

export function removeGroup(config: DraftConfigV5, groupId: string): DraftConfigV5 {
  return {
    ...config,
    groups: config.groups.filter((g) => g.id !== groupId),
    lines: config.lines.filter((l) => l.groupId !== groupId),
  };
}

export function duplicateLine(config: DraftConfigV5, id: string, idGen: IdGen = defaultIdGen): DraftConfigV5 {
  const i = config.lines.findIndex((l) => l.id === id);
  if (i < 0) return config;
  const copy = { ...config.lines[i], id: idGen(), options: [...config.lines[i].options] };
  return { ...config, lines: [...config.lines.slice(0, i + 1), copy, ...config.lines.slice(i + 1)] };
}

/** Move a line out of its group (groupId undefined) or into another group. */
export function moveLineToGroup(config: DraftConfigV5, id: string, groupId: string | undefined): DraftConfigV5 {
  const line = config.lines.find((l) => l.id === id);
  if (!line) return config;
  const rest = config.lines.filter((l) => l.id !== id);
  const moved: QuoteLineV5 = { ...line };
  if (groupId) moved.groupId = groupId;
  else delete moved.groupId;
  return { ...config, lines: insertLine(rest, moved) };
}

/**
 * "Set total…": create or update the adjustment so the total lands exactly on
 * `target` (§6.4 invariant 8). The label is kept; a zero adjustment clears it.
 */
export function setTargetTotal(config: DraftConfigV5, target: number, label?: string): DraftConfigV5 {
  const r = rounder(config);
  const t = r(Math.max(0, target));
  const without = computeTotals({ ...config, adjustment: null }).total;
  const amount = r(t - without);
  if (amount === 0) return { ...config, adjustment: null };
  return {
    ...config,
    adjustment: { amount, label: label ?? config.adjustment?.label ?? "Courtesy adjustment" },
  };
}

// ---------------------------------------------------------------------------
// Price refresh (§8.3): never automatic
// ---------------------------------------------------------------------------

export interface PriceChange {
  key: string;
  lineId: string;
  lineName: string;
  field: "unitPrice" | "designFee" | "option";
  optionId?: string;
  from: number;
  to: number;
}

export function diffAgainstPriceBook(config: DraftConfigV5, pb: PriceBook): PriceChange[] {
  const out: PriceChange[] = [];
  for (const l of config.lines) {
    const p = findProduct(pb, l.productId);
    if (!p) continue;
    const now = l.digital ? p.digitalPrice : p.price;
    if (now !== null && l.listUnitPrice !== undefined && Math.abs(now - l.listUnitPrice) > 0.0001) {
      out.push({ key: `${l.id}:unit`, lineId: l.id, lineName: l.name, field: "unitPrice", from: l.listUnitPrice, to: now });
    }
    if (!l.digital && l.listDesignFee !== undefined && Math.abs(p.designFee - l.listDesignFee) > 0.0001) {
      out.push({ key: `${l.id}:design`, lineId: l.id, lineName: l.name, field: "designFee", from: l.listDesignFee, to: p.designFee });
    }
    for (const o of l.options) {
      const cur = pb.options.find((x) => x.id === o.id);
      if (cur && cur.amount !== null && Math.abs(cur.amount - o.amount) > 0.0001) {
        out.push({ key: `${l.id}:opt:${o.id}`, lineId: l.id, lineName: `${l.name} · ${o.name}`, field: "option", optionId: o.id, from: o.amount, to: cur.amount });
      }
    }
  }
  return out;
}

export function applyRefresh(config: DraftConfigV5, changes: PriceChange[], now: string): DraftConfigV5 {
  let next = config;
  for (const c of changes) {
    const l = next.lines.find((x) => x.id === c.lineId);
    if (!l) continue;
    if (c.field === "unitPrice") next = updateLine(next, l.id, { unitPrice: c.to, listUnitPrice: c.to });
    else if (c.field === "designFee") next = updateLine(next, l.id, { designFee: c.to, listDesignFee: c.to });
    else next = updateLine(next, l.id, { options: l.options.map((o) => (o.id === c.optionId ? { ...o, amount: c.to } : o)) });
  }
  return { ...next, pricedAt: now };
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

function collapse(names: string[]): string {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const n of names) {
    if (!counts.has(n)) order.push(n);
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return order.map((n) => ((counts.get(n) ?? 1) > 1 ? `${n} ×${counts.get(n)}` : n)).join(" + ");
}

/**
 * The quote's display name (dashboard, Sheet, client page): group names and
 * standalone product lines, in order; a custom-only quote falls back to its
 * custom line names.
 */
export function quoteDisplayName(config: Pick<DraftConfigV5, "groups" | "lines">): string {
  const groupName = new Map(config.groups.map((g) => [g.id, g.name]));
  const seenGroups = new Set<string>();
  const main: string[] = [];
  const custom: string[] = [];
  for (const l of config.lines) {
    if (l.groupId && groupName.has(l.groupId)) {
      if (!seenGroups.has(l.groupId)) {
        seenGroups.add(l.groupId);
        main.push(groupName.get(l.groupId)!);
      }
    } else if (l.kind === "product") {
      main.push(l.name);
    } else if (!l.system) {
      custom.push(l.name.trim() || "Custom item");
    }
  }
  // Groups that lost all their lines still name the quote.
  for (const g of config.groups) if (!seenGroups.has(g.id)) main.push(g.name);
  if (main.length > 0) return collapse(main);
  if (custom.length > 0) return collapse(custom);
  return "—";
}
