import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGridPlan, gridLevelPrice, validateGridSettings, type GridSettings } from "../grid";

const percentGrid: GridSettings = { anchorPrice: "100", spacingMode: "percent", stepValue: "10", sizingMode: "shares", sizeValue: "10", levelsPerSide: 2 };
const market = { referencePrice: "105", heldQuantity: "15", averageCost: "95", cashBalance: "2000" };

describe("gridLevelPrice", () => {
  it("spaces percent levels geometrically and amount levels evenly, rounded to cents", () => {
    assert.deepEqual([-2, -1, 0, 1, 2].map((i) => gridLevelPrice(percentGrid, i).toString()), ["82.64", "90.91", "100", "110", "121"]);
    const amountGrid = { ...percentGrid, spacingMode: "amount" as const, stepValue: "2.5" };
    assert.deepEqual([-1, 0, 1].map((i) => gridLevelPrice(amountGrid, i).toString()), ["97.5", "100", "102.5"]);
  });
});

describe("buildGridPlan", () => {
  it("plans the nearest levels below the reference as buys and above as sells", () => {
    const plan = buildGridPlan(percentGrid, market);
    assert.deepEqual(plan.buyLevels.map((l) => [l.index, l.price.toString()]), [[0, "100"], [-1, "90.91"]]);
    assert.deepEqual(plan.sellLevels.map((l) => [l.index, l.price.toString()]), [[1, "110"], [2, "121"]]);
  });

  it("tracks buy costs, remaining cash, projected average cost, and round-trip profit", () => {
    const [first, second] = buildGridPlan(percentGrid, market).buyLevels;
    assert.equal(first!.cost.toString(), "1000");
    assert.equal(first!.cashAfter.toString(), "1000");
    assert.equal(first!.affordable, true);
    assert.equal(first!.quantityAfter.toString(), "25");
    assert.equal(first!.averageCostAfter?.toString(), "97"); // (15×95 + 1000) / 25
    assert.equal(first!.profitPerRoundTrip.toString(), "100"); // 10 × (110 − 100)
    assert.equal(second!.cumulativeCost.toString(), "1909.1");
    assert.equal(second!.cashAfter.toString(), "90.9");
    assert.equal(first!.distancePercent.toDecimalPlaces(2).toString(), "-4.76");
  });

  it("flags buy levels that cash cannot cover", () => {
    const plan = buildGridPlan(percentGrid, { ...market, cashBalance: "1500" });
    assert.deepEqual(plan.buyLevels.map((l) => l.affordable), [true, false]);
  });

  it("caps sells at the shares held and reports profit against average cost", () => {
    const [first, second] = buildGridPlan(percentGrid, market).sellLevels;
    assert.equal(first!.quantity.toString(), "10");
    assert.equal(first!.profitVsAverageCost?.toString(), "150"); // (110 − 95) × 10
    assert.equal(second!.quantity.toString(), "5");
    assert.equal(second!.quantityAfter.toString(), "0");
    assert.equal(second!.cumulativeProceeds.toString(), "1705"); // 1100 + 605
  });

  it("skips a level that equals the reference price", () => {
    const plan = buildGridPlan(percentGrid, { ...market, referencePrice: "110" });
    assert.deepEqual(plan.buyLevels.map((l) => l.price.toString()), ["100", "90.91"]);
    assert.deepEqual(plan.sellLevels.map((l) => l.price.toString()), ["121", "133.1"]);
  });

  it("finds levels when the reference is far below the anchor", () => {
    const plan = buildGridPlan({ ...percentGrid, anchorPrice: "34.44", stepValue: "3" }, { ...market, referencePrice: "25.3" });
    assert.deepEqual(plan.buyLevels.map((l) => [l.index, l.price.toString()]), [[-11, "24.88"], [-12, "24.16"]]);
    assert.deepEqual(plan.sellLevels.map((l) => [l.index, l.price.toString()]), [[-10, "25.63"], [-9, "26.4"]]);
  });

  it("sizes by cash amount using whole shares", () => {
    const plan = buildGridPlan({ ...percentGrid, sizingMode: "amount", sizeValue: "500" }, market);
    assert.deepEqual(plan.buyLevels.map((l) => l.quantity.toString()), ["5", "5"]); // 500/100, 500/90.91
    assert.deepEqual(plan.sellLevels.map((l) => l.quantity.toString()), ["4", "4"]); // 500/110, 500/121
  });

  it("stops amount-spaced buy levels before the price reaches zero", () => {
    const plan = buildGridPlan({ ...percentGrid, anchorPrice: "3", spacingMode: "amount", stepValue: "1", levelsPerSide: 5 }, { ...market, referencePrice: "3.5" });
    assert.deepEqual(plan.buyLevels.map((l) => l.price.toString()), ["3", "2", "1"]);
  });

  it("rejects invalid settings", () => {
    assert.throws(() => validateGridSettings({ ...percentGrid, anchorPrice: "0" }), /Anchor/);
    assert.throws(() => validateGridSettings({ ...percentGrid, stepValue: "0.05" }), /Percent step/);
    assert.throws(() => validateGridSettings({ ...percentGrid, spacingMode: "amount", stepValue: "0.001" }), /Price step/);
    assert.throws(() => validateGridSettings({ ...percentGrid, sizeValue: "0" }), /Size/);
    assert.throws(() => validateGridSettings({ ...percentGrid, levelsPerSide: 0 }), /Levels/);
    assert.throws(() => buildGridPlan(percentGrid, { ...market, referencePrice: "0" }), /Reference/);
  });
});
