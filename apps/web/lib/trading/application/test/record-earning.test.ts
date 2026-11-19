import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EarningRejectedError, recordEarning, type EarningRepositories } from "../record-earning";
import type { EarningRecord } from "../repositories";

function setup() {
  const created: Array<Omit<EarningRecord, "id"> & { accountId: string }> = [];
  const repositories: EarningRepositories = {
    accounts: { findById: async (id) => id === "a1" ? { id, name: "A", broker: "wealthsimple", accountType: "non_registered", currency: "CAD", initialFund: "0" } : null },
    instruments: {
      findByIds: async (ids) => [
        { id: "cad", symbol: "AAA", name: "A", instrumentType: "stock", currency: "CAD", isActive: true },
        { id: "usd", symbol: "BBB", name: "B", instrumentType: "stock", currency: "USD", isActive: true },
      ].filter((i) => ids.includes(i.id)),
    },
    earnings: { create: async (input) => { created.push(input); } },
  };
  return { repositories, created };
}

const now = new Date("2026-11-18T12:00:00Z");
const input = { accountId: "a1", kind: "stock_lending" as const, amount: "3.21", receivedAt: new Date("2026-11-15T00:00:00Z") };

describe("recordEarning", () => {
  it("records an earning with an optional instrument and trimmed note", async () => {
    const { repositories, created } = setup();
    await recordEarning({ ...input, instrumentId: "cad", note: "  Nov payout " }, repositories, now);
    await recordEarning({ ...input, instrumentId: "", note: "   " }, repositories, now);
    assert.deepEqual(created, [
      { accountId: "a1", kind: "stock_lending", amount: "3.21", tradingInstrumentId: "cad", receivedAt: input.receivedAt, note: "Nov payout" },
      { accountId: "a1", kind: "stock_lending", amount: "3.21", tradingInstrumentId: null, receivedAt: input.receivedAt, note: null },
    ]);
  });

  it("rejects bad amounts, dates, accounts, and instruments", async () => {
    const { repositories, created } = setup();
    for (const amount of ["0", "-1", "abc", "1.123456789"]) {
      await assert.rejects(recordEarning({ ...input, amount }, repositories, now), /greater than zero/);
    }
    await assert.rejects(recordEarning({ ...input, receivedAt: new Date("x") }, repositories, now), /invalid/);
    await assert.rejects(recordEarning({ ...input, receivedAt: new Date("2026-11-19T00:00:00Z") }, repositories, now), /future/);
    await assert.rejects(recordEarning({ ...input, accountId: "nope" }, repositories, now), EarningRejectedError);
    await assert.rejects(recordEarning({ ...input, instrumentId: "missing" }, repositories, now), /not found/);
    await assert.rejects(recordEarning({ ...input, instrumentId: "usd" }, repositories, now), /currency/);
    assert.equal(created.length, 0);
  });
});
