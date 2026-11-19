const DEFAULT_BASE_URL = "https://api.twelvedata.com";

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

export interface TwelveDataMarketDataOptions {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

/** Fetches ETF symbols and daily historical prices from Twelve Data. */
export class TwelveDataMarketData {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TwelveDataMarketDataOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.TWELVE_DATA_API_KEY ?? "";
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async searchSymbols(etfName: string): Promise<MarketDataSymbol[]> {
    const query = etfName.trim();
    if (!query) throw new Error("ETF name is required");

    const response = await this.request("/symbol_search", { symbol: query });
    if (!Array.isArray(response.data)) return [];

    return response.data.flatMap((item) => {
      if (!isRecord(item)) return [];
      const symbol = stringValue(item.symbol);
      const name = stringValue(item.instrument_name);
      const exchange = stringValue(item.exchange);
      if (!symbol || !name || !exchange) return [];
      return [{
        symbol,
        name,
        exchange,
        micCode: nullableString(item.mic_code),
        currency: nullableString(item.currency),
        instrumentType: nullableString(item.instrument_type),
        country: nullableString(item.country),
      }];
    });
  }

  async getHistoricalDailyPrices(symbol: Pick<MarketDataSymbol, "symbol" | "exchange">): Promise<HistoricalDailyPrice[]> {
    const ticker = symbol.symbol.trim();
    const exchange = symbol.exchange.trim();
    if (!ticker || !exchange) throw new Error("Resolved symbol and exchange are required");

    const response = await this.request("/time_series", {
      symbol: `${ticker}:${exchange}`,
      interval: "1day",
      outputsize: "500",
      order: "desc",
    });
    if (!Array.isArray(response.values)) return [];

    return response.values.flatMap((item) => {
      if (!isRecord(item)) return [];
      const date = stringValue(item.datetime);
      const open = stringValue(item.open);
      const high = stringValue(item.high);
      const low = stringValue(item.low);
      const close = stringValue(item.close);
      if (!date || !open || !high || !low || !close) return [];
      return [{ date, open, high, low, close, volume: nullableString(item.volume) }];
    });
  }

  /** Resolves an ETF name, then fetches its 500 most recent daily prices. */
  async getEtfDailyPrices(etfName: string): Promise<EtfDailyPrices> {
    const matches = await this.searchSymbols(etfName);
    const symbol = chooseSymbol(matches, etfName);
    if (!symbol) throw new Error(`No Twelve Data symbol found for ETF "${etfName.trim()}"`);
    return { symbol, prices: await this.getHistoricalDailyPrices(symbol) };
  }

  private async request(path: string, parameters: Record<string, string>): Promise<Record<string, unknown>> {
    if (!this.apiKey) throw new Error("TWELVE_DATA_API_KEY is not set");
    const url = new URL(path.replace(/^\/+/, ""), ensureTrailingSlash(this.baseUrl));
    for (const [key, value] of Object.entries({ ...parameters, apikey: this.apiKey })) url.searchParams.set(key, value);

    const response = await this.fetchImpl(url, { headers: { accept: "application/json" } });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(`Twelve Data request failed (${response.status})`);
    if (!isRecord(payload)) throw new Error("Twelve Data returned an invalid response");
    const message = stringValue(payload.message);
    if (payload.status === "error" || message) throw new Error(`Twelve Data error: ${message || "request failed"}`);
    return payload;
  }
}

function chooseSymbol(symbols: MarketDataSymbol[], query: string): MarketDataSymbol | undefined {
  const normalizedQuery = query.trim().toLowerCase();
  return symbols.find((symbol) => symbol.name.toLowerCase() === normalizedQuery) ?? symbols[0];
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
