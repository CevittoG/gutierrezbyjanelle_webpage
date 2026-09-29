"use client";

// Small form primitives for the builder. Numbers are typed as text so a
// half-typed "1." or "" never snaps back mid-keystroke; the parent gets a
// number on every valid change. 44px targets, tabular figures.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

function parse(raw: string): number | null {
  const t = raw.replace(/[$,\s]/g, "");
  if (t === "" || t === "." || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function display(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return "";
  if (decimals === 0) return String(Math.round(n));
  return Number.isInteger(n) ? String(n) : n.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

export function NumberField({
  value,
  onChange,
  label,
  decimals = 2,
  min = 0,
  prefix,
  suffix,
  className,
  inputClassName,
  id,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  decimals?: number;
  min?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(display(value, decimals));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(display(value, decimals));
  }, [value, decimals]);

  return (
    <span
      className={cn(
        "inline-flex h-11 items-center rounded-md border border-border bg-card focus-within:ring-2 focus-within:ring-ring",
        disabled && "opacity-50",
        className,
      )}
    >
      {prefix && <span className="pl-2.5 text-sm text-muted-foreground whitespace-nowrap" aria-hidden>{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode={decimals === 0 ? "numeric" : "decimal"}
        aria-label={label}
        value={text}
        disabled={disabled}
        onFocus={(e) => {
          focused.current = true;
          e.currentTarget.select();
        }}
        onBlur={() => {
          focused.current = false;
          setText(display(value, decimals));
        }}
        onChange={(e) => {
          setText(e.target.value);
          const n = parse(e.target.value);
          if (n !== null) onChange(Math.max(min, decimals === 0 ? Math.round(n) : n));
        }}
        className={cn(
          "h-full w-full min-w-0 bg-transparent px-2 text-right text-base font-mono tabular-nums focus:outline-none",
          inputClassName,
        )}
      />
      {suffix && <span className="pr-2.5 text-sm text-muted-foreground whitespace-nowrap" aria-hidden>{suffix}</span>}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors",
        checked ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer accent-foreground"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-md border border-border">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-11 whitespace-nowrap text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "px-2.5" : "px-4",
              active ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Section({
  step,
  title,
  children,
  aside,
}: {
  step?: string;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          {step && <span className="mr-2 text-foreground/70">{step}</span>}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
