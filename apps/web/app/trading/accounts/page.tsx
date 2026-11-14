import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTradingAccounts } from "@/lib/trading/application";
import { createPrismaTradingRepositories } from "@/lib/trading/infrastructure";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TradingAccountsPage() {
  const accounts = await getTradingAccounts(createPrismaTradingRepositories());

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rise-in border-b border-black/10 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Trading</p>
          <h1 className="mt-3 font-(--font-fashion-display) text-4xl text-black">Trading accounts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/60">Choose an account to review its current holdings and values.</p>
        </header>

        {accounts.length === 0 ? (
          <Card className="border-black/10 bg-white/85">
            <CardContent className="px-6 py-12 text-center">
              <BriefcaseBusiness aria-hidden="true" className="mx-auto text-black/35" size={28} />
              <h2 className="mt-4 font-medium text-black">No trading accounts yet</h2>
              <p className="mt-2 text-sm text-black/55">Create an account before viewing its holdings.</p>
              <Link href="/manage/trading" className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80">
                Manage trading accounts
              </Link>
            </CardContent>
          </Card>
        ) : (
          <section aria-label="Trading accounts" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <Link key={account.id} href={`/trading/accounts/${account.id}`} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
                <Card className="h-full border-black/10 bg-white/85 transition-colors group-hover:bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-(--font-fashion-display) text-xl">{account.name}</CardTitle>
                        <CardDescription className="mt-1">{brokerName(account.broker)} · {account.accountType.replaceAll("_", " ")}</CardDescription>
                      </div>
                      <ArrowUpRight aria-hidden="true" className="shrink-0 text-black/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-800" size={18} />
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-black/55">
                    Base currency: <span className="font-medium text-black">{account.currency}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function brokerName(broker: string): string {
  if (broker === "ibkr") return "IBKR";
  if (broker === "wealthsimple") return "Wealthsimple";
  return broker;
}
