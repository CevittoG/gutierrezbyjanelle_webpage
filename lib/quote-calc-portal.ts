// Shared types + pure helpers for the Phase 3 client portal.
//
// No IO, no server-only — imported by both the server (sheets reader, routes)
// and the client. The PublicQuote projector lives here too so the client-safe
// shape is defined in exactly one place and can never accidentally carry a
// secret (cost rate, margin %, the full Draft) across to a public route.

import type { Draft, DraftConfig } from "./quote-calc-drafts";
import type { QuoteBreakdown } from "./quote-calc-totals";
import { CatalogItem, ITEM_CATALOG, PACKAGES } from "./quote-calc-logic";

export type LinkStatus = "active" | "revoked" | "";

// The five server-managed columns N–R on the Quotes tab. Kept out of the
// Draft / _data JSON so a public token never rides the client-synced draft.
export interface PortalMeta {
  id: string;
  driveFolderId: string;
  publicToken: string;
  linkStatus: LinkStatus;
  /** Raw sheet value: an ISO date/datetime, or "" for no expiry. */
  expiresAt: string;
  /** Reserved for the deferred "Approve" feature. Unused this phase. */
  approvedAt: string;
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

// Deliberately minimal: clients see what's included, how much they save, and
// the total — never the cost buildup (design/production/admin/margin).
export interface PublicQuote {
  clientName: string;
  eventType: string;
  eventDate: string; // formatted for display
  packageName: string;
  includedPieces: string[];
  savings: number; // total discount amount (>= 0); 0 when no discount applies
  total: number; // after savings, before shipping — same as the printed PDF
  proofs: { images: PublicQuoteFile[]; pdfs: PublicQuoteFile[] };
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
  const pkgDef = PACKAGES[config.pkg];
  const isDigital = config.pkg === "individual" ? config.individualDigital : pkgDef.isDigital;
  const qty = config.qty;

  const pieceLabel = (label: string, fixed: number | undefined, catalogQty: number): string => {
    const count = fixed !== undefined ? `${fixed} pcs` : isDigital ? "design" : `${catalogQty * qty} pcs`;
    return `${label} — ${count}`;
  };

  const pieces: string[] = [];
  if (config.pkg === "individual") {
    const cat = catalog.find((i) => i.key === config.individualItem);
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

  // Surface à-la-carte and misc add-ons by name (their price sits in categories.addOns).
  for (const a of breakdown.addOnLines) pieces.push(`${a.label} × ${a.qty}`);
  for (const m of breakdown.miscLines) pieces.push(`${m.label} × ${m.qty}`);
  return pieces;
}

// Project a full Draft + its recomputed breakdown down to the client-safe shape.
// Everything secret (assumptionsSnapshot, per-item rates, the cost buildup) is
// dropped here by construction — only the fields below ever leave the server.
export function buildPublicQuote(
  draft: Draft,
  breakdown: QuoteBreakdown,
  files: PublicQuoteFile[],
  catalog: CatalogItem[] = ITEM_CATALOG,
): PublicQuote {
  const { config } = draft;
  const savings = breakdown.discountAmount + breakdown.vendorAmount;

  return {
    clientName: draft.client.name || "",
    eventType: draft.client.eventType || "",
    eventDate: formatEventDate(draft.client.eventDate),
    packageName: PACKAGES[config.pkg]?.name ?? config.pkg,
    includedPieces: buildIncludedPieces(config, breakdown, catalog),
    savings,
    total: breakdown.finalPrice,
    proofs: {
      images: files.filter((f) => f.kind === "image"),
      pdfs: files.filter((f) => f.kind === "pdf"),
    },
  };
}
