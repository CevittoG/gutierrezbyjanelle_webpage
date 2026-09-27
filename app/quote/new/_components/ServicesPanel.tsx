"use client";

// ④ Services: rush, extra revisions, file license, packaging, shipping and the
// deposit. Every policy value is pre-filled from Settings and editable per
// quote; edits live on the quote and are never written back to the Sheet.

import { Minus, Plus } from "lucide-react";
import type { DraftConfigV5 } from "@/lib/quote-types";
import { NumberField, Segmented, Toggle } from "./fields";

export function ServicesPanel({
  config,
  onChange,
  physical,
}: {
  config: DraftConfigV5;
  onChange: (next: DraftConfigV5) => void;
  physical: boolean;
}) {
  const sv = config.services;
  const setSv = (patch: Partial<DraftConfigV5["services"]>) => onChange({ ...config, services: { ...sv, ...patch } });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[14rem] flex-1">
          <Toggle
            checked={sv.rush}
            onChange={(rush) => setSv({ rush })}
            label="Rush production"
            description="A surcharge on the order after any discount. Never on shipping."
          />
        </div>
        <NumberField label="Rush percent" value={sv.rushPct} decimals={1} suffix="%" onChange={(rushPct) => setSv({ rushPct })} className="w-24" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2">
        <div className="min-w-[10rem] flex-1">
          <p className="text-sm">Extra revision rounds</p>
          <p className="text-xs text-muted-foreground">The first round is included.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="One fewer revision round"
            disabled={sv.extraRevisions <= 0}
            onClick={() => setSv({ extraRevisions: Math.max(0, sv.extraRevisions - 1) })}
            className="h-11 w-11 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="w-8 text-center font-mono tabular-nums" aria-live="polite">{sv.extraRevisions}</span>
          <button
            type="button"
            aria-label="One more revision round"
            onClick={() => setSv({ extraRevisions: sv.extraRevisions + 1 })}
            className="h-11 w-11 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <NumberField label="Price per extra round" value={sv.revisionRoundPrice} prefix="$" suffix="/ round" onChange={(revisionRoundPrice) => setSv({ revisionRoundPrice })} className="w-40" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[14rem] flex-1">
          <Toggle
            checked={sv.license}
            onChange={(license) => setSv({ license })}
            label="File license"
            description="Print-ready source files for the client."
          />
        </div>
        <NumberField label="License fee" value={sv.licenseFee} prefix="$" onChange={(licenseFee) => setSv({ licenseFee })} className="w-28" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2">
        <div className="min-w-[10rem] flex-1">
          <p className="text-sm">Packaging & handling</p>
          <p className="text-xs text-muted-foreground">
            {physical ? "Once per printed order." : "Not charged: nothing on this quote ships."}
          </p>
        </div>
        <NumberField label="Packaging fee" value={sv.packagingFee} prefix="$" onChange={(packagingFee) => setSv({ packagingFee })} className="w-28" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2">
        <div className="min-w-[10rem] flex-1">
          <p className="text-sm">Shipping</p>
          <p className="text-xs text-muted-foreground">Never discounted or rushed.</p>
        </div>
        <Segmented
          label="Shipping"
          size="sm"
          value={config.shipping === null ? "later" : "now"}
          options={[
            { value: "later", label: "Added later" },
            { value: "now", label: "Add now" },
          ]}
          onChange={(v) => onChange({ ...config, shipping: v === "later" ? null : config.shipping ?? 0 })}
        />
        {config.shipping !== null && (
          <NumberField label="Shipping amount" value={config.shipping} prefix="$" onChange={(shipping) => onChange({ ...config, shipping })} className="w-28" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2">
        <div className="min-w-[10rem] flex-1">
          <p className="text-sm">Deposit to begin</p>
          <p className="text-xs text-muted-foreground">Shown to the client; never changes the total.</p>
        </div>
        <NumberField label="Deposit" value={config.deposit} prefix="$" onChange={(deposit) => onChange({ ...config, deposit })} className="w-28" />
      </div>
    </div>
  );
}
