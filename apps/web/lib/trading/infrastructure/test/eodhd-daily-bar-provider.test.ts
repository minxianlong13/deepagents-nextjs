import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EodhdDailyBarProvider } from "../eodhd-daily-bar-provider";
import { EodhdMarketData } from "../eodhd-market-data";

type Reply = { body: unknown; status?: number };

function provider(routes: { live: Reply; eod: Reply }) {
  return new EodhdDailyBarProvider(new EodhdMarketData({
    apiToken: "test-token",
    baseUrl: "https://example.test",
    fetchImpl: async (input) => {
      const reply = new URL(input.toString()).pathname.startsWith("/api/real-time/") ? routes.live : routes.eod;
      return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200 });
    },
  }));
}

const tqqq = { symbol: "TQQQ", currency: "CAD" };
const eod = [
  { date: "2026-11-18", open: 27, high: 27.5, low: 26.1, close: 26.4, volume: 900000 },
  { date: "2026-11-17", open: 28, high: 28.4, low: 26.9, close: 27.1, volume: 800000 },
];
// 2026-11-19T21:00:00Z = 16:00 in Toronto on Nov 19.
const live = { code: "TQQQ.TO", timestamp: 1795122000, open: 27.75, high: 28.28, low: 24.96, close: 25.3, previousClose: 26.4 };
const na = { code: "TQQQ.TO", timestamp: "NA", open: "NA", high: "NA", low: "NA", close: "NA", previousClose: "NA" };

describe("EodhdDailyBarProvider", () => {
  it("uses the live day bar when it is newer than the official daily bar", async () => {
    assert.deepEqual(await provider({ live: { body: live }, eod: { body: eod } }).getLatestDailyBar(tqqq), {
      date: "2026-11-19", open: "27.75", high: "28.28", low: "24.96", close: "25.3",
      previousClose: "26.4", isFinal: false, observedAt: "2026-11-19T21:00:00.000Z",
    });
  });

  it("prefers the official bar when it covers the same date as the live quote", async () => {
    const sameDay = [{ date: "2026-11-19", open: 27.75, high: 28.3, low: 24.9, close: 25.28, volume: 1 }, ...eod];
    const bar = await provider({ live: { body: live }, eod: { body: sameDay } }).getLatestDailyBar(tqqq);
    assert.deepEqual(bar, { date: "2026-11-19", open: "27.75", high: "28.3", low: "24.9", close: "25.28", previousClose: "26.4", isFinal: true, observedAt: null });
  });

  it("falls back to the official bar when live data is unavailable or errors", async () => {
    assert.equal((await provider({ live: { body: na }, eod: { body: eod } }).getLatestDailyBar(tqqq)).date, "2026-11-18");
    assert.equal((await provider({ live: { body: {}, status: 403 }, eod: { body: eod } }).getLatestDailyBar(tqqq)).previousClose, "27.1");
  });

  it("uses the live bar alone when daily history fails", async () => {
    const bar = await provider({ live: { body: live }, eod: { body: {}, status: 500 } }).getLatestDailyBar(tqqq);
    assert.equal(bar.close, "25.3");
    assert.equal(bar.isFinal, false);
  });

  it("fails clearly when neither source has data or the currency is unsupported", async () => {
    await assert.rejects(provider({ live: { body: na }, eod: { body: [] } }).getLatestDailyBar(tqqq), /no recent prices for TQQQ.TO/);
    await assert.rejects(provider({ live: { body: {}, status: 401 }, eod: { body: {}, status: 401 } }).getLatestDailyBar(tqqq), /401/);
    await assert.rejects(provider({ live: { body: live }, eod: { body: eod } }).getLatestDailyBar({ symbol: "X", currency: "EUR" }), /No EODHD exchange/);
  });
});
