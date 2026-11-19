import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { refreshPositionPrices, type PriceQuote, type PriceRefreshRepositories } from "./refresh-position-prices";

const instruments = [
  { id: "i1", symbol: "AAA", name: "Alpha", instrumentType: "etf", currency: "CAD", isActive: true },
  { id: "i2", symbol: "BBB", name: "Beta", instrumentType: "stock", currency: "CAD", isActive: true },
];

function setup() {
  const updates: Array<{ positionId: string; accountId: string; price: string }> = [];
  const repositories: PriceRefreshRepositories = {
    accounts: { findById: async (id) => id === "a1" ? { id, name: "Acct", broker: "ibkr", accountType: "non_registered", currency: "CAD", initialFund: "0" } : null },
    instruments: { findByIds: async (ids) => instruments.filter((i) => ids.includes(i.id)) },
    positions: {
      findByAccountId: async () => [
        { id: "p1", tradingAccountId: "a1", tradingInstrumentId: "i1", quantity: "1", averageCost: "10", currentPrice: "9" },
        { id: "p2", tradingAccountId: "a1", tradingInstrumentId: "i2", quantity: "1", averageCost: "10", currentPrice: null },
      ],
    },
    positionPrices: { updateCurrentPrice: async (positionId, accountId, price) => { updates.push({ positionId, accountId, price }); } },
  };
  return { repositories, updates };
}

const good = (symbol: string, overrides: Partial<PriceQuote> = {}): PriceQuote => ({
  symbol, price: "12.5", currency: "CAD", asOf: "2026-11-18", sourceUrl: "https://example.com", ...overrides,
});

describe("refreshPositionPrices", () => {
  it("returns null for an unknown account", async () => {
    assert.equal(await refreshPositionPrices("missing", setup().repositories, { getQuote: async (i) => good(i.symbol) }), null);
  });

  it("stores valid quotes and reports the previous price", async () => {
    const { repositories, updates } = setup();
    const results = await refreshPositionPrices("a1", repositories, { getQuote: async (i) => good(i.symbol) });
    assert.deepEqual(updates.map((u) => [u.positionId, u.price]), [["p1", "12.5"], ["p2", "12.5"]]);
    assert.equal(results?.[0]?.status, "updated");
    assert.equal(results?.[0]?.status === "updated" && results[0].previousPrice, "9");
  });

  it("keeps the old price and reports a failure for bad or failed quotes, without blocking others", async () => {
    const cases: Array<[Partial<PriceQuote> | Error, RegExp]> = [
      [new Error("timeout"), /timeout/],
      [{ symbol: "ZZZ" }, /not AAA/],
      [{ currency: "USD" }, /USD/],
      [{ price: "0" }, /valid positive/],
      [{ price: "-1" }, /valid positive/],
      [{ sourceUrl: null }, /source/],
    ];
    for (const [quote, reason] of cases) {
      const { repositories, updates } = setup();
      const results = await refreshPositionPrices("a1", repositories, {
        getQuote: async (i) => {
          if (i.symbol !== "AAA") return good(i.symbol);
          if (quote instanceof Error) throw quote;
          return good(i.symbol, quote);
        },
      });
      const first = results?.[0];
      assert.equal(first?.status, "failed");
      assert.match(first?.status === "failed" ? first.reason : "", reason);
      assert.deepEqual(updates.map((u) => u.positionId), ["p2"]);
    }
  });
});
