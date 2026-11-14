import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTradingAccount } from "./get-trading-account";
import type { TradingAccountReadRepositories } from "./get-trading-account";

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
