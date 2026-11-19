import { Prisma } from "@prisma/client";
import { decimal, type MoneyValue } from "./money";

export type TradeSide = "buy" | "sell";

export interface TradeInput {
  side: TradeSide;
  quantity: MoneyValue;
  price: MoneyValue;
  /** Fees and commissions charged for the trade. Defaults to 0. */
  fee?: MoneyValue;
}

export interface HeldPosition {
  quantity: MoneyValue;
  averageCost: MoneyValue;
}

/** Matches the Decimal(20, 8) precision of persisted position columns. */
const STORED_SCALE = 8;

export type PositionChange =
  | { kind: "upsert"; quantity: Prisma.Decimal; averageCost: Prisma.Decimal }
  | { kind: "delete" };

/**
 * Applies a buy or sell to the currently held position.
 * Buys blend into a weighted average cost, with fees added to the cost basis.
 * Sells reduce quantity and keep the average cost; their fees only reduce proceeds.
 * Selling the entire holding removes the position.
 */
export function applyTrade(current: HeldPosition | null, trade: TradeInput): PositionChange {
  const tradeQuantity = decimal(trade.quantity);
  const price = decimal(trade.price);
  const fee = decimal(trade.fee ?? "0");

  if (!tradeQuantity.isPositive() || tradeQuantity.isZero()) {
    throw new Error("Trade quantity must be greater than zero");
  }
  if (price.isNegative()) {
    throw new Error("Trade price cannot be negative");
  }
  if (fee.isNegative()) {
    throw new Error("Trade fee cannot be negative");
  }

  const heldQuantity = current ? decimal(current.quantity) : new Prisma.Decimal(0);
  const heldAverageCost = current ? decimal(current.averageCost) : new Prisma.Decimal(0);

  if (trade.side === "sell") {
    if (tradeQuantity.greaterThan(heldQuantity)) {
      throw new Error(`Cannot sell ${tradeQuantity.toString()}; only ${heldQuantity.toString()} held`);
    }
    const remaining = heldQuantity.minus(tradeQuantity);
    return remaining.isZero()
      ? { kind: "delete" }
      : { kind: "upsert", quantity: remaining, averageCost: heldAverageCost };
  }

  const quantity = heldQuantity.plus(tradeQuantity);
  const averageCost = heldQuantity.mul(heldAverageCost)
    .plus(tradeQuantity.mul(price))
    .plus(fee)
    .div(quantity)
    .toDecimalPlaces(STORED_SCALE, Prisma.Decimal.ROUND_HALF_UP);
  return { kind: "upsert", quantity, averageCost };
}
