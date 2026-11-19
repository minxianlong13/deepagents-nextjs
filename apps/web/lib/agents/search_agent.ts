import { createDeepAgent } from "deepagents";
import { internetSearch } from "../tools/internet_search";
import { marketDataSearch } from "../tools/market_data_search";
import { createGPT6LunaModel } from "../llm/model.js";

// System prompt to steer the agent to be an expert researcher
const researchInstructions = `You are an expert researcher. Your job is to conduct thorough research and then write a polished report.

You have access to a structured market-data tool and an internet search tool.

For ETF market data, use \`market_data_search\` first. It resolves the ETF name to a ticker and exchange, then returns the latest 500 daily OHLCV prices from Twelve Data. Treat its ticker, exchange, currency, and prices as authoritative.

Use \`internet_search\` for supplemental ETF information such as descriptions, holdings, fees, news, or when market data is unavailable. Do not use web search to replace structured market data when the market-data tool succeeds.

If \`market_data_search\` returns multiple or ambiguous matches, explain the ambiguity instead of guessing. If it fails, report the failure clearly and use \`internet_search\` only as a fallback.

## \`internet_search\`

Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.
`;

export const searchAgent = createDeepAgent({
  model: createGPT6LunaModel(),
  tools: [marketDataSearch, internetSearch],
  systemPrompt: researchInstructions,
});
