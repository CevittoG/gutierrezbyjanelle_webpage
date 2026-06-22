"use client";

// Admin control to record how much of the deposit a client has paid. Stored on
// the quote's portal metadata (column U) and shown on the public Client Quote
// Profile, where the remaining balance is derived from it. There are no online
// payments — Janelle records the amount she received offline.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmt$ } from "@/lib/quote-calc-logic";

export function DepositPaidControl({
  id,
  initialPaid,
  expected,
  total,
}: {
  id: string;
  initialPaid: number;
  expected: number;
  total: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialPaid || 0));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const parsed = Math.max(parseFloat(value) || 0, 0);
  const dirty = parsed !== (initialPaid || 0);

  async function save() {
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      const r = await fetch(`/quote-calc/api/portal/${encodeURIComponent(id)}/deposit`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
      const b = (await r.json()) as { ok?: boolean };
      if (!b.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="deposit-paid" className="block text-xs text-muted-foreground mb-1.5">
            Deposit paid
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="deposit-paid"
              type="number"
              min={0}
              max={total || undefined}
              step={5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-28 h-9 rounded-md border border-border bg-background px-2 text-right text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="h-9 px-4 rounded-md border border-border text-xs normal-case tracking-normal hover:bg-muted transition-colors disabled:opacity-50"
        >
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground normal-case tracking-normal leading-snug">
        {expected > 0 ? <>Expected deposit {fmt$(Math.round(expected))}. </> : null}
        Shown to the client as paid; the remaining balance updates to{" "}
        {fmt$(Math.round(Math.max(total - parsed, 0)))}.
        {error && <span className="text-foreground"> Couldn&apos;t save — try again.</span>}
      </p>
    </div>
  );
}
