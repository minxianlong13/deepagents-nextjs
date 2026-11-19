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
    this.apiToken = options.apiToken ?? process.env.EODHD_API_KEY ?? "";
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
  ): Promise<HistoricalDailyPrice[]> {
    const ticker = symbol.symbol.trim();
    const exchange = toEodhdExchange(symbol.exchange);
    if (!ticker || !exchange)
      throw new Error("Resolved symbol and exchange are required");

    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - HISTORY_LOOKBACK_DAYS);
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
        const date = stringValue(item.date);
        const open = stringValue(item.open);
        const high = stringValue(item.high);
        const low = stringValue(item.low);
        const close = stringValue(item.close);
        if (!date || !open || !high || !low || !close) return [];
        return [
          { date, open, high, low, close, volume: nullableString(item.volume) },
        ];
      })
      .slice(0, MAX_DAILY_PRICES);
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
