import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EodhdMarketData } from "../eodhd-market-data";
import { EodhdQuoteProvider } from "../eodhd-quote-provider";

type Reply = { body: unknown; status?: number };

/** Routes fake EODHD responses by endpoint: /api/real-time/... and /api/eod/... */
function provider(routes: { live?: Reply; eod?: Reply }, requests: URL[] = []) {
  return new EodhdQuoteProvider(new EodhdMarketData({
    apiToken: "test-token",
    baseUrl: "https://example.test",
    fetchImpl: async (input) => {
      const url = new URL(input.toString());
      requests.push(url);
      const reply = url.pathname.startsWith("/api/real-time/") ? routes.live : routes.eod;
      if (!reply) throw new Error(`unexpected request ${url.pathname}`);
      return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200 });
    },
  }));
}

const xeqt = { symbol: "xeqt", name: "iShares Core Equity ETF Portfolio", instrumentType: "etf", currency: "CAD" };
const liveXeqt = { code: "XEQT.TO", timestamp: 1795116000, gmtoffset: 0, open: 44.21, high: 44.28, low: 43.21, close: 43.415, volume: 1503314, previousClose: 44.01, change: -0.595, change_p: -1.352 };
const dailyXeqt = [
  { date: "2026-11-17", open: 44.8, high: 44.8, low: 44.14, close: 44.34, volume: 1321300 },
  { date: "2026-11-18", open: 44.34, high: 44.34, low: 43.9, close: 44.01, volume: 1081554 },
];

describe("EodhdQuoteProvider", () => {
  it("uses the live (delayed) price and its timestamp when available", async () => {
    const requests: URL[] = [];
    const quote = await provider({ live: { body: liveXeqt } }, requests).getQuote(xeqt);

    assert.deepEqual(quote, {
      symbol: "xeqt",
      currency: "CAD",
      sourceUrl: null,
      price: "43.415",
      asOf: "2026-11-19T19:20:00.000Z",
      sourceLabel: "EODHD live, delayed (XEQT.TO)",
    });
    assert.deepEqual(requests.map((url) => url.pathname), ["/api/real-time/XEQT.TO"]);
    assert.equal(JSON.stringify(quote).includes("test-token"), false);
  });

  it("falls back to the newest daily close when live data is NA", async () => {
    const requests: URL[] = [];
    const quote = await provider({
      live: { body: { code: "XEQT.TO", timestamp: "NA", close: "NA", previousClose: "NA" } },
      eod: { body: dailyXeqt },
    }, requests).getQuote(xeqt);

    assert.equal(quote.price, "44.01");
    assert.equal(quote.asOf, "2026-11-18");
    assert.equal(quote.sourceLabel, "EODHD daily close (XEQT.TO)");
    assert.deepEqual(requests.map((url) => url.pathname), ["/api/real-time/XEQT.TO", "/api/eod/XEQT.TO"]);
  });

  it("falls back to the daily close when the live endpoint errors", async () => {
    const quote = await provider({
      live: { body: { message: "Not available on your plan" }, status: 403 },
      eod: { body: dailyXeqt },
    }).getQuote(xeqt);
    assert.equal(quote.price, "44.01");
  });

  it("maps USD instruments to the US exchange", async () => {
    const requests: URL[] = [];
    await provider({ live: { body: { ...liveXeqt, code: "VTI.US" } } }, requests)
      .getQuote({ ...xeqt, symbol: "VTI", currency: "USD" });
    assert.equal(requests[0]?.pathname, "/api/real-time/VTI.US");
  });

  it("fails clearly for unsupported currencies, empty data, and errors on both endpoints", async () => {
    await assert.rejects(provider({}).getQuote({ ...xeqt, currency: "EUR" }), /No EODHD exchange/);
    await assert.rejects(provider({ live: { body: { close: "NA" } }, eod: { body: [] } }).getQuote(xeqt), /no prices for XEQT.TO/);
    await assert.rejects(
      provider({ live: { body: { message: "Ticker not found" } }, eod: { body: {}, status: 401 } }).getQuote(xeqt),
      /live: EODHD error: Ticker not found; daily: .*401/,
    );
  });
});
