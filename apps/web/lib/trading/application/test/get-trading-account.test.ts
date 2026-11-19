import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTradingAccount } from "../get-trading-account";
import type { TradingAccountReadRepositories } from "../get-trading-account";

const base = {
  accounts: {
    findById: async (id: string) => id === "account-1"
      ? { id, name: "Long-term", broker: "ibkr", accountType: "non_registered", currency: "CAD", initialFund: "1000.00" }
      : null,
    findAll: async () => [],
  },
  instruments: {
    findByIds: async (ids: readonly string[]) => ids.includes("instrument-1")
      ? [{ id: "instrument-1", symbol: "ABC", name: "Example Co.", instrumentType: "stock", currency: "CAD", isActive: true }]
      : [],
  },
  positions: {
    findByAccountId: async (accountId: string) => accountId === "account-1"
      ? [{ id: "position-1", tradingAccountId: accountId, tradingInstrumentId: "instrument-1", quantity: "2", averageCost: "10.25", currentPrice: "12" }]
      : [],
  },
  trades: {
    findByAccountId: async (accountId: string) => accountId === "account-1"
      ? [
          { id: "t1", tradingInstrumentId: "instrument-1", side: "buy" as const, quantity: "3", price: "10.25", fee: "0", executedAt: new Date() },
          { id: "t2", tradingInstrumentId: "instrument-1", side: "sell" as const, quantity: "1", price: "13", fee: "0.5", executedAt: new Date() },
        ]
      : [],
  },
  earnings: { findByAccountId: async () => [] },
} satisfies TradingAccountReadRepositories;

describe("getTradingAccount", () => {
  it("returns account metadata and Decimal-derived position and totals", async () => {
    const result = await getTradingAccount("account-1", base);
    assert.equal(result?.initialFund, "1000.00");
    assert.equal(result?.positions[0]?.symbol, "ABC");
    assert.equal(result?.positions[0]?.costBasis, "20.5");
    assert.equal(result?.positions[0]?.marketValue, "24");
    assert.equal(result?.positions[0]?.unrealizedReturn, "3.5");
    assert.equal(result?.totalCostBasis, "20.5");
    assert.equal(result?.totalMarketValue, "24");
    assert.equal(result?.totalUnrealizedReturn, "3.5");
  });

  it("derives cash, total fund, and realized return from the trade history", async () => {
    const result = await getTradingAccount("account-1", base);
    assert.equal(result?.cashBalance, "981.75");   // 1000 − 30.75 + 13 − 0.5
    assert.equal(result?.totalFund, "1005.75");    // cash + 24 market value
    assert.equal(result?.totalReturn, "5.75");
    assert.equal(result?.realizedReturn, "2.25");  // 13 − 0.5 − 10.25
    assert.equal(result?.totalFees, "0.5");
    assert.equal(result?.tradeCount, 2);
  });

  it("returns trade history newest first with per-trade realized return", async () => {
    const repositories = {
      ...base,
      trades: {
        findByAccountId: async () => [
          { id: "t1", tradingInstrumentId: "instrument-1", side: "buy" as const, quantity: "3", price: "10.25", fee: "0", executedAt: new Date("2026-11-01T15:00:00Z") },
          { id: "t2", tradingInstrumentId: "instrument-1", side: "sell" as const, quantity: "1", price: "13", fee: "0.5", executedAt: new Date("2026-11-10T15:00:00Z") },
        ],
      },
    } satisfies TradingAccountReadRepositories;
    const result = await getTradingAccount("account-1", repositories);
    assert.deepEqual(result?.trades.map((t) => [t.id, t.symbol, t.realizedReturn, t.quantityAfter]), [
      ["t2", "ABC", "2.25", "2"],
      ["t1", "ABC", null, "3"],
    ]);
    assert.equal(result?.trades[0]?.executedAt, "2026-11-10T15:00:00.000Z");
  });

  it("adds earnings to cash and total fund but not to realized return", async () => {
    const repositories = {
      ...base,
      earnings: {
        findByAccountId: async () => [
          { id: "e1", kind: "stock_lending" as const, amount: "4.25", tradingInstrumentId: "instrument-1", receivedAt: new Date("2026-11-15T00:00:00Z"), note: null },
          { id: "e2", kind: "stock_lending" as const, amount: "0.75", tradingInstrumentId: null, receivedAt: new Date("2026-11-01T00:00:00Z"), note: "misc" },
        ],
      },
    } satisfies TradingAccountReadRepositories;
    const result = await getTradingAccount("account-1", repositories);
    assert.equal(result?.totalEarnings, "5");
    assert.equal(result?.cashBalance, "986.75");
    assert.equal(result?.totalFund, "1010.75");
    assert.equal(result?.totalReturn, "10.75");
    assert.equal(result?.realizedReturn, "2.25");
    assert.deepEqual(result?.earnings.map((e) => [e.id, e.symbol]), [["e1", "ABC"], ["e2", null]]);
  });

  it("leaves total fund unavailable while a price is missing", async () => {
    const repositories = {
      ...base,
      positions: { findByAccountId: async (accountId: string) => [{ id: "position-1", tradingAccountId: accountId, tradingInstrumentId: "instrument-1", quantity: "2", averageCost: "10.25", currentPrice: null }] },
    } satisfies TradingAccountReadRepositories;
    const result = await getTradingAccount("account-1", repositories);
    assert.equal(result?.totalFund, null);
    assert.equal(result?.totalReturn, null);
    assert.equal(result?.cashBalance, "981.75");
  });

  it("returns null when the account does not exist", async () => {
    assert.equal(await getTradingAccount("missing", base), null);
  });

  it("rejects inconsistent persisted currency data", async () => {
    const repositories = {
      ...base,
      instruments: {
        findByIds: async () => [{ id: "instrument-1", symbol: "ABC", name: "Example Co.", instrumentType: "stock", currency: "USD", isActive: true }],
      },
    } satisfies TradingAccountReadRepositories;
    await assert.rejects(getTradingAccount("account-1", repositories), /currency/);
  });
});
