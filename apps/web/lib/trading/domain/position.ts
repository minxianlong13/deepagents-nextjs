import { Prisma } from "@prisma/client";
import { decimal, type MoneyValue } from "./money";

export interface PositionValues {
  quantity: MoneyValue;
  averageCost: MoneyValue;
  currentPrice: MoneyValue | null;
}

export interface PositionCalculation {
  costBasis: Prisma.Decimal;
  marketValue: Prisma.Decimal | null;
  unrealizedReturn: Prisma.Decimal | null;
  unrealizedReturnPercent: Prisma.Decimal | null;
}

export function calculatePositionValues(position: PositionValues): PositionCalculation {
  const quantity = decimal(position.quantity);
  const averageCost = decimal(position.averageCost);
  const costBasis = quantity.mul(averageCost);

  if (position.currentPrice === null) {
    return { costBasis, marketValue: null, unrealizedReturn: null, unrealizedReturnPercent: null };
  }

  const marketValue = quantity.mul(decimal(position.currentPrice));
  const unrealizedReturn = marketValue.minus(costBasis);
  const unrealizedReturnPercent = costBasis.isZero()
    ? null
    : unrealizedReturn.div(costBasis).mul(100);

  return { costBasis, marketValue, unrealizedReturn, unrealizedReturnPercent };
}
