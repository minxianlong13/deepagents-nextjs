import * as z from "zod/v4";
import type { PriceQuote } from "../application/refresh-position-prices";

const quoteSchema = z.object({
  symbol: z.string().min(1),
  price: z.union([z.string(), z.number()]).nullable(),
  currency: z.string().min(1),
  asOf: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

/**
 * Extracts the JSON quote object from an agent's free-text reply.
 * Accepts a fenced ```json block or the last {...} object in the text.
 */
export function parseQuoteResponse(text: string): PriceQuote {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((match) => match[1]!).at(-1);
  const candidate = fenced ?? lastJsonObject(text);
  if (!candidate) throw new Error("Search agent did not return a price");

  let raw: unknown;
  try {
    raw = JSON.parse(candidate);
  } catch {
    throw new Error("Search agent returned an unreadable price");
  }
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Search agent returned an incomplete price");

  const quote = parsed.data;
  if (quote.price === null || quote.price === "") {
    throw new Error(quote.error?.trim() || "Search agent could not find a price");
  }
  const price = typeof quote.price === "number" ? numberToPlainString(quote.price) : quote.price.trim().replace(/,/g, "");
  return {
    symbol: quote.symbol,
    price,
    currency: quote.currency,
    asOf: quote.asOf?.trim() || null,
    sourceUrl: normalizeUrl(quote.sourceUrl),
  };
}

function lastJsonObject(text: string): string | null {
  const end = text.lastIndexOf("}");
  if (end === -1) return null;
  let depth = 0;
  for (let index = end; index >= 0; index--) {
    if (text[index] === "}") depth++;
    if (text[index] === "{" && --depth === 0) return text.slice(index, end + 1);
  }
  return null;
}

function numberToPlainString(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return value.toFixed(8).replace(/\.?0+$/, "");
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
