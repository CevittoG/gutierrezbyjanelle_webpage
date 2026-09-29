// Shared types + pure helpers for the Phase 3 client portal.
//
// No IO, no server-only — imported by both the server (sheets reader, routes)
// and the client. The PublicQuote projector lives here too so the client-safe
// shape is defined in exactly one place and can never accidentally carry a
// secret (cost rate, margin %, the full Draft) across to a public route.

import type { Draft } from "./quote-calc-drafts";
import { isDigitalQuote as isDigitalConfig, quoteDisplayName, type QuoteTotals } from "./quote-engine";
import type { DraftConfigV5, QuoteLineV5 } from "./quote-types";

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

// A quote is "digital" only when *every* line (custom lines included) is
// digital: any physical piece pulls the whole project into the physical flow
// (it must be produced and shipped). An empty quote reads as physical.
export function isDigitalQuote(config: Pick<DraftConfigV5, "lines">): boolean {
  return isDigitalConfig(config);
}
export function projectTypeOf(config: Pick<DraftConfigV5, "lines">): ProjectType {
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

// PublicQuote v2 (docs/quote-builder-redesign.md §10.2). Selling prices only:
// never listUnitPrice, estimates, health, productId, option costs, `legacy`,
// or the hidden notes. Built from computeTotals(config) and nothing else.

export interface PublicPiece {
  name: string;
  /** null for a digital file. */
  qty: number | null;
  detail?: string;
}

export interface PublicGroup {
  name: string;
  pieces: PublicPiece[];
  subtotal: number;
  savingsPct: number;
  savings: number;
}

export interface PublicExtra extends PublicPiece {
  price: number;
  /** Bullet list (e.g. the pieces of a suite converted from the old calculator). */
  includes?: string[];
}

export interface PublicQuote {
  clientName: string;
  eventType: string;
  eventDate: string; // formatted for display
  title: string;
  groups: PublicGroup[];
  extras: PublicExtra[];
  services: { label: string; price: number }[];
  discount: { label: string; amount: number } | null;
  rush: { label: string; amount: number } | null;
  adjustment: { label: string; amount: number } | null;
  /** null ⇒ "added later" (footnote). */
  shipping: number | null;
  /** Groups + extras + services, before savings/discount. */
  subtotal: number;
  /** Suite savings + the discount. */
  savings: number;
  total: number;
  depositExpected: number;
  depositPaid: number;
  balanceRemaining: number;
  /** Quotes converted from the old calculator keep their whole-dollar display. */
  wholeDollars: boolean;
  anyPhysical: boolean;
  proofs: { images: PublicQuoteFile[]; pdfs: PublicQuoteFile[] };
  clientNote: string;
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

function pieceOf(l: QuoteLineV5): PublicPiece {
  const optionNames = l.options.map((o) => o.name);
  const detail = [l.detail, ...optionNames, l.reuseDesign ? "adapted design" : null].filter(Boolean).join(" · ");
  const digitalFile = l.kind === "product" && l.digital;
  return {
    name: l.name.trim() || "Custom item",
    qty: digitalFile ? null : l.qty,
    ...(detail ? { detail } : digitalFile ? { detail: "digital file" } : {}),
  };
}

// Project a v5 Draft + its totals down to the client-safe shape. Everything
// secret is dropped here by construction: only the fields below ever leave
// the server. `depositPaid` is what Janelle recorded as received (PortalMeta).
export function buildPublicQuote(
  draft: Draft,
  totals: QuoteTotals,
  files: PublicQuoteFile[],
  depositPaid = 0,
): PublicQuote {
  const { config } = draft;
  const lineTotal = new Map(totals.lines.map((l) => [l.id, l.total]));
  const grouped = new Set<string>();

  const groups: PublicGroup[] = totals.groups
    .filter((g) => g.lineIds.length > 0)
    .map((g) => {
      g.lineIds.forEach((id) => grouped.add(id));
      return {
        name: g.name,
        pieces: config.lines.filter((l) => l.groupId === g.id).map(pieceOf),
        subtotal: g.subtotal,
        savingsPct: g.bundlePct,
        savings: g.savings,
      };
    });

  const extras: PublicExtra[] = config.lines
    .filter((l) => !grouped.has(l.id))
    .map((l) => {
      const piece = pieceOf(l);
      // A converted line is a fixed price for the whole piece: its qty of 1 says nothing.
      const qty = piece.qty === 1 && (l.includes?.length || l.system || config.legacy) ? null : piece.qty;
      return {
        ...piece,
        qty,
        price: lineTotal.get(l.id) ?? 0,
        ...(l.includes && l.includes.length > 0 ? { includes: [...l.includes] } : {}),
      };
    });

  const services: { label: string; price: number }[] = [];
  const n = Math.max(0, Math.round(config.services.extraRevisions));
  if (totals.services.revisions > 0) {
    services.push({ label: `Extra revision round${n === 1 ? "" : "s"} ×${n}`, price: totals.services.revisions });
  }
  if (totals.services.license > 0) services.push({ label: "File license (print-ready source files)", price: totals.services.license });
  if (totals.services.packaging > 0) services.push({ label: "Packaging & handling", price: totals.services.packaging });

  const total = totals.total;
  const clampToTotal = (x: number) => Math.min(Math.max(x || 0, 0), Math.max(total, 0));
  const paid = clampToTotal(depositPaid);

  return {
    clientName: draft.client.name || "",
    eventType: draft.client.eventType || "",
    eventDate: formatEventDate(draft.client.eventDate),
    title: quoteDisplayName(config),
    groups,
    extras,
    services,
    discount: totals.discount ? { label: totals.discount.label, amount: totals.discount.amount } : null,
    rush: totals.rush ? { label: totals.rush.label, amount: totals.rush.amount } : null,
    adjustment: totals.adjustment ? { label: totals.adjustment.label, amount: totals.adjustment.amount } : null,
    shipping: totals.shipping,
    subtotal: totals.itemsSubtotal + totals.services.total,
    savings: totals.bundleSavings + (totals.discount?.amount ?? 0),
    total,
    depositExpected: clampToTotal(totals.deposit),
    depositPaid: paid,
    balanceRemaining: Math.max(total - paid, 0),
    wholeDollars: !!config.legacy,
    anyPhysical: totals.anyPhysical,
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
