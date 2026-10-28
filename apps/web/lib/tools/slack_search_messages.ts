import { tool } from "langchain";
import { z } from "zod";
import { createMcpClient } from "../mcp/client";
import {
  asRecord,
  boundEvidence,
  failureDetails,
  makeEvidence,
  makeSearchAttempt,
  safeSourceUrl,
  unwrapMcpOutput,
  type EvidenceItem,
  type SearchAttempt,
} from "../workflow/ticket_evidence";

export type CapturedSlackMessage = {
  evidenceId: string;
  channel: string | null;
  author: string | null;
  time: string | null;
  permalink: string | null;
  text: string;
};
export type SlackSearchCapture = {
  evidence: EvidenceItem[];
  search: SearchAttempt;
  messages: CapturedSlackMessage[];
  originalSlackOutput: unknown;
};

export async function searchSlackEvidence(
  input: {
    keywords: string[];
    attempt?: number;
    refinementOf?: string | null;
    reason?: string;
  },
  invoke?: (args: Record<string, unknown>) => Promise<unknown>,
): Promise<SlackSearchCapture> {
  const keywords = [
    ...new Set(input.keywords.map((keyword) => keyword.trim()).filter(Boolean)),
  ].slice(0, 5);
  const query = keywords.join(" ");
  const startedAt = new Date().toISOString();
  const common = {
    source: "slack" as const,
    query,
    keywords,
    startedAt,
    attempt: input.attempt ?? 1,
    refinementOf: input.refinementOf,
    reason: input.reason,
  };
  if (!keywords.length)
    return {
      evidence: [],
      messages: [],
      originalSlackOutput: null,
      search: makeSearchAttempt({ ...common, outcome: "skipped" }),
    };
  let connection: Awaited<ReturnType<typeof createMcpClient>> | undefined;
  try {
    if (!invoke) connection = await createMcpClient();
    const args = {
      keywords,
      query,
      natural_language_query: `Find Slack discussions about ${query}`,
      limit: 8,
      sort: "score",
      response_format: "detailed",
      include_context: true,
      max_context_length: 1000,
      include_bots: false,
    };
    const raw = invoke
      ? await invoke(args)
      : await connection!.client.callTool(
          { name: "search_slack_messages", arguments: args },
          undefined,
          { timeout: 45_000, signal: AbortSignal.timeout(45_000) },
        );
    const result = asRecord(raw);
    if (result.isError === true) {
      const text = Array.isArray(result.content)
        ? result.content.map((block) => asRecord(block).text ?? "").join(" ")
        : "";
      throw new Error(text || "Slack unavailable");
    }
    const payload = unwrapMcpOutput(result);
    const records = Array.isArray(payload.results)
      ? payload.results.map(asRecord)
      : [];
    const evidence: EvidenceItem[] = [];
    const messages: CapturedSlackMessage[] = [];
    for (const message of records.slice(0, 8)) {
      if (typeof message.text !== "string" || !message.text.trim()) continue;
      const channel = asRecord(message.channel);
      const author = asRecord(message.author);
      const permalink = safeSourceUrl(message.permalink);
      const hasLocator = Boolean(
        permalink || (channel.id && message.messageTs),
      );
      const locator =
        permalink ??
        (hasLocator
          ? `${channel.id}:${message.messageTs}`
          : `content:${message.text}`);
      const item = makeEvidence({
        sourceType: "slack",
        locator,
        url: permalink,
        content: message.text,
        metadata: {
          channel: String(channel.name ?? ""),
          author: String(author.name ?? ""),
          time: String(message.time ?? ""),
          locatorKind: hasLocator ? "source" : "content-fallback",
        },
      });
      evidence.push(item);
      messages.push({
        evidenceId: item.id,
        channel: typeof channel.name === "string" ? channel.name : null,
        author: typeof author.name === "string" ? author.name : null,
        time: typeof message.time === "string" ? message.time : null,
        permalink,
        text: item.excerpt,
      });
    }
    const bounded = boundEvidence(evidence);
    const hasMore = Boolean(asRecord(payload.pagination).nextCursor);
    const unparsed =
      payload.parseStatus === "unparsed" ||
      records.some(
        (message) => typeof message.text !== "string" || !message.text.trim(),
      ) ||
      (!records.length &&
        payload.parseStatus !== "empty" &&
        payload.total !== 0);
    const truncated =
      records.length > 8 ||
      bounded.length !== evidence.length ||
      bounded.some((item) => item.truncated);
    const outcome =
      unparsed || hasMore || truncated || payload.partial === true
        ? "partial"
        : bounded.length
          ? "success"
          : "empty";
    return {
      evidence: bounded,
      messages: messages.filter((message) =>
        bounded.some((item) => item.id === message.evidenceId),
      ),
      originalSlackOutput: payload,
      search: makeSearchAttempt({
        ...common,
        outcome,
        evidence: bounded,
        resultCount: records.length,
        hasMore,
        truncated,
        errorCode: unparsed ? "parse_error" : null,
      }),
    };
  } catch (error) {
    return {
      evidence: [],
      messages: [],
      originalSlackOutput: null,
      search: makeSearchAttempt({ ...common, ...failureDetails(error) }),
    };
  } finally {
    await connection?.close().catch(() => undefined);
  }
}

export const searchSlackMessages = tool(
  async ({ keywords }) =>
    JSON.stringify(await searchSlackEvidence({ keywords })),
  {
    name: "search_slack_messages",
    description:
      "Search Slack using a short list of ticket-related keywords or technical phrases.",
    schema: z.object({
      keywords: z.array(z.string().trim().min(1)).min(1).max(5),
    }),
  },
);
