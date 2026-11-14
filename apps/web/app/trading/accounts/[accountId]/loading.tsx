export default function TradingAccountLoading() {
  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8" aria-busy="true" aria-label="Loading trading account">
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-6">
        <div className="space-y-3 border-b border-black/10 pb-6">
          <div className="h-4 w-32 rounded bg-black/10" />
          <div className="h-10 w-72 rounded bg-black/10" />
          <div className="h-4 w-48 rounded bg-black/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl border border-black/10 bg-white/70" />)}
        </div>
        <div className="h-72 rounded-xl border border-black/10 bg-white/70" />
      </div>
    </main>
  );
}
