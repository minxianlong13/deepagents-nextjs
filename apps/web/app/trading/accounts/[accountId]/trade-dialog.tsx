"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { submitTrade, type TradeActionState } from "./actions";
import { Field } from "./form-field";

export type TradeSide = "buy" | "sell";

export interface TradeInstrumentOption {
  id: string;
  symbol: string;
  name: string;
  /** Quantity currently held in this account, or null when not held. */
  heldQuantity: string | null;
}

interface TradeButtonProps {
  accountId: string;
  currency: string;
  side: TradeSide;
  instruments: TradeInstrumentOption[];
  defaultInstrumentId?: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

const initialState: TradeActionState = { status: "idle" };

export function TradeButton({
  accountId,
  currency,
  side,
  instruments,
  defaultInstrumentId,
  label,
  size = "sm",
  variant,
  className,
}: TradeButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);
  const options = side === "sell" ? instruments.filter((option) => option.heldQuantity !== null) : instruments;
  const disabled = options.length === 0;

  const open = () => {
    setSession((value) => value + 1);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant ?? (side === "buy" ? "default" : "secondary")}
        className={className}
        onClick={open}
        disabled={disabled}
        title={disabled ? (side === "sell" ? "No holdings to sell" : "No active instruments in this currency") : undefined}
      >
        {label ?? (side === "buy" ? "Buy" : "Sell")}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`trade-title-${side}-${defaultInstrumentId ?? "any"}`}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-0 text-left text-black shadow-2xl backdrop:bg-black/40"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        {session > 0 ? (
          <TradeForm
            key={session}
            titleId={`trade-title-${side}-${defaultInstrumentId ?? "any"}`}
            accountId={accountId}
            currency={currency}
            side={side}
            options={options}
            defaultInstrumentId={defaultInstrumentId ?? options[0]?.id}
            onDone={close}
          />
        ) : null}
      </dialog>
    </>
  );
}

function TradeForm({
  titleId,
  accountId,
  currency,
  side,
  options,
  defaultInstrumentId,
  onDone,
}: {
  titleId: string;
  accountId: string;
  currency: string;
  side: TradeSide;
  options: TradeInstrumentOption[];
  defaultInstrumentId?: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitTrade, initialState);
  const [instrumentId, setInstrumentId] = useState(defaultInstrumentId ?? "");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("0");
  const [executedAtLocal, setExecutedAtLocal] = useState(() => toLocalInputValue(new Date()));
  const executedAtIso = parseLocalInputValue(executedAtLocal)?.toISOString() ?? "";
  const selected = options.find((option) => option.id === instrumentId);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  const quantityNumber = Number(quantity);
  const priceNumber = Number(price);
  const feeNumber = fee.trim() === "" ? 0 : Number(fee);
  const gross = quantityNumber * priceNumber;
  // Buys pay the fee on top; sells net it out of proceeds.
  const net = side === "buy" ? gross + feeNumber : gross - feeNumber;
  const estimate = quantity && price && Number.isFinite(gross) && Number.isFinite(feeNumber)
    ? net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
  const oversell = side === "sell" && selected?.heldQuantity != null && quantity !== "" && quantityNumber > Number(selected.heldQuantity);

  return (
    <form action={formAction} className="space-y-5 p-6">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="side" value={side} />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">{side === "buy" ? "Buy order" : "Sell order"}</p>
        <h2 id={titleId} className="mt-1 font-(--font-fashion-display) text-2xl">
          {side === "buy" ? "Buy" : "Sell"} {selected?.symbol ?? "holding"}
        </h2>
        {selected ? <p className="mt-1 text-sm text-black/55">{selected.name}{selected.heldQuantity ? ` · ${selected.heldQuantity} held` : ""}</p> : null}
      </div>

      <Field label="Instrument" error={fieldErrors?.instrumentId}>
        <select
          name="instrumentId"
          value={instrumentId}
          onChange={(event) => setInstrumentId(event.target.value)}
          required
          className="flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.symbol} — {option.name}</option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Quantity"
          error={fieldErrors?.quantity ?? (oversell ? `Only ${selected?.heldQuantity} held.` : undefined)}
          action={side === "sell" && selected?.heldQuantity ? (
            <button type="button" className="text-xs font-medium text-black/55 underline-offset-2 hover:text-black hover:underline" onClick={() => setQuantity(selected.heldQuantity!)}>
              Max
            </button>
          ) : null}
        >
          <Input name="quantity" inputMode="decimal" autoComplete="off" placeholder="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} required autoFocus />
        </Field>
        <Field label={`Price (${currency})`} error={fieldErrors?.price}>
          <Input name="price" inputMode="decimal" autoComplete="off" placeholder="0.00" value={price} onChange={(event) => setPrice(event.target.value)} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Fees & commissions (${currency})`} error={fieldErrors?.fee}>
          <Input name="fee" inputMode="decimal" autoComplete="off" placeholder="0.00" value={fee} onChange={(event) => setFee(event.target.value)} />
        </Field>
        <Field
          label="Date & time"
          error={fieldErrors?.executedAt}
          action={(
            <button type="button" className="text-xs font-medium text-black/55 underline-offset-2 hover:text-black hover:underline" onClick={() => setExecutedAtLocal(toLocalInputValue(new Date()))}>
              Now
            </button>
          )}
        >
          <Input type="datetime-local" step={60} value={executedAtLocal} max={toLocalInputValue(new Date())} onChange={(event) => setExecutedAtLocal(event.target.value)} required />
        </Field>
      </div>
      <input type="hidden" name="executedAt" value={executedAtIso} />

      <div className="flex items-center justify-between rounded-lg bg-black/[0.035] px-4 py-3 text-sm">
        <span className="text-black/55">Estimated {side === "buy" ? "total cost" : "net proceeds"}{feeNumber > 0 ? " incl. fees" : ""}</span>
        <span className="font-medium tabular-nums">{estimate ? `${currency} ${estimate}` : "—"}</span>
      </div>

      {state.status === "error" ? <p role="alert" className="text-sm text-red-700">{state.message}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending || oversell} className={cn(side === "sell" && "bg-red-700 text-white hover:bg-red-700/90")}>
          {pending ? "Saving…" : side === "buy" ? "Confirm buy" : "Confirm sell"}
        </Button>
      </div>
    </form>
  );
}

/** Formats a Date as the `YYYY-MM-DDTHH:mm` value a datetime-local input expects, in the browser's time zone. */
function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses a datetime-local value as local time; returns null for empty or invalid input. */
function parseLocalInputValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
