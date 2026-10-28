import { createDeepAgent } from "deepagents";
import { tool, toolStrategy } from "langchain";
import { z } from "zod";
import { createDeterministicGPT6LunaModel } from "../llm/model.js";
import { SLACK_SEARCH_AGENT_PROMPT } from "../skill/jira_analysis";
import {
  searchSlackEvidence,
  type SlackSearchCapture,
} from "../tools/slack_search_messages";
import {
  boundEvidence,
  evidenceBundleSchema,
  searchOutcomeSchema,
  type EvidenceItem,
  type SearchAttempt,
} from "../workflow/ticket_evidence";

const findingSchema = z.object({
  evidenceId: z.string(),
  channel: z.string().nullable(),
  author: z.string().nullable(),
  time: z.string().nullable(),
  permalink: z.string().nullable(),
  text: z.string(),
  relevance: z.string(),
  classification: z.enum([
    "source_supported",
    "inferred",
    "opinion",
    "unverified",
  ]),
});

export const slackSearchAgentOutputSchema = z.object({
  keywords: z.array(z.string().max(200)).max(5),
  summary: z.string().max(8000),
  findings: z.array(findingSchema).max(16),
});
export const slackSearchAgentResultSchema = slackSearchAgentOutputSchema.extend(
  {
    available: z.boolean(),
    outcome: searchOutcomeSchema,
    evidence: evidenceBundleSchema.shape.evidence,
    searches: evidenceBundleSchema.shape.searches,
    originalSlackOutput: z.unknown(),
    limitation: z.string().max(1000),
  },
);
export type SlackSearchAgentOutput = z.infer<
  typeof slackSearchAgentOutputSchema
>;
export type SlackSearchAgentResult = z.infer<
  typeof slackSearchAgentResultSchema
>;

const synthesisSchema = z.object({
  summary: z.string().max(8000),
  findings: z
    .array(
      z.object({
        evidenceId: z.string(),
        relevance: z.string().max(2000),
        classification: z.enum([
          "source_supported",
          "inferred",
          "opinion",
          "unverified",
        ]),
      }),
    )
    .max(16),
});

function normalizedQuery(keywords: string[]) {
  return [
    ...new Set(
      keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean),
    ),
  ]
    .sort()
    .join(" ");
}

export function createSlackResearchSession(
  keywords: string[],
  search: typeof searchSlackEvidence = searchSlackEvidence,
) {
  const captures: SlackSearchCapture[] = [];
  let attempts = 0;
  const queries = new Set<string>();
  const searchTool = tool(
    async ({ keywords: queryKeywords, reason }) => {
      if (attempts >= 2)
        throw new Error(
          "Slack search budget exhausted (two attempts maximum).",
        );
      const query = normalizedQuery(queryKeywords);
      if (queries.has(query))
        throw new Error(
          "Duplicate Slack query; choose a different focused query.",
        );
      if (attempts === 0 && query !== normalizedQuery(keywords)) {
        throw new Error(
          "The initial Slack search must use the supplied keywords.",
        );
      }
      const first = captures[0];
      if (attempts > 0) {
        if (
          !first ||
          !["success", "partial", "empty"].includes(first.search.outcome)
        ) {
          throw new Error("Do not refine an unavailable or failed source.");
        }
        if (!reason || reason.trim().length < 10)
          throw new Error("Explain the evidence gap requiring refinement.");
      }
      queries.add(query);
      attempts += 1;
      const capture = await search({
        keywords: queryKeywords,
        attempt: attempts,
        refinementOf: first?.search.id ?? null,
        reason: reason ?? "Initial Jira keyword search",
      });
      captures.push(capture);
      return JSON.stringify({ ...capture, originalSlackOutput: undefined });
    },
    {
      name: "search_slack_messages",
      description:
        "Search Slack; use supplied keywords first, then at most one different refined query if needed.",
      schema: z.object({
        keywords: z.array(z.string().trim().min(1).max(200)).min(1).max(5),
        reason: z.string().max(1000).optional(),
      }),
    },
  );
  return { searchTool, captures };
}

export async function runSlackSearchAgent(
  keywordInputs: string[],
): Promise<SlackSearchAgentResult> {
  const keywords = [
    ...new Set(keywordInputs.map((keyword) => keyword.trim()).filter(Boolean)),
  ].slice(0, 5);
  const session = createSlackResearchSession(keywords);
  let summary =
    "Slack search completed; review the captured messages as reference, not confirmed root cause.";
  let generated: z.infer<typeof synthesisSchema>["findings"] = [];
  let limitation = "";
  if (!keywords.length) {
    session.captures.push(await searchSlackEvidence({ keywords }));
  } else {
    try {
      const agent = createDeepAgent({
        name: "search_slack_messages",
        model: createDeterministicGPT6LunaModel(),
        tools: [session.searchTool],
        systemPrompt: SLACK_SEARCH_AGENT_PROMPT,
        responseFormat: toolStrategy(synthesisSchema),
      });
      const result = await agent.invoke(
        { messages: [{ role: "user", content: JSON.stringify({ keywords }) }] },
        { recursionLimit: 20 },
      );
      const parsed = synthesisSchema.safeParse(result.structuredResponse);
      if (!parsed.success) throw new Error("Invalid Slack synthesis");
      summary = parsed.data.summary;
      generated = parsed.data.findings;
    } catch {
      limitation =
        "Slack synthesis was incomplete; only captured source messages are retained.";
    }
  }
  if (!session.captures.length) {
    limitation = "The Slack agent did not complete a search.";
  }
  const evidence: EvidenceItem[] = boundEvidence(
    session.captures.flatMap((capture) => capture.evidence),
  );
  const searches: SearchAttempt[] = session.captures.map((capture) => {
    const evidenceIds = capture.search.evidenceIds.filter((id) =>
      evidence.some((item) => item.id === id),
    );
    return evidenceIds.length === capture.search.evidenceIds.length
      ? capture.search
      : { ...capture.search, evidenceIds, outcome: "partial", truncated: true };
  });
  const messages = [
    ...new Map(
      session.captures
        .flatMap((capture) => capture.messages)
        .map((message) => [message.evidenceId, message]),
    ).values(),
  ].filter((message) =>
    evidence.some((item) => item.id === message.evidenceId),
  );
  const knownIds = new Set(evidence.map((item) => item.id));
  if (generated.some((finding) => !knownIds.has(finding.evidenceId))) {
    limitation =
      "Slack synthesis cited unknown evidence; generated findings were discarded.";
    generated = [];
    summary =
      "Review the captured Slack messages; automated synthesis could not be validated.";
  }
  const annotations = new Map(
    generated.map((finding) => [finding.evidenceId, finding]),
  );
  const available = searches.some((search) =>
    ["success", "partial", "empty"].includes(search.outcome),
  );
  const outcome = evidence.length
    ? searches.some((search) => search.outcome !== "success") || limitation
      ? "partial"
      : "success"
    : (searches.at(-1)?.outcome ?? "failed");
  if (!evidence.length)
    summary =
      outcome === "empty"
        ? "No useful Slack discussions were found."
        : outcome === "skipped"
          ? "No keywords were available for Slack search."
          : "Slack search did not return usable messages; see the search status and limitations.";
  return slackSearchAgentResultSchema.parse({
    keywords,
    summary,
    available,
    outcome,
    evidence,
    searches,
    limitation,
    findings: messages.map((message) => ({
      ...message,
      relevance:
        annotations.get(message.evidenceId)?.relevance ??
        "Captured search match; relevance requires review.",
      classification:
        annotations.get(message.evidenceId)?.classification ?? "unverified",
    })),
    originalSlackOutput: session.captures.map(
      (capture) => capture.originalSlackOutput,
    ),
  });
}
