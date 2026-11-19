"use server";

import * as z from "zod/v4";
import { Prisma } from "@prisma/client";
import {
  getGridReport,
  GridRejectedError,
  saveGridSettings,
  type GridReportContext,
  type GridReportResult,
  type GridSettingsValues,
} from "@/lib/trading/application";
import { createDailyBarProvider, createPrismaGridReportRepositories } from "@/lib/trading/infrastructure";
import { formatMoney, formatQuantity, formatSignedMoney, formatSignedPercent, tone } from "./format";

type Tone = "gain" | "loss" | "flat";

/** Grid report with every amount pre-formatted on the server (exact decimals). */
export type GridView =
  | { status: "error"; message: string }
  | {
      status: "needs_setup" | "ready";
      symbol: string;
      name: string;
      currency: string;
      session: {
        date: string;
        isFinal: boolean;
        observedAt: string | null;
        close: string;
        /** Unformatted close, for "anchor at close" in the settings form. */
        closeRaw: string;
        open: string;
        high: string;
        low: string;
        change: string | null;
        changeTone: Tone | null;
      };
      position: { quantity: string; averageCost: string | null; cash: string };
      /** Raw values for the settings form. */
      settings: { anchorPrice: string; spacingMode: "percent" | "amount"; stepValue: string; sizingMode: "shares" | "amount"; sizeValue: string; levelsPerSide: number };
      plan: null | {
        summary: string;
        levelsInSessionRange: string[];
        sell: Array<{ price: string; distance: string; quantity: string; proceeds: string; profit: string | null; profitTone: Tone | null; sharesLeft: string; note: string | null }>;
        buy: Array<{ price: string; distance: string; quantity: string; cost: string; cashAfter: string; affordable: boolean; averageCostAfter: string | null; roundTripProfit: string; note: string | null }>;
        totalBuyCost: string;
        totalSellProceeds: string;
      };
    };

const positiveDecimal = z.string().trim().regex(/^\d+(\.\d{1,8})?$/, "Use a positive number with up to 8 decimal places.");

const settingsInput = z.object({
  accountId: z.string().min(1),
  instrumentId: z.string().min(1),
  anchorPrice: positiveDecimal,
  spacingMode: z.enum(["percent", "amount"]),
  stepValue: positiveDecimal,
  sizingMode: z.enum(["shares", "amount"]),
  sizeValue: positiveDecimal,
  levelsPerSide: z.coerce.number().int().min(1).max(50),
});

export async function loadGridReport(accountId: string, instrumentId: string): Promise<GridView> {
  try {
    const result = await getGridReport(accountId, instrumentId, createPrismaGridReportRepositories(), createDailyBarProvider());
    if (!result) return { status: "error", message: "Trading account was not found." };
    return toView(result);
  } catch (error) {
    if (error instanceof GridRejectedError) return { status: "error", message: error.message };
    console.error("Failed to build grid report", { accountId, instrumentId, error });
    return { status: "error", message: `The grid report could not be generated: ${error instanceof Error ? error.message : "unknown error"}` };
  }
}

export async function saveGridSettingsAction(formData: FormData): Promise<GridView> {
  const parsed = settingsInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", message: issue ? `${String(issue.path[0] ?? "Settings")}: ${issue.message}` : "Grid settings are invalid." };
  }
  try {
    await saveGridSettings(parsed.data, createPrismaGridReportRepositories());
  } catch (error) {
    if (error instanceof GridRejectedError) return { status: "error", message: error.message };
    console.error("Failed to save grid settings", { accountId: parsed.data.accountId, instrumentId: parsed.data.instrumentId, error });
    return { status: "error", message: "The grid settings could not be saved. Please try again." };
  }
  return loadGridReport(parsed.data.accountId, parsed.data.instrumentId);
}

function toView(result: GridReportResult): GridView {
  const context: GridReportContext = result.status === "ready" ? result.report : result.context;
  const settings: GridSettingsValues = result.status === "ready" ? result.report.settings : result.suggestedSettings;
  const { currency, bar } = context;
  const money = (value: string) => formatMoney(value, currency);
  const change = bar.previousClose === null ? null : new Prisma.Decimal(bar.close).minus(bar.previousClose);

  return {
    status: result.status,
    symbol: context.instrument.symbol,
    name: context.instrument.name,
    currency,
    session: {
      date: bar.date,
      isFinal: bar.isFinal,
      observedAt: bar.observedAt,
      close: money(bar.close),
      closeRaw: plain(bar.close),
      open: money(bar.open),
      high: money(bar.high),
      low: money(bar.low),
      change: change === null || bar.previousClose === null || new Prisma.Decimal(bar.previousClose).isZero()
        ? null
        : `${formatSignedMoney(change.toString(), currency)} (${formatSignedPercent(change.div(bar.previousClose).mul(100).toString())})`,
      changeTone: change === null ? null : tone(change.toString()),
    },
    position: {
      quantity: formatQuantity(context.position.quantity),
      averageCost: context.position.averageCost === null ? null : money(context.position.averageCost),
      cash: money(context.cashBalance),
    },
    settings: {
      anchorPrice: plain(settings.anchorPrice),
      spacingMode: settings.spacingMode,
      stepValue: plain(settings.stepValue),
      sizingMode: settings.sizingMode,
      sizeValue: plain(settings.sizeValue),
      levelsPerSide: settings.levelsPerSide,
    },
    plan: result.status !== "ready" ? null : {
      summary: `${settings.spacingMode === "percent" ? `${plain(settings.stepValue)}% steps` : `${money(settings.stepValue)} steps`} from ${money(settings.anchorPrice)} · ${
        settings.sizingMode === "shares" ? `${plain(settings.sizeValue)} shares per level` : `${money(settings.sizeValue)} per level`
      }`,
      levelsInSessionRange: result.report.levelsInSessionRange.map(money),
      sell: result.report.sellLevels.map((level) => {
        const none = new Prisma.Decimal(level.quantity).isZero();
        return {
          price: money(level.price),
          distance: formatSignedPercent(level.distancePercent),
          quantity: formatQuantity(level.quantity),
          proceeds: money(level.proceeds),
          profit: none || level.profitVsAverageCost === null ? null : formatSignedMoney(level.profitVsAverageCost, currency),
          profitTone: none || level.profitVsAverageCost === null ? null : tone(level.profitVsAverageCost),
          sharesLeft: formatQuantity(level.quantityAfter),
          note: none ? "No shares left to sell" : level.profitVsAverageCost !== null && new Prisma.Decimal(level.profitVsAverageCost).isNegative() ? "Below average cost" : null,
        };
      }),
      buy: result.report.buyLevels.map((level) => {
        const none = new Prisma.Decimal(level.quantity).isZero();
        return {
          price: money(level.price),
          distance: formatSignedPercent(level.distancePercent),
          quantity: formatQuantity(level.quantity),
          cost: money(level.cost),
          cashAfter: money(level.cashAfter),
          affordable: level.affordable,
          averageCostAfter: level.averageCostAfter === null ? null : money(level.averageCostAfter),
          roundTripProfit: formatSignedMoney(level.profitPerRoundTrip, currency),
          note: none ? "Size is too small for one share" : level.affordable ? null : "Not enough cash",
        };
      }),
      totalBuyCost: money(result.report.totalBuyCost),
      totalSellProceeds: money(result.report.totalSellProceeds),
    },
  };
}

/** Plain decimal string without trailing zeros, for form inputs. */
function plain(value: string): string {
  const fixed = new Prisma.Decimal(value).toFixed();
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
}
