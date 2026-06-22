"use client";

// Client proof-approval action. Two deliberate steps so it's never triggered by
// accident: first the client checks "I've reviewed my proofs", which reveals a
// name field; approval only sends once they type their name and confirm. On
// success the server has advanced the stage (approval → balance); a refresh
// re-renders the page into its approved state.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveProofs({ token }: { token: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = checked && name.trim().length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/q/${encodeURIComponent(token)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const b = (await r.json()) as { ok?: boolean };
      if (!b.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Something went wrong — please try again, or reply to Janelle.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-accent bg-accent/10 px-6 py-6">
      <p className="font-squarepeg text-3xl leading-none">Ready to approve?</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-prose">
        Once everything above looks perfect, approve your proofs and I'll move into production. Need a
        tweak first? Just reply and we'll get it right.
      </p>

      <label className="mt-5 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[hsl(var(--ring))]"
        />
        <span className="text-sm leading-snug">I've reviewed my proofs and I'm ready to approve them.</span>
      </label>

      {checked && (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="approver-name" className="block text-xs text-muted-foreground mb-1.5">
              Type your name to confirm
            </label>
            <input
              id="approver-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className="w-full max-w-xs h-11 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="h-11 px-5 inline-flex items-center rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Approving…" : "Approve my proofs"}
          </button>
          {error && <p className="text-xs text-foreground">{error}</p>}
        </div>
      )}
    </div>
  );
}
