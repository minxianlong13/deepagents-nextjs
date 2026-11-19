import { Prisma } from "@prisma/client";

/** Server-side display formatting with exact decimals. Not for Client Components (imports Prisma). */

export function formatMoney(value: string, currency: string): string {
  const fixed = new Prisma.Decimal(value).toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${grouped}.${fraction}`;
}

export function formatSignedMoney(value: string, currency: string): string {
  const amount = new Prisma.Decimal(value);
  if (amount.isZero()) return formatMoney("0", currency);
  return `${amount.isNegative() ? "−" : "+"}${formatMoney(amount.abs().toString(), currency)}`;
}

export function formatReturnPercent(change: string, base: string): string {
  const baseAmount = new Prisma.Decimal(base);
  if (baseAmount.isZero()) return "n/a";
  const percent = new Prisma.Decimal(change).div(baseAmount).mul(100);
  return `${percent.isNegative() ? "" : "+"}${percent.toFixed(2)}%`;
}

export function tone(value: string): "gain" | "loss" | "flat" {
  const amount = new Prisma.Decimal(value);
  return amount.isZero() ? "flat" : amount.isNegative() ? "loss" : "gain";
}

export function formatMaybeMoney(value: string | null, currency: string): string {
  return value === null ? "Unavailable" : formatMoney(value, currency);
}

export function formatQuantity(value: string): string {
  return new Prisma.Decimal(value).toFixed();
}

export function formatPercent(value: string | null): string {
  return value === null ? "Unavailable" : `${new Prisma.Decimal(value).toFixed(2)}%`;
}

/** Signed percent with two decimals, e.g. "+3.00%" or "−1.66%". */
export function formatSignedPercent(value: string): string {
  const percent = new Prisma.Decimal(value);
  if (percent.isZero()) return "0.00%";
  return `${percent.isNegative() ? "−" : "+"}${percent.abs().toFixed(2)}%`;
}
