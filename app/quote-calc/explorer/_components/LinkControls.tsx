"use client";

// Per-quote public-link controls: generate/regenerate a token, copy the client
// link, revoke it. Used by both the Explorer list and the per-quote detail.

import { useState } from "react";
import { siteConfig } from "@/config/site";
import type { LinkStatus } from "@/lib/quote-calc-portal";
import { cn } from "@/utils";

export function LinkControls({
  id,
  token: initialToken,
  linkStatus: initialStatus,
}: {
  id: string;
  token: string;
  linkStatus: LinkStatus;
}) {
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<LinkStatus>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = token ? `${siteConfig.url}/q/${token}` : "";
  const isActive = status === "active" && !!token;

  async function generate() {
    setBusy(true);
    try {
      const r = await fetch(`/quote-calc/api/portal/${encodeURIComponent(id)}/token`, {
        method: "POST",
        credentials: "same-origin",
      });
      const b = (await r.json()) as { ok?: boolean; token?: string };
      if (b.ok && b.token) {
        setToken(b.token);
        setStatus("active");
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      const r = await fetch(`/quote-calc/api/portal/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
        credentials: "same-origin",
      });
      const b = (await r.json()) as { ok?: boolean };
      if (b.ok) setStatus("revoked");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const btn =
    "h-8 px-3 rounded-md border border-border text-xs normal-case tracking-normal hover:bg-muted transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={status} hasToken={!!token} />
      {isActive && (
        <button type="button" onClick={copy} className={btn} disabled={busy}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      )}
      <button type="button" onClick={generate} className={btn} disabled={busy}>
        {token ? "Regenerate" : "Generate link"}
      </button>
      {isActive && (
        <button
          type="button"
          onClick={revoke}
          className={cn(btn, "hover:bg-accent/30")}
          disabled={busy}
        >
          Revoke
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status, hasToken }: { status: LinkStatus; hasToken: boolean }) {
  const label = status === "active" && hasToken ? "Link active" : status === "revoked" ? "Revoked" : "No link";
  const tone =
    status === "active" && hasToken
      ? "bg-accent/30 text-foreground"
      : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] normal-case tracking-normal", tone)}>
      {label}
    </span>
  );
}
