import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTradingAccount, type TradingAccountDetails } from "@/lib/trading/application";
import { createPrismaTradingRepositories } from "@/lib/trading/infrastructure";
import { EarningsButton, type EarningRow } from "./earnings-dialog";
import { RefreshPricesButton } from "./refresh-prices-button";
import { TradeButton, type TradeInstrumentOption } from "./trade-dialog";
import { TradeHistoryButton, type TradeHistoryRow, type TradeHistorySummary } from "./trade-history-dialog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Price refresh runs a web-search agent per holding from a Server Action on this page.
export const maxDuration = 300;

type PageProps = { params: Promise<{ accountId: string }> };

export default async function TradingAccountPage({ params }: PageProps) {
  const { accountId } = await params;
  const repositories = createPrismaTradingRepositories();
  const account = await getTradingAccount(accountId, repositories);

  if (!account) notFound();

  const activeInstruments = await repositories.instruments.findActiveByCurrency(account.currency);
  const tradeOptions = buildTradeOptions(account.positions, activeInstruments);
  const tradeProps = { accountId: account.id, currency: account.currency, instruments: tradeOptions };
  const historyProps = buildTradeHistory(account.trades, account.currency);
  const earningRows: EarningRow[] = account.earnings.map((earning) => ({
    id: earning.id,
    kindLabel: earningKindLabel(earning.kind),
    amount: formatSignedMoney(earning.amount, account.currency),
    symbol: earning.symbol,
    receivedAt: earning.receivedAt,
    note: earning.note,
  }));

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rise-in border-b border-black/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/trading/accounts" className="text-sm font-medium text-black/55 transition hover:text-black">
              ← All trading accounts
            </Link>
            <Link href="/manage/trading" className="inline-flex rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-white hover:text-black">
              Manage trading
            </Link>
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Trading account</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-(--font-fashion-display) text-4xl text-black">{account.name}</h1>
            <span className="text-sm text-black/55">{brokerName(account.broker)} · {account.accountType.replaceAll("_", " ")}</span>
          </div>
          <p className="mt-2 text-sm text-black/60">All values are shown in {account.currency}.</p>
        </header>

        <section aria-label="Account summary" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total fund"
              value={formatMaybeMoney(account.totalFund, account.currency)}
              note={account.totalReturn === null
                ? "Unavailable while any holding has no current price. Use “Refresh prices” to fetch them."
                : `${formatSignedMoney(account.totalReturn, account.currency)} vs initial fund (${formatReturnPercent(account.totalReturn, account.initialFund)})`}
              tone={account.totalReturn === null ? undefined : tone(account.totalReturn)}
            />
            <SummaryCard
              label="Cash"
              value={formatMoney(account.cashBalance, account.currency)}
              note={new Prisma.Decimal(account.cashBalance).isNegative() ? "Negative: buys exceed the initial fund, sell proceeds, and earnings." : "Initial fund ± trade cash flows after fees, plus earnings."}
            />
            <SummaryCard
              label="Total holdings value"
              value={formatMaybeMoney(account.totalMarketValue, account.currency)}
              note={account.totalMarketValue === null ? "Unavailable while any holding has no current price. Use “Refresh prices” to fetch them." : undefined}
            />
            <SummaryCard label="Initial fund" value={formatMoney(account.initialFund, account.currency)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Earnings"
              value={formatSignedMoney(account.totalEarnings, account.currency)}
              note={`Stock lending and other income · ${account.earnings.length} entr${account.earnings.length === 1 ? "y" : "ies"}`}
              tone={tone(account.totalEarnings)}
              action={(
                <EarningsButton
                  accountId={account.id}
                  currency={account.currency}
                  instruments={tradeOptions}
                  entries={earningRows}
                  total={formatSignedMoney(account.totalEarnings, account.currency)}
                  label={account.earnings.length === 0 ? "Add earnings" : "Add / view"}
                  className="h-8 px-3"
                />
              )}
            />
            <SummaryCard
              label="Realized return"
              value={formatSignedMoney(account.realizedReturn, account.currency)}
              note={`From ${account.tradeCount} trade${account.tradeCount === 1 ? "" : "s"} · ${formatMoney(account.totalFees, account.currency)} in fees`}
              tone={tone(account.realizedReturn)}
            />
            <SummaryCard
              label="Unrealized return"
              value={account.totalUnrealizedReturn === null ? "Unavailable" : formatSignedMoney(account.totalUnrealizedReturn, account.currency)}
              note={`${account.positions.length} holding${account.positions.length === 1 ? "" : "s"}`}
              tone={account.totalUnrealizedReturn === null ? undefined : tone(account.totalUnrealizedReturn)}
            />
            <SummaryCard label="Total cost basis" value={formatMoney(account.totalCostBasis, account.currency)} />
          </div>
        </section>

        <Card className="border-black/10 bg-white/85">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-black/10">
            <div className="space-y-1.5">
              <CardTitle className="font-(--font-fashion-display) text-xl">Holdings</CardTitle>
              <CardDescription>Current positions and their unrealized values.</CardDescription>
            </div>
            <div className="flex gap-2">
              <TradeButton {...tradeProps} side="buy" label="Buy holding" />
              <TradeButton {...tradeProps} side="sell" label="Sell holding" />
              <TradeHistoryButton {...historyProps} label="Trade history" variant="secondary" />
            </div>
            <div className="basis-full">
              <RefreshPricesButton accountId={account.id} disabled={account.positions.length === 0} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {account.positions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <h2 className="font-medium text-black">No holdings yet</h2>
                <p className="mt-2 text-sm text-black/55">This account does not have any positions to show. Use “Buy holding” to open one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
                  <thead className="bg-black/[0.025] text-xs text-black/55">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Instrument</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Quantity</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Average cost</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Cost basis</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Current price</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Market value</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Unrealized P/L</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Return</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.positions.map((position) => (
                      <tr key={position.id} className="border-t border-black/10 align-top">
                        <th scope="row" className="px-4 py-4 font-normal">
                          <span className="block font-semibold text-black">{position.symbol}</span>
                          <span className="mt-0.5 block text-xs text-black/55">{position.instrumentName} · {position.instrumentType.toUpperCase()}</span>
                        </th>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatQuantity(position.quantity)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatMoney(position.averageCost, account.currency)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatMoney(position.costBasis, account.currency)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatMaybeMoney(position.currentPrice, account.currency)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatMaybeMoney(position.marketValue, account.currency)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatMaybeMoney(position.unrealizedReturn, account.currency)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatPercent(position.unrealizedReturnPercent)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <TradeButton {...tradeProps} side="buy" defaultInstrumentId={position.instrumentId} className="h-8 px-3" />
                            <TradeButton {...tradeProps} side="sell" defaultInstrumentId={position.instrumentId} className="h-8 px-3" />
                            <TradeHistoryButton {...historyProps} defaultInstrumentId={position.instrumentId} className="h-8 px-3" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function buildTradeHistory(
  trades: TradingAccountDetails["trades"],
  currency: string,
): { rows: TradeHistoryRow[]; summaries: Record<string, TradeHistorySummary> } {
  const rows: TradeHistoryRow[] = trades.map((trade) => ({
    id: trade.id,
    instrumentId: trade.instrumentId,
    symbol: trade.symbol,
    instrumentName: trade.instrumentName,
    side: trade.side,
    executedAt: trade.executedAt,
    quantity: formatQuantity(trade.quantity),
    price: formatMoney(trade.price, currency),
    fee: formatMoney(trade.fee, currency),
    cashFlow: formatSignedMoney(trade.cashFlow, currency),
    realizedReturn: trade.realizedReturn === null ? null : formatSignedMoney(trade.realizedReturn, currency),
    realizedTone: trade.realizedReturn === null ? null : tone(trade.realizedReturn),
    positionAfter: trade.averageCostAfter === null
      ? "Closed"
      : `${formatQuantity(trade.quantityAfter)} @ ${formatMoney(trade.averageCostAfter, currency)}`,
  }));

  const totals = new Map<string, { count: number; realized: Prisma.Decimal; fees: Prisma.Decimal }>();
  for (const trade of trades) {
    for (const key of ["all", trade.instrumentId]) {
      const entry = totals.get(key) ?? { count: 0, realized: new Prisma.Decimal(0), fees: new Prisma.Decimal(0) };
      entry.count += 1;
      entry.fees = entry.fees.plus(trade.fee);
      if (trade.realizedReturn !== null) entry.realized = entry.realized.plus(trade.realizedReturn);
      totals.set(key, entry);
    }
  }
  const summaries: Record<string, TradeHistorySummary> = {};
  for (const [key, entry] of totals) {
    summaries[key] = {
      tradeCount: entry.count,
      realizedReturn: formatSignedMoney(entry.realized.toString(), currency),
      realizedTone: tone(entry.realized.toString()),
      fees: formatMoney(entry.fees.toString(), currency),
    };
  }
  return { rows, summaries };
}

function buildTradeOptions(
  positions: Array<{ instrumentId: string; symbol: string; instrumentName: string; quantity: string }>,
  activeInstruments: Array<{ id: string; symbol: string; name: string }>,
): TradeInstrumentOption[] {
  const options = new Map<string, TradeInstrumentOption>();
  for (const position of positions) {
    options.set(position.instrumentId, {
      id: position.instrumentId,
      symbol: position.symbol,
      name: position.instrumentName,
      heldQuantity: formatQuantity(position.quantity),
    });
  }
  for (const instrument of activeInstruments) {
    if (!options.has(instrument.id)) {
      options.set(instrument.id, { id: instrument.id, symbol: instrument.symbol, name: instrument.name, heldQuantity: null });
    }
  }
  return [...options.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function SummaryCard({ label, value, note, tone, action }: { label: string; value: string; note?: string; tone?: "gain" | "loss" | "flat"; action?: ReactNode }) {
  return (
    <Card className="border-black/10 bg-white/78">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          {action}
        </div>
        <CardTitle className={`text-xl tabular-nums ${tone === "gain" ? "text-emerald-700" : tone === "loss" ? "text-red-700" : ""}`}>{value}</CardTitle>
      </CardHeader>
      {note ? <CardContent className="pt-0 text-xs leading-relaxed text-black/50">{note}</CardContent> : null}
    </Card>
  );
}

function formatMoney(value: string, currency: string): string {
  const fixed = new Prisma.Decimal(value).toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${grouped}.${fraction}`;
}

function formatSignedMoney(value: string, currency: string): string {
  const amount = new Prisma.Decimal(value);
  if (amount.isZero()) return formatMoney("0", currency);
  return `${amount.isNegative() ? "−" : "+"}${formatMoney(amount.abs().toString(), currency)}`;
}

function formatReturnPercent(change: string, base: string): string {
  const baseAmount = new Prisma.Decimal(base);
  if (baseAmount.isZero()) return "n/a";
  const percent = new Prisma.Decimal(change).div(baseAmount).mul(100);
  return `${percent.isNegative() ? "" : "+"}${percent.toFixed(2)}%`;
}

function tone(value: string): "gain" | "loss" | "flat" {
  const amount = new Prisma.Decimal(value);
  return amount.isZero() ? "flat" : amount.isNegative() ? "loss" : "gain";
}

function formatMaybeMoney(value: string | null, currency: string): string {
  return value === null ? "Unavailable" : formatMoney(value, currency);
}

function formatQuantity(value: string): string {
  return new Prisma.Decimal(value).toFixed();
}

function formatPercent(value: string | null): string {
  return value === null ? "Unavailable" : `${new Prisma.Decimal(value).toFixed(2)}%`;
}

function earningKindLabel(kind: string): string {
  if (kind === "stock_lending") return "Stock lending";
  return kind.replaceAll("_", " ");
}

function brokerName(broker: string): string {
  if (broker === "ibkr") return "IBKR";
  if (broker === "wealthsimple") return "Wealthsimple";
  return broker;
}
