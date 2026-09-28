"use client";

// ① Client & event: who, when, what kind of event, and the two numbers every
// linked quantity follows (households and guests; guests default to
// households × guestsPerHousehold until typed).

import { ClientInfoSection } from "@/app/quote-calc/_components/ClientInfoSection";
import type { DraftClientInfo } from "@/lib/quote-calc-drafts";
import { NumberField } from "./fields";

export function EventBasics({
  client,
  onClient,
  dateError,
  households,
  guests,
  guestsAuto,
  guestsPerHousehold,
  onCounts,
}: {
  client: DraftClientInfo;
  onClient: (c: DraftClientInfo) => void;
  dateError: boolean;
  households: number;
  guests: number;
  guestsAuto: boolean;
  guestsPerHousehold: number;
  onCounts: (households: number, guests: number, guestsAuto: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <ClientInfoSection client={client} onChange={onClient} dateError={dateError} part="basics" />
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div>
          <label htmlFor="households" className="block text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
            Households
          </label>
          <NumberField
            id="households"
            label="Households"
            value={households}
            decimals={0}
            onChange={(h) => onCounts(h, guestsAuto ? Math.round(h * guestsPerHousehold) : guests, guestsAuto)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="guests" className="block text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
            Guests {guestsAuto && <span className="normal-case tracking-normal">(auto)</span>}
          </label>
          <NumberField
            id="guests"
            label="Guests"
            value={guests}
            decimals={0}
            onChange={(g) => onCounts(households, g, false)}
            className="w-full"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground max-w-prose">
        Linked quantities follow these numbers. Type a quantity on a line to set it by hand.
      </p>
    </div>
  );
}
