"use server";

import { refresh } from "next/cache";
import * as z from "zod/v4";
import {
  EarningRejectedError,
  executeTrade,
  recordEarning,
  refreshPositionPrices,
  TradeRejectedError,
  type PriceRefreshResult,
} from "@/lib/trading/application";
import {
  createPrismaEarningRepositories,
  createPrismaPriceRefreshRepositories,
  createPrismaTradeRepositories,
  createMarketQuoteProvider,
} from "@/lib/trading/infrastructure";

export type TradeActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<"instrumentId" | "quantity" | "price" | "fee" | "executedAt", string>> };

const decimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,8})?$/, "Use a non-negative number with up to 8 decimal places.");

const tradeInput = z.object({
  accountId: z.string().min(1),
  instrumentId: z.string().min(1, "Choose an instrument."),
  side: z.enum(["buy", "sell"]),
  quantity: decimal.refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
  price: decimal,
  fee: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? "0" : value ?? "0"), decimal),
  // The client converts its local date/time input to an ISO-8601 UTC timestamp.
  executedAt: z.iso.datetime({ message: "Enter the date and time of the trade." }).transform((value) => new Date(value)),
});

export async function submitTrade(_previous: TradeActionState, formData: FormData): Promise<TradeActionState> {
  const parsed = tradeInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<Extract<TradeActionState, { status: "error" }>["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "instrumentId" || field === "quantity" || field === "price" || field === "fee" || field === "executedAt") && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    await executeTrade(parsed.data, createPrismaTradeRepositories());
  } catch (error) {
    if (error instanceof TradeRejectedError) return { status: "error", message: error.message };
    console.error("Failed to execute trade", { accountId: parsed.data.accountId, instrumentId: parsed.data.instrumentId, side: parsed.data.side, error });
    return { status: "error", message: "The trade could not be saved. Please try again." };
  }

  refresh();
  const verb = parsed.data.side === "buy" ? "Bought" : "Sold";
  const feeNote = Number(parsed.data.fee) > 0 ? ` (fee ${parsed.data.fee})` : "";
  return { status: "success", message: `${verb} ${parsed.data.quantity} @ ${parsed.data.price}${feeNote}.` };
}

export type PriceRefreshActionState =
  | { status: "idle" }
  | { status: "done"; results: PriceRefreshResult[]; refreshedAt: string }
  | { status: "error"; message: string };

export async function refreshPrices(_previous: PriceRefreshActionState, formData: FormData): Promise<PriceRefreshActionState> {
  const accountId = formData.get("accountId");
  if (typeof accountId !== "string" || !accountId) return { status: "error", message: "Missing account." };

  let results: PriceRefreshResult[] | null;
  try {
    results = await refreshPositionPrices(accountId, createPrismaPriceRefreshRepositories(), createMarketQuoteProvider());
  } catch (error) {
    console.error("Failed to refresh position prices", { accountId, error });
    return { status: "error", message: "Prices could not be refreshed. Please try again." };
  }
  if (!results) return { status: "error", message: "Trading account was not found." };

  for (const result of results) {
    if (result.status === "failed") console.warn("Price refresh failed for holding", { accountId, ...result });
  }
  if (results.some((result) => result.status === "updated")) refresh();
  return { status: "done", results, refreshedAt: new Date().toISOString() };
}

export type EarningActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<"amount" | "receivedAt" | "note", string>> };

const earningInput = z.object({
  accountId: z.string().min(1),
  kind: z.enum(["stock_lending"]),
  amount: decimal.refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  instrumentId: z.string().optional().transform((value) => value || null),
  receivedAt: z.iso.datetime({ message: "Enter the date the earnings were received." }).transform((value) => new Date(value)),
  note: z.string().trim().max(200, "Keep the note under 200 characters.").optional(),
});

export async function submitEarning(_previous: EarningActionState, formData: FormData): Promise<EarningActionState> {
  const parsed = earningInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<Extract<EarningActionState, { status: "error" }>["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "amount" || field === "receivedAt" || field === "note") && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    await recordEarning(parsed.data, createPrismaEarningRepositories());
  } catch (error) {
    if (error instanceof EarningRejectedError) return { status: "error", message: error.message };
    console.error("Failed to record earning", { accountId: parsed.data.accountId, kind: parsed.data.kind, error });
    return { status: "error", message: "The earnings could not be saved. Please try again." };
  }

  refresh();
  return { status: "success", message: `Added ${parsed.data.amount} in earnings.` };
}
