"use client";

import { AlertTriangle, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/utils";
import type { ConfigWarning } from "@/lib/quote-calc-config";

export type ConfigBannerState =
  | { kind: "ok"; warnings: ConfigWarning[] }
  | { kind: "fallback"; reason: "unconfigured" | "network" | "server" | "unauthorized" }
  | { kind: "hidden" };

interface Props {
  state: ConfigBannerState;
  onRetry?: () => void;
  retrying?: boolean;
}

function reasonCopy(
  reason: "unconfigured" | "network" | "server" | "unauthorized",
): { title: string; detail: string } {
  switch (reason) {
    case "unconfigured":
      return {
        title: "Sheet not connected — using built-in defaults",
        detail:
          "GOOGLE_SHEETS_* env vars aren't set, so the calculator is running off the bundled fallback values. Settings and Items edits in the Sheet won't apply until that's configured.",
      };
    case "network":
      return {
        title: "Couldn't reach the Sheet — using built-in defaults",
        detail:
          "Network request failed. Your numbers may be stale. Reconnect and click Retry.",
      };
    case "unauthorized":
      return {
        title: "Session expired — using built-in defaults",
        detail: "Re-login to pull fresh values from the Sheet.",
      };
    case "server":
    default:
      return {
        title: "Sheet read failed — using built-in defaults",
        detail:
          "The Sheets API returned an error. Your numbers may be stale. Try Retry; if it persists, check the server logs.",
      };
  }
}

export function ConfigBanner({ state, onRetry, retrying }: Props) {
  if (state.kind === "hidden") return null;

  const isFallback = state.kind === "fallback";
  const warnings = state.kind === "ok" ? state.warnings : [];
  if (state.kind === "ok" && warnings.length === 0) return null;

  const { title, detail } = isFallback
    ? reasonCopy(state.reason)
    : {
        title:
          warnings.length === 1
            ? "1 issue in the Sheet — falling back where needed"
            : `${warnings.length} issues in the Sheet — falling back where needed`,
        detail:
          "These rows were ignored and the bundled defaults are being used in their place. Fix in the Sheet and click Retry.",
      };

  const Icon = isFallback ? CloudOff : AlertTriangle;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "mb-6 rounded-md border bg-card text-card-foreground shadow-sm",
        "border-l-4 border-l-accent",
        "border-border",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "bg-accent/30 text-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-anybody text-xs uppercase tracking-wider text-foreground">
            {title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground leading-snug">
            {detail}
          </p>
          {warnings.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {warnings.map((w, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex shrink-0 items-center rounded-sm border border-border",
                      "px-1.5 py-0.5 font-anybody text-[10px] uppercase tracking-wider",
                      "text-muted-foreground",
                    )}
                  >
                    {w.tab ?? "Sheet"}
                    {w.sheetRow != null ? ` · row ${w.sheetRow}` : ""}
                  </span>
                  <span className="leading-snug">{w.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-sm border border-border",
              "bg-background px-3 py-1.5 font-anybody text-xs uppercase tracking-wider",
              "text-foreground transition-colors",
              "hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <RefreshCw
              className={cn("h-3 w-3", retrying && "animate-spin")}
              aria-hidden
            />
            {retrying ? "Retrying" : "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}
