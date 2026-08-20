import { createDeepAgent } from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";
import { internetSearch } from "../tools/internet_search";

// System prompt to steer the agent to be an expert researcher
const researchInstructions = `You are an expert researcher. Your job is to conduct thorough research and then write a polished report.

You have access to an internet search tool as your primary means of gathering information.

## \`internet_search\`

Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.
`;

export const searchAgent = createDeepAgent({
  model: new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
  }),
  tools: [internetSearch],
  systemPrompt: researchInstructions,
});
