import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyTrade } from "../trade";

describe("applyTrade", () => {
  it("opens a new position at the trade price", () => {
    const result = applyTrade(null, { side: "buy", quantity: "3", price: "10.5" });
    assert.equal(result.kind, "upsert");
    if (result.kind !== "upsert") return;
    assert.equal(result.quantity.toString(), "3");
    assert.equal(result.averageCost.toString(), "10.5");
  });

  it("blends buys into a weighted average cost rounded to stored precision", () => {
    const result = applyTrade({ quantity: "2", averageCost: "10" }, { side: "buy", quantity: "1", price: "11" });
    assert.equal(result.kind, "upsert");
    if (result.kind !== "upsert") return;
    assert.equal(result.quantity.toString(), "3");
    assert.equal(result.averageCost.toString(), "10.33333333");
  });

  it("adds buy fees to the cost basis", () => {
    const result = applyTrade({ quantity: "2", averageCost: "10" }, { side: "buy", quantity: "2", price: "11", fee: "4.99" });
    assert.equal(result.kind, "upsert");
    if (result.kind !== "upsert") return;
    assert.equal(result.quantity.toString(), "4");
    assert.equal(result.averageCost.toString(), "11.7475");
  });

  it("does not change the average cost for sell fees", () => {
    const result = applyTrade({ quantity: "4", averageCost: "10" }, { side: "sell", quantity: "1", price: "12", fee: "9.99" });
    assert.equal(result.kind, "upsert");
    if (result.kind !== "upsert") return;
    assert.equal(result.averageCost.toString(), "10");
  });

  it("reduces quantity on sell and keeps the average cost", () => {
    const result = applyTrade({ quantity: "5", averageCost: "8.25" }, { side: "sell", quantity: "1.5", price: "100" });
    assert.equal(result.kind, "upsert");
    if (result.kind !== "upsert") return;
    assert.equal(result.quantity.toString(), "3.5");
    assert.equal(result.averageCost.toString(), "8.25");
  });

  it("removes the position when the full quantity is sold", () => {
    assert.deepEqual(applyTrade({ quantity: "2", averageCost: "5" }, { side: "sell", quantity: "2", price: "6" }), { kind: "delete" });
  });

  it("rejects overselling, selling with no holding, and invalid inputs", () => {
    assert.throws(() => applyTrade({ quantity: "1", averageCost: "5" }, { side: "sell", quantity: "1.01", price: "5" }), /Cannot sell/);
    assert.throws(() => applyTrade(null, { side: "sell", quantity: "1", price: "5" }), /Cannot sell/);
    assert.throws(() => applyTrade(null, { side: "buy", quantity: "0", price: "5" }), /quantity/);
    assert.throws(() => applyTrade(null, { side: "buy", quantity: "-1", price: "5" }), /quantity/);
    assert.throws(() => applyTrade(null, { side: "buy", quantity: "1", price: "-5" }), /price/);
    assert.throws(() => applyTrade(null, { side: "buy", quantity: "1", price: "5", fee: "-1" }), /fee/);
  });
});
