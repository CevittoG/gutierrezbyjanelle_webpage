# Quote-Calc — Architecture Review & Roadmap

## Context

The `/quote-calc` tool is a password-gated internal pricing calculator for a single
non-technical user (Janelle). It computes cost-plus stationery quotes in the browser,
caches to `localStorage`, and syncs drafts to Google Sheets (full `Draft` JSON in
column M) via a service-account JWT. The owner wants to (a) simplify the app by pushing
configuration out of TypeScript and into the sheet, (b) make saved records readable for a
non-technical user, and (c) eventually give clients a shareable view of their quote and
design proofs. This document is a **recommendation roadmap only — no code changes** — that
splits those goals into what to do, what to avoid, and a detailed design for the client
portal.

The review's central finding: **separate *data* from *logic*.** Externalize the data
(rates, items, discounts) to the sheet; keep the formula engine in TypeScript where it is
fast, testable, type-safe, and version-controlled. Moving the *formulas* into the sheet
(or Apps Script) is the one proposed idea to reject.

---

## Verdicts on the four proposals

| # | Proposal | Verdict | Why |
|---|----------|---------|-----|
| 1 | Move all calculation logic into the sheet | **Reject as stated** | Kills the real-time breakdown (every change → network round-trip), trades testable TS for untested cell formulas / Apps Script, and solves a rare problem (formulas rarely change; numbers change often and are already editable). |
| 2 | Store assumptions + items in the sheet; dynamic item list | **Adopt — the real win** | Removes ~64 per-item fields from `QuoteState` and the per-item table from the UI; "add an item" becomes a one-row edit. Requires runtime config load + cache + validation + fallback. |
| 3 | Readable records instead of JSON blob | **Adopt — cheap, high value** | Column M JSON is noise to Janelle. Make the Quotes tab human-readable; move the machine payload aside. |
| 4 | Drive folders + proof files + client portal + shareable links | **Implemented (2026-06)** — see "As built" below | Real value, but a separate product with a real security surface. Prerequisite: fix the forgeable admin auth first (done in Phase 0). |

---

## Cross-cutting finding (not in the original ask): forgeable admin auth

`app/api/quote-auth/route.ts` sets a **constant** cookie `quote_auth=1`; every gate
(`app/quote-calc/page.tsx`, `app/quote-calc/print/page.tsx`, both API routes) checks
`value === "1"`. `HttpOnly` blocks XSS *reads* but not *forgery* — anyone can send
`Cookie: quote_auth=1` directly to the API and read/write every draft in the sheet.
Low risk for an obscure internal tool today; an unacceptable hole the moment a public
client portal exists alongside it. **This is the prerequisite (Phase 0) for the portal.**

---

## Recommended phasing

### Phase 0 — Security foundation (prerequisite for Phase 3)
Replace the constant cookie with a **signed, expiring session token**. Render is
stateless, so use a self-verifying signed cookie rather than server-side sessions:
- Cookie value = `base64url(payload).hmac`, where `payload = { exp }` and the HMAC uses a
  new secret env var (e.g. `QUOTE_CALC_SESSION_SECRET`). Use Node's built-in `crypto` —
  **no new dependency**.
- Verify in one shared helper used by `page.tsx`, `print/page.tsx`, and both API routes
  (replaces the four `=== "1"` checks).
- Keep `HttpOnly; SameSite=Strict; Secure`.
- Critical files: `app/api/quote-auth/route.ts`, `app/quote-calc/page.tsx`,
  `app/quote-calc/print/page.tsx`, `app/quote-calc/api/drafts/route.ts`,
  `app/quote-calc/api/drafts/[id]/route.ts`. Add a `lib/quote-calc-auth.ts` helper.

### Phase 1 — Externalize data (items + settings), keep the engine in TS
Goal: delete the per-item table from the UI and the ~64 `i{key}_*` fields from
`QuoteState`; make the item list sheet-driven.
- New sheet tabs:
  - `Items` — one row per catalog item: `key, label, designMin, prodMin, sheetCost,
    yield, qtyRule` (qtyRule encodes per-guest / per-household / fixed currently in
    `getItemQty`/`CatalogItem.fixed`).
  - `Settings` — one row per global rate: `hourly, adminPtg, targetProfitPtg,
    errorMarginPtg, packagingCost, reuseFactor, revisionMin`, discount tiers, modifiers.
- App loads config at runtime in `lib/quote-calc-sheets.ts` (new `listConfig()` reader),
  exposed via a new `GET /quote-calc/api/config` route, **cached** (module-level, like the
  token cache already there) and **validated**. On malformed/empty sheet or fetch failure,
  **fall back to the existing `DEFAULTS`/`ITEM_CATALOG`** in `lib/quote-calc-logic.ts` so a
  bad cell can never take the tool down.
- **Visible fallback alert:** when config fails to load and defaults are used, show a clear
  on-screen banner so Janelle knows the sheet values aren't being applied (e.g. "Couldn't
  read settings from the sheet — using built-in defaults. Check the Items/Settings tab.").
  Surface it in `QuoteCalculator.tsx`, ideally naming the offending tab/row when known.
  Silent fallback would let her quote on stale numbers without realizing it.
- Keep `calcPackage` / `calcAddOn` / `calcAddOnRaw` in `lib/quote-calc-logic.ts` untouched
  in spirit — they now receive config as data instead of reading hardcoded constants.
- Reuse what exists: the module-level token cache pattern in `quote-calc-sheets.ts`, the
  graceful-degradation `RemoteResult` pattern in `quote-calc-drafts-remote.ts`, and
  `DEFAULTS` as the bundled fallback.
- Packages (`PACKAGES`) can stay in TS for now (they reference item keys and rarely
  change); only the item *parameters* and global *settings* move. Revisit packages later
  if needed.
- **Do not** move `calcPackage`/markup math into the sheet or Apps Script.

### Phase 2 — Human-readable Quotes tab
- Restructure the `Quotes` tab so each row is readable: client, event type, event date,
  package, qty, **itemized lines + total**, status, timestamps.
- Move the machine payload (current column M `JSON.stringify(d)`) to a separate `_data`
  tab keyed by id (or a far hidden column), so reads still reconstruct a full `Draft` but
  Janelle never sees the blob.
- Critical files: `lib/quote-calc-sheets.ts` (`draftToRow` / row parsing), and the
  one-time header setup documented in CLAUDE.md.

### Phase 3 — Client portal (detailed design below)

---

## Phase 3 detailed design — per-quote Drive folder + client link

> **As built (2026-06).** The implementation follows the design below with four
> deliberate changes, decided during planning:
> 1. **Folders are auto-created, not pasted.** On quote save the app creates a
>    subfolder under a configured root (`GOOGLE_DRIVE_PARENT_FOLDER_ID`) and stores
>    the id — Janelle never copies a share link. This needs **read + create**
>    Drive access (`drive.file` + `drive.readonly`) and the root shared as
>    **Editor**, not read-only/Viewer. The app still uploads no file *content*.
> 2. **The client price view is minimal:** included pieces, savings amount, and
>    total only — not a per-line cost breakdown. Keeps margin/cost internals off
>    the public page.
> 3. **The "Approve" button is deferred.** Column R (`Approved`) is reserved.
> 4. Portal metadata lives in **`Quotes` columns N–R** (server-managed), not the
>    `_data` JSON. See CLAUDE.md "Client portal + Drive proofs (Phase 3)" for the
>    shipped file map and column layout.

### Goal
Each quote maps to one Drive folder that serves **two purposes**:
1. **Proof files** (images, PDFs) — invitations, RSVPs, etc.
2. **A PDF snapshot of the quote as sent**, capturing the *exact calculation used*. This is
   the version record: Janelle's pricing is changing daily at this early stage, so when the
   formulas/rates change later, the folder still shows how that client was actually charged.

The app **only reads** the folder — it never uploads. This is the key simplification from
the original feedback: no in-app upload UI, no per-file id tracking, no streaming
infrastructure (avoids the Render memory/resource cost and UI complexity).

### How files get in (no app upload)
- **Janelle uploads through the Drive UI directly.** She also drops in the quote PDF
  (printed/saved from the existing `app/quote-calc/print/page.tsx` — no new export code).
- Folders are named by **client / quote name only — no dates** (Janelle remembers names).
- One root folder `GBJ Quotes`, shared with the service account as **Viewer**.

### Linking a quote to its folder
- Add one simple optional field per quote: **"Drive folder link."** Janelle pastes the
  folder's share link once; the app extracts the folder id and stores `driveFolderId` in
  the quote's sheet row. This is a single text input — not an upload widget.

### Drive scope (important correction)
- Files Janelle uploads via the Drive UI are owned by *her*, not the service account, so
  `drive.file` (app-created files only) is **insufficient**. Use **`drive.readonly`** so the
  SA can list and read the folder's contents. Keep the existing `spreadsheets` scope.
- No write scope needed anywhere — the app reads, Janelle manages files in Drive.

### Rendering the folder
- List via Drive `files.list` (`'<folderId>' in parents`), split by MIME type:
  - **images → gallery** — proxy each through `GET /q/.../file/[fileId]` (SA-authenticated,
    streams from Drive) or use `thumbnailLink`. Don't expose raw Drive URLs publicly.
  - **PDF → the saved quote copy** — shown as a link/embed.

### Janelle's simple calculation view (admin only)
- On the authenticated per-quote page, show a **SIMPLE** summary of the final calculation
  used — total + line items — reusing the existing breakdown/print output. **This is for
  Janelle only**; clients never see cost/margin internals.

### Client shareable link
- Public route `GET /q/[token]` — **no admin cookie**, read-only, server-rendered.
- `token` = 128-bit random (`crypto.randomBytes`), stored in the quote's sheet row.
  **Never** use the enumerable draft `id` in the URL.
- Sheet columns `publicToken`, `linkStatus` (active/revoked), `expiresAt` let Janelle
  revoke/expire a link by editing the sheet; the route rejects revoked/expired tokens.
- **Client-safe payload only:** client name, event, line items, client-facing total, and
  the proofs gallery. **Excludes all cost/margin internals** — build a dedicated
  `PublicQuote` shape; never hand the full `Draft` JSON to the public route.
- Optional approval: an "Approve" button → writes an `approvedAt` timestamp to the row. No
  client accounts.

### Quote Explorer (admin UI)
- Authenticated list from `listDrafts()`: client, event, total, status, **copy public
  link**, open folder, revoke/regenerate token. Reuses the Sheets reader; adds the Drive
  folder/file listing. No upload controls.

### Phase 3 prerequisites
- Phase 0 done (no forgeable admin cookie next to a public surface).
- Stays free and low-infra: read-only Drive access + manual uploads avoids the streaming,
  storage, and image-processing costs the original upload design would have added.

---

## What to explicitly NOT do
- Do **not** move `calcPackage`/markup/discount math into Sheets cells or Apps Script.
- Do **not** migrate to a real database — Sheets is the correct, low-cost, owner-accessible
  store at this scale. (Confirmed sound, not just agreed: single user, low write volume,
  owner needs direct data access.)
- Do **not** expose the draft `id` or full `Draft` JSON on any public route.

---

## Verification (per phase, when implemented)
- **Phase 0:** confirm a forged `Cookie: quote_auth=...` (old constant) is rejected by all
  four gates; valid login still works; token expiry enforced. Run via Docker
  (`docker-compose up`) and `curl` the API routes with/without a valid signed cookie.
- **Phase 1:** edit a value in the `Items`/`Settings` tab → reload → price reflects it;
  corrupt a cell → tool falls back to `DEFAULTS`, still renders, **and shows the fallback
  banner** naming the bad tab/row. Verify config cache refreshes on reload.
- **Phase 2:** save a quote → confirm the `Quotes` tab row is human-readable and a reload
  still reconstructs the full draft from the `_data` tab.
- **Phase 3:** paste a Drive folder link onto a quote → app lists that folder's files;
  images render in the gallery and the PDF shows as the quote copy; the admin per-quote
  page shows the simple calc summary. Open `/q/<token>` in a private window (no cookie) →
  client-safe view + proofs gallery, **no cost internals**; revoke in sheet → link 404s;
  enumerating a different token fails.

---

## Critical files referenced
- Engine/config: `lib/quote-calc-logic.ts` (`QuoteState`, `DEFAULTS`, `ITEM_CATALOG`,
  `PACKAGES`, `calcPackage`, `getItemQty`)
- Persistence: `lib/quote-calc-drafts.ts`, `lib/quote-calc-drafts-remote.ts`
- Sheets I/O: `lib/quote-calc-sheets.ts` (`draftToRow`, token cache, `listDrafts`)
- Routes: `app/quote-calc/api/drafts/route.ts`, `app/quote-calc/api/drafts/[id]/route.ts`,
  `app/api/quote-auth/route.ts`
- Gates: `app/quote-calc/page.tsx`, `app/quote-calc/print/page.tsx` (the print page also
  produces the PDF snapshot Janelle saves to the Drive folder — no new export code)
- New (proposed): `lib/quote-calc-auth.ts`, `app/quote-calc/api/config/route.ts`,
  `app/q/[token]/` (public client link). **No** proofs/upload route — Drive UI handles
  uploads; the app reads folders via `drive.readonly`.
