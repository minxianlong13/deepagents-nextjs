import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAccountTotals,
  calculatePositionValues,
  validateInitialFund,
  validatePosition,
} from "./index";

describe("trading domain calculations", () => {
  it("calculates position values without floating-point drift", () => {
    const result = calculatePositionValues({ quantity: "3.5", averageCost: "10.12", currentPrice: "11.34" });
    assert.equal(result.costBasis.toString(), "35.42");
    assert.equal(result.marketValue?.toString(), "39.69");
    assert.equal(result.unrealizedReturn?.toString(), "4.27");
    assert.equal(result.unrealizedReturnPercent?.toDecimalPlaces(4).toString(), "12.0553");
  });

  it("totals multiple positions exactly", () => {
    const result = calculateAccountTotals([
      { quantity: "2", averageCost: "10.10", currentPrice: "12.00" },
      { quantity: "1.5", averageCost: "20", currentPrice: "18" },
    ]);
    assert.equal(result.totalCostBasis.toString(), "50.2");
    assert.equal(result.totalMarketValue?.toString(), "51");
    assert.equal(result.totalUnrealizedReturn?.toString(), "0.8");
  });

  it("keeps price-dependent values unavailable when a price is missing", () => {
    const position = calculatePositionValues({ quantity: "2", averageCost: "5", currentPrice: null });
    assert.equal(position.costBasis.toString(), "10");
    assert.equal(position.marketValue, null);
    assert.equal(position.unrealizedReturn, null);
    const totals = calculateAccountTotals([
      { quantity: "2", averageCost: "5", currentPrice: null },
      { quantity: "1", averageCost: "7", currentPrice: "8" },
    ]);
    assert.equal(totals.totalCostBasis.toString(), "17");
    assert.equal(totals.totalMarketValue, null);
    assert.equal(totals.totalUnrealizedReturn, null);
  });

  it("validates association, currency, and nonnegative position values", () => {
    const valid = {
      accountId: "a1", accountCurrency: "CAD", instrumentId: "i1", instrumentCurrency: "cad",
      positionAccountId: "a1", positionInstrumentId: "i1", quantity: "1", averageCost: "0",
    };
    assert.doesNotThrow(() => validatePosition(valid));
    assert.throws(() => validatePosition({ ...valid, instrumentCurrency: "USD" }), /currency/);
    assert.throws(() => validatePosition({ ...valid, positionAccountId: "a2" }), /association/);
    assert.throws(() => validatePosition({ ...valid, quantity: "-0.1" }), /quantity/);
    assert.throws(() => validatePosition({ ...valid, averageCost: "-1" }), /average cost/);
    assert.throws(() => validateInitialFund("-0.01"), /Initial fund/);
  });

  it("returns no percentage when cost basis is zero", () => {
    const result = calculatePositionValues({ quantity: "1", averageCost: "0", currentPrice: "5" });
    assert.equal(result.unrealizedReturnPercent, null);
  });
});
