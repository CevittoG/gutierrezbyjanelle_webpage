"use client";

import { SyncStatus } from "@/lib/quote-calc-drafts";
import { cn } from "@/utils";

interface Props {
  currentDraftId: string | null;
  currentName: string;
  dirty: boolean;
  syncStatus: SyncStatus;
  onSave: () => void;
  onSaveAs: () => void;
  onRefreshRemote: () => void;
}

function syncLabel(s: SyncStatus): { label: string; tone: "neutral" | "good" | "warn" | "bad" } {
  switch (s.kind) {
    case "idle":
      return { label: "Local only", tone: "neutral" };
    case "syncing":
      return { label: "Syncing…", tone: "neutral" };
    case "synced":
      return { label: "Synced to Sheet", tone: "good" };
    case "offline":
      switch (s.reason) {
        case "network":
          return { label: "Offline · saved locally", tone: "warn" };
        case "unconfigured":
          return { label: "Sheet not configured", tone: "warn" };
        case "server":
          return { label: "Sheet unavailable", tone: "bad" };
      }
  }
}

export function DraftsBar({
  currentDraftId,
  currentName,
  dirty,
  syncStatus,
  onSave,
  onSaveAs,
  onRefreshRemote,
}: Props) {
  const canPrint = currentDraftId !== null;
  const printHref = canPrint ? `/quote-calc/print?draft=${currentDraftId}` : "#";
  const sync = syncLabel(syncStatus);
  const syncToneClass =
    sync.tone === "good"
      ? "text-emerald-700"
      : sync.tone === "warn"
      ? "text-amber-700"
      : sync.tone === "bad"
      ? "text-red-700"
      : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            currentDraftId === null ? "bg-muted-foreground/40" : dirty ? "bg-accent-foreground" : "bg-emerald-500"
          )}
          aria-hidden
        />
        <span className="text-sm font-medium truncate">{currentName || "Untitled quote"}</span>
        {dirty && <span className="text-xs text-muted-foreground shrink-0">· unsaved changes</span>}
        <span className={cn("text-xs shrink-0 hidden sm:inline", syncToneClass)} title={sync.label}>
          · {sync.label}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRefreshRemote}
          disabled={syncStatus.kind === "syncing"}
          className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-50"
          title="Refresh from Sheet"
        >
          {syncStatus.kind === "syncing" ? "Refreshing…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty && currentDraftId !== null}
          className="h-10 px-3 rounded-lg border border-border bg-foreground text-background text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onSaveAs}
          className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          Save as…
        </button>

        <a
          href={printHref}
          target="_blank"
          rel="noopener"
          aria-disabled={!canPrint}
          onClick={(e) => {
            if (!canPrint) e.preventDefault();
          }}
          className={cn(
            "h-10 px-3 rounded-lg border border-border text-sm flex items-center transition-colors",
            canPrint ? "hover:bg-muted" : "opacity-40 cursor-not-allowed"
          )}
          title={canPrint ? "Open print view in new tab" : "Save the quote first"}
        >
          Print quote ↗
        </a>
      </div>
    </div>
  );
}
