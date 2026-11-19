import type { DailyBar, DailyBarProvider, TradingInstrumentRecord } from "../application/repositories";
import { EodhdMarketData } from "./eodhd-market-data";
import { eodhdExchangeForCurrency } from "./eodhd-quote-provider";

const LOOKBACK_DAYS = 10;
/** Time zone used to turn a live quote's timestamp into a trading date. */
const MARKET_TIME_ZONE = "America/Toronto";

/**
 * Returns the most recent session's bar from EODHD. The official end-of-day bar can lag the close,
 * so the live endpoint's day bar is used when it is for a later date.
 */
export class EodhdDailyBarProvider implements DailyBarProvider {
  constructor(private readonly marketData: EodhdMarketData = new EodhdMarketData()) {}

  async getLatestDailyBar(instrument: Pick<TradingInstrumentRecord, "symbol" | "currency">): Promise<DailyBar> {
    const exchange = eodhdExchangeForCurrency(instrument.currency);
    const symbol = instrument.symbol.trim().toUpperCase();
    const ticker = `${symbol}.${exchange}`;

    const [daily, live] = await Promise.allSettled([
      this.marketData.getHistoricalDailyPrices({ symbol, exchange }, { lookbackDays: LOOKBACK_DAYS }),
      this.marketData.getRealTimeQuote({ symbol, exchange }),
    ]);

    const history = daily.status === "fulfilled" ? [...daily.value].sort((a, b) => b.date.localeCompare(a.date)) : [];
    const official = history[0];
    const quote = live.status === "fulfilled" ? live.value : null;
    const liveDate = quote ? tradingDate(quote.observedAt) : null;

    if (quote && liveDate && quote.open && quote.high && quote.low && (!official || liveDate > official.date)) {
      return {
        date: liveDate,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.price,
        previousClose: quote.previousClose ?? official?.close ?? null,
        isFinal: false,
        observedAt: quote.observedAt,
      };
    }
    if (official) {
      return {
        date: official.date,
        open: official.open,
        high: official.high,
        low: official.low,
        close: official.close,
        previousClose: history[1]?.close ?? null,
        isFinal: true,
        observedAt: null,
      };
    }

    const reasons = [daily, live].flatMap((result) => (result.status === "rejected" ? [errorMessage(result.reason)] : []));
    throw new Error(reasons.length > 0 ? reasons.join("; ") : `EODHD has no recent prices for ${ticker}`);
  }
}

function tradingDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: MARKET_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
