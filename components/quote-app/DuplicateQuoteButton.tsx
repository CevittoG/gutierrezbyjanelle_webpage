"use client";

// "Duplicate as new quote" (§10.1): a server-side copy with a fresh id, no
// client link and no Drive folder. Lands on the copy's Profile Overview.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { cn } from "@/utils";

export function DuplicateQuoteButton({
  id,
  variant = "button",
  className,
}: {
  id: string;
  variant?: "button" | "icon";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function duplicate() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/quote-calc/api/drafts/${encodeURIComponent(id)}/duplicate`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as { ok?: boolean; id?: string };
      if (!res.ok || !body.ok || !body.id) throw new Error("duplicate failed");
      router.push(`/quotes/${encodeURIComponent(body.id)}`);
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void duplicate()}
        disabled={busy}
        aria-label={error ? "Duplicate failed, try again" : "Duplicate as new quote"}
        title={error ? "Duplicate failed, try again" : "Duplicate as new quote"}
        className={cn(
          "h-11 w-11 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-md border border-border transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Copy className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void duplicate()}
      disabled={busy}
      className={cn(
        "h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors disabled:opacity-50",
        className,
      )}
    >
      <Copy className="h-4 w-4" aria-hidden />
      {busy ? "Duplicating" : error ? "Try again" : "Duplicate as new quote"}
    </button>
  );
}
