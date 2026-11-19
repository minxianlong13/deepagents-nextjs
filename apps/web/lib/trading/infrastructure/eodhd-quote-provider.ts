import type { PriceQuote, PriceQuoteProvider } from "../application/refresh-position-prices";
import type { TradingInstrumentRecord } from "../application/repositories";
import { EodhdMarketData } from "./eodhd-market-data";

/** Days of daily history to request for the fallback; covers weekends and market holidays. */
const QUOTE_LOOKBACK_DAYS = 10;

/** EODHD exchange suffix for the account currencies we support. */
const EXCHANGE_BY_CURRENCY: Record<string, string> = {
  CAD: "TO",
  USD: "US",
};

/** Maps an instrument's currency to its EODHD exchange suffix; throws for unsupported currencies. */
export function eodhdExchangeForCurrency(currency: string): string {
  const exchange = EXCHANGE_BY_CURRENCY[currency.toUpperCase()];
  if (!exchange) throw new Error(`No EODHD exchange is configured for ${currency.toUpperCase()} instruments`);
  return exchange;
}

/**
 * Prices a holding from EODHD without an LLM. Uses the live (delayed ~15–25 min) quote first and
 * falls back to the latest daily close when live data is unavailable. The instrument's symbol and
 * currency determine the EODHD ticker directly.
 */
export class EodhdQuoteProvider implements PriceQuoteProvider {
  constructor(private readonly marketData: EodhdMarketData = new EodhdMarketData()) {}

  async getQuote(
    instrument: Pick<TradingInstrumentRecord, "symbol" | "name" | "instrumentType" | "currency">,
  ): Promise<PriceQuote> {
    const currency = instrument.currency.toUpperCase();
    const exchange = eodhdExchangeForCurrency(currency);

    const symbol = instrument.symbol.trim().toUpperCase();
    const ticker = `${symbol}.${exchange}`;
    const base = { symbol: instrument.symbol, currency, sourceUrl: null };

    let liveError: unknown = null;
    try {
      const live = await this.marketData.getRealTimeQuote({ symbol, exchange });
      if (live) {
        return { ...base, price: live.price, asOf: live.observedAt, sourceLabel: `EODHD live, delayed (${ticker})` };
      }
    } catch (error) {
      liveError = error;
    }

    let prices;
    try {
      prices = await this.marketData.getHistoricalDailyPrices({ symbol, exchange }, { lookbackDays: QUOTE_LOOKBACK_DAYS });
    } catch (error) {
      // Report both failures so a plan/auth problem on one endpoint is not hidden by the other.
      const live = liveError instanceof Error ? `live: ${liveError.message}; ` : "";
      throw new Error(`${live}daily: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Requested newest first; sort defensively in case the API ignores `order`.
    const latest = [...prices].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest) throw new Error(`EODHD has no prices for ${ticker} in the last ${QUOTE_LOOKBACK_DAYS} days`);

    return { ...base, price: latest.close, asOf: latest.date, sourceLabel: `EODHD daily close (${ticker})` };
  }
}
