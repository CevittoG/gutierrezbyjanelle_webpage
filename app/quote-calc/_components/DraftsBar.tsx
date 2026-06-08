"use client";

import { useEffect, useRef, useState } from "react";
import { Draft, deleteDraft, renameDraft } from "@/lib/quote-calc-drafts";
import { fmt$ } from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface Props {
  drafts: Draft[];
  currentDraftId: string | null;
  currentName: string;
  dirty: boolean;
  onLoadDraft: (id: string) => void;
  onNew: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onDraftsChange: (drafts: Draft[]) => void;
}

export function DraftsBar({
  drafts,
  currentDraftId,
  currentName,
  dirty,
  onLoadDraft,
  onNew,
  onSave,
  onSaveAs,
  onDraftsChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleRename(id: string, oldName: string) {
    const next = window.prompt("Rename quote", oldName);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;
    onDraftsChange(renameDraft(id, trimmed));
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    onDraftsChange(deleteDraft(id));
  }

  const canPrint = currentDraftId !== null;
  const printHref = canPrint ? `/quote-calc/print?draft=${currentDraftId}` : "#";

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
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onNew}
          className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          New
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

        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            Open ▾ <span className="text-muted-foreground">({drafts.length})</span>
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-card shadow-lg z-30 overflow-hidden"
            >
              {drafts.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  No saved drafts yet. Use "Save as…" to keep this quote.
                </p>
              ) : (
                <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                  {drafts.map((d) => {
                    const isCurrent = d.id === currentDraftId;
                    return (
                      <li
                        key={d.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 hover:bg-muted/40",
                          isCurrent && "bg-muted/40"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onLoadDraft(d.id);
                            setOpen(false);
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-sm font-medium truncate">{d.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {d.client.name || "—"} · {d.client.eventDate || "no date"} ·{" "}
                            <span className="font-mono tabular-nums">{fmt$(Math.round(d.cachedTotal))}</span>
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRename(d.id, d.name)}
                          aria-label="Rename"
                          className="h-9 w-9 rounded-md text-xs text-muted-foreground hover:bg-muted flex items-center justify-center"
                          title="Rename"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id, d.name)}
                          aria-label="Delete"
                          className="h-9 w-9 rounded-md text-xs text-muted-foreground hover:bg-red-100 hover:text-red-700 flex items-center justify-center"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

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
