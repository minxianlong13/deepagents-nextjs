import { Prisma } from "@prisma/client";
import { decimal, type MoneyValue } from "./money";

export type GridSpacingMode = "percent" | "amount";
export type GridSizingMode = "shares" | "amount";

export interface GridSettings {
  /** Price the ladder is built from. Levels stay fixed until this changes. */
  anchorPrice: MoneyValue;
  spacingMode: GridSpacingMode;
  /** Percent between levels (e.g. "3" = 3%) or a fixed price step, depending on `spacingMode`. */
  stepValue: MoneyValue;
  sizingMode: GridSizingMode;
  /** Shares per level, or cash per level (converted to whole shares), depending on `sizingMode`. */
  sizeValue: MoneyValue;
  /** How many buy levels and how many sell levels to plan. */
  levelsPerSide: number;
}

export interface GridMarketState {
  /** Latest close (or last price) the plan is centred on. */
  referencePrice: MoneyValue;
  heldQuantity: MoneyValue;
  averageCost: MoneyValue | null;
  cashBalance: MoneyValue;
}

export interface GridBuyLevel {
  /** Ladder index relative to the anchor (0 = anchor, negative = below). */
  index: number;
  price: Prisma.Decimal;
  /** Percent distance from the reference price (negative). */
  distancePercent: Prisma.Decimal;
  quantity: Prisma.Decimal;
  cost: Prisma.Decimal;
  cumulativeCost: Prisma.Decimal;
  cashAfter: Prisma.Decimal;
  /** False when cash would go negative if this and all nearer buy levels fill. */
  affordable: boolean;
  /** Position after this and all nearer buy levels fill. */
  quantityAfter: Prisma.Decimal;
  averageCostAfter: Prisma.Decimal | null;
  /** Profit from selling this lot one level up. */
  profitPerRoundTrip: Prisma.Decimal;
}

export interface GridSellLevel {
  index: number;
  price: Prisma.Decimal;
  /** Percent distance from the reference price (positive). */
  distancePercent: Prisma.Decimal;
  /** Planned size, capped by the shares still held after nearer sell levels. */
  quantity: Prisma.Decimal;
  proceeds: Prisma.Decimal;
  cumulativeProceeds: Prisma.Decimal;
  /** (price − average cost) × quantity; null when there is no average cost. */
  profitVsAverageCost: Prisma.Decimal | null;
  quantityAfter: Prisma.Decimal;
}

export interface GridPlan {
  referencePrice: Prisma.Decimal;
  /** Nearest first (highest price first). */
  buyLevels: GridBuyLevel[];
  /** Nearest first (lowest price first). */
  sellLevels: GridSellLevel[];
  totalBuyCost: Prisma.Decimal;
  totalSellProceeds: Prisma.Decimal;
}

const ZERO = new Prisma.Decimal(0);
const PRICE_SCALE = 2;
/** Guards the ladder walk against degenerate settings. */
const MAX_STEPS = 5_000;

export function validateGridSettings(settings: GridSettings): void {
  const anchor = decimal(settings.anchorPrice);
  const step = decimal(settings.stepValue);
  const size = decimal(settings.sizeValue);
  if (!anchor.isPositive() || anchor.isZero()) throw new Error("Anchor price must be greater than zero");
  if (settings.spacingMode === "percent") {
    if (step.lessThan("0.1") || step.greaterThan(50)) throw new Error("Percent step must be between 0.1 and 50");
  } else if (step.lessThan("0.01")) {
    throw new Error("Price step must be at least 0.01");
  }
  if (!size.isPositive() || size.isZero()) throw new Error("Size per level must be greater than zero");
  if (!Number.isInteger(settings.levelsPerSide) || settings.levelsPerSide < 1 || settings.levelsPerSide > 50) {
    throw new Error("Levels per side must be a whole number between 1 and 50");
  }
}

/** Price of ladder level `index`, rounded to cents. Level 0 is the anchor. */
export function gridLevelPrice(settings: Pick<GridSettings, "anchorPrice" | "spacingMode" | "stepValue">, index: number): Prisma.Decimal {
  const anchor = decimal(settings.anchorPrice);
  const step = decimal(settings.stepValue);
  const raw = settings.spacingMode === "percent"
    ? anchor.mul(step.div(100).plus(1).pow(index))
    : anchor.plus(step.mul(index));
  return raw.toDecimalPlaces(PRICE_SCALE, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Plans the next session's limit orders: the nearest grid levels below the reference price become
 * buys, the nearest above become sells. A level equal to the reference price is skipped.
 */
export function buildGridPlan(settings: GridSettings, market: GridMarketState): GridPlan {
  validateGridSettings(settings);
  const reference = decimal(market.referencePrice);
  if (!reference.isPositive() || reference.isZero()) throw new Error("Reference price must be greater than zero");

  // Walk from the anchor to the highest level that is not above the reference price.
  let floorIndex = 0;
  let steps = 0;
  while (gridLevelPrice(settings, floorIndex).greaterThan(reference)) {
    floorIndex--;
    if (++steps > MAX_STEPS) throw new Error("Reference price is too far below the grid anchor");
  }
  while (gridLevelPrice(settings, floorIndex + 1).lessThanOrEqualTo(reference)) {
    floorIndex++;
    if (++steps > MAX_STEPS) throw new Error("Reference price is too far above the grid anchor");
  }

  const sizeFor = (price: Prisma.Decimal): Prisma.Decimal =>
    settings.sizingMode === "shares" ? decimal(settings.sizeValue) : decimal(settings.sizeValue).div(price).floor();

  const held = decimal(market.heldQuantity);
  const averageCost = market.averageCost === null ? null : decimal(market.averageCost);
  const cash = decimal(market.cashBalance);

  const buyLevels: GridBuyLevel[] = [];
  let cumulativeCost = ZERO;
  let quantityAfterBuys = held;
  let costBasis = averageCost ? held.mul(averageCost) : ZERO;
  let buyIndex = gridLevelPrice(settings, floorIndex).equals(reference) ? floorIndex - 1 : floorIndex;
  while (buyLevels.length < settings.levelsPerSide) {
    const price = gridLevelPrice(settings, buyIndex);
    if (!price.isPositive() || price.isZero()) break;
    const quantity = sizeFor(price);
    const cost = quantity.mul(price);
    cumulativeCost = cumulativeCost.plus(cost);
    quantityAfterBuys = quantityAfterBuys.plus(quantity);
    costBasis = costBasis.plus(cost);
    const cashAfter = cash.minus(cumulativeCost);
    buyLevels.push({
      index: buyIndex,
      price,
      distancePercent: price.minus(reference).div(reference).mul(100),
      quantity,
      cost,
      cumulativeCost,
      cashAfter,
      affordable: !cashAfter.isNegative(),
      quantityAfter: quantityAfterBuys,
      averageCostAfter: quantityAfterBuys.isZero() ? null : costBasis.div(quantityAfterBuys).toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP),
      profitPerRoundTrip: gridLevelPrice(settings, buyIndex + 1).minus(price).mul(quantity),
    });
    buyIndex--;
  }

  const sellLevels: GridSellLevel[] = [];
  let cumulativeProceeds = ZERO;
  let remaining = held;
  for (let sellIndex = floorIndex + 1; sellLevels.length < settings.levelsPerSide; sellIndex++) {
    const price = gridLevelPrice(settings, sellIndex);
    const quantity = Prisma.Decimal.min(sizeFor(price), remaining);
    const proceeds = quantity.mul(price);
    cumulativeProceeds = cumulativeProceeds.plus(proceeds);
    remaining = remaining.minus(quantity);
    sellLevels.push({
      index: sellIndex,
      price,
      distancePercent: price.minus(reference).div(reference).mul(100),
      quantity,
      proceeds,
      cumulativeProceeds,
      profitVsAverageCost: averageCost ? price.minus(averageCost).mul(quantity) : null,
      quantityAfter: remaining,
    });
  }

  return { referencePrice: reference, buyLevels, sellLevels, totalBuyCost: cumulativeCost, totalSellProceeds: cumulativeProceeds };
}
