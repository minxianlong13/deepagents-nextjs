import { Prisma } from "@prisma/client";
import { calculatePositionValues, type PositionValues } from "./position";
import { sumDecimals } from "./money";

export interface AccountTotals {
  totalCostBasis: Prisma.Decimal;
  /** Null when any position lacks a current price, so a partial sum is not presented as complete. */
  totalMarketValue: Prisma.Decimal | null;
  totalUnrealizedReturn: Prisma.Decimal | null;
}

export function calculateAccountTotals(positions: readonly PositionValues[]): AccountTotals {
  const calculations = positions.map(calculatePositionValues);
  const totalCostBasis = sumDecimals(calculations.map((position) => position.costBasis));
  const pricesAvailable = calculations.every((position) => position.marketValue !== null);

  return {
    totalCostBasis,
    totalMarketValue: pricesAvailable
      ? sumDecimals(calculations.map((position) => position.marketValue!))
      : null,
    totalUnrealizedReturn: pricesAvailable
      ? sumDecimals(calculations.map((position) => position.unrealizedReturn!))
      : null,
  };
}
