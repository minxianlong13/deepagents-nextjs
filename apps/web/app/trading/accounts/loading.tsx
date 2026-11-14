export default function TradingAccountsLoading() {
  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8" aria-busy="true" aria-label="Loading trading accounts">
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-6">
        <div className="space-y-3 border-b border-black/10 pb-6">
          <div className="h-4 w-24 rounded bg-black/10" />
          <div className="h-10 w-64 rounded bg-black/10" />
          <div className="h-4 w-80 rounded bg-black/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-36 rounded-xl border border-black/10 bg-white/70" />)}
        </div>
      </div>
    </main>
  );
}
