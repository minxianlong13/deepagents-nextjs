import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PositionChange } from "../../domain";
import { executeTrade, TradeRejectedError, type TradeRepositories } from "../execute-trade";
import type { PositionRecord, TradeRecordInput } from "../repositories";

function setup(options: { position?: PositionRecord | null; instrumentCurrency?: string; isActive?: boolean } = {}) {
  const writes: PositionChange[] = [];
  const recorded: TradeRecordInput[] = [];
  const repositories: TradeRepositories = {
    accounts: {
      findById: async (id) => id === "account-1"
        ? { id, name: "Long-term", broker: "ibkr", accountType: "non_registered", currency: "CAD", initialFund: "1000" }
        : null,
    },
    instruments: {
      findByIds: async (ids) => ids.includes("instrument-1")
        ? [{ id: "instrument-1", symbol: "ABC", name: "Example", instrumentType: "stock", currency: options.instrumentCurrency ?? "CAD", isActive: options.isActive ?? true }]
        : [],
    },
    positionWrites: {
      recordTrade: async (record, update) => { recorded.push(record); writes.push(update(options.position ?? null)); },
    },
  };
  return { repositories, writes, recorded };
}

const held: PositionRecord = { id: "p1", tradingAccountId: "account-1", tradingInstrumentId: "instrument-1", quantity: "4", averageCost: "10", currentPrice: null };
const executedAt = new Date("2026-11-17T14:30:00.000Z");
const trade = { accountId: "account-1", instrumentId: "instrument-1", side: "buy" as const, quantity: "1", price: "15", executedAt };

describe("executeTrade", () => {
  it("persists the blended position for a buy", async () => {
    const { repositories, writes } = setup({ position: held });
    await executeTrade(trade, repositories);
    assert.equal(writes[0]?.kind, "upsert");
    if (writes[0]?.kind !== "upsert") return;
    assert.equal(writes[0].quantity.toString(), "5");
    assert.equal(writes[0].averageCost.toString(), "11");
  });

  it("passes the fee into the position cost basis", async () => {
    const { repositories, writes } = setup({ position: held });
    await executeTrade({ ...trade, fee: "5" }, repositories);
    if (writes[0]?.kind !== "upsert") return assert.fail("expected upsert");
    assert.equal(writes[0].averageCost.toString(), "12");
  });

  it("records the trade with its execution time and a default fee of 0", async () => {
    const { repositories, recorded } = setup({ position: held });
    await executeTrade(trade, repositories);
    assert.deepEqual(recorded, [{ accountId: "account-1", instrumentId: "instrument-1", side: "buy", quantity: "1", price: "15", fee: "0", executedAt }]);
  });

  it("rejects invalid and future execution times", async () => {
    const now = new Date("2026-11-18T12:00:00.000Z");
    await assert.rejects(executeTrade({ ...trade, executedAt: new Date("nope") }, setup().repositories, now), /invalid/);
    await assert.rejects(executeTrade({ ...trade, executedAt: new Date("2026-11-18T12:10:00.000Z") }, setup().repositories, now), /future/);
    await assert.doesNotReject(executeTrade({ ...trade, executedAt: new Date("2026-11-18T12:02:00.000Z") }, setup({ position: held }).repositories, now));
  });

  it("rejects unknown accounts, unknown instruments, and currency mismatches", async () => {
    await assert.rejects(executeTrade({ ...trade, accountId: "missing" }, setup().repositories), TradeRejectedError);
    await assert.rejects(executeTrade({ ...trade, instrumentId: "missing" }, setup().repositories), TradeRejectedError);
    await assert.rejects(executeTrade(trade, setup({ instrumentCurrency: "USD" }).repositories), /currency/);
  });

  it("rejects opening a position in an inactive instrument but allows selling one", async () => {
    await assert.rejects(executeTrade(trade, setup({ isActive: false }).repositories), /inactive/);
    const { repositories, writes } = setup({ position: held, isActive: false });
    await executeTrade({ ...trade, side: "sell", quantity: "4" }, repositories);
    assert.deepEqual(writes, [{ kind: "delete" }]);
  });

  it("surfaces overselling as a rejected trade", async () => {
    await assert.rejects(executeTrade({ ...trade, side: "sell", quantity: "5" }, setup({ position: held }).repositories), TradeRejectedError);
  });
});
