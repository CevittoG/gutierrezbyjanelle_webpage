// Shared types + pure helpers for the Phase 3 client portal.
//
// No IO, no server-only — imported by both the server (sheets reader, routes)
// and the client. The PublicQuote projector lives here too so the client-safe
// shape is defined in exactly one place and can never accidentally carry a
// secret (cost rate, margin %, the full Draft) across to a public route.

import type { Draft, DraftConfig } from "./quote-calc-drafts";
import type { PackageLineResult, QuoteBreakdown } from "./quote-calc-totals";
import { CatalogItem, ITEM_CATALOG, PACKAGES } from "./quote-calc-logic";
import { packagesDisplayName } from "./quote-calc-summary";

export type LinkStatus = "active" | "revoked" | "";

// The server-managed columns N–T on the Quotes tab. Kept out of the Draft /
// _data JSON so a public token / lifecycle state never rides the client-synced
// draft.
export interface PortalMeta {
  id: string;
  driveFolderId: string;
  publicToken: string;
  linkStatus: LinkStatus;
  /** Raw sheet value: an ISO date/datetime, or "" for no expiry. */
  expiresAt: string;
  /** ISO timestamp the client approved their proofs, or "" if not yet. */
  approvedAt: string;
  /** Raw stage key from the sheet (normalize via `normalizeStage`); "" ⇒ inquiry. */
  stage: string;
  /** Name the client typed when approving, or "". */
  approvedBy: string;
  /** Dollar amount of the deposit Janelle has recorded as paid; 0 if none. */
  depositPaid: number;
}

// --- Project lifecycle stages ---
//
// One ordered pipeline drives both the admin selector and the client tracker.
// Physical and digital projects share every stage; only `production` and
// `delivery` differ in wording. All copy lives here, in one module.

export type ProjectType = "physical" | "digital";

export type ProjectStage =
  | "inquiry"
  | "quote"
  | "deposit"
  | "proofing"
  | "approval"
  | "balance"
  | "production"
  | "delivery"
  | "completed";

export const STAGE_ORDER: ProjectStage[] = [
  "inquiry",
  "quote",
  "deposit",
  "proofing",
  "approval",
  "balance",
  "production",
  "delivery",
  "completed",
];

export interface StageCopy {
  /** Short label — Janelle's dropdown + the client tracker node. */
  adminLabel: string;
  /** Client-facing headline for the current-stage banner. */
  clientHeadline: string;
  /** Client-facing one-liner under the headline. */
  clientSub: string;
}

// Stages that read the same for both project types use a flat StageCopy; the
// two that diverge carry a per-type record resolved by `resolveStageCopy`.
const STAGE_COPY: Record<ProjectStage, StageCopy | Record<ProjectType, StageCopy>> = {
  inquiry: {
    adminLabel: "Inquiry",
    clientHeadline: "Inquiry received",
    clientSub: "Thank you for reaching out — I'm putting together your custom quote.",
  },
  quote: {
    adminLabel: "Quote sent",
    clientHeadline: "Your quote is ready",
    clientSub: "Here's everything we discussed. Look it over and tell me what you think.",
  },
  deposit: {
    adminLabel: "Deposit",
    clientHeadline: "Reserving your date",
    clientSub: "A deposit reserves your spot on my calendar so I can begin.",
  },
  proofing: {
    adminLabel: "Designing proofs",
    clientHeadline: "Designing your proofs",
    clientSub: "I'm bringing your suite to life — your first proofs will appear here soon.",
  },
  approval: {
    adminLabel: "Awaiting approval",
    clientHeadline: "Ready for your approval",
    clientSub: "Your proofs are ready. Review them above and approve when everything looks perfect.",
  },
  balance: {
    adminLabel: "Balance due",
    clientHeadline: "Approved — balance due",
    clientSub: "Love it! The remaining balance is due before I begin final production.",
  },
  production: {
    physical: {
      adminLabel: "In production",
      clientHeadline: "In production",
      clientSub: "Your pieces are being printed and assembled by hand.",
    },
    digital: {
      adminLabel: "Finalizing files",
      clientHeadline: "Finalizing your files",
      clientSub: "I'm preparing your final, print-ready files.",
    },
  },
  delivery: {
    physical: {
      adminLabel: "Shipping",
      clientHeadline: "On its way",
      clientSub: "Your order is packed and headed to you — tracking to follow.",
    },
    digital: {
      adminLabel: "Delivered",
      clientHeadline: "Delivered",
      clientSub: "Your final files have been sent. Check your inbox!",
    },
  },
  completed: {
    adminLabel: "Completed",
    clientHeadline: "All wrapped up",
    clientSub: "It was such a joy creating this with you. Thank you!",
  },
};

export function stageIndex(stage: ProjectStage): number {
  return STAGE_ORDER.indexOf(stage);
}

// Coerce a raw sheet value to a known stage. Blank / unknown ⇒ "inquiry".
export function normalizeStage(raw: string | undefined | null): ProjectStage {
  const s = (raw ?? "").trim().toLowerCase();
  return (STAGE_ORDER as string[]).includes(s) ? (s as ProjectStage) : "inquiry";
}

export function resolveStageCopy(stage: ProjectStage, type: ProjectType): StageCopy {
  const entry = STAGE_COPY[stage];
  return "adminLabel" in entry ? entry : entry[type];
}

// The next stage in the pipeline (clamped at the last). Used by the client
// approval action to auto-advance `approval → balance`.
export function nextStage(stage: ProjectStage): ProjectStage {
  const i = stageIndex(stage);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return stage;
  return STAGE_ORDER[i + 1];
}

// Payment status is *derived* from the stage — no money is ever entered.
// Janelle advances the stage once she's received the payment offline.
export function isDepositPaid(stage: ProjectStage): boolean {
  return stageIndex(stage) > stageIndex("deposit");
}
export function isBalancePaid(stage: ProjectStage): boolean {
  return stageIndex(stage) > stageIndex("balance");
}

// A quote is "digital" only when *every* package line is digital — any physical
// piece pulls the whole project into the physical flow (it must be produced and
// shipped). Mirrors the per-line digital rule used in `buildIncludedPieces`.
export function isDigitalQuote(config: DraftConfig): boolean {
  return (
    config.packages.length > 0 &&
    config.packages.every((line) =>
      line.pkg === "individual" ? line.individualDigital ?? false : PACKAGES[line.pkg].isDigital,
    )
  );
}
export function projectTypeOf(config: DraftConfig): ProjectType {
  return isDigitalQuote(config) ? "digital" : "physical";
}

export function isLinkExpired(expiresAt: string, now: Date = new Date()): boolean {
  const raw = (expiresAt ?? "").trim();
  if (!raw) return false; // no expiry set
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return false; // unparseable → don't lock the client out
  return now.getTime() >= t;
}

export function isLinkActive(
  meta: Pick<PortalMeta, "linkStatus" | "expiresAt">,
  now: Date = new Date(),
): boolean {
  return meta.linkStatus === "active" && !isLinkExpired(meta.expiresAt, now);
}

// --- The client-safe quote projection ---

export interface PublicQuoteFile {
  id: string;
  name: string;
  kind: "image" | "pdf";
  url: string; // server proxy: /q/<token>/file/<id>
}

// One priced line on the client's investment table — a package line, an
// à-la-carte add-on, or a misc item. Selling price only; never the cost buildup.
export interface PublicQuoteLine {
  label: string;
  price: number; // list price (before quote-wide savings)
  kind: "package" | "addon" | "misc";
}

// Clients see what's included, an itemized investment, how much they save, the
// total, and the deposit/balance split — never the cost buildup
// (design/production/admin/margin) or any per-item rate.
export interface PublicQuote {
  clientName: string;
  eventType: string;
  eventDate: string; // formatted for display
  packageName: string;
  includedPieces: string[];
  lineItems: PublicQuoteLine[]; // packages + add-ons + misc, each at list price
  subtotal: number; // sum of lineItems (before savings/rush)
  savings: number; // total discount amount (>= 0); 0 when no discount applies
  rush: number; // rush surcharge (>= 0); 0 when no rush
  total: number; // after savings + rush, before shipping — same as the printed PDF
  depositExpected: number; // the fixed deposit to start proofs (capped at total); 0 when none configured
  depositPaid: number; // amount Janelle has recorded as received (capped at total)
  balanceRemaining: number; // total − depositPaid (>= 0)
  proofs: { images: PublicQuoteFile[]; pdfs: PublicQuoteFile[] };
  clientNote: string; // Janelle's client-facing message; "" when none set
}

function formatEventDate(iso: string): string {
  if (!iso) return "TBD";
  // Date-only input arrives as YYYY-MM-DD; parse without timezone shift.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildIncludedPieces(
  config: DraftConfig,
  breakdown: QuoteBreakdown,
  catalog: CatalogItem[],
): string[] {
  const pieces: string[] = [];

  // Union of pieces across every package line, each sized by its own qty.
  for (const line of config.packages) {
    const pkgDef = PACKAGES[line.pkg];
    const isDigital = line.pkg === "individual" ? (line.individualDigital ?? false) : pkgDef.isDigital;
    const qty = line.qty;

    const pieceLabel = (label: string, fixed: number | undefined, catalogQty: number): string => {
      const count = fixed !== undefined ? `${fixed} pcs` : isDigital ? "design" : `${catalogQty * qty} pcs`;
      return `${label} — ${count}`;
    };

    if (line.pkg === "individual") {
      const cat = catalog.find((i) => i.key === (line.individualItem ?? "iInvite"));
      if (cat) pieces.push(pieceLabel(cat.label, cat.fixed, cat.qty));
    } else {
      for (const it of pkgDef.items) {
        const k = typeof it === "string" ? it : it.key;
        const label =
          (typeof it !== "string" && it.displayLabel) || catalog.find((i) => i.key === k)?.label || k;
        const cat = catalog.find((i) => i.key === k);
        pieces.push(pieceLabel(label, cat?.fixed, cat?.qty ?? 0));
      }
    }
  }

  // Surface à-la-carte and misc add-ons by name (their price sits in categories.addOns).
  for (const a of breakdown.addOnLines) pieces.push(`${a.label} × ${a.qty}`);
  for (const m of breakdown.miscLines) pieces.push(`${m.label} × ${m.qty}`);
  return pieces;
}

// Display name for a single package line including piece count.
// For `individual` lines: "Games — 60 pcs" (or "design" when digital).
// For suite packages: just the suite name (e.g. "Sweet Suite").
function packageLineLabel(line: PackageLineResult, catalog: CatalogItem[]): string {
  if (line.pkg === "individual") {
    const cat = catalog.find((i) => i.key === (line.individualItem ?? "iInvite"));
    const base = cat?.label ?? line.individualItem ?? "Individual item";
    if (line.individualDigital) return `${base} — design`;
    if (cat) {
      const count =
        cat.fixed !== undefined ? `${cat.fixed} pcs` : `${cat.qty * line.qty} pcs`;
      return `${base} — ${count}`;
    }
    return base;
  }
  return PACKAGES[line.pkg]?.name ?? line.pkg;
}

// Project a full Draft + its recomputed breakdown down to the client-safe shape.
// Everything secret (assumptionsSnapshot, per-item rates, the cost buildup) is
// dropped here by construction — only the fields below ever leave the server.
// `depositPaid` is the amount Janelle has recorded as received (from PortalMeta).
export function buildPublicQuote(
  draft: Draft,
  breakdown: QuoteBreakdown,
  files: PublicQuoteFile[],
  catalog: CatalogItem[] = ITEM_CATALOG,
  depositPaid = 0,
): PublicQuote {
  const { config } = draft;
  const savings =
    breakdown.discountAmount +
    breakdown.vendorAmount +
    breakdown.packageDiscountAmount +
    breakdown.familyFriendsAmount;

  // Itemized lines at list price (before quote-wide savings): one per package
  // line, then à-la-carte add-ons, then misc. `subtotal − savings + rush` closes
  // to `finalPrice` (verified against the engine buildup).
  const lineItems: PublicQuoteLine[] = [
    ...breakdown.packageLines.map((pl) => ({
      label: packageLineLabel(pl, catalog),
      price: pl.adjustedBeforeDiscount,
      kind: "package" as const,
    })),
    ...breakdown.addOnLines.map((a) => ({
      label: a.qty > 1 ? `${a.label} × ${a.qty}` : a.label,
      price: a.result.price,
      kind: "addon" as const,
    })),
    ...breakdown.miscLines.map((m) => ({
      label: m.qty > 1 ? `${m.label} × ${m.qty}` : m.label,
      price: m.total,
      kind: "misc" as const,
    })),
  ];
  const subtotal = breakdown.adjustedBeforeDiscount + breakdown.addOnsTotal + breakdown.miscTotal;

  const total = breakdown.finalPrice;
  const clampToTotal = (n: number) => Math.min(Math.max(n || 0, 0), total);
  const depositExpected = clampToTotal(draft.assumptionsSnapshot.depositAmount || 0);
  const paid = clampToTotal(depositPaid);
  const balanceRemaining = Math.max(total - paid, 0);

  return {
    clientName: draft.client.name || "",
    eventType: draft.client.eventType || "",
    eventDate: formatEventDate(draft.client.eventDate),
    packageName: packagesDisplayName(config.packages),
    includedPieces: buildIncludedPieces(config, breakdown, catalog),
    lineItems,
    subtotal,
    savings,
    rush: breakdown.rushAmount,
    total,
    depositExpected,
    depositPaid: paid,
    balanceRemaining,
    proofs: {
      images: files.filter((f) => f.kind === "image"),
      pdfs: files.filter((f) => f.kind === "pdf"),
    },
    clientNote: draft.client.clientNotes || "",
  };
}

// --- Client-facing progress projection ---

export interface PublicProgressStep {
  key: ProjectStage;
  label: string;
  state: "done" | "current" | "upcoming";
}

export interface PublicProgress {
  stage: ProjectStage;
  headline: string;
  sub: string;
  steps: PublicProgressStep[];
  /** True only at the `approval` stage — gates the client approve action. */
  awaitingApproval: boolean;
  approvedBy: string; // "" until the client approves
  approvedAt: string; // ISO timestamp, "" until approved
}

// Build the stage tracker + current-stage copy for a quote, resolving the
// physical/digital wording. Pure: derives everything from portal meta + type.
export function buildPublicProgress(
  meta: Pick<PortalMeta, "stage" | "approvedBy" | "approvedAt">,
  type: ProjectType,
): PublicProgress {
  const stage = normalizeStage(meta.stage);
  const currentIdx = stageIndex(stage);
  const copy = resolveStageCopy(stage, type);
  const steps: PublicProgressStep[] = STAGE_ORDER.map((key, i) => ({
    key,
    label: resolveStageCopy(key, type).adminLabel,
    state: i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming",
  }));
  return {
    stage,
    headline: copy.clientHeadline,
    sub: copy.clientSub,
    steps,
    awaitingApproval: stage === "approval",
    approvedBy: meta.approvedBy || "",
    approvedAt: meta.approvedAt || "",
  };
}
