"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./form-field";
import { loadGridReport, saveGridSettingsAction, type GridView } from "./grid-actions";

type LoadedView = Exclude<GridView, { status: "error" }>;

interface GridButtonProps {
  accountId: string;
  instrumentId: string;
  symbol: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

export function GridButton({ accountId, instrumentId, symbol, label = "Grid", size = "sm", variant = "ghost", className }: GridButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [view, setView] = useState<LoadedView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const titleId = `grid-title-${instrumentId}`;

  const apply = (result: GridView) => {
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    setError(null);
    setView(result);
    setEditing(false);
  };

  const open = () => {
    setOpened(true);
    setError(null);
    dialogRef.current?.showModal();
    startTransition(async () => apply(await loadGridReport(accountId, instrumentId)));
  };
  const close = () => dialogRef.current?.close();

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => apply(await saveGridSettingsAction(formData)));
  };

  const showForm = view !== null && (view.status === "needs_setup" || editing);

  return (
    <>
      <Button type="button" size={size} variant={variant} className={className} onClick={open}>
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(64rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-0 text-left text-black shadow-2xl backdrop:bg-black/40"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        {opened ? (
          <div className="flex max-h-[min(52rem,calc(100vh-3rem))] flex-col">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Grid report · next session</p>
                <h2 id={titleId} className="mt-1 font-(--font-fashion-display) text-2xl">{view?.symbol ?? symbol}</h2>
                {view ? <p className="mt-1 text-sm text-black/55">{view.name}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {view?.status === "ready" && !editing ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={pending}>Edit grid</Button>
                ) : null}
                <Button type="button" size="sm" variant="secondary" onClick={close}>Close</Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-auto p-6">
              {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
              {!view && pending ? <p className="text-sm text-black/55" aria-live="polite">Fetching today&rsquo;s prices and building the grid…</p> : null}

              {view ? (
                <>
                  <SessionSummary view={view} />
                  {showForm ? (
                    <SettingsForm
                      key={`${view.status}-${editing}`}
                      accountId={accountId}
                      instrumentId={instrumentId}
                      view={view}
                      pending={pending}
                      onSubmit={save}
                      onCancel={view.status === "ready" ? () => setEditing(false) : undefined}
                    />
                  ) : null}
                  {view.plan && !showForm ? <Ladder view={view} plan={view.plan} /> : null}
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function SessionSummary({ view }: { view: LoadedView }) {
  const { session, position } = view;
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <Stat label={`Close · ${session.date}`} value={session.close} note={session.change} tone={session.changeTone} />
        <Stat label="Day range" value={`${session.low} – ${session.high}`} note={`Open ${session.open}`} />
        <Stat label="Position" value={`${position.quantity} shares`} note={position.averageCost ? `Avg cost ${position.averageCost}` : "Not held"} />
        <Stat label="Cash available" value={position.cash} />
      </dl>
      {session.isFinal ? null : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Using a live, delayed snapshot{session.observedAt ? ` from ${formatTime(session.observedAt)}` : ""} because the official closing bar
          for {session.date} is not published yet. If the market is still open, the close and the plan below can change.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string | null; tone?: "gain" | "loss" | "flat" | null }) {
  return (
    <div>
      <dt className="text-xs text-black/55">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
      {note ? <dd className={`text-xs tabular-nums ${toneClass(tone) || "text-black/50"}`}>{note}</dd> : null}
    </div>
  );
}

function Ladder({ view, plan }: { view: LoadedView; plan: NonNullable<LoadedView["plan"]> }) {
  // Highest price at the top: far sells, near sells, the close, near buys, far buys.
  const sells = [...plan.sell].reverse();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-black/75">Limit orders for the next session</h3>
        <p className="text-xs text-black/50">{plan.summary}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-black/[0.025] text-xs text-black/55">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Limit price</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">vs close</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Shares</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Profit</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">If filled</th>
            </tr>
          </thead>
          <tbody>
            {sells.map((level) => (
              <tr key={`sell-${level.price}`} className={`border-t border-black/10 ${level.note === "No shares left to sell" ? "text-black/40" : ""}`}>
                <td className="px-4 py-2.5"><SideBadge side="sell" />{level.note ? <span className="ml-2 text-xs text-black/50">{level.note}</span> : null}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums">{level.price}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-black/60">{level.distance}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{level.quantity}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{level.proceeds}</td>
                <td className={`whitespace-nowrap px-4 py-2.5 text-right tabular-nums ${toneClass(level.profitTone)}`} title="Against your average cost">{level.profit ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs tabular-nums text-black/60">{level.sharesLeft} shares left</td>
              </tr>
            ))}
            <tr className="border-t border-black/10 bg-black/[0.04]">
              <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black/60">Close</td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums">{view.session.close}</td>
              <td colSpan={5} className="px-4 py-2 text-xs text-black/50">{view.session.date}</td>
            </tr>
            {plan.buy.map((level) => (
              <tr key={`buy-${level.price}`} className={`border-t border-black/10 ${level.affordable ? "" : "text-black/40"}`}>
                <td className="px-4 py-2.5"><SideBadge side="buy" />{level.note ? <span className="ml-2 text-xs text-red-700">{level.note}</span> : null}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums">{level.price}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-black/60">{level.distance}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{level.quantity}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{level.cost}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-emerald-700" title="If this lot is sold one level up">{level.roundTripProfit}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs tabular-nums text-black/60">
                  {level.cashAfter} cash{level.averageCostAfter ? ` · avg ${level.averageCostAfter}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-1 text-xs text-black/55">
        <li>Sell profit is measured against your average cost. Buy profit is what that lot earns if it is later sold one level up.</li>
        <li>&ldquo;If filled&rdquo; assumes every nearer order on the same side has also filled. All buys together need {plan.totalBuyCost}; all sells together return {plan.totalSellProceeds}.</li>
        <li>
          {plan.levelsInSessionRange.length === 0
            ? "No grid level fell inside today's price range."
            : `Grid levels inside today's range: ${plan.levelsInSessionRange.join(", ")}.`}
        </li>
      </ul>
    </div>
  );
}

function SettingsForm({
  accountId,
  instrumentId,
  view,
  pending,
  onSubmit,
  onCancel,
}: {
  accountId: string;
  instrumentId: string;
  view: LoadedView;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
}) {
  const [anchor, setAnchor] = useState(view.settings.anchorPrice);
  const [spacingMode, setSpacingMode] = useState(view.settings.spacingMode);
  const [sizingMode, setSizingMode] = useState(view.settings.sizingMode);

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-black/10 p-4">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <div>
        <h3 className="text-sm font-medium text-black/75">{view.status === "needs_setup" ? "Set up the grid" : "Edit the grid"}</h3>
        <p className="mt-1 text-xs text-black/55">
          Levels are built up and down from the anchor price and stay fixed until you change it. Each report plans the nearest levels below the close as buys and above it as sells.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label={`Anchor price (${view.currency})`}
          action={(
            <button type="button" className="text-xs font-medium text-black/55 underline-offset-2 hover:text-black hover:underline" onClick={() => setAnchor(view.session.closeRaw)}>
              Use close
            </button>
          )}
        >
          <Input name="anchorPrice" inputMode="decimal" autoComplete="off" value={anchor} onChange={(event) => setAnchor(event.target.value)} required />
        </Field>
        <Field label="Spacing">
          <select name="spacingMode" value={spacingMode} onChange={(event) => setSpacingMode(event.target.value as typeof spacingMode)} className={selectClass}>
            <option value="percent">Percent step</option>
            <option value="amount">Fixed price step</option>
          </select>
        </Field>
        <Field label={spacingMode === "percent" ? "Step (%)" : `Step (${view.currency})`}>
          <Input name="stepValue" inputMode="decimal" autoComplete="off" defaultValue={view.settings.stepValue} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Size per level">
          <select name="sizingMode" value={sizingMode} onChange={(event) => setSizingMode(event.target.value as typeof sizingMode)} className={selectClass}>
            <option value="shares">Fixed shares</option>
            <option value="amount">Fixed cash amount</option>
          </select>
        </Field>
        <Field label={sizingMode === "shares" ? "Shares per level" : `Cash per level (${view.currency})`}>
          <Input name="sizeValue" inputMode="decimal" autoComplete="off" defaultValue={view.settings.sizeValue} required />
        </Field>
        <Field label="Levels per side">
          <Input name="levelsPerSide" type="number" min={1} max={50} step={1} defaultValue={view.settings.levelsPerSide} required />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Cancel</Button> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save and generate report"}</Button>
      </div>
    </form>
  );
}

function SideBadge({ side }: { side: "buy" | "sell" }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${side === "buy" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
      {side === "buy" ? "Buy" : "Sell"}
    </span>
  );
}

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

function toneClass(tone: "gain" | "loss" | "flat" | null | undefined): string {
  return tone === "gain" ? "text-emerald-700" : tone === "loss" ? "text-red-700" : "";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
