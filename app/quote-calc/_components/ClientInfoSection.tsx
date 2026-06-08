"use client";

import { DraftClientInfo, EVENT_TYPES } from "@/lib/quote-calc-drafts";

interface Props {
  client: DraftClientInfo;
  onChange: (next: DraftClientInfo) => void;
}

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const labelClass =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5";

export function ClientInfoSection({ client, onChange }: Props) {
  function set<K extends keyof DraftClientInfo>(key: K, value: DraftClientInfo[K]) {
    onChange({ ...client, [key]: value });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="client-name" className={labelClass}>
          Client name
        </label>
        <input
          id="client-name"
          type="text"
          value={client.name}
          placeholder="e.g. Smith Wedding"
          onChange={(e) => set("name", e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="event-date" className={labelClass}>
          Event date
        </label>
        <input
          id="event-date"
          type="date"
          value={client.eventDate}
          onChange={(e) => set("eventDate", e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="event-type" className={labelClass}>
          Event type
        </label>
        <select
          id="event-type"
          value={client.eventType}
          onChange={(e) => set("eventType", e.target.value)}
          className={fieldClass}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="client-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="client-notes"
          rows={2}
          value={client.notes}
          placeholder="Private notes — not shown on the printed quote unless you choose to share them"
          onChange={(e) => set("notes", e.target.value)}
          className={fieldClass + " resize-y"}
        />
      </div>
    </div>
  );
}
