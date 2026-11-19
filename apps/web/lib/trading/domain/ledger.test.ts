import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeTradeLedger } from "./ledger";

describe("summarizeTradeLedger", () => {
  it("is zero with no trades", () => {
    const summary = summarizeTradeLedger([]);
    assert.equal(summary.netCashFlow.toString(), "0");
    assert.equal(summary.realizedReturn.toString(), "0");
  });

  it("realizes gains against the average cost at the time of each sell, net of fees", () => {
    const summary = summarizeTradeLedger([
      { instrumentId: "a", side: "buy", quantity: "10", price: "10", fee: "1" },  // avg 10.1
      { instrumentId: "a", side: "buy", quantity: "10", price: "12", fee: "1" },  // avg 11.1
      { instrumentId: "a", side: "sell", quantity: "5", price: "15", fee: "2" },  // 75 - 2 - 55.5 = 17.5
      { instrumentId: "a", side: "sell", quantity: "15", price: "10", fee: "0" }, // 150 - 166.5 = -16.5
    ]);
    assert.equal(summary.realizedReturn.toString(), "1");
    assert.equal(summary.netCashFlow.toString(), "1"); // -101 -121 +73 +150
    assert.equal(summary.totalFees.toString(), "4");
    assert.deepEqual(summary.entries.map((e) => e.realizedReturn?.toString() ?? null), [null, null, "17.5", "-16.5"]);
    assert.deepEqual(summary.entries.map((e) => e.cashFlow.toString()), ["-101", "-121", "73", "150"]);
    assert.deepEqual(summary.entries.map((e) => e.quantityAfter.toString()), ["10", "20", "15", "0"]);
    assert.deepEqual(summary.entries.map((e) => e.averageCostAfter?.toString() ?? null), ["10.1", "11.1", "11.1", null]);
  });

  it("tracks instruments independently and resets cost after a full exit", () => {
    const summary = summarizeTradeLedger([
      { instrumentId: "a", side: "buy", quantity: "1", price: "100", fee: "0" },
      { instrumentId: "b", side: "buy", quantity: "2", price: "5", fee: "0" },
      { instrumentId: "a", side: "sell", quantity: "1", price: "110", fee: "0" }, // +10
      { instrumentId: "a", side: "buy", quantity: "1", price: "50", fee: "0" },
      { instrumentId: "a", side: "sell", quantity: "1", price: "40", fee: "0" },  // -10
      { instrumentId: "b", side: "sell", quantity: "1", price: "6", fee: "0" },   // +1
    ]);
    assert.equal(summary.realizedReturn.toString(), "1");
    assert.equal(summary.netCashFlow.toString(), "-4"); // -100 -10 +110 -50 +40 +6
  });
});
