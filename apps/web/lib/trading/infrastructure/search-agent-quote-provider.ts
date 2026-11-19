import type { PriceQuote, PriceQuoteProvider } from "../application/refresh-position-prices";
import type { TradingInstrumentRecord } from "../application/repositories";
import { parseQuoteResponse } from "./parse-quote-response";

const QUOTE_TIMEOUT_MS = 90_000;

/** Uses the internet-search agent to find the latest traded price for an instrument. */
export class SearchAgentQuoteProvider implements PriceQuoteProvider {
  async getQuote(
    instrument: Pick<TradingInstrumentRecord, "symbol" | "name" | "instrumentType" | "currency">,
  ): Promise<PriceQuote> {
    // Loaded lazily so rendering trading pages does not initialize the LLM stack.
    const { searchAgent } = await import("@/lib/agents/search_agent");
    const result = await searchAgent.invoke(
      { messages: [{ role: "user", content: buildPrompt(instrument) }] },
      { signal: AbortSignal.timeout(QUOTE_TIMEOUT_MS), recursionLimit: 30 },
    );
    const last = result.messages[result.messages.length - 1];
    return parseQuoteResponse(contentToText(last?.content));
  }
}

function buildPrompt(instrument: Pick<TradingInstrumentRecord, "symbol" | "name" | "instrumentType" | "currency">): string {
  const listing = instrument.currency.toUpperCase() === "CAD"
    ? "It trades in Canadian dollars (most likely on the TSX / Cboe Canada)."
    : `It trades in ${instrument.currency.toUpperCase()}.`;
  return [
    `Find the latest market price for this ${instrument.instrumentType.toUpperCase()}:`,
    `- Symbol: ${instrument.symbol}`,
    `- Name: ${instrument.name}`,
    `- ${listing}`,
    "",
    "Use market_data_search first with the ETF name to resolve the ticker and exchange and obtain its daily prices from Twelve Data. Use the most recent returned closing price and its date. Use internet_search with topic \"finance\" only if the market-data tool fails, and prefer a reputable quote page in that fallback.",
    "Do not write a report. Do not estimate or guess. Reply with ONLY one JSON object in a ```json fenced block:",
    "```json",
    `{"symbol":"${instrument.symbol}","price":"<decimal number, no currency symbol>","currency":"<3-letter code of the quoted price>","asOf":"<ISO-8601 time or date of the quote, or null>","sourceUrl":"<URL of the page the price came from>"}`,
    "```",
    `If you cannot find a reliable price, reply with {"symbol":"${instrument.symbol}","price":null,"currency":"${instrument.currency}","error":"<short reason>"}.`,
  ].join("\n");
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : typeof part?.text === "string" ? part.text : ""))
      .join("\n");
  }
  return "";
}
