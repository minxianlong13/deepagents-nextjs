import { Prisma } from "@prisma/client";
import { decimal, type MoneyValue } from "./money";
import { applyTrade, type HeldPosition, type TradeSide } from "./trade";

export interface LedgerTrade {
  instrumentId: string;
  side: TradeSide;
  quantity: MoneyValue;
  price: MoneyValue;
  fee: MoneyValue;
}

export interface TradeLedgerSummary {
  /** Net cash moved by trades: sell proceeds minus buy costs, after fees. */
  netCashFlow: Prisma.Decimal;
  /** Sum over sells of (price − average cost at the time) × quantity − fee. */
  realizedReturn: Prisma.Decimal;
  totalFees: Prisma.Decimal;
  /** One entry per input trade, in the same order. */
  entries: TradeLedgerEntry[];
}

export interface TradeLedgerEntry {
  /** Cash moved by this trade: negative for buys, positive for sells, after fees. */
  cashFlow: Prisma.Decimal;
  /** Realized return for sells; null for buys. */
  realizedReturn: Prisma.Decimal | null;
  quantityAfter: Prisma.Decimal;
  averageCostAfter: Prisma.Decimal | null;
}

/**
 * Replays trades in the order they were applied to positions, so each sell's realized return uses the
 * same average cost the position had when that sell was recorded.
 */
export function summarizeTradeLedger(trades: readonly LedgerTrade[]): TradeLedgerSummary {
  const held = new Map<string, HeldPosition>();
  let netCashFlow = new Prisma.Decimal(0);
  let realizedReturn = new Prisma.Decimal(0);
  let totalFees = new Prisma.Decimal(0);
  const entries: TradeLedgerEntry[] = [];

  for (const trade of trades) {
    const quantity = decimal(trade.quantity);
    const gross = quantity.mul(decimal(trade.price));
    const fee = decimal(trade.fee);
    const current = held.get(trade.instrumentId) ?? null;

    let tradeRealized: Prisma.Decimal | null = null;
    const cashFlow = trade.side === "sell" ? gross.minus(fee) : gross.plus(fee).negated();
    if (trade.side === "sell") {
      const averageCost = current ? decimal(current.averageCost) : new Prisma.Decimal(0);
      tradeRealized = gross.minus(fee).minus(quantity.mul(averageCost));
      realizedReturn = realizedReturn.plus(tradeRealized);
    }
    netCashFlow = netCashFlow.plus(cashFlow);
    totalFees = totalFees.plus(fee);

    const change = applyTrade(current, trade);
    if (change.kind === "delete") held.delete(trade.instrumentId);
    else held.set(trade.instrumentId, { quantity: change.quantity, averageCost: change.averageCost });

    entries.push({
      cashFlow,
      realizedReturn: tradeRealized,
      quantityAfter: change.kind === "delete" ? new Prisma.Decimal(0) : change.quantity,
      averageCostAfter: change.kind === "delete" ? null : change.averageCost,
    });
  }

  return { netCashFlow, realizedReturn, totalFees, entries };
}
