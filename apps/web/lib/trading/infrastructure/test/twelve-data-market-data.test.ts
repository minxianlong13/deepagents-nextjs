import assert from "node:assert/strict";
import test from "node:test";
import { TwelveDataMarketData } from "../twelve-data-market-data";

test("resolves an ETF name and fetches daily prices with its ticker and exchange", async () => {
  const requests: URL[] = [];
  const client = new TwelveDataMarketData({
    apiKey: "test-key",
    baseUrl: "https://example.test/api",
    fetchImpl: async (input) => {
      const url = new URL(input.toString());
      requests.push(url);
      const body = url.pathname.endsWith("symbol_search")
        ? { data: [{ symbol: "VFV", instrument_name: "Vanguard S&P 500 Index ETF", exchange: "TSX", mic_code: "XTSE", currency: "CAD", instrument_type: "ETF", country: "Canada" }] }
        : { meta: { symbol: "VFV:TSX" }, values: [{ datetime: "2026-11-17", open: "150", high: "152", low: "149", close: "151", volume: "1000" }] };
      return new Response(JSON.stringify(body), { status: 200 });
    },
  });

  const result = await client.getEtfDailyPrices("Vanguard S&P 500 Index ETF");

  assert.equal(result.symbol.symbol, "VFV");
  assert.equal(result.symbol.exchange, "TSX");
  assert.deepEqual(result.prices[0], { date: "2026-11-17", open: "150", high: "152", low: "149", close: "151", volume: "1000" });
  assert.equal(requests[0]?.pathname, "/api/symbol_search");
  assert.equal(requests[0]?.searchParams.get("symbol"), "Vanguard S&P 500 Index ETF");
  assert.equal(requests[1]?.pathname, "/api/time_series");
  assert.equal(requests[1]?.searchParams.get("symbol"), "VFV:TSX");
  assert.equal(requests[1]?.searchParams.get("interval"), "1day");
  assert.equal(requests[1]?.searchParams.get("outputsize"), "500");
  assert.equal(requests[1]?.searchParams.get("order"), "desc");
  assert.equal(requests[1]?.searchParams.get("apikey"), "test-key");
});

test("surfaces Twelve Data API errors", async () => {
  const client = new TwelveDataMarketData({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ status: "error", message: "symbol not found" }), { status: 200 }),
  });
  await assert.rejects(() => client.searchSymbols("missing"), /Twelve Data error: symbol not found/);
});
