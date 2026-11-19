import assert from "node:assert/strict";
import test from "node:test";
import { EodhdMarketData } from "../eodhd-market-data";

test("resolves an ETF name and fetches daily prices with its ticker and exchange", async () => {
  const requests: URL[] = [];
  const client = new EodhdMarketData({
    apiToken: "test-token",
    baseUrl: "https://example.test",
    fetchImpl: async (input) => {
      const url = new URL(input.toString());
      requests.push(url);
      const body = url.pathname.endsWith("/search/Vanguard%20S%26P%20500%20Index%20ETF")
        ? [{ Code: "VFV", Name: "Vanguard S&P 500 Index ETF", Exchange: "TSX", Mic: "XTSE", Currency: "CAD", Type: "ETF", Country: "Canada" }]
        : [{ date: "2026-11-17", open: "150", high: "152", low: "149", close: "151", volume: "1000" }];
      return new Response(JSON.stringify(body), { status: 200 });
    },
  });

  const result = await client.getEtfDailyPrices("Vanguard S&P 500 Index ETF");

  assert.equal(result.symbol.symbol, "VFV");
  assert.equal(result.symbol.exchange, "TSX");
  assert.deepEqual(result.prices[0], { date: "2026-11-17", open: "150", high: "152", low: "149", close: "151", volume: "1000" });
  assert.equal(requests[0]?.pathname, "/api/search/Vanguard%20S%26P%20500%20Index%20ETF");
  assert.equal(requests[0]?.searchParams.get("api_token"), "test-token");
  assert.equal(requests[1]?.pathname, "/api/eod/VFV.TO");
  assert.equal(requests[1]?.searchParams.get("period"), "d");
  assert.equal(requests[1]?.searchParams.get("order"), "d");
  assert.equal(requests[1]?.searchParams.get("fmt"), "json");
  assert.equal(requests[1]?.searchParams.get("api_token"), "test-token");
});

test("surfaces EODHD API errors", async () => {
  const client = new EodhdMarketData({
    apiToken: "test-token",
    fetchImpl: async () => new Response(JSON.stringify({ message: "symbol not found" }), { status: 200 }),
  });
  await assert.rejects(() => client.searchSymbols("missing"), /EODHD error: symbol not found/);
});
