import { Prisma } from "@prisma/client";

/** Prisma Decimal keeps calculations exact across the database/application boundary. */
export type MoneyValue = Prisma.Decimal | string;
export type DecimalValue = Prisma.Decimal;

export function decimal(value: MoneyValue): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function sumDecimals(values: readonly Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce((total, value) => total.plus(value), new Prisma.Decimal(0));
}
