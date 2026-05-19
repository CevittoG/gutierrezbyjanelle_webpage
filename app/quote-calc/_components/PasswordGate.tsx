"use client";

import { useState } from "react";
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
      setError("Incorrect password. Try again.");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-squarepeg text-3xl mb-1">Quote Calculator</h1>
          <p className="text-sm text-muted-foreground mb-6 normal-case tracking-normal">
            Internal tool — enter your access password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-widest"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 normal-case tracking-normal">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-md bg-foreground text-background py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 normal-case tracking-normal"
            >
              {loading ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
