"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitEarning, type EarningActionState } from "./actions";
import { Field } from "./form-field";

export interface EarningInstrumentOption {
  id: string;
  symbol: string;
  name: string;
}

/** An earnings entry with its amount already formatted on the server. */
export interface EarningRow {
  id: string;
  kindLabel: string;
  amount: string;
  symbol: string | null;
  receivedAt: string;
  note: string | null;
}

interface EarningsButtonProps {
  accountId: string;
  currency: string;
  instruments: EarningInstrumentOption[];
  entries: EarningRow[];
  total: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

const initialState: EarningActionState = { status: "idle" };

export function EarningsButton({
  accountId,
  currency,
  instruments,
  entries,
  total,
  label = "Add earnings",
  size = "sm",
  variant = "secondary",
  className,
}: EarningsButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);

  const open = () => {
    setSession((value) => value + 1);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button type="button" size={size} variant={variant} className={className} onClick={open}>
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`earnings-title-${accountId}`}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-0 text-left text-black shadow-2xl backdrop:bg-black/40"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        {session > 0 ? (
          <div className="flex max-h-[min(46rem,calc(100vh-4rem))] flex-col">
            <EarningForm
              key={session}
              titleId={`earnings-title-${accountId}`}
              accountId={accountId}
              currency={currency}
              instruments={instruments}
              onDone={close}
            />
            <section aria-label="Recorded earnings" className="min-h-0 flex-1 overflow-auto border-t border-black/10 px-6 py-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-medium text-black/75">Recorded earnings</h3>
                <span className="text-sm font-medium tabular-nums text-emerald-700">{total}</span>
              </div>
              {entries.length === 0 ? (
                <p className="mt-3 text-sm text-black/55">No earnings recorded yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-black/10 text-sm">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-start justify-between gap-4 py-2">
                      <div className="min-w-0">
                        <p className="text-black/80">
                          {formatDate(entry.receivedAt)} · {entry.kindLabel}
                          {entry.symbol ? <span className="font-semibold text-black"> · {entry.symbol}</span> : null}
                        </p>
                        {entry.note ? <p className="truncate text-xs text-black/50">{entry.note}</p> : null}
                      </div>
                      <span className="shrink-0 tabular-nums">{entry.amount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function EarningForm({
  titleId,
  accountId,
  currency,
  instruments,
  onDone,
}: {
  titleId: string;
  accountId: string;
  currency: string;
  instruments: EarningInstrumentOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitEarning, initialState);
  const [receivedOn, setReceivedOn] = useState(() => toLocalDateValue(new Date()));
  // Store the start of the chosen day in the viewer's time zone.
  const receivedAtIso = receivedOn ? new Date(`${receivedOn}T00:00`).toISOString() : "";
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-5 p-6">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="receivedAt" value={receivedAtIso} />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Earnings</p>
        <h2 id={titleId} className="mt-1 font-(--font-fashion-display) text-2xl">Add earnings</h2>
        <p className="mt-1 text-sm text-black/55">Income outside of trades. It is added to cash and total fund.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select name="kind" defaultValue="stock_lending" className={selectClass}>
            <option value="stock_lending">Stock lending</option>
          </select>
        </Field>
        <Field label={`Amount (${currency})`} error={fieldErrors?.amount}>
          <Input name="amount" inputMode="decimal" autoComplete="off" placeholder="0.00" required autoFocus />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Related holding (optional)">
          <select name="instrumentId" defaultValue="" className={selectClass}>
            <option value="">Not specific</option>
            {instruments.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>{instrument.symbol} — {instrument.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Received on" error={fieldErrors?.receivedAt}>
          <Input type="date" value={receivedOn} max={toLocalDateValue(new Date())} onChange={(event) => setReceivedOn(event.target.value)} required />
        </Field>
      </div>

      <Field label="Note (optional)" error={fieldErrors?.note}>
        <Input name="note" maxLength={200} autoComplete="off" placeholder="e.g. November stock lending payout" />
      </Field>

      {state.status === "error" ? <p role="alert" className="text-sm text-red-700">{state.message}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add earnings"}</Button>
      </div>
    </form>
  );
}

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

function toLocalDateValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Rendered only after the dialog opens on the client, so the viewer's time zone is used. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
