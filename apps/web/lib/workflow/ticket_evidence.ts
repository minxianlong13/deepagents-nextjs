import { createHash } from "node:crypto";
import { z } from "zod";

export const MAX_EVIDENCE_ITEMS = 40;
export const MAX_EXCERPT_LENGTH = 4000;
export const MAX_EVIDENCE_CHARACTERS = 64000;
export const MAX_PAYLOAD_BYTES = 2_000_000;
export const sourceTypeSchema = z.enum(["jira", "slack", "documentation"]);
export const searchOutcomeSchema = z.enum([
  "success",
  "empty",
  "partial",
  "failed",
  "timed_out",
  "skipped",
]);
export const evidenceItemSchema = z.object({
  id: z.string().min(1).max(100),
  sourceType: sourceTypeSchema,
  locator: z.string().min(1).max(2000),
  url: z.string().max(2000).nullable(),
  excerpt: z.string().max(MAX_EXCERPT_LENGTH),
  retrievedAt: z.string().datetime(),
  updatedAt: z.string().max(100).nullable(),
  metadata: z.record(z.string().max(2000)),
  linkable: z.boolean(),
  truncated: z.boolean(),
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export const searchAttemptSchema = z.object({
  id: z.string().max(100),
  source: sourceTypeSchema,
  query: z.string().max(2000),
  keywords: z.array(z.string().max(200)).max(5),
  attempt: z.number().int().min(1).max(3),
  refinementOf: z.string().nullable(),
  reason: z.string().max(1000),
  outcome: searchOutcomeSchema,
  evidenceIds: z.array(z.string()).max(MAX_EVIDENCE_ITEMS),
  resultCount: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
  truncated: z.boolean(),
  hasMore: z.boolean(),
  errorCode: z
    .enum([
      "auth_required",
      "rate_limited",
      "unavailable",
      "parse_error",
      "unknown",
    ])
    .nullable(),
});
export type SearchAttempt = z.infer<typeof searchAttemptSchema>;
export const claimSchema = z.object({
  id: z.string().min(1).max(100),
  target: z.string().min(1).max(200),
  text: z.string().min(1).max(8000),
  classification: z.enum([
    "source_supported",
    "inferred",
    "opinion",
    "unverified",
  ]),
  evidenceIds: z.array(z.string()).max(40),
  explanation: z.string().min(1).max(4000),
});
export const conflictSchema = z.object({
  id: z.string().min(1),
  affectedConclusion: z.string(),
  sides: z
    .array(
      z.object({ claim: z.string(), evidenceIds: z.array(z.string()).min(1) }),
    )
    .min(2),
  confidenceImpact: z.string().min(1),
  status: z.enum(["unresolved", "resolved"]),
  resolution: z.string(),
  resolutionEvidenceIds: z.array(z.string()),
});
export const researchGapSchema = z.object({
  missingEvidence: z.string().min(1),
  impact: z.string().min(1),
  nextAction: z.string().min(1),
});
export const evidenceBundleSchema = z.object({
  evidence: z.array(evidenceItemSchema).max(MAX_EVIDENCE_ITEMS),
  searches: z.array(searchAttemptSchema).max(6),
});
export const assessmentSchema = z.object({
  claims: z.array(claimSchema).max(100),
  conflicts: z.array(conflictSchema).max(20),
  researchGaps: z.array(researchGapSchema).max(30),
  evidenceSufficiency: z.enum([
    "sufficient for provisional recommendation",
    "further evidence required",
  ]),
});
export type EvidenceAssessment = z.infer<typeof assessmentSchema>;

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function makeEvidence(input: {
  sourceType: EvidenceItem["sourceType"];
  locator: string;
  content: string;
  url?: string | null;
  updatedAt?: string | null;
  metadata?: Record<string, string>;
  linkable?: boolean;
}): EvidenceItem {
  const hash = createHash("sha256")
    .update(JSON.stringify([input.locator, input.content]))
    .digest("hex")
    .slice(0, 24);
  return evidenceItemSchema.parse({
    id: `${input.sourceType}-${hash}`,
    sourceType: input.sourceType,
    locator: input.locator.slice(0, 2000),
    url: safeSourceUrl(input.url),
    excerpt: input.content.slice(0, MAX_EXCERPT_LENGTH),
    retrievedAt: new Date().toISOString(),
    updatedAt: input.updatedAt ?? null,
    metadata: input.metadata ?? {},
    linkable: input.linkable ?? true,
    truncated: input.content.length > MAX_EXCERPT_LENGTH,
  });
}

export function boundEvidence(items: EvidenceItem[]): EvidenceItem[] {
  const unique = [...new Map(items.map((item) => [item.id, item])).values()];
  let characters = 0;
  return unique.filter((item, index) => {
    characters += JSON.stringify(item).length;
    return index < MAX_EVIDENCE_ITEMS && characters <= MAX_EVIDENCE_CHARACTERS;
  });
}

export function unwrapMcpOutput(value: unknown): Record<string, unknown> {
  const record = asRecord(value);
  if (record.structuredContent) return asRecord(record.structuredContent);
  if (!Array.isArray(record.content)) return record;
  const text = record.content
    .map((block) => asRecord(block))
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return {};
  }
}

export function jiraEvidence(
  value: unknown,
  ticketKey: string,
): EvidenceItem[] {
  const issue = unwrapMcpOutput(value);
  const fields = asRecord(issue.fields);
  const updatedAt = typeof fields.updated === "string" ? fields.updated : null;
  const common = {
    sourceType: "jira" as const,
    url: safeSourceUrl(issue.url),
    updatedAt,
  };
  const items = Object.entries(fields)
    .filter(
      ([field, content]) =>
        field !== "comment" &&
        content !== null &&
        content !== undefined &&
        content !== "",
    )
    .map(([field, content]) =>
      makeEvidence({
        ...common,
        locator: `${ticketKey}:fields.${field}`,
        content:
          typeof content === "string" ? content : JSON.stringify(content),
        metadata: { ticketKey, field: `fields.${field}` },
      }),
    );
  const comments = asRecord(fields.comment).comments;
  if (Array.isArray(comments)) {
    for (const [index, raw] of comments.entries()) {
      const comment = asRecord(raw);
      items.push(
        makeEvidence({
          ...common,
          locator: `${ticketKey}:comment:${comment.id ?? index}`,
          content: JSON.stringify(comment),
          metadata: { ticketKey, field: `fields.comment.comments[${index}]` },
        }),
      );
    }
  }
  return boundEvidence(items);
}

export function failureDetails(
  error: unknown,
): Pick<SearchAttempt, "outcome" | "errorCode"> {
  const message = error instanceof Error ? error.message : "";
  if (/timeout|timed out|abort/i.test(message))
    return { outcome: "timed_out", errorCode: "unavailable" };
  if (/401|403|oauth|unauthori|authentication/i.test(message))
    return { outcome: "failed", errorCode: "auth_required" };
  if (/429|rate.limit/i.test(message))
    return { outcome: "failed", errorCode: "rate_limited" };
  return { outcome: "failed", errorCode: "unavailable" };
}

export function makeSearchAttempt(input: {
  source: SearchAttempt["source"];
  query: string;
  keywords?: string[];
  attempt: number;
  refinementOf?: string | null;
  reason?: string;
  startedAt: string;
  outcome: SearchAttempt["outcome"];
  evidence?: EvidenceItem[];
  resultCount?: number;
  truncated?: boolean;
  hasMore?: boolean;
  errorCode?: SearchAttempt["errorCode"];
}): SearchAttempt {
  return searchAttemptSchema.parse({
    id: `${input.source}-search-${input.attempt}`,
    source: input.source,
    query: input.query,
    keywords: input.keywords ?? [],
    attempt: input.attempt,
    refinementOf: input.refinementOf ?? null,
    reason: input.reason ?? "Initial search",
    outcome: input.outcome,
    evidenceIds: (input.evidence ?? []).map((item) => item.id),
    resultCount: input.resultCount ?? input.evidence?.length ?? 0,
    startedAt: input.startedAt,
    durationMs: Math.max(0, Date.now() - Date.parse(input.startedAt)),
    truncated: input.truncated ?? false,
    hasMore: input.hasMore ?? false,
    errorCode: input.errorCode ?? null,
  });
}

export function validateCitations(
  assessment: EvidenceAssessment,
  evidence: EvidenceItem[],
  requiredTargets: string[] = [],
): string[] {
  const items = new Map(evidence.map((item) => [item.id, item]));
  const errors: string[] = [];
  const checkIds = (ids: string[]) => {
    for (const id of ids)
      if (!items.has(id)) errors.push(`Unknown evidence ID: ${id}`);
  };
  const claimIds = new Set<string>();
  for (const claim of assessment.claims) {
    if (claimIds.has(claim.id)) errors.push(`Duplicate claim ID: ${claim.id}`);
    claimIds.add(claim.id);
    checkIds(claim.evidenceIds);
    if (
      claim.classification === "source_supported" &&
      (!claim.evidenceIds.length ||
        claim.evidenceIds.some((id) => !items.get(id)?.linkable))
    ) {
      errors.push(
        `Source-supported claim lacks traceable evidence: ${claim.target}`,
      );
    }
  }
  for (const target of requiredTargets) {
    if (!assessment.claims.some((claim) => claim.target === target))
      errors.push(`Missing claim: ${target}`);
  }
  for (const conflict of assessment.conflicts) {
    for (const side of conflict.sides) checkIds(side.evidenceIds);
    checkIds(conflict.resolutionEvidenceIds);
    if (
      conflict.status === "resolved" &&
      (!conflict.resolution.trim() ||
        !conflict.resolutionEvidenceIds.length ||
        conflict.resolutionEvidenceIds.some((id) => !items.get(id)?.linkable))
    ) {
      errors.push(
        `Resolved conflict has no supporting resolution: ${conflict.id}`,
      );
    }
  }
  return errors;
}

export class TicketInputError extends Error {}
export class EvidenceValidationError extends Error {}

export function validateClaimText(
  claims: z.infer<typeof claimSchema>[],
  output: unknown,
): string[] {
  return claims.flatMap((claim) => {
    const segments = claim.target.replace(/\[(\d+)\]/g, ".$1").split(".");
    let value: unknown = output;
    for (const segment of segments) {
      value = Array.isArray(value)
        ? value[Number(segment)]
        : asRecord(value)[segment];
    }
    return typeof value !== "string" || value !== claim.text
      ? [`Claim text does not match its output field: ${claim.target}`]
      : [];
  });
}

export async function readTicketRequestBody(
  request: Request,
): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new TicketInputError("A JSON request body is required.");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_PAYLOAD_BYTES) {
        await reader.cancel();
        throw new TicketInputError(
          "The workflow payload exceeds the 2 MB limit.",
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new TicketInputError("Request body must be valid JSON.");
    }
  } finally {
    reader.releaseLock();
  }
}
