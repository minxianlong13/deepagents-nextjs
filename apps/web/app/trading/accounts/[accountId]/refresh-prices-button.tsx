"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { refreshPrices, type PriceRefreshActionState } from "./actions";

const initialState: PriceRefreshActionState = { status: "idle" };

export function RefreshPricesButton({ accountId, disabled }: { accountId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(refreshPrices, initialState);
  const updated = state.status === "done" ? state.results.filter((result) => result.status === "updated").length : 0;

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="accountId" value={accountId} />
        <Button type="submit" size="sm" variant="secondary" disabled={pending || disabled} title={disabled ? "No holdings to price" : undefined}>
          {pending ? "Fetching prices…" : "Refresh prices"}
        </Button>
      </form>

      {pending ? (
        <p className="text-xs text-black/55" aria-live="polite">Fetching each holding&rsquo;s latest close from EODHD…</p>
      ) : null}

      {!pending && state.status === "error" ? <p role="alert" className="text-xs text-red-700">{state.message}</p> : null}

      {!pending && state.status === "done" ? (
        <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3 text-xs" aria-live="polite">
          <p className="font-medium text-black/75">
            Updated {updated} of {state.results.length} holding{state.results.length === 1 ? "" : "s"} ·{" "}
            {new Date(state.refreshedAt).toLocaleTimeString()}
          </p>
          <ul className="mt-2 space-y-1">
            {state.results.map((result) => (
              <li key={result.positionId} className="flex flex-wrap gap-x-2">
                <span className="font-semibold text-black">{result.symbol}</span>
                {result.status === "updated" ? (
                  <>
                    <span className="tabular-nums text-black/70">
                      {result.previousPrice ? `${trim(result.previousPrice)} → ` : ""}{trim(result.price)}
                    </span>
                    {result.asOf ? <span className="text-black/50">as of {formatAsOf(result.asOf)}</span> : null}
                    {result.sourceUrl ? (
                      <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-black/50 underline underline-offset-2 hover:text-black">
                        {result.sourceLabel}
                      </a>
                    ) : (
                      <span className="text-black/50">{result.sourceLabel}</span>
                    )}
                  </>
                ) : (
                  <span className="text-red-700">Not updated: {result.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Shows timestamps in the viewer's local time; date-only values (daily closes) are shown as-is. */
function formatAsOf(value: string): string {
  if (!value.includes("T")) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function trim(value: string): string {
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}
