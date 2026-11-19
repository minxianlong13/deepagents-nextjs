import { decimal } from "../domain";
import type {
  PositionPriceRepository,
  PositionRepository,
  TradingAccountRepository,
  TradingInstrumentRecord,
  TradingInstrumentRepository,
} from "./repositories";

export interface PriceQuote {
  symbol: string;
  price: string;
  currency: string;
  /** When the source says the price was observed, if it reported one. */
  asOf: string | null;
  /** Public page the price can be checked on; null when the source has no browsable page. */
  sourceUrl: string | null;
  /** Human-readable source for quotes from a trusted data API (e.g. "EODHD daily close"). */
  sourceLabel?: string | null;
}

/** Looks up the latest market price for an instrument. Implementations may be slow or fail. */
export interface PriceQuoteProvider {
  getQuote(instrument: Pick<TradingInstrumentRecord, "symbol" | "name" | "instrumentType" | "currency">): Promise<PriceQuote>;
}

export interface PriceRefreshRepositories {
  accounts: Pick<TradingAccountRepository, "findById">;
  instruments: Pick<TradingInstrumentRepository, "findByIds">;
  positions: PositionRepository;
  positionPrices: PositionPriceRepository;
}

export type PriceRefreshResult =
  | {
      positionId: string;
      symbol: string;
      status: "updated";
      previousPrice: string | null;
      price: string;
      asOf: string | null;
      sourceUrl: string | null;
      sourceLabel: string;
    }
  | { positionId: string; symbol: string; status: "failed"; reason: string };

const PRICE_PATTERN = /^\d+(\.\d{1,8})?$/;

/**
 * Fetches a current price for every holding in the account and stores the ones that pass validation.
 * A holding whose quote fails or looks wrong keeps its previous price and is reported as failed.
 */
export async function refreshPositionPrices(
  accountId: string,
  repositories: PriceRefreshRepositories,
  quotes: PriceQuoteProvider,
  options: { concurrency?: number } = {},
): Promise<PriceRefreshResult[] | null> {
  const account = await repositories.accounts.findById(accountId);
  if (!account) return null;

  const positions = await repositories.positions.findByAccountId(account.id);
  const instruments = await repositories.instruments.findByIds([...new Set(positions.map((p) => p.tradingInstrumentId))]);
  const instrumentsById = new Map(instruments.map((instrument) => [instrument.id, instrument]));

  return mapWithConcurrency(positions, options.concurrency ?? 3, async (position): Promise<PriceRefreshResult> => {
    const instrument = instrumentsById.get(position.tradingInstrumentId);
    if (!instrument) {
      return { positionId: position.id, symbol: position.tradingInstrumentId, status: "failed", reason: "Instrument not found" };
    }
    const fail = (reason: string): PriceRefreshResult => ({ positionId: position.id, symbol: instrument.symbol, status: "failed", reason });

    let quote: PriceQuote;
    try {
      quote = await quotes.getQuote(instrument);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Price lookup failed");
    }

    if (quote.symbol.trim().toUpperCase() !== instrument.symbol.toUpperCase()) {
      return fail(`Quote was for ${quote.symbol}, not ${instrument.symbol}`);
    }
    if (quote.currency.trim().toUpperCase() !== account.currency.toUpperCase()) {
      return fail(`Quote was in ${quote.currency}, but the account uses ${account.currency}`);
    }
    if (!PRICE_PATTERN.test(quote.price) || decimal(quote.price).isZero()) {
      return fail(`Quote price "${quote.price}" is not a valid positive price`);
    }
    const sourceLabel = quote.sourceLabel?.trim() || (quote.sourceUrl ? hostname(quote.sourceUrl) : null);
    if (!sourceLabel) {
      return fail("Quote did not cite a source");
    }

    await repositories.positionPrices.updateCurrentPrice(position.id, account.id, quote.price);
    return {
      positionId: position.id,
      symbol: instrument.symbol,
      status: "updated",
      previousPrice: position.currentPrice,
      price: quote.price,
      asOf: quote.asOf,
      sourceUrl: quote.sourceUrl,
      sourceLabel,
    };
  });
}

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, worker));
  return results;
}
