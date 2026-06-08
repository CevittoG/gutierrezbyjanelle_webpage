"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { fmt$, fmtPct } from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface Props {
  total: number;
  netMargin: number;
  marginDiff: number;
  children: React.ReactNode;
}

export function MobileBreakdownSheet({ total, netMargin, marginDiff, children }: Props) {
  const [open, setOpen] = useState(false);

  const marginTone =
    marginDiff >= 0
      ? "text-emerald-700"
      : marginDiff >= -5
      ? "text-amber-700"
      : "text-red-700";

  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center gap-3 px-4 py-3 max-w-screen-2xl mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none">
              Total quote
            </p>
            <p className="font-squarepeg text-3xl leading-tight truncate">
              {fmt$(Math.round(total))}
            </p>
            <p className={cn("text-xs font-mono tabular-nums leading-none", marginTone)}>
              {fmtPct(netMargin)} margin
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-11 px-4 rounded-lg border border-border bg-foreground text-background text-sm font-medium shrink-0"
          >
            View breakdown
          </button>
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="lg:hidden fixed inset-0 z-40 bg-foreground/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content
            className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
            aria-describedby={undefined}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
              <Dialog.Title className="text-sm font-semibold normal-case tracking-normal">
                Price breakdown
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-10 w-10 rounded-md hover:bg-muted flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="p-4 pb-8">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
