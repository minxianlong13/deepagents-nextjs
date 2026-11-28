import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { getChatModel } from "./catalog";

const OPENAI_EMBEDDING_DIMENSIONS = 1024;
const OPENAI_CHAT_MODEL = "gpt-6-luna";

export function createOpenAIEmbeddingModel() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    dimensions: OPENAI_EMBEDDING_DIMENSIONS,
  });
}

/**
 * Provider-neutral chat-model factory. The catalog is the only place that
 * maps an approved model ID to a provider, so workflows never construct a
 * provider client from untrusted request data.
 */
export function createChatModel(modelId, options = {}) {
  const model = getChatModel(modelId);
  const temperature = options.deterministic ? 0 : undefined;

  if (model.provider === "OpenAI") {
    const config = {
      model: model.id,
      ...(temperature === undefined ? {} : { temperature }),
    };

    if (model.id === OPENAI_CHAT_MODEL) {
      config.modelKwargs = { reasoning_effort: "none" };
    }

    return new ChatOpenAI(config);
  }

  if (model.provider === "Anthropic") {
    return new ChatAnthropic({
      model: model.id,
      ...(temperature === undefined ? {} : { temperature }),
    });
  }

  return new ChatGoogleGenerativeAI({
    model: model.id,
    ...(temperature === undefined ? {} : { temperature }),
  });
}

export function createDeterministicChatModel(modelId) {
  return createChatModel(modelId, { deterministic: true });
}
