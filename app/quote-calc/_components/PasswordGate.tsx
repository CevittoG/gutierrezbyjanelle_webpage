"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/quote-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      setError("That password didn't match. Try again.");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <Image src="/logo.svg" alt="" width={56} height={56} className="h-14 w-14 object-contain mb-4" priority />
          <h1 className="font-squarepeg text-4xl leading-none">Studio</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">
            Quotes &amp; client links
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-widest"
              >
                Access password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? "password-error" : undefined}
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-base normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <p id="password-error" className="text-sm text-muted-foreground normal-case tracking-normal">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium normal-case tracking-normal transition-colors hover:bg-ring disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Checking…" : "Enter studio"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-6 normal-case tracking-normal">
          Private tool · not indexed
        </p>
      </div>
    </div>
  );
}
