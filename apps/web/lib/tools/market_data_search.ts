import { tool } from "langchain";
import { z } from "zod";
import { EodhdMarketData } from "../trading/infrastructure/eodhd-market-data";

/** Resolves an ETF name and returns its latest 500 daily EODHD prices. */
export const marketDataSearch = tool(
  async ({ etfName }: { etfName: string }) => {
    const marketData = new EodhdMarketData();
    const matches = await marketData.searchSymbols(etfName);
    const normalizedName = etfName.trim().toLowerCase();
    const exactMatches = matches.filter((match) => match.name.toLowerCase() === normalizedName);
    const candidates = exactMatches.length > 0 ? exactMatches : matches;

    if (candidates.length === 0) {
      return JSON.stringify({ status: "not_found", etfName: etfName.trim(), matches: [] });
    }
    if (candidates.length > 1) {
      return JSON.stringify({ status: "ambiguous", etfName: etfName.trim(), matches: candidates });
    }

    const symbol = candidates[0]!;
    const prices = await marketData.getHistoricalDailyPrices(symbol);
    return JSON.stringify({ status: "ok", symbol, prices });
  },
  {
    name: "market_data_search",
    description:
      "Resolve an ETF name with EODHD and fetch its latest 500 daily OHLCV prices. Use this for authoritative ticker, exchange, currency, and historical market data.",
    schema: z.object({
      etfName: z.string().min(1).describe("The ETF's full name, as provided by the user"),
    }),
  },
);
