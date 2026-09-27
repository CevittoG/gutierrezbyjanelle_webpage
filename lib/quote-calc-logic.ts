// The pre-v5 calculator's engine now lives, frozen, in lib/legacy/logic.ts.
// This module re-exports it for the old calculator (removed in P5) and keeps
// the old calculator's formatting and browser-defaults helpers.

import { DEFAULTS, type QuoteState } from "./legacy/logic";

export * from "./legacy/logic";

// --- Formatting ---

export function fmt$(n: number, dec = 0): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmt$2(n: number): string {
  return fmt$(n, 2);
}

export function fmtPct(n: number): string {
  return Math.round(n) + "%";
}

// The percentage a dollar amount really is of its base, for client-facing
// labels ("Suite savings (9.6%)"). One decimal, trailing ".0" dropped, so the
// printed % always equals amount ÷ base.
export function fmtEffectivePct(amount: number, base: number): string {
  if (!(base > 0) || !(amount > 0)) return "0%";
  const pct = Math.round((amount / base) * 1000) / 10;
  return (Number.isInteger(pct) ? String(pct) : pct.toFixed(1)) + "%";
}

// Net margin a quote needs to be "on target": target profit is a markup on
// cost + admin overhead, so as a share of price it is profit / (1 + profit).
export function targetMarginPct(targetProfitPtg: number): number {
  return (targetProfitPtg / (100 + targetProfitPtg)) * 100;
}

// --- Persistence ---

const STORAGE_KEY = "quote-calc-defaults";

export function loadSavedDefaults(): QuoteState {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<QuoteState>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveDefaults(s: QuoteState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSavedDefaults(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportSettings(s: QuoteState): void {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quote-calc-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSettings(file: File): Promise<QuoteState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<QuoteState>;
        resolve({ ...DEFAULTS, ...parsed });
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
