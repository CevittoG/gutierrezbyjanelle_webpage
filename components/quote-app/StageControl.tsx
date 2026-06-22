"use client";

// Admin stage selector for the Profile Overview page. Janelle moves a project
// through its lifecycle here; the choice persists to the Quotes sheet (column S)
// and drives both the client tracker and the derived deposit/balance status.
// Optimistic update with a refresh so the page's payment readout re-derives.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  STAGE_ORDER,
  normalizeStage,
  resolveStageCopy,
  type ProjectStage,
  type ProjectType,
} from "@/lib/quote-calc-portal";

export function StageControl({
  id,
  type,
  initialStage,
}: {
  id: string;
  type: ProjectType;
  initialStage: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<ProjectStage>(normalizeStage(initialStage));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const copy = resolveStageCopy(stage, type);

  async function change(next: ProjectStage) {
    const prev = stage;
    setStage(next);
    setBusy(true);
    setError(false);
    try {
      const r = await fetch(`/quote-calc/api/portal/${encodeURIComponent(id)}/stage`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      const b = (await r.json()) as { ok?: boolean };
      if (!b.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setStage(prev);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="stage" className="text-xs text-muted-foreground">
          Stage
        </label>
        <select
          id="stage"
          value={stage}
          disabled={busy}
          onChange={(e) => change(e.target.value as ProjectStage)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {resolveStageCopy(s, type).adminLabel}
            </option>
          ))}
        </select>
        {busy && <span className="text-xs text-muted-foreground">Saving…</span>}
        {error && <span className="text-xs text-foreground">Couldn&apos;t save — try again</span>}
      </div>
      <p className="text-xs text-muted-foreground normal-case tracking-normal leading-snug">
        Client sees: <span className="text-foreground">{copy.clientHeadline}</span> — {copy.clientSub}
      </p>
    </div>
  );
}
