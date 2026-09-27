// The itemized investment, rendered from the client-safe PublicQuote only, so
// the client portal, Profile Overview and the print view show exactly the same
// rows: suites as their pieces + true suite savings, then extras, services,
// discount, rush, adjustment and shipping. Money never wraps; names do.

import { formatMoney, formatPct } from "@/lib/money";
import type { PublicPiece, PublicQuote } from "@/lib/quote-calc-portal";
import { cn } from "@/utils";

function pieceQty(p: PublicPiece): string | null {
  if (p.qty === null) return null;
  return `× ${p.qty.toLocaleString("en-US")}`;
}

export function InvestmentList({ quote, compact }: { quote: PublicQuote; compact?: boolean }) {
  const money = (n: number) => formatMoney(n, { wholeDollars: quote.wholeDollars });
  const empty =
    quote.groups.length === 0 && quote.extras.length === 0 && quote.services.length === 0 && !quote.adjustment;

  return (
    <div className={cn("text-sm", compact ? "space-y-3" : "space-y-5")}>
      {empty && <p className="text-muted-foreground">Nothing is on this quote yet.</p>}

      {quote.groups.map((g, gi) => (
        <section key={gi} aria-label={g.name}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-squarepeg text-2xl leading-tight min-w-0 break-words">{g.name}</h3>
            <span className="font-mono tabular-nums whitespace-nowrap">{money(g.subtotal)}</span>
          </div>
          <ul className="mt-1.5 space-y-1">
            {g.pieces.map((p, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 text-muted-foreground">
                <span className="min-w-0 break-words">
                  <span className="text-foreground">{p.name}</span>
                  {p.detail && <span className="text-xs"> · {p.detail}</span>}
                </span>
                <span className="text-xs font-mono tabular-nums whitespace-nowrap">
                  {pieceQty(p) ?? "file"}
                </span>
              </li>
            ))}
          </ul>
          {g.savings > 0 && (
            <Line label={`Suite savings (${formatPct(g.savingsPct)})`} value={`−${money(g.savings)}`} dim className="mt-1.5" />
          )}
        </section>
      ))}

      {quote.extras.length > 0 && (
        <section aria-label="Pieces" className="space-y-1.5">
          {quote.groups.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Also included</span>
              <span className="flex-1 h-px bg-border/60" />
            </div>
          )}
          {quote.extras.map((x, i) => (
            <div key={i}>
              <Line
                label={
                  <>
                    {x.name}
                    {pieceQty(x) && <span className="text-muted-foreground"> {pieceQty(x)}</span>}
                    {x.detail && <span className="text-xs text-muted-foreground"> · {x.detail}</span>}
                  </>
                }
                value={money(x.price)}
              />
              {x.includes && x.includes.length > 0 && (
                <ul className="mt-0.5 mb-1 space-y-0.5 pl-3 text-xs text-muted-foreground">
                  {x.includes.map((inc, j) => (
                    <li key={j} className="break-words">· {inc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(quote.services.length > 0 || quote.discount || quote.rush || quote.adjustment || quote.shipping !== null) && (
        <section aria-label="Services and adjustments" className="space-y-1.5 border-t border-border/60 pt-3">
          {quote.services.map((s, i) => (
            <Line key={i} label={s.label} value={money(s.price)} />
          ))}
          {quote.discount && <Line label={quote.discount.label} value={`−${money(quote.discount.amount)}`} dim />}
          {quote.rush && <Line label={quote.rush.label} value={`+${money(quote.rush.amount)}`} />}
          {quote.adjustment && (
            <Line
              label={quote.adjustment.label}
              value={quote.adjustment.amount < 0 ? `−${money(-quote.adjustment.amount)}` : `+${money(quote.adjustment.amount)}`}
              dim={quote.adjustment.amount < 0}
            />
          )}
          {quote.shipping !== null && <Line label="Shipping" value={money(quote.shipping)} />}
        </section>
      )}
    </div>
  );
}

function Line({
  label,
  value,
  dim,
  className,
}: {
  label: React.ReactNode;
  value: string;
  dim?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <span className={cn("min-w-0 break-words", dim ? "text-muted-foreground" : "text-foreground")}>{label}</span>
      <span className={cn("font-mono tabular-nums whitespace-nowrap", dim ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
