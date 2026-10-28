import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const OPENAI_EMBEDDING_DIMENSIONS = 1024;
const OPENAI_CHAT_MODEL = "gpt-6-luna";

export function createGPT6LunaModel() {
  return new ChatOpenAI({
    model: OPENAI_CHAT_MODEL,
    modelKwargs: { reasoning_effort: "none" },
  });
}

export function createDeterministicGPT6LunaModel() {
  return new ChatOpenAI({
    model: OPENAI_CHAT_MODEL,
    temperature: 0,
    modelKwargs: { reasoning_effort: "none" },
  });
}

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
