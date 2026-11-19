import { buildGridPlan, gridLevelPrice, validateGridSettings, type GridSettings } from "../domain";
import { getTradingAccount, type TradingAccountReadRepositories } from "./get-trading-account";
import type { DailyBar, DailyBarProvider, GridStrategyRecord, GridStrategyRepository } from "./repositories";

export interface GridReportRepositories extends TradingAccountReadRepositories {
  grids: GridStrategyRepository;
}

export type GridSettingsValues = Omit<GridStrategyRecord, "accountId" | "instrumentId">;

export interface GridReportContext {
  instrument: { id: string; symbol: string; name: string };
  currency: string;
  bar: DailyBar;
  position: { quantity: string; averageCost: string | null };
  cashBalance: string;
}

export interface GridReport extends GridReportContext {
  settings: GridSettingsValues;
  /** Nearest first. */
  buyLevels: Array<{
    index: number;
    price: string;
    distancePercent: string;
    quantity: string;
    cost: string;
    cumulativeCost: string;
    cashAfter: string;
    affordable: boolean;
    quantityAfter: string;
    averageCostAfter: string | null;
    profitPerRoundTrip: string;
  }>;
  /** Nearest first. */
  sellLevels: Array<{
    index: number;
    price: string;
    distancePercent: string;
    quantity: string;
    proceeds: string;
    cumulativeProceeds: string;
    profitVsAverageCost: string | null;
    quantityAfter: string;
  }>;
  totalBuyCost: string;
  totalSellProceeds: string;
  /** Grid level prices inside the session's low–high range, lowest first. */
  levelsInSessionRange: string[];
}

export type GridReportResult =
  | { status: "needs_setup"; context: GridReportContext; suggestedSettings: GridSettingsValues }
  | { status: "ready"; report: GridReport };

export class GridRejectedError extends Error {}

const MAX_RANGE_LEVELS = 100;

/**
 * Builds the next session's grid plan for one instrument from the latest daily bar, the current
 * position, and the account's cash. Returns null when the account does not exist.
 */
export async function getGridReport(
  accountId: string,
  instrumentId: string,
  repositories: GridReportRepositories,
  bars: DailyBarProvider,
): Promise<GridReportResult | null> {
  const account = await getTradingAccount(accountId, repositories);
  if (!account) return null;

  const [instrument] = await repositories.instruments.findByIds([instrumentId]);
  if (!instrument) throw new GridRejectedError("Trading instrument was not found");
  if (instrument.currency.toUpperCase() !== account.currency.toUpperCase()) {
    throw new GridRejectedError("Instrument currency must match account currency");
  }

  const bar = await bars.getLatestDailyBar(instrument);
  const held = account.positions.find((position) => position.instrumentId === instrument.id);
  const context: GridReportContext = {
    instrument: { id: instrument.id, symbol: instrument.symbol, name: instrument.name },
    currency: account.currency,
    bar,
    position: { quantity: held?.quantity ?? "0", averageCost: held?.averageCost ?? null },
    cashBalance: account.cashBalance,
  };

  const saved = await repositories.grids.find(account.id, instrument.id);
  if (!saved) {
    return {
      status: "needs_setup",
      context,
      suggestedSettings: { anchorPrice: bar.close, spacingMode: "percent", stepValue: "3", sizingMode: "shares", sizeValue: "10", levelsPerSide: 5 },
    };
  }

  const settings: GridSettingsValues = {
    anchorPrice: saved.anchorPrice,
    spacingMode: saved.spacingMode,
    stepValue: saved.stepValue,
    sizingMode: saved.sizingMode,
    sizeValue: saved.sizeValue,
    levelsPerSide: saved.levelsPerSide,
  };
  const plan = buildGridPlan(settings, {
    referencePrice: bar.close,
    heldQuantity: context.position.quantity,
    averageCost: context.position.averageCost,
    cashBalance: account.cashBalance,
  });

  return {
    status: "ready",
    report: {
      ...context,
      settings,
      buyLevels: plan.buyLevels.map((level) => ({
        index: level.index,
        price: level.price.toString(),
        distancePercent: level.distancePercent.toString(),
        quantity: level.quantity.toString(),
        cost: level.cost.toString(),
        cumulativeCost: level.cumulativeCost.toString(),
        cashAfter: level.cashAfter.toString(),
        affordable: level.affordable,
        quantityAfter: level.quantityAfter.toString(),
        averageCostAfter: level.averageCostAfter?.toString() ?? null,
        profitPerRoundTrip: level.profitPerRoundTrip.toString(),
      })),
      sellLevels: plan.sellLevels.map((level) => ({
        index: level.index,
        price: level.price.toString(),
        distancePercent: level.distancePercent.toString(),
        quantity: level.quantity.toString(),
        proceeds: level.proceeds.toString(),
        cumulativeProceeds: level.cumulativeProceeds.toString(),
        profitVsAverageCost: level.profitVsAverageCost?.toString() ?? null,
        quantityAfter: level.quantityAfter.toString(),
      })),
      totalBuyCost: plan.totalBuyCost.toString(),
      totalSellProceeds: plan.totalSellProceeds.toString(),
      levelsInSessionRange: levelsInRange(settings, plan.sellLevels[0]!.index - 1, bar.low, bar.high),
    },
  };
}

export async function saveGridSettings(
  input: GridStrategyRecord,
  repositories: Pick<GridReportRepositories, "accounts" | "instruments" | "grids">,
): Promise<void> {
  try {
    validateGridSettings(input);
  } catch (error) {
    throw new GridRejectedError(error instanceof Error ? error.message : "Grid settings are invalid");
  }
  const account = await repositories.accounts.findById(input.accountId);
  if (!account) throw new GridRejectedError("Trading account was not found");
  const [instrument] = await repositories.instruments.findByIds([input.instrumentId]);
  if (!instrument) throw new GridRejectedError("Trading instrument was not found");
  if (instrument.currency.toUpperCase() !== account.currency.toUpperCase()) {
    throw new GridRejectedError("Instrument currency must match account currency");
  }
  await repositories.grids.save(input);
}

/** Grid level prices between `low` and `high` inclusive, walking outward from the level at or below the close. */
function levelsInRange(settings: Pick<GridSettings, "anchorPrice" | "spacingMode" | "stepValue">, floorIndex: number, low: string, high: string): string[] {
  const prices: string[] = [];
  for (let index = floorIndex, count = 0; count < MAX_RANGE_LEVELS; index--, count++) {
    const price = gridLevelPrice(settings, index);
    if (price.lessThan(low) || !price.isPositive() || price.isZero()) break;
    if (price.lessThanOrEqualTo(high)) prices.unshift(price.toString());
  }
  for (let index = floorIndex + 1, count = 0; count < MAX_RANGE_LEVELS; index++, count++) {
    const price = gridLevelPrice(settings, index);
    if (price.greaterThan(high)) break;
    if (price.greaterThanOrEqualTo(low)) prices.push(price.toString());
  }
  return prices;
}
