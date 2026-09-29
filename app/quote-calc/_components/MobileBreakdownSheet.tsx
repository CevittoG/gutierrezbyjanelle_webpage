"use client";

// Mobile: a sticky bottom bar ("Total $570 · ! $24.21/hr") that opens the
// summary as a bottom sheet. Hidden from lg up, where the summary is sticky.

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface Props {
  total: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function MobileBreakdownSheet({ total, status, actions, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-[44px] min-w-0 flex-1 text-left"
            aria-label="Open the quote summary"
          >
            <span className="block font-squarepeg text-3xl leading-none tabular-nums truncate">{total}</span>
            {status && <span className="block text-xs text-muted-foreground truncate normal-case tracking-normal">{status}</span>}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-11 shrink-0 rounded-md border border-border px-3 text-sm normal-case tracking-normal"
          >
            Summary
          </button>
          {actions}
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="lg:hidden fixed inset-0 z-40 bg-foreground/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content
            className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-lg border-t border-border bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
            aria-describedby={undefined}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2 backdrop-blur">
              <Dialog.Title className="text-sm normal-case tracking-normal">Quote summary</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-11 w-11 rounded-md hover:bg-muted flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="p-4 pb-10">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
