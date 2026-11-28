export const MODEL_CATALOG = [
  {
    id: "gpt-6-luna",
    label: "GPT-6 Luna",
    provider: "OpenAI",
    description: "Strong general reasoning for complex workflows.",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    description: "General-purpose reasoning and generation.",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    description: "Faster, lower-cost general-purpose reasoning.",
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    provider: "OpenAI",
    description: "Strong coding, instruction following, and long context.",
  },
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    provider: "OpenAI",
    description: "Efficient coding and instruction following.",
  },
  {
    id: "o3",
    label: "o3",
    provider: "OpenAI",
    description: "Deep reasoning for difficult technical problems.",
  },
  {
    id: "o4-mini",
    label: "o4-mini",
    provider: "OpenAI",
    description: "Compact reasoning for faster complex-task execution.",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet",
    provider: "Anthropic",
    description: "High-quality reasoning and structured analysis.",
  },
  {
    id: "claude-opus-4-1-20250805",
    label: "Claude Opus 4.1",
    provider: "Anthropic",
    description: "Highest-capability reasoning for demanding work.",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Balanced reasoning, coding, and agent workflows.",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku",
    provider: "Anthropic",
    description: "Fast, lower-cost summaries and extraction.",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Advanced reasoning and multimodal analysis.",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Fast general-purpose reasoning with strong quality.",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    provider: "Google",
    description: "Low-latency, lower-cost generation and extraction.",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast multimodal generation for everyday workflows.",
  },
] as const;

export type ChatModelId = (typeof MODEL_CATALOG)[number]["id"];

export const MODEL_SELECTION_DEFAULTS: Record<
  "resumeTailoring" | "coverLetter",
  ChatModelId
> = {
  resumeTailoring: "gpt-6-luna",
  coverLetter: "gpt-6-luna",
};

export function isChatModelId(value: unknown): value is ChatModelId {
  return MODEL_CATALOG.some((model) => model.id === value);
}

export function getChatModel(modelId: string) {
  const model = MODEL_CATALOG.find((candidate) => candidate.id === modelId);
  if (!model) {
    throw new Error(`The selected AI model is not available: ${modelId}`);
  }
  return model;
}
