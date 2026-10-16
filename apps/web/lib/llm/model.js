import { ChatAnthropic } from "@langchain/anthropic";
import { OpenAIEmbeddings } from "@langchain/openai";

export const OPENAI_EMBEDDING_DIMENSIONS = 1024;

export function createClaudeSonnetModel() {
  return new ChatAnthropic({ model: "claude-sonnet-4-6" });
}

export function createDeterministicClaudeSonnetModel() {
  return new ChatAnthropic({ model: "claude-sonnet-4-6", temperature: 0 });
}

export function createClaudeHaikuModel() {
  return new ChatAnthropic({ model: "claude-haiku-4-5-20251001" });
}

export function createOpenAIEmbeddingModel() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    dimensions: OPENAI_EMBEDDING_DIMENSIONS,
  });
}
