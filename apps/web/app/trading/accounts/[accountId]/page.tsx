import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTradingAccount } from "@/lib/trading/application";
import { createPrismaTradingRepositories } from "@/lib/trading/infrastructure";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = { params: Promise<{ accountId: string }> };

export default async function TradingAccountPage({ params }: PageProps) {
  const { accountId } = await params;
  const account = await getTradingAccount(accountId, createPrismaTradingRepositories());

  if (!account) notFound();

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

        <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Initial fund" value={formatMoney(account.initialFund, account.currency)} />
          <SummaryCard
            label="Total holdings value"
            value={formatMaybeMoney(account.totalMarketValue, account.currency)}
            note={account.totalMarketValue === null ? "Unavailable while any holding has no current price." : undefined}
          />
          <SummaryCard label="Total cost basis" value={formatMoney(account.totalCostBasis, account.currency)} />
          <SummaryCard
            label="Unrealized return"
            value={formatMaybeMoney(account.totalUnrealizedReturn, account.currency)}
            note={`${account.positions.length} holding${account.positions.length === 1 ? "" : "s"}`}
          />
        </section>

        <Card className="border-black/10 bg-white/85">
          <CardHeader className="border-b border-black/10">
            <CardTitle className="font-(--font-fashion-display) text-xl">Holdings</CardTitle>
            <CardDescription>Current positions and their unrealized values.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {account.positions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <h2 className="font-medium text-black">No holdings yet</h2>
                <p className="mt-2 text-sm text-black/55">This account does not have any positions to show.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] border-collapse text-left text-sm">
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

function SummaryCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="border-black/10 bg-white/78">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
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

function formatMaybeMoney(value: string | null, currency: string): string {
  return value === null ? "Unavailable" : formatMoney(value, currency);
}

function formatQuantity(value: string): string {
  return new Prisma.Decimal(value).toString();
}

function formatPercent(value: string | null): string {
  return value === null ? "Unavailable" : `${new Prisma.Decimal(value).toFixed(2)}%`;
}

function brokerName(broker: string): string {
  if (broker === "ibkr") return "IBKR";
  if (broker === "wealthsimple") return "Wealthsimple";
  return broker;
}
