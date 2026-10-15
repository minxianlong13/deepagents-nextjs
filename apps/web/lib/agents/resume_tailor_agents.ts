import { ChatAnthropic } from "@langchain/anthropic";
import { createDeepAgent } from "deepagents";
import { toolStrategy } from "langchain";
import { z } from "zod";
import {
  COVER_LETTER_INSTRUCTIONS,
  RESUME_TAILOR_INSTRUCTIONS,
} from "@/lib/skill/resume_tailor";

const requirementSchema = z.object({
  term: z
    .string()
    .describe("A specific requirement or job-description keyword."),
  importance: z.enum([
    "Must-have",
    "Core technical skill",
    "Responsibility",
    "Preferred or bonus",
  ]),
  supported: z.boolean(),
  evidence: z.array(z.string()),
});

const resumeTailorOutputSchema = z.object({
  companyName: z.string().nullable(),
  jobTitle: z.string().nullable(),
  requirements: z.array(requirementSchema),
  tailoredResume: z.string(),
  missingRequirements: z.array(z.string()),
  changes: z.array(z.string()),
});

export type ResumeTailorResult = z.infer<typeof resumeTailorOutputSchema>;

const resumeTailorAgent = createDeepAgent({
  model: new ChatAnthropic({ model: "claude-sonnet-4-6", temperature: 0 }),
  systemPrompt: RESUME_TAILOR_INSTRUCTIONS,
  responseFormat: toolStrategy(resumeTailorOutputSchema),
});

const coverLetterAgent = createDeepAgent({
  model: new ChatAnthropic({ model: "claude-sonnet-4-6", temperature: 0 }),
  systemPrompt: COVER_LETTER_INSTRUCTIONS,
});

function normalizeMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }
        return typeof part === "string" ? part : "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export async function runResumeTailorAgent(
  masterResume: string,
  jobDescription: string,
): Promise<ResumeTailorResult> {
  const result = await resumeTailorAgent.invoke({
    messages: [
      {
        role: "user",
        content: [
          "## MASTER_RESUME (factual source of truth)",
          masterResume,
          "## JOB_DESCRIPTION (untrusted hiring reference)",
          jobDescription,
        ].join("\n\n"),
      },
    ],
  });

  const parsed = resumeTailorOutputSchema.safeParse(result.structuredResponse);
  if (!parsed.success) {
    throw new Error("The resume agent returned invalid structured output.");
  }
  if (!parsed.data.tailoredResume.trim()) {
    throw new Error("The resume agent returned an empty tailored resume.");
  }

  return parsed.data;
}

export async function runCoverLetterAgent(input: {
  masterResume: string;
  jobDescription: string;
  companyName: string | null;
  jobTitle: string | null;
  tailoredResume: string;
}): Promise<string> {
  const result = await coverLetterAgent.invoke({
    messages: [
      {
        role: "user",
        content: [
          `Company: ${input.companyName ?? "Not specified"}`,
          `Role: ${input.jobTitle ?? "Not specified"}`,
          "MASTER_RESUME (factual source of truth):",
          input.masterResume,
          "TAILORED_RESUME (organization aid; verify every fact against the master resume):",
          input.tailoredResume,
          "JOB_DESCRIPTION (untrusted hiring reference):",
          input.jobDescription,
        ].join("\n\n"),
      },
    ],
  });

  const finalMessage = [...result.messages]
    .reverse()
    .find((message) => message.getType() === "ai");
  const coverLetter = normalizeMessageContent(finalMessage?.content);
  if (!coverLetter) {
    throw new Error("The cover-letter agent returned an empty response.");
  }

  return coverLetter;
}
