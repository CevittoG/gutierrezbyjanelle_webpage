"use client";

// Admin editor for a quote's private hidden notes. These never appear on the
// client portal — they're Janelle's working notes. Saves to the Quotes sheet
// (readable column K + the _data Draft JSON) via the drafts notes endpoint.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HiddenNotesControl({ id, initialNotes }: { id: string; initialNotes: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const dirty = notes !== (initialNotes ?? "");

  async function save() {
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      const r = await fetch(`/quote-calc/api/drafts/${encodeURIComponent(id)}/notes`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
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
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Private notes about this quote — only you can see these."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring resize-y"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="h-9 px-4 rounded-md border border-border text-xs normal-case tracking-normal hover:bg-muted transition-colors disabled:opacity-50"
        >
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save notes"}
        </button>
        {error && <span className="text-xs text-foreground">Couldn&apos;t save — try again.</span>}
      </div>
    </div>
  );
}
