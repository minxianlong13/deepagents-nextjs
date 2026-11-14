import { Prisma } from "@prisma/client";
import { decimal, type MoneyValue } from "./money";

export interface PositionAssociation {
  accountId: string;
  accountCurrency: string;
  instrumentId: string;
  instrumentCurrency: string;
  positionAccountId: string;
  positionInstrumentId: string;
  quantity: MoneyValue;
  averageCost: MoneyValue;
}

export function validatePosition(input: PositionAssociation): void {
  if (input.positionAccountId !== input.accountId || input.positionInstrumentId !== input.instrumentId) {
    throw new Error("Position account or instrument association is invalid");
  }
  if (input.accountCurrency.toUpperCase() !== input.instrumentCurrency.toUpperCase()) {
    throw new Error("Instrument currency must match account currency");
  }
  if (new Prisma.Decimal(input.quantity).isNegative()) {
    throw new Error("Position quantity cannot be negative");
  }
  if (new Prisma.Decimal(input.averageCost).isNegative()) {
    throw new Error("Position average cost cannot be negative");
  }
}

export function validateInitialFund(initialFund: MoneyValue): void {
  if (decimal(initialFund).isNegative()) {
    throw new Error("Initial fund cannot be negative");
  }
}
