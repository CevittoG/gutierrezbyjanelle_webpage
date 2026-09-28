"use client";

// ⑤ One discount, with a reason, as a true % or a $ amount (§6.3). Replaces
// the vendor toggle and the two labor-only % inputs. It comes off the order
// after suite savings, and the client sees exactly this % or amount.

import type { PriceSettings } from "@/lib/quote-pricebook";
import type { DiscountReason, QuoteDiscount } from "@/lib/quote-types";
import { NumberField, Segmented } from "./fields";

const REASONS: { value: DiscountReason | "none"; label: string }[] = [
  { value: "none", label: "No discount" },
  { value: "vendor", label: "Vendor referral" },
  { value: "family", label: "Family & friends" },
  { value: "promo", label: "Promo" },
  { value: "custom", label: "Custom" },
];

export function DiscountControl({
  discount,
  settings,
  onChange,
}: {
  discount: QuoteDiscount | null;
  settings: PriceSettings;
  onChange: (d: QuoteDiscount | null) => void;
}) {
  const reason = discount?.reason ?? "none";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="discount-reason" className="sr-only">Discount reason</label>
        <select
          id="discount-reason"
          value={reason}
          onChange={(e) => {
            const r = e.target.value as DiscountReason | "none";
            if (r === "none") return onChange(null);
            const preset = r === "vendor" ? settings.vendorReferralPct : discount?.value ?? 10;
            onChange({ reason: r, kind: r === "vendor" ? "percent" : discount?.kind ?? "percent", value: preset, label: discount?.label });
          }}
          className="h-11 rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {discount && (
          <>
            <Segmented
              label="Discount type"
              size="sm"
              value={discount.kind}
              options={[
                { value: "percent", label: "%" },
                { value: "amount", label: "$" },
              ]}
              onChange={(kind) => onChange({ ...discount, kind })}
            />
            <NumberField
              label={discount.kind === "percent" ? "Discount percent" : "Discount amount"}
              value={discount.value}
              decimals={discount.kind === "percent" ? 1 : 2}
              prefix={discount.kind === "amount" ? "$" : undefined}
              suffix={discount.kind === "percent" ? "%" : undefined}
              onChange={(value) => onChange({ ...discount, value: discount.kind === "percent" ? Math.min(100, value) : value })}
              className="w-28"
            />
          </>
        )}
      </div>
      {discount && (
        <div>
          <label htmlFor="discount-label" className="block text-xs text-muted-foreground mb-1">
            Label the client sees (optional)
          </label>
          <input
            id="discount-label"
            value={discount.label ?? ""}
            onChange={(e) => onChange({ ...discount, label: e.target.value || undefined })}
            placeholder={REASONS.find((r) => r.value === discount.reason)?.label}
            className="h-11 w-full max-w-sm rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
