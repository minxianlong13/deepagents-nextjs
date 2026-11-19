import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGridReport, GridRejectedError, saveGridSettings, type GridReportRepositories } from "../grid-report";
import type { DailyBar, GridStrategyRecord } from "../repositories";

const bar: DailyBar = { date: "2026-11-19", open: "27.75", high: "28.28", low: "24.96", close: "25.3", previousClose: "26.4", isFinal: true, observedAt: null };
const grid: GridStrategyRecord = { accountId: "a1", instrumentId: "i1", anchorPrice: "34.44", spacingMode: "percent", stepValue: "3", sizingMode: "shares", sizeValue: "10", levelsPerSide: 2 };

function setup(saved: GridStrategyRecord | null = grid, instrumentCurrency = "CAD") {
  const savedRecords: GridStrategyRecord[] = [];
  const repositories: GridReportRepositories = {
    accounts: {
      findById: async (id) => id === "a1" ? { id, name: "Acct", broker: "wealthsimple", accountType: "non_registered", currency: "CAD", initialFund: "1000" } : null,
      findAll: async () => [],
    },
    instruments: { findByIds: async (ids) => ids.includes("i1") ? [{ id: "i1", symbol: "TQQQ", name: "Bull ETF", instrumentType: "etf", currency: instrumentCurrency, isActive: true }] : [] },
    positions: { findByAccountId: async () => [{ id: "p1", tradingAccountId: "a1", tradingInstrumentId: "i1", quantity: "15", averageCost: "30", currentPrice: "25.3" }] },
    trades: { findByAccountId: async () => [{ id: "t1", tradingInstrumentId: "i1", side: "buy" as const, quantity: "15", price: "30", fee: "0", executedAt: new Date() }] },
    earnings: { findByAccountId: async () => [] },
    grids: { find: async () => saved, save: async (record) => { savedRecords.push(record); } },
  };
  return { repositories, savedRecords };
}

const bars = { getLatestDailyBar: async () => bar };

describe("getGridReport", () => {
  it("returns null for an unknown account", async () => {
    assert.equal(await getGridReport("missing", "i1", setup().repositories, bars), null);
  });

  it("asks for setup with suggested settings anchored at the close when no grid is saved", async () => {
    const result = await getGridReport("a1", "i1", setup(null).repositories, bars);
    assert.equal(result?.status, "needs_setup");
    if (result?.status !== "needs_setup") return;
    assert.equal(result.suggestedSettings.anchorPrice, "25.3");
    assert.equal(result.suggestedSettings.spacingMode, "percent");
    assert.deepEqual(result.context.position, { quantity: "15", averageCost: "30" });
    assert.equal(result.context.cashBalance, "550"); // 1000 − 15×30
  });

  it("plans the next session from the close, position, and cash", async () => {
    const result = await getGridReport("a1", "i1", setup().repositories, bars);
    assert.equal(result?.status, "ready");
    if (result?.status !== "ready") return;
    const { report } = result;
    assert.deepEqual(report.buyLevels.map((l) => l.price), ["24.88", "24.16"]);
    assert.deepEqual(report.sellLevels.map((l) => [l.price, l.quantity]), [["25.63", "10"], ["26.4", "5"]]);
    assert.deepEqual(report.buyLevels.map((l) => l.affordable), [true, true]); // 248.8, then 490.4 of 550
    assert.equal(report.buyLevels[1]?.cashAfter, "59.6");
    assert.equal(report.sellLevels[0]?.profitVsAverageCost, "-43.7"); // (25.63 − 30) × 10
    assert.equal(report.totalBuyCost, "490.4");
    // Levels between the session low 24.96 and high 28.28.
    assert.deepEqual(report.levelsInSessionRange, ["25.63", "26.4", "27.19", "28"]);
  });

  it("rejects an instrument in another currency or one that does not exist", async () => {
    await assert.rejects(getGridReport("a1", "i1", setup(grid, "USD").repositories, bars), /currency/);
    await assert.rejects(getGridReport("a1", "nope", setup().repositories, bars), GridRejectedError);
  });
});

describe("saveGridSettings", () => {
  it("saves valid settings", async () => {
    const { repositories, savedRecords } = setup();
    await saveGridSettings(grid, repositories);
    assert.deepEqual(savedRecords, [grid]);
  });

  it("rejects invalid settings, unknown accounts or instruments, and currency mismatches", async () => {
    const { repositories, savedRecords } = setup();
    await assert.rejects(saveGridSettings({ ...grid, stepValue: "0" }, repositories), /Percent step/);
    await assert.rejects(saveGridSettings({ ...grid, accountId: "nope" }, repositories), /account/);
    await assert.rejects(saveGridSettings({ ...grid, instrumentId: "nope" }, repositories), /instrument/);
    await assert.rejects(saveGridSettings(grid, setup(grid, "USD").repositories), /currency/);
    assert.equal(savedRecords.length, 0);
  });
});
