"use client";

import { useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** A trade row with amounts already formatted on the server (exact decimals, account currency). */
export interface TradeHistoryRow {
  id: string;
  instrumentId: string;
  symbol: string;
  instrumentName: string;
  side: "buy" | "sell";
  executedAt: string;
  quantity: string;
  price: string;
  fee: string;
  cashFlow: string;
  realizedReturn: string | null;
  realizedTone: "gain" | "loss" | "flat" | null;
  positionAfter: string;
}

export interface TradeHistorySummary {
  tradeCount: number;
  realizedReturn: string;
  realizedTone: "gain" | "loss" | "flat";
  fees: string;
}

interface TradeHistoryButtonProps {
  rows: TradeHistoryRow[];
  /** Summaries keyed by instrument id, plus "all" for the whole account. */
  summaries: Record<string, TradeHistorySummary>;
  defaultInstrumentId?: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

const ALL = "all";

export function TradeHistoryButton({
  rows,
  summaries,
  defaultInstrumentId,
  label = "History",
  size = "sm",
  variant = "ghost",
  className,
}: TradeHistoryButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState(defaultInstrumentId ?? ALL);
  const [opened, setOpened] = useState(false);
  const instruments = [...new Map(rows.map((row) => [row.instrumentId, row])).values()]
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  const visible = filter === ALL ? rows : rows.filter((row) => row.instrumentId === filter);
  const summary = summaries[filter] ?? { tradeCount: 0, realizedReturn: "—", realizedTone: "flat" as const, fees: "—" };
  const selected = instruments.find((row) => row.instrumentId === filter);
  const titleId = `trade-history-${defaultInstrumentId ?? ALL}`;
  const relevantCount = defaultInstrumentId ? (summaries[defaultInstrumentId]?.tradeCount ?? 0) : rows.length;

  const open = () => {
    setFilter(defaultInstrumentId ?? ALL);
    setOpened(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        onClick={open}
        disabled={relevantCount === 0}
        title={relevantCount === 0 ? "No recorded trades yet" : undefined}
      >
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(68rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-0 text-left text-black shadow-2xl backdrop:bg-black/40"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        {opened ? (
          <div className="flex max-h-[min(44rem,calc(100vh-4rem))] flex-col">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Trade history</p>
                <h2 id={titleId} className="mt-1 font-(--font-fashion-display) text-2xl">
                  {selected ? selected.symbol : "All holdings"}
                </h2>
                {selected ? <p className="mt-1 text-sm text-black/55">{selected.instrumentName}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor={`${titleId}-filter`} className="sr-only">Filter by holding</label>
                <select
                  id={`${titleId}-filter`}
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                >
                  <option value={ALL}>All holdings</option>
                  {instruments.map((row) => (
                    <option key={row.instrumentId} value={row.instrumentId}>{row.symbol}</option>
                  ))}
                </select>
                <Button type="button" size="sm" variant="secondary" onClick={close}>Close</Button>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-4 border-b border-black/10 px-6 py-4 text-sm">
              <div>
                <dt className="text-xs text-black/55">Trades</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{summary.tradeCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-black/55">Realized return</dt>
                <dd className={`mt-0.5 font-medium tabular-nums ${toneClass(summary.realizedTone)}`}>{summary.realizedReturn}</dd>
              </div>
              <div>
                <dt className="text-xs text-black/55">Fees paid</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{summary.fees}</dd>
              </div>
            </dl>

            <div className="min-h-0 flex-1 overflow-auto">
              {visible.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-black/55">No trades recorded for this holding.</p>
              ) : (
                <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-white text-xs text-black/55 shadow-[inset_0_-1px_0_rgb(0_0_0/0.1)]">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Date &amp; time</th>
                      {filter === ALL ? <th scope="col" className="px-4 py-3 font-medium">Instrument</th> : null}
                      <th scope="col" className="px-4 py-3 font-medium">Side</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Quantity</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Fee</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Cash flow</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Realized P/L</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Position after</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.id} className="border-t border-black/10">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDateTime(row.executedAt)}</td>
                        {filter === ALL ? <td className="whitespace-nowrap px-4 py-3 font-semibold">{row.symbol}</td> : null}
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.side === "buy" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                            {row.side === "buy" ? "Buy" : "Sell"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.price}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.fee}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.cashFlow}</td>
                        <td className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${toneClass(row.realizedTone)}`}>{row.realizedReturn ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-black/70">{row.positionAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function toneClass(tone: "gain" | "loss" | "flat" | null): string {
  return tone === "gain" ? "text-emerald-700" : tone === "loss" ? "text-red-700" : "";
}

/** Rendered only after the dialog opens on the client, so the viewer's time zone is used without hydration mismatches. */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
