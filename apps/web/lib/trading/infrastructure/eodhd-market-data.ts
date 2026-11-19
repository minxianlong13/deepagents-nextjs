const DEFAULT_BASE_URL = "https://eodhd.com";
const HISTORY_LOOKBACK_DAYS = 1_100;
const MAX_DAILY_PRICES = 500;

export interface MarketDataSymbol {
  symbol: string;
  name: string;
  exchange: string;
  micCode: string | null;
  currency: string | null;
  instrumentType: string | null;
  country: string | null;
}

export interface HistoricalDailyPrice {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string | null;
}

export interface RealTimeQuote {
  /** EODHD ticker with exchange suffix, e.g. "XEQT.TO". */
  code: string;
  /** Latest traded price (EODHD's `close` field on the live endpoint). */
  price: string;
  previousClose: string | null;
  /** The session's open, high, and low so far; null when EODHD omits them. */
  open: string | null;
  high: string | null;
  low: string | null;
  /** When the price was observed, as an ISO-8601 UTC timestamp. */
  observedAt: string;
}

export interface EtfDailyPrices {
  symbol: MarketDataSymbol;
  prices: HistoricalDailyPrice[];
}

export interface EodhdMarketDataOptions {
  apiToken?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

/** Fetches ETF symbols and daily historical prices from EODHD. */
export class EodhdMarketData {
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: EodhdMarketDataOptions = {}) {
    this.apiToken = options.apiToken ?? process.env.EODHD_API_TOKEN ?? "";
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async searchSymbols(etfName: string): Promise<MarketDataSymbol[]> {
    const query = etfName.trim();
    if (!query) throw new Error("ETF name is required");

    const response = await this.request(
      `/api/search/${encodeURIComponent(query)}`,
    );
    if (!Array.isArray(response)) return [];

    return response.flatMap((item) => {
      if (!isRecord(item)) return [];
      const symbol = stringValue(item.Code);
      const name = stringValue(item.Name);
      const exchange = stringValue(item.Exchange);
      if (!symbol || !name || !exchange) return [];
      return [
        {
          symbol,
          name,
          exchange,
          micCode: nullableString(item.Mic),
          currency: nullableString(item.Currency),
          instrumentType: nullableString(item.Type),
          country: nullableString(item.Country),
        },
      ];
    });
  }

  async getHistoricalDailyPrices(
    symbol: Pick<MarketDataSymbol, "symbol" | "exchange">,
    options: { lookbackDays?: number } = {},
  ): Promise<HistoricalDailyPrice[]> {
    const ticker = symbol.symbol.trim();
    const exchange = toEodhdExchange(symbol.exchange);
    if (!ticker || !exchange)
      throw new Error("Resolved symbol and exchange are required");

    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - (options.lookbackDays ?? HISTORY_LOOKBACK_DAYS));
    const response = await this.request(
      `/api/eod/${encodeURIComponent(`${ticker}.${exchange}`)}`,
      {
        from: formatDate(from),
        to: formatDate(to),
        period: "d",
        order: "d",
      },
    );
    if (!Array.isArray(response)) return [];

    return response
      .flatMap((item) => {
        if (!isRecord(item)) return [];
        // EODHD returns prices and volume as JSON numbers.
        const date = stringValue(item.date);
        const open = numericString(item.open);
        const high = numericString(item.high);
        const low = numericString(item.low);
        const close = numericString(item.close);
        if (!date || !open || !high || !low || !close) return [];
        return [
          { date, open, high, low, close, volume: numericString(item.volume) },
        ];
      })
      .slice(0, MAX_DAILY_PRICES);
  }

  /**
   * Fetches EODHD's live (delayed) quote. Returns null when EODHD has no live data for the
   * ticker (it reports "NA" fields), so callers can fall back to the daily close.
   */
  async getRealTimeQuote(
    symbol: Pick<MarketDataSymbol, "symbol" | "exchange">,
  ): Promise<RealTimeQuote | null> {
    const ticker = symbol.symbol.trim();
    const exchange = toEodhdExchange(symbol.exchange);
    if (!ticker || !exchange)
      throw new Error("Resolved symbol and exchange are required");

    const response = await this.request(
      `/api/real-time/${encodeURIComponent(`${ticker}.${exchange}`)}`,
    );
    if (!isRecord(response)) return null;

    const price = numericString(response.close);
    const timestamp = typeof response.timestamp === "number" && Number.isFinite(response.timestamp)
      ? response.timestamp
      : null;
    if (!price || timestamp === null) return null;

    return {
      code: stringValue(response.code) ?? `${ticker}.${exchange}`,
      price,
      previousClose: numericString(response.previousClose),
      open: numericString(response.open),
      high: numericString(response.high),
      low: numericString(response.low),
      observedAt: new Date(timestamp * 1000).toISOString(),
    };
  }

  /** Resolves an ETF name, then fetches its 500 most recent daily prices. */
  async getEtfDailyPrices(etfName: string): Promise<EtfDailyPrices> {
    const matches = await this.searchSymbols(etfName);
    const symbol = chooseSymbol(matches, etfName);
    if (!symbol)
      throw new Error(`No EODHD symbol found for ETF "${etfName.trim()}"`);
    return { symbol, prices: await this.getHistoricalDailyPrices(symbol) };
  }

  private async request(
    path: string,
    parameters: Record<string, string> = {},
  ): Promise<unknown> {
    if (!this.apiToken) throw new Error("EODHD_API_TOKEN is not set");
    const url = new URL(
      path.replace(/^\/+/, ""),
      ensureTrailingSlash(this.baseUrl),
    );
    for (const [key, value] of Object.entries({
      ...parameters,
      api_token: this.apiToken,
      fmt: "json",
    }))
      url.searchParams.set(key, value);

    const response = await this.fetchImpl(url, {
      headers: { accept: "application/json" },
    });
    const payload: unknown = await response.json();
    if (!response.ok)
      throw new Error(`EODHD request failed (${response.status})`);
    if (isRecord(payload) && stringValue(payload.message))
      throw new Error(`EODHD error: ${stringValue(payload.message)}`);
    if (isRecord(payload) && stringValue(payload.error))
      throw new Error(`EODHD error: ${stringValue(payload.error)}`);
    return payload;
  }
}

function chooseSymbol(
  symbols: MarketDataSymbol[],
  query: string,
): MarketDataSymbol | undefined {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    symbols.find((symbol) => symbol.name.toLowerCase() === normalizedQuery) ??
    symbols[0]
  );
}

function toEodhdExchange(exchange: string): string {
  const normalized = exchange.trim().toUpperCase();
  return (
    { TSX: "TO", "TORONTO STOCK EXCHANGE": "TO" }[normalized] ?? normalized
  );
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableString(value: unknown): string | null {
  return stringValue(value);
}

/** Accepts a finite JSON number or numeric string and returns a plain (non-exponent) decimal string. */
function numericString(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    const text = String(value);
    return /e/i.test(text) ? value.toFixed(8).replace(/\.?0+$/, "") : text;
  }
  const text = stringValue(value);
  return text && /^-?\d+(\.\d+)?$/.test(text) ? text : null;
}
