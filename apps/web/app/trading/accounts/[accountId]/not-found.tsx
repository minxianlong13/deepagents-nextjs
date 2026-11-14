import Link from "next/link";

export default function TradingAccountNotFound() {
  return (
    <main className="min-h-[60vh] p-4 md:p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white/85 p-8 md:p-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">Trading account</p>
        <h1 className="mt-3 font-(--font-fashion-display) text-3xl">Account not found</h1>
        <p className="mt-2 text-sm text-black/60">The account may have been removed or the link may be incorrect.</p>
        <Link href="/manage/trading" className="mt-6 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80">
          Go to trading management
        </Link>
      </div>
    </main>
  );
}
